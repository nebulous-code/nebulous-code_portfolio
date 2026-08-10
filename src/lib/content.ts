/**
 * Derived facts about the content collections.
 */

import { getCollection } from 'astro:content';

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
