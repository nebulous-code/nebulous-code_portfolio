/**
 * Choosing which technologies to show.
 *
 * Two sources that behave differently:
 *
 *   languages  MEASURED. From the GitHub languages endpoint, already filtered
 *              to those clearing the byte-share floor. Self-correcting — it
 *              re-derives on every build.
 *   stack      ASSERTED. Hand-listed in src/config/projects.ts for things
 *              Linguist cannot see. Postgres in these repos is a dependency,
 *              not a corpus: the card dashboard reports no SQL at all, only
 *              0.06% Mako from Alembic templates. No byte-share floor would
 *              ever surface it.
 *
 * They merge for display because a visitor asking "what is this built with"
 * doesn't care which half of the answer was counted and which was claimed.
 * They stay separate in config because only one of them self-corrects.
 */

/**
 * Up to three, guaranteeing at least one of each kind when both exist, and
 * spending any leftover slot on a language first.
 *
 * The guarantee is the point: a Python/Vue/Postgres project that showed three
 * languages would hide the database entirely, and a Rust-only project that
 * showed one language would waste the row.
 *
 * Ordering is languages first, then stack — measured before asserted, and it
 * reads the way someone would say it out loud.
 */
export function pickFeaturedTech(
  languages: readonly string[],
  stack: readonly string[],
  limit = 3,
): string[] {
  const chosenLanguages: string[] = [];
  const chosenStack: string[] = [];

  // One of each, so neither kind can be crowded out.
  if (languages.length > 0) chosenLanguages.push(languages[0]!);
  if (stack.length > 0) chosenStack.push(stack[0]!);

  // Remaining slots prefer languages; stack fills in only once languages run
  // out, which is what lets a single-language repo still fill the row.
  const remainder = [...languages.slice(1), ...stack.slice(1)];
  for (const item of remainder) {
    if (chosenLanguages.length + chosenStack.length >= limit) break;
    if (languages.includes(item)) chosenLanguages.push(item);
    else chosenStack.push(item);
  }

  return [
    ...languages.filter((l) => chosenLanguages.includes(l)),
    ...stack.filter((s) => chosenStack.includes(s)),
  ];
}

/**
 * Everything, for the pages with room for it — project summaries and post
 * pages. Languages still respect the byte-share floor; every asserted stack
 * entry is shown, since the list is short and hand-curated by definition.
 */
export function allTech(
  languages: readonly string[],
  stack: readonly string[],
): string[] {
  return [...languages, ...stack];
}
