/**
 * Derived facts about the content collections.
 */

import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { isKnownCategory, BLOG_CATEGORIES } from '~/config/taxonomy';
import { GITHUB_USERNAME, getProjectBySlug } from '~/config/projects';
import { getProjectStats } from '~/lib/github';

/**
 * The most recent last-updated date across every project summary — i.e. how
 * fresh the projects listing is as a whole.
 *
 * Derived rather than hand-maintained: writing up any one project re-dates
 * the listing on both the home page and /projects, with nothing to remember.
 * Falls back to a summary's publish date when it has never been revised.
 */
export async function getLatestProjectUpdate(): Promise<Date | undefined> {
  const entries = await getCollection('projects');
  const dates = entries.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt);
  return dates.length > 0 ? dates.reduce((a, b) => (b > a ? b : a)) : undefined;
}

/** Values already warned about, so a build logs each problem once. */
const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

/**
 * Flags unrecognised taxonomy values. Deliberately a warning and never a
 * throw: a typo must not stop a scheduled post from publishing on time.
 * `npm run validate:content` is the gate that actually fails, and it runs in
 * its own CI workflow, separate from the release cron.
 */
function checkTaxonomy(post: CollectionEntry<'blog'>): void {
  const { category } = post.data;

  if (!isKnownCategory(category)) {
    warnOnce(
      `category:${category}`,
      `[blog] unknown category "${category}" in ${post.id} — expected one of: ${BLOG_CATEGORIES.join(', ')}`,
    );
  }
}

/**
 * Every blog post that should be visible right now, newest first.
 *
 * DO NOT call getCollection('blog') anywhere else. This function is the only
 * thing standing between a scheduled post and the public site: it drops
 * drafts and anything dated in the future. A route that reads the collection
 * directly will publish posts early, and nothing will fail to warn you.
 *
 * Because future posts are excluded from getStaticPaths, an unreleased post's
 * URL 404s rather than existing unlinked.
 *
 * Timing: `publishedAt` may be a date (parsed as UTC midnight) or a full
 * timestamp. The site rebuilds every 6 hours, so a post appears at the first
 * build after its timestamp — within 6 hours, not at a precise moment.
 */
export async function getPublishedPosts(): Promise<CollectionEntry<'blog'>[]> {
  const now = Date.now();
  const posts = await getCollection('blog', (post) => !post.data.draft);

  const published = posts.filter((post) => post.data.publishedAt.getTime() <= now);
  published.forEach(checkTaxonomy);

  return published.sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );
}

/**
 * The technologies a post inherits from its linked project — measured
 * languages and asserted stack both.
 *
 * Never stored on the post. Linking to a project already supplies language,
 * stack, and repo — encoding them a second time would create a source that
 * drifts. These come from the same GitHub-derived data the project card
 * renders, so a post about chip-8 says "rust" without anyone typing it.
 *
 * Empty when the post has no project, the slug doesn't resolve, or the
 * languages fetch degraded.
 */
export async function getInheritedTech(
  post: CollectionEntry<'blog'>,
): Promise<{ languages: string[]; stack: string[] }> {
  const empty = { languages: [], stack: [] };
  const slug = post.data.project;
  if (!slug) return empty;

  const project = getProjectBySlug(slug);
  if (!project) return empty;

  const stats = await getProjectStats(GITHUB_USERNAME);
  return {
    languages: stats.find((s) => s.repo === project.repo)?.languages ?? [],
    stack: [...(project.stack ?? [])],
  };
}

/**
 * The human-written strings for a project: its title and its card tagline.
 *
 * These live in the summary's MDX frontmatter, not in src/config/projects.ts.
 * They used to exist in both places as `title`/`name` and `summary`/`tagline`,
 * and both pairs drifted — a rename left the card saying "Rubik's Cube
 * Practice" while the page it linked to said "Quiet-Cube". Config now holds
 * only pipeline facts; every string a human writes is in one file.
 *
 * `tagline` falls back to `summary` when unwritten. The card just gets taller,
 * which beats failing a build over a missing string — content problems never
 * stop a deploy. validate:content still flags it.
 *
 * Undefined when no summary MDX matches the slug, which validate:content
 * fails on.
 */
