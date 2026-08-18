/**
 * Display labels for taxonomy values.
 *
 * Tags, categories and stack keys are stored in snake_case because that is
 * what they are: URL segments (`/tags/retro_computing`), a closed union the
 * compiler checks (`StackTech`), and values the author types by hand. The
 * underscore is load-bearing in all three places.
 *
 * It is not load-bearing on screen, where it reads as a variable name. These
 * helpers are the display layer, applied at render time only — nothing here
 * touches storage, and `slugify()` in src/lib/content.ts remains the inverse
 * used for hrefs. Never feed a label back into a URL.
 *
 * Two forms because two contexts:
 *
 *   termLabel  chips, technology rows, anything the design system already
 *              lowercases in CSS. Only the underscore needs removing; the
 *              casing is decided by `text-transform: lowercase`, which is why
 *              a measured language keeps its own casing in the data.
 *   termTitle  headings, where nothing forces case and "retro_computing"
 *              would sit in a serif H1 looking like code.
 */

/** "retro_computing" -> "retro computing". Leaves other values untouched. */
export function termLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

/** "retro_computing" -> "Retro Computing". For headings and <title>. */
export function termTitle(value: string): string {
  return termLabel(value).replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}
