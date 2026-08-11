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

/** Whole days between now and an ISO timestamp; Infinity when there isn't one. */
export function daysSince(iso: string | null | undefined): number {
  if (!iso) return Infinity;
  return Math.round((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * "today" / "3d ago" / "7mo ago". Shared by the project card and the summary
 * page so the same commit can't be described two different ways.
 */
export function lastPushLabel(days: number): string {
  if (!Number.isFinite(days)) return '—';
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}
