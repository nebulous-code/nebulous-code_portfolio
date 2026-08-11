/**
 * Reserved vocabulary for post categories.
 *
 * docs/POST_TAXONOMY.md is the source of truth for what these mean and how to
 * choose between them. This file only holds the machine-readable list.
 *
 * Three axes, which must never overlap:
 *
 *   project   the link. Gives language, stack, and repo for free — which is
 *             why none of those are ever encoded anywhere else.
 *   category  the FORM of a post. Exactly one. Reserved, this list.
 *   tags      the SUBJECT. As many as genuinely apply. Free-form, and they
 *             apply to project summaries too.
 *
 * There is deliberately no `languages` axis. It was tried and removed: the
 * project link already supplies it, and a second source would drift.
 *
 * Nothing here can fail a build. An unrecognised value warns during the build
 * and fails `npm run validate:content`, but a scheduled post always goes out
 * on time — a typo is a content problem, not a release problem.
 */

/**
 * The form of a post — what the reader is meant to walk away with, not what
 * the post is made of. Almost every post here contains a retrospective; that
 * alone never makes one a `retrospective`.
 *
 * THIS LIST IS CLOSED AT EIGHT. Adding a ninth should be a deliberate
 * decision, never a reaction to a post that didn't fit. If it drifts past
 * eight it has become a second tag system, which is the failure mode this
 * whole taxonomy exists to avoid.
 *
 * Stored snake_case; the slug is the stored value.
 */
export const BLOG_CATEGORIES = [
  // The reader should do something differently afterwards.
  'advice',
  // One fork examined: options, choice, cost, and whether it held up.
  'design_decisions',
  // Something went wrong and the failure is the subject.
  'what_broke',
  // Numbers are the spine — before, after, by how much.
  'measured_results',
  // A dated announcement built around a demo. The only place pitching is the job.
  'shipped',
  // A position that doesn't need a build to justify it.
  'opinion',
  // A rule was imposed on the work; this reports what happened under it.
  'constraints',
  // Last resort. If this fills up, the tiebreaker rule isn't being applied.
  'retrospective',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export function isKnownCategory(value: string): boolean {
  return (BLOG_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Tags are free-form, so only their shape can be checked: singular, untensed,
 * snake_case. Only the shape is machine-checkable — singular and untensed are
 * on you.
 *
 * A near-duplicate pair splits a query silently and nothing else will warn.
 */
export const TAG_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

export function isWellFormedTag(value: string): boolean {
  return TAG_PATTERN.test(value);
}
