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

export const collections = { projects };
