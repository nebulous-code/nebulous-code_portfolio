# Post Taxonomy

Three axes, and they should never overlap:

- **Project** — linking a post to its project gives language, stack, and repo for free. Nothing else needs to encode that.
- **Category** — the **form** of a post. What kind of writing it is. Exactly one per post.
- **Tags** — the **subject**. What it is about. As many as genuinely apply.

The reason this holds together is that category and tags answer different questions. Most blog taxonomies collapse because both axes end up answering "what is it about," and then nothing has an obvious home.

## Where each axis lives

| Axis | Written in | Applies to | Browsable at |
|---|---|---|---|
| project | post frontmatter, `project:` | posts | the project summary page |
| category | post frontmatter, closed list in `src/config/taxonomy.ts` | posts only | `/blog/category/<category>` |
| tags | **MDX frontmatter** — both posts and project summaries | both | `/tags/<tag>` |

Tags are canonical in the MDX frontmatter and nowhere else. `src/config/projects.ts` deliberately has no `tags` field: a second list would drift from the first, and only one of them could win.

`/tags/<tag>` is canonical for a tag no matter what carries it. It lists project summaries first, then posts — the summary is the evergreen reference for a subject, the posts are the running commentary on it. Categories stay under `/blog/` because a summary has no form or tone to describe.

---

# Categories

Every post gets exactly one category. If two fit, use the tiebreaker rather than picking both.

## The tiebreaker rule

**Category is what the reader is meant to walk away with, not what the post is made of.**

Almost everything here will contain a retrospective, so "it looks back at a project" is never enough to make something a Retrospective. When to Rewrite Prod is built entirely out of a migration retrospective, but the reader leaves with a rule about when to touch a stable system, so it's Advice.

## The list

This list is closed at eight. Adding one should be a deliberate decision, not something that happens because a post didn't fit. If it starts drifting past eight, it has turned into a second tag system.

### Advice

Directed outward. The reader is supposed to do something differently after reading it.

Examples: the Chip-8 emulator post, When to Rewrite Prod.

This is the mode that serves the junior dev reader most directly, so it will probably carry the most weight over time.

### Design Decisions

One fork examined. What the options were, what got picked, what it cost, and whether it was right in hindsight.

Example: the Remark42 post, where two requirements couldn't both be true.

The distinguishing feature is that a real choice existed. If there was no choice, it belongs somewhere else.

### What Broke

Something went wrong and the failure itself is the subject. Post-mortems, bug write-ups, how it happened, and what got added to keep it from happening again.

This is also the low-lift weekly option. A week spent only fixing bugs still produces a post here, and work material fits if it stays vague enough.

No measured results or design fork required, which is the point of keeping it separate from those two.

### Measured Results

Numbers are the spine. Before, after, what changed and by how much.

Example: the Lighthouse performance post.

If the numbers are supporting evidence rather than the point, it is probably Design Decisions or What Broke instead.

### Shipped

An announcement. A thing is out and other people should use it.

These are short by design: an embedded video demo that shows and pitches the project, with a little writing wrapped around it. This is the only category where pitching is the job.

Distinct from a project summary, which is evergreen reference and lives as its own content type. A Shipped post is dated and narrative, tied to a release.

### Opinion

A position that doesn't need a build to justify it.

Examples: monorepos are fine, why Google stays off my sites.

### Constraints

A rule was imposed on the work, and the post reports what happened under it.

Example: building the Gameboy emulator in Rust without AI coding tools.

Speculative for now, but the habit is well documented: no Google services, no agent-written content, one monorepo against the grain.

### Retrospective

Last resort. Nothing else fits, or the post is a rant about nothing in particular.

If this category starts filling up, the tiebreaker rule is not being applied.

## Boundaries worth remembering

- **What Broke vs. Measured Results** — the Lighthouse story qualifies for both, since it opens with a regression and resolves with a table. It is Measured Results because the reader leaves with the numbers and the lesson about invisible work. Had the failure been the point, it would be What Broke with the table as evidence.

- **What Broke vs. Design Decisions** — both can contain a mistake. Design Decisions is about a fork chosen between. What Broke is about something going wrong whether or not a choice existed.

- **Shipped vs. project summary** — Shipped is a dated announcement built around a demo. The summary is the evergreen reference page. A project can have both.

## Considered and cut

**Explainer** — teaching a concept for the semi-technical reader. Cut because the interest isn't there right now, and in practice the explaining happens inside other posts anyway, the way the Lighthouse definition sits in the middle of a numbers piece. It's a mode, not a category.

---

# Tags

Tags are subject domains. What the piece is about, at any level of technicality.

## The rule

**A tag is anything not derivable from the project link.**

Languages, frameworks, and stack are already covered by linking to the project, so they never become tags. No `rust`, no `astro`, no `cloudflare`.

What's left is subject: `emulator`, `blog`, `pokemon`, `rubiks_cube`. Note that some of these are technical — "not a language or framework" is the actual test, not "non-technical."

### The gap this used to leave, and how it's closed

The rule assumes the project link covers the whole stack. It doesn't, on its own: GitHub's languages endpoint measures *bytes of code*, so anything used rather than written is invisible to it. The card dashboard reports **no SQL at all** — its only database trace is 0.06% Mako from Alembic templates — and Quiet-Cube reports PLpgSQL at 0.24%. No byte-share floor would ever surface Postgres in either.

That gap was the one real temptation to tag `postgres`, which would have broken the rule. Instead the project itself carries a second, hand-asserted list:

```ts
// src/config/projects.ts
stack: ['postgres', 'fastapi'],
```

So the premise holds: the project link really does cover the stack, and tags stay purely about subject.

Two different kinds of claim, kept apart on purpose. *"Python is 70% of this repo"* is a measurement that re-derives every build. *"This uses Postgres"* is an assertion that goes stale silently the day you rip Postgres out. They merge for display — a reader doesn't care which half was counted — but they stay separate in config because only one self-corrects.

`StackTech` is a union type rather than `string[]`, so a typo is a TypeScript error caught by your editor and by `astro check`, but not by `astro build`, which strips types without checking. It fails the content workflow, never a release.

## Tags are deliberately not project-specific

A tag should be able to span several projects, and ideally reach outside code entirely. `pokemon` should still work if it covers a card dashboard, a rom hack, an AI that plays the games, or something with no code in it at all.

If a tag can only ever apply to one project, it isn't a tag. That's what the project link is for.

## Naming

Singular, untensed, snake_case. Same rule as the tdx labels, for the same reason: near-duplicate pairs split a query silently.

`emulator` not `emulators`. `rubiks_cube` not `Rubik's cube`.

**Settle the slug before the first tag exists.** Apostrophes and spaces become URLs, and renaming a tag with twenty posts behind it is the same class of problem as orphaning comments by changing permalinks, just smaller.

## Tags apply to project summaries too

Categories do not — a summary has no tone or form to describe, so the axis doesn't apply. Tags do, and they're what connects the two content types: `pokemon` surfaces the card dashboard summary alongside any Pokemon posts.

If tags were post-only, summaries and posts would live in separate worlds.

Both write them the same way, in MDX frontmatter:

```yaml
# src/content/projects/pokemon-dashboard.mdx     # src/content/blog/tcgdex.mdx
tags:                                            tags:
  - pokemon                                        - pokemon
  - dashboard
```

`/tags/pokemon` then lists the summary first and both posts under it.

## Open question

Whether a tag page renders when only one item sits behind it. Several tags will be thin for a while, since the cross-domain ambition is the whole point. Same question as an empty Related Posts section, and probably wants the same answer.
