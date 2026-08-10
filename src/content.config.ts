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

export const collections = { projects, now };
