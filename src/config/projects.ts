/**
 * Project configuration.
 *
 * This is the single source of truth for which projects exist and how they
 * should be treated by the site's data pipeline. Adding a new project means
 * adding one entry here.
 *
 * Field reference:
 *
 * - `slug`            URL slug used for the case study route (/projects/[slug]).
 *                     Must match a corresponding MDX file in src/content/projects/.
 *
 * Note: `title` and `tagline` are NOT here. Every string a human writes about
 * a project lives in its summary's MDX frontmatter, so there's one file to
 * edit and nothing to keep in sync. This file holds pipeline facts only —
 * which repo, how to treat it, where to link. See docs/POST_TAXONOMY.md.
 *
 * - `repo`            GitHub repo in `owner/name` format. Used by the data
 *                     pipeline to fetch commit data. May point to a private
 *                     repo; the sanitization layer (src/lib/github.ts) handles
 *                     what's safe to surface.
 *
 * - `visibility`      Controls how the card and case study render:
 *                       'public'       — code is open; show "View Code" button
 *                                         and may show commit messages.
 *                       'private-saas' — running product, source closed.
 *                                         Show product/pricing link instead of
 *                                         repo link. Never show commit content.
 *                       'private-wip'  — in development, not yet shipped.
 *                                         Card shows minimal info or is hidden.
 *
 * - `tracked`         If true, this repo is queried for its most recent commit,
 *                     which drives the "last push" KPI and the active/idle
 *                     status on the project card. Set false to show a card with
 *                     no freshness data (rare).
 *                     This does NOT gate the activity sparkline. That scans
 *                     every non-archived, non-fork repo pushed to in the last
 *                     90 days — owned, collaborator, and org — by design, so
 *                     work outside these projects still counts toward the
 *                     total. See getCommitActivity in src/lib/github.ts.
 *
 * - `allowlistContent` Explicit opt-in to showing commit *messages* (and other
 *                     content like SHAs and branch names) for this repo.
 *                     Default is false — even public repos are scrubbed unless
 *                     explicitly allowed. This is the "deny by default" stance
 *                     for the sanitization layer.
 *                     Should always be false for visibility !== 'public'.
 *
 * - `liveUrl`         Where a visitor can actually use the thing (e.g.,
 *                     cards.nebulouscode.com). Surfaced on both the project
 *                     card and the summary page. Omit if there's nowhere to
 *                     send them yet — the link is skipped rather than broken.
 *
 * - `linkKind`        How that link is labeled. Deliberately independent of
 *                     `visibility`: an open-source repo can still be a real
 *                     product someone uses, and a closed one can be a toy.
 *                     Defaults to 'demo'. See PROJECT_LINK_LABELS to add a
 *                     new kind (a desktop download, say).
 *
 * Note: there is deliberately no `tags` field here. Tags live in the summary's
 * MDX frontmatter, which is the canonical source — they span posts and
 * summaries alike and drive /tags/. A second list here would drift.
 */

/** GitHub account that owns the tracked repos. Used by the data pipeline. */
export const GITHUB_USERNAME = 'nebulous-code';

export type ProjectVisibility = 'public' | 'private-saas' | 'private-wip';

/**
 * Technologies the GitHub languages endpoint can't see, because they're used
 * rather than written. Postgres in these repos is a dependency, not a corpus —
 * the card dashboard reports no SQL at all, just 0.06% Mako from Alembic
 * templates, so no byte-share floor would ever surface it.
 *
 * A union rather than `string[]` on purpose: a typo becomes a TypeScript error
 * caught by your editor and by `astro check` in the content workflow, but NOT
 * by `astro build`, which strips types without checking them. That puts it on
 * the right side of the warn-vs-fail split — it fails CI, never a release.
 *
 * Add a member here to use it. Keep the list to things genuinely invisible to
 * Linguist; anything with real code in the repo will show up on its own.
 */
