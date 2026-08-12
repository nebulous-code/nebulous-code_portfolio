/**
 * Content collections schema.
 *
 * Each MDX file in src/content/projects/ must validate against the
 * `projects` schema below. The schema is intentionally permissive on
 * structure (you write the body however you like) but strict on the
 * frontmatter that drives navigation, sorting, and link generation.
 */

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    // Short line for project cards. Lives here rather than in
    // src/config/projects.ts so every string a human writes about a project
    // is in one file — the two used to drift.
    //
    // Optional on purpose: a card falls back to `summary` without one. A tall
    // card is better than a failed deploy, so a missing tagline can't block a
    // release. `npm run validate:content` still flags it, off the release path.
    tagline: z.string().optional(),
    summary: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // Optional architecture section flag — used by the case study layout to
    // emphasize the architecture writeup for projects without viewable source.
    hasArchitectureSection: z.boolean().default(false),
  }),
});

/**
 * The "Currently Building" blurb on the home page. A single-file collection —
 * it goes through the same markdown pipeline as the case studies so paragraph
 * breaks, bold, and links all render properly.
 */
const now = defineCollection({
  loader: glob({ pattern: 'now.md', base: './src/content' }),
  schema: z.object({
    updatedAt: z.coerce.date(),
  }),
});

/**
 * Blog posts.
 *
 * Unlike `projects`, there is no explicit `slug` field — the URL comes from
 * the filename. A post has no counterpart in src/config/projects.ts to stay in
 * sync with, so deriving the slug removes a whole class of mismatch bug.
 *
 * `publishedAt` doubles as the release gate: a future date means scheduled,
 * and the post simply doesn't exist until a build runs after that timestamp.
 * Nothing here reads that field directly — see getPublishedPosts() in
 * src/lib/content.ts, which every consumer must go through.
 *
 * `category` is deliberately a plain string rather than an enum. An unknown
 * value warns at build time and fails `npm run validate:content`, but it must
 * never block a scheduled post from going out on time.
 *
 * There is no `languages` field on purpose: the `project` link already
 * supplies language, stack, and repo, and a second source would drift.
 * See docs/POST_TAXONOMY.md and src/config/taxonomy.ts.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    // Slug of an entry in PROJECTS, when the post is about a tracked project.
    project: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, now, blog };
