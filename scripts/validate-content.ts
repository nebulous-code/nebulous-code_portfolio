/**
 * Content validation, run by hand before committing and by its own CI
 * workflow — deliberately NOT on the release path.
 *
 *   npm run validate:content
 *
 * A typo in a category should tell you loudly and fail a pull request. It
 * should never stop a scheduled post from going out on time, which is why
 * this lives here rather than in the Zod schema, and why the workflow that
 * runs it is separate from deploy.yml.
 *
 * Imports the real vocabularies from src/config rather than restating them,
 * so this can't drift from what the site actually uses. That needs Node's
 * type stripping (Node >= 22 with --experimental-strip-types, on by default
 * from 23.6).
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { BLOG_CATEGORIES, isWellFormedTag } from '../src/config/taxonomy.ts';
import { PROJECTS } from '../src/config/projects.ts';

const BLOG_DIR = 'src/content/blog';
const PROJECT_DIR = 'src/content/projects';
const PROJECT_REQUIRED = ['slug', 'title', 'summary', 'publishedAt'] as const;
const REQUIRED = ['title', 'summary', 'publishedAt', 'category'] as const;

const problems: string[] = [];
const seenSlugs = new Map<string, string>();

function fail(file: string, message: string): void {
  problems.push(`${file}: ${message}`);
}

function frontmatterOf(raw: string, file: string): Record<string, unknown> | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!match) {
    fail(file, 'no YAML frontmatter block found');
    return null;
  }
  try {
    return (parseYaml(match[1]!) ?? {}) as Record<string, unknown>;
  } catch (err) {
    fail(file, `frontmatter is not valid YAML — ${(err as Error).message}`);
    return null;
  }
}

let files: string[] = [];
try {
  files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
} catch {
  console.log(`No ${BLOG_DIR}/ directory yet — nothing to validate.`);
  process.exit(0);
}

const projectSlugs = new Set(PROJECTS.map((p) => p.slug));

for (const file of files.sort()) {
  const data = frontmatterOf(readFileSync(join(BLOG_DIR, file), 'utf8'), file);
  if (!data) continue;

  for (const field of REQUIRED) {
    if (data[field] === undefined || data[field] === '') {
      fail(file, `missing required field "${field}"`);
    }
  }

  for (const field of ['publishedAt', 'updatedAt'] as const) {
    const value = data[field];
    if (value === undefined) continue;
    if (Number.isNaN(new Date(value as string | Date).getTime())) {
      fail(file, `"${field}" is not a parseable date: ${JSON.stringify(value)}`);
    }
  }

  const category = data['category'];
  if (typeof category === 'string' && !(BLOG_CATEGORIES as readonly string[]).includes(category)) {
    fail(file, `unknown category "${category}" — expected one of: ${BLOG_CATEGORIES.join(', ')}`);
  }

  const tags = data['tags'];
  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      fail(file, '"tags" must be a list');
    } else {
      for (const tag of tags) {
        // Shape only. Singular and untensed can't be machine-checked.
        if (!isWellFormedTag(String(tag))) {
          fail(file, `tag "${tag}" is not singular snake_case (lowercase, underscores)`);
        }
      }
    }
  }

  const project = data['project'];
  if (project !== undefined && !projectSlugs.has(String(project))) {
    fail(
      file,
      `project "${project}" is not a slug in src/config/projects.ts — expected one of: ${[...projectSlugs].join(', ')}`,
    );
  }

  // The URL comes from the filename, so a collision would silently drop a post.
  const slug = file.replace(/\.mdx?$/, '');
  const previous = seenSlugs.get(slug);
  if (previous) {
    fail(file, `slug "${slug}" collides with ${previous}`);
  } else {
    seenSlugs.set(slug, file);
  }
}

/*
 * Project summaries.
 *
 * Every PROJECTS entry must have one, because that MDX now owns the title and
 * tagline the cards render — and because /projects/[slug] builds its routes
 * from these files, so a config entry without one produces a card linking to a
 * 404. Checked in both directions: an orphan summary has no links, stack, or
 * live URL, since those come from the config side.
 */
let projectFiles: string[] = [];
try {
  projectFiles = readdirSync(PROJECT_DIR).filter((f) => f.endsWith('.mdx'));
} catch {
  projectFiles = [];
}

const summarySlugs = new Map<string, string>();

for (const file of projectFiles.sort()) {
  const data = frontmatterOf(readFileSync(join(PROJECT_DIR, file), 'utf8'), file);
  if (!data) continue;

  for (const field of PROJECT_REQUIRED) {
    if (data[field] === undefined || data[field] === '') {
      fail(file, `missing required field "${field}"`);
    }
  }

  // Not required by the schema — a card falls back to `summary` — but worth
  // nagging about here, where failing costs a red check and not a deploy.
  if (data['tagline'] === undefined || data['tagline'] === '') {
    fail(file, 'no "tagline" — the card will fall back to the longer summary');
  }

  const tags = data['tags'];
  if (Array.isArray(tags)) {
    for (const tag of tags) {
      if (!isWellFormedTag(String(tag))) {
        fail(file, `tag "${tag}" is not singular snake_case (lowercase, underscores)`);
      }
    }
  }

  const slug = String(data['slug'] ?? '');
  if (slug) summarySlugs.set(slug, file);
  if (slug && !projectSlugs.has(slug)) {
    fail(file, `slug "${slug}" has no entry in src/config/projects.ts, so the page has no links or stack`);
  }
}

for (const slug of projectSlugs) {
  if (!summarySlugs.has(slug)) {
    problems.push(
      `src/config/projects.ts: project "${slug}" has no summary at ${PROJECT_DIR}/${slug}.mdx — its card would have no title and would link to a 404`,
    );
  }
}

if (problems.length > 0) {
  console.error(`\nContent validation failed — ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('');
  process.exit(1);
}

console.log(
  `Content validation passed — ${files.length} post(s), ${projectFiles.length} project summary(s) checked.`,
);
