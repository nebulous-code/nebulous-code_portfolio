# nebulouscode.com

Source for [nebulouscode.com](https://nebulouscode.com), my personal portfolio site. Astro 5 + Vue islands + Tailwind v4, deployed as a static site to Render, with GitHub activity data baked in at build time on a 6-hour cron.

This README focuses on how the site is built and why. For day-to-day operational notes (adding projects, deploy setup, transitions) see [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md). For active work and roadmap see [`docs/TODO.md`](docs/TODO.md).

## Architecture at a glance

```
GitHub API ──┐
             │  (build-time fetch, sanitization layer)
             ▼
       src/lib/github.ts
             │
             ▼
   Astro build (static HTML)
             │
             ▼
        Render CDN
             ▲
             │  (Deploy Hook)
             │
   GitHub Actions cron ── every 6h + manual trigger
```

The site is fully static at request time — no API calls, no server runtime, no cold starts. Freshness comes from rebuilding on a schedule, not from runtime fetches. The tradeoff is up to ~6 hours of staleness; the upside is zero rate-limit risk, zero hosting cost beyond Render's static tier, and a simple deploy story.

## Stack and rationale

| Choice | Why |
|---|---|
| **Astro 5** | Content-heavy sites with mostly static output. Frontmatter scripts run at build time, so GitHub data is fetched once and baked into HTML. |
| **Vue 3 islands** | Interactivity where it's actually needed (e.g., project filters), without shipping a full SPA runtime for static pages. |
| **Tailwind v4** | CSS-based config via `@theme` blocks aligns naturally with a design-tokens approach. No JS config file. |
| **MDX** | Case studies as long-form prose with optional embedded interactive components. |
| **Render static** | Already used for other projects in the same portfolio, simple deploy hook for the cron-rebuild pattern. |
| **Static-only output** | Site stays live even if every external dependency fails. Build is the only place anything can break. |

## The data pipeline

Three live signals on the home page reflect "what I'm currently working on":

1. **Activity sparkline** — last 90 days of commit activity, bucketed daily. Sourced from the GitHub events feed.
2. **Per-project last-update labels** — most recent default-branch commit per tracked repo.
3. **Currently-building text** — manually curated in `src/content/now.md`.

All three are baked at build time. Visitors load static HTML.

### Sanitization layer

`src/lib/github.ts` is the single boundary between raw GitHub API responses and rendered output. It enforces a deny-by-default rule: counts and dates always pass through, but commit messages, repo names, SHAs, and branches only pass through for repos explicitly opted in via the `allowlistContent` flag in `src/config/projects.ts`.

This matters because the authenticated PAT used at build time can see private repo activity. The aggregate sparkline reflects all my work (public + private), but no private content reaches the rendered page. When a public repo transitions to private (e.g., a free demo becoming a paid SaaS), flipping the project's `allowlistContent` flag to `false` is sufficient to stop content leakage on the next build.

## Project structure

```
.
├── astro.config.mjs              # Astro + Vue + MDX + Tailwind v4
├── render.yaml                   # Render static site config
├── .github/workflows/
│   └── scheduled-rebuild.yml     # Cron + workflow_dispatch trigger
├── docs/
│   ├── MAINTENANCE.md            # Operational guide
│   └── TODO.md                   # Active work and milestones
└── src/
    ├── config/projects.ts        # Single source of truth for projects
    ├── content.config.ts         # Astro content collection schema
    ├── content/
    │   ├── now.md                # Currently-building text
    │   └── projects/             # MDX case studies
    ├── lib/github.ts             # GitHub fetch + sanitization layer
    ├── components/
    │   ├── ProjectCard.astro     # Visibility-aware project card
    │   └── ActivitySparkline.astro
    ├── layouts/BaseLayout.astro
    ├── pages/                    # Routes
    └── styles/global.css         # Tailwind + design tokens
```

## Run locally

```bash
npm install
cp .env.example .env             # optional: add a GITHUB_TOKEN
npm run dev
```

Open `http://localhost:4321`.

## Build

```bash
npm run build       # outputs to ./dist
npm run preview     # serve the build locally
```

## License

The source code in this repository is provided as a portfolio reference. Content (case studies, prose, design assets) is not licensed for reuse.