export type StackTech =
  | 'postgres'
  | 'sqlite'
  | 'redis'
  | 'docker'
  | 'fastapi'
  | 'tailwind'
  | 'cargo'
  | 'vue'
  | 'wasm'
  | 'eframe'
  | 'excel'
  | 'github_actions'
  | 'axum'
  | 'sqlx'
  | 'astro'
  | 'cloudflare_pages'
  | 'remark42'
  | 'wrangler';

/**
 * What kind of thing `liveUrl` points at, which decides how the link reads.
 * Add a kind here and give it a label in PROJECT_LINK_LABELS — nothing else
 * needs to change.
 */
export type ProjectLinkKind = 'demo' | 'product';

/** No arrow here — ActionLink appends it, so baking one in would double up. */
const PROJECT_LINK_LABELS: Record<ProjectLinkKind, string> = {
  demo: 'live demo',
  product: 'visit product',
};

export interface ProjectConfig {
  slug: string;
  repo: string;
  visibility: ProjectVisibility;
  tracked: boolean;
  allowlistContent: boolean;
  liveUrl?: string;
  linkKind?: ProjectLinkKind;
  /** Asserted, unlike `languages` which is measured. See StackTech. */
  stack?: readonly StackTech[];
}

export const PROJECTS: ProjectConfig[] = [
  {
    slug: 'pokemon-dashboard',
    repo: 'nebulous-code/card_market_intelligence_dashboard',
    visibility: 'public',
    tracked: true,
    allowlistContent: true,
    liveUrl: 'https://cards.nebulouscode.com',
    linkKind: 'product',
    stack: ['excel', 'postgres', 'fastapi', 'github_actions'],
  },
  {
    slug: 'cube-practice',
    repo: 'nebulous-code/quiet-cube',
    visibility: 'public',
    tracked: true,
    allowlistContent: true,
    // Open source, but a real product someone can use.
    liveUrl: 'https://quiet-cube.com/',
    linkKind: 'product',
    stack: ['postgres', 'axum', 'sqlx'],
  },
  {
    slug: 'author-sites',
    repo: 'nebulous-code/astro_sites',
    // Private: it runs the publishing company's sites, and the repo carries
    // client content. Counts and dates still surface; nothing else does.
    visibility: 'private-saas',
    tracked: true,
    // Must stay false while the repo is private — this is what keeps commit
    // messages, branch names and SHAs off the page. See the note on the field.
    allowlistContent: false,
    liveUrl: 'https://nicholaslicalsi.com',
    linkKind: 'product',
    // Doing more work here than on the other projects: with allowlistContent
    // false the languages endpoint is never read, so this list is the entire
    // technology row rather than a supplement to it. `astro` earns a place it
    // wouldn't on a public repo, where Linguist would report it.
    stack: ['astro', 'cloudflare_pages', 'github_actions', 'remark42', 'wrangler'],
  },
  {
    slug: 'chip8-emulator',
    repo: 'nebulous-code/chip-8',
    visibility: 'public',
    tracked: true,
    allowlistContent: true,
    // A toy you play with rather than a product, so it keeps the 'demo'
    // default. Served from the chip8-vue repo, not the tracked chip-8 one.
    liveUrl: 'https://nebulous-code.github.io/chip8-vue/',
    stack: ['vue', 'wasm', 'eframe'],
  },
];

/**
 * Helpers used by the data pipeline and templates.
 */

export function getTrackedRepos(): string[] {
  return PROJECTS.filter((p) => p.tracked).map((p) => p.repo);
}

export function getContentAllowlist(): Set<string> {
  return new Set(
    PROJECTS.filter((p) => p.allowlistContent).map((p) => p.repo),
  );
}

export function getProjectBySlug(slug: string): ProjectConfig | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

/**
 * The "go use the thing" link, resolved to an href and its label. Shared by
 * the project card and the summary page so the two can't drift apart.
 * Returns null when there's nowhere to send a visitor yet.
 */
export function getLiveLink(
  project: ProjectConfig,
): { href: string; label: string } | null {
  if (!project.liveUrl) return null;
  return {
    href: project.liveUrl,
    label: PROJECT_LINK_LABELS[project.linkKind ?? 'demo'],
  };
}