export async function getProjectDisplay(
  slug: string,
): Promise<{ title: string; tagline: string } | undefined> {
  const entries = await getCollection('projects');
  const entry = entries.find((e) => e.data.slug === slug);
  if (!entry) return undefined;
  return { title: entry.data.title, tagline: entry.data.tagline ?? entry.data.summary };
}

/** Published posts about a given project, newest first. */
export async function getPostsForProject(
  slug: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.data.project === slug);
}

/**
 * URL-safe form of a taxonomy value, in snake_case to match how tags are
 * written everywhere else (including tdx).
 *
 * Apostrophes are removed rather than treated as separators: "rubik's cube"
 * has to become rubiks_cube, not rubik_s_cube. Both the straight quote and the
 * typographic one, since the latter is what most editors insert.
 *
 * Categories and languages are already lowercase by convention, but tags are
 * free-form — one code path for all three means no route that works for some
 * values and not others.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    // Fold accents to their base letter first, or "Pokémon" would slug to
    // pok_mon — the accent would read as a word separator.
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['‘’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Every distinct category across published posts, paired with its slug. */
export async function getCategoryValues(): Promise<{ value: string; slug: string }[]> {
  const posts = await getPublishedPosts();
  const seen = new Map<string, string>();

  for (const post of posts) {
    const slug = slugify(post.data.category);
    if (slug && !seen.has(slug)) seen.set(slug, post.data.category);
  }

  return [...seen.entries()].map(([slug, value]) => ({ value, slug }));
}

/** Published posts in a category. */
export async function getPostsByCategory(
  slug: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => slugify(post.data.category) === slug);
}

/**
 * Anything a tag can be attached to.
 *
 * Tags span both content types deliberately — they are what connects a post to
 * the project summary it relates to. If tags were post-only, summaries and
 * posts would live in separate worlds. Categories, by contrast, apply to posts
 * only: a summary has no form or tone to describe.
 */
export type TaggedItem =
  | { kind: 'project'; date: Date; tags: string[]; entry: CollectionEntry<'projects'> }
  | { kind: 'post'; date: Date; tags: string[]; post: CollectionEntry<'blog'> };

/**
 * Carries the whole entry rather than a flattened title/summary, so a tag page
 * can render the same ProjectCard and PostCard used everywhere else instead of
 * a bespoke list that drifts from them.
 */
async function getAllTaggedItems(): Promise<TaggedItem[]> {
  const posts = await getPublishedPosts();
  const projects = await getCollection('projects');

  const items: TaggedItem[] = [
    ...projects.map(
      (entry): TaggedItem => ({
        kind: 'project',
        date: entry.data.updatedAt ?? entry.data.publishedAt,
        tags: entry.data.tags,
        entry,
      }),
    ),
    ...posts.map(
      (post): TaggedItem => ({
        kind: 'post',
        date: post.data.publishedAt,
        tags: post.data.tags,
        post,
      }),
    ),
  ];

  // Projects pin above posts. A summary is the evergreen reference for a
  // subject; the posts are the running commentary on it, so the reference
  // should be the first thing a tag page offers. Newest first within each.
  const rank = (item: TaggedItem) => (item.kind === 'project' ? 0 : 1);
  return items.sort(
    (a, b) => rank(a) - rank(b) || b.date.getTime() - a.date.getTime(),
  );
}

/** Every distinct tag across posts and project summaries, with its slug. */
export async function getTagValues(): Promise<{ value: string; slug: string }[]> {
  const items = await getAllTaggedItems();
  const seen = new Map<string, string>();

  for (const item of items) {
    for (const tag of item.tags) {
      const slug = slugify(tag);
      if (slug && !seen.has(slug)) seen.set(slug, tag);
    }
  }

  return [...seen.entries()].map(([slug, value]) => ({ value, slug }));
}

/** Posts and project summaries carrying a tag, newest first. */
export async function getItemsByTag(slug: string): Promise<TaggedItem[]> {
  const items = await getAllTaggedItems();
  return items.filter((item) => item.tags.some((tag) => slugify(tag) === slug));
}
