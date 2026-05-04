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
 * - `tracked`         If true, this project's commits feed the activity
 *                     sparkline (count + date only). If false, the project is
 *                     completely invisible to the data pipeline.
 *                     Use false for projects you want to feature in a card but
 *                     don't want contributing to the activity graph (rare).
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
 * - `productUrl`      For 'private-saas' projects, the live product URL.
 *
 * - `liveDemoUrl`     Optional live demo URL (e.g., pokemon.nebulouscode.com).
 *                     Used for the "Live demo" link on cards and case studies.
 *
 * - `tags`            Free-form tag list for the /projects index filter.
 */

export type ProjectVisibility = 'public' | 'private-saas' | 'private-wip';

export interface ProjectConfig {
  slug: string;
  name: string;
  tagline: string;
  repo: string;
  visibility: ProjectVisibility;
  tracked: boolean;
  featured: boolean;
  allowlistContent: boolean;
  productUrl?: string;
  liveDemoUrl?: string;
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
    liveDemoUrl: 'https://pokemon.nebulouscode.com',
    tags: ['vue', 'fastapi', 'postgres', 'data-viz'],
  },
  {
    slug: 'cube-practice',
    name: 'Rubik\u2019s Cube Practice',
    tagline: 'Web app for drilling OLL algorithms with spaced repetition.',
    repo: 'nebulous-code/cube_practice_app',
    visibility: 'public',
    tracked: true,
    featured: true,
    allowlistContent: true,
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
