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
 * - `name`            Display name shown in cards and case studies. This is
 *                     ALWAYS what visitors see — the GitHub repo name is never
 *                     rendered directly, so renaming a repo doesn't affect
 *                     the site.
 *
 * - `tagline`         One-sentence pitch for cards.
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
 * - `featured`        If true, this project appears as a card on the home page
 *                     and in the /projects index. If false, it's tracked for
 *                     the sparkline but not surfaced as a featured project.
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
 * - `tags`            Free-form tag list for the /projects index filter.
 */

/** GitHub account that owns the tracked repos. Used by the data pipeline. */
export const GITHUB_USERNAME = 'nebulous-code';

export type ProjectVisibility = 'public' | 'private-saas' | 'private-wip';

/**
 * What kind of thing `liveUrl` points at, which decides how the link reads.
 * Add a kind here and give it a label in PROJECT_LINK_LABELS — nothing else
 * needs to change.
 */
export type ProjectLinkKind = 'demo' | 'product';

const PROJECT_LINK_LABELS: Record<ProjectLinkKind, string> = {
  demo: 'live demo →',
  product: 'visit product →',
};

export interface ProjectConfig {
  slug: string;
  name: string;
  tagline: string;
  repo: string;
  visibility: ProjectVisibility;
  tracked: boolean;
  featured: boolean;
  allowlistContent: boolean;
  liveUrl?: string;
  linkKind?: ProjectLinkKind;
  tags: string[];
}

export const PROJECTS: ProjectConfig[] = [
  {
    slug: 'pokemon-dashboard',
    name: 'Pokémon Card Market Intelligence Dashboard',
    tagline: 'Full-stack dashboard tracking Pokémon TCG card prices over time.',
    repo: 'nebulous-code/card_market_intelligence_dashboard',
    visibility: 'public',
    tracked: true,
    featured: true,
    allowlistContent: true,
    liveUrl: 'https://cards.nebulouscode.com',
    linkKind: 'product',
    tags: ['vue', 'fastapi', 'postgres', 'data-viz'],
  },
  {
    slug: 'cube-practice',
    name: 'Quiet-Cube',
    tagline: 'Web app for drilling OLL algorithms with spaced repetition.',
    repo: 'nebulous-code/quiet-cube',
    visibility: 'public',
    tracked: true,
    featured: true,
    allowlistContent: true,
    // Open source, but a real product someone can use.
    liveUrl: 'https://quiet-cube.com/',
    linkKind: 'product',
    tags: ['vue', 'spaced-repetition'],
  },
  {
    slug: 'chip8-emulator',
    name: 'Chip-8 Emulator',
    tagline: 'Chip-8 emulator written in Rust with a Vue desktop wrapper.',
    repo: 'nebulous-code/chip-8',
    visibility: 'public',
    tracked: true,
    featured: true,
    allowlistContent: true,
    // A toy you play with rather than a product, so it keeps the 'demo'
    // default. Served from the chip8-vue repo, not the tracked chip-8 one.
    liveUrl: 'https://nebulous-code.github.io/chip8-vue/',
    tags: ['rust', 'emulator', 'tauri'],
  },
];

/**
 * Helpers used by the data pipeline and templates.
 */

export function getFeaturedProjects(): ProjectConfig[] {
  return PROJECTS.filter((p) => p.featured);
}

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
