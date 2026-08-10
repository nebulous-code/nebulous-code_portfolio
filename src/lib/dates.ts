/**
 * Freshness stamps.
 *
 * One place for both the wording and the format, so the page headers and the
 * home page sections can't drift apart into "last updated: August 2026" and
 * "Updated Aug 2026".
 */

/**
 * Formats an editorial date as the eyebrow line above a title.
 *
 * UTC is deliberate: these come from date-only values like `2026-05-04`,
 * which parse as UTC midnight. Formatting in local time would render that as
 * May 3rd for any reader west of Greenwich, and at a month boundary it would
 * name the wrong month entirely.
 */
export function updatedLabel(date: Date): string {
  return `last updated: ${date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })}`;
}
