# nebulouscode.com

Source for [nebulouscode.com](https://nebulouscode.com), my personal portfolio site. Astro 5 + Tailwind v4 + MDX, deployed as a static site to Cloudflare Pages, with GitHub activity data baked in at build time on a 6-hour cron. Ships no JavaScript bundles — two small inline scripts, for the relative deploy timestamp and the mobile nav toggle.

This README focuses on how the site is built and why. For day-to-day operational notes (adding projects, deploy setup, transitions) see [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md). For active work and roadmap see [`docs/TODO.md`](docs/TODO.md).

## Architecture at a glance

```
GitHub Actions ── push to main · every 6h · manual trigger
             │
             ▼
GitHub API ──┐
             │  (build-time fetch, sanitization layer)
             ▼
       src/lib/github.ts
             │
             ▼
   Astro build (static HTML)
             │
             ▼    (wrangler pages deploy — direct upload)
   Cloudflare Pages
```

The build runs in Actions and Wrangler uploads the result, rather than the host building from a git hook. That way the job reporting success is the job that actually built — a failed build shows up as a red check instead of silently leaving the previous site in place.

The site is fully static at request time — no API calls, no server runtime, no cold starts. Freshness comes from rebuilding on a schedule, not from runtime fetches. The tradeoff is up to ~6 hours of staleness; the upside is zero rate-limit risk, no hosting cost on Cloudflare's free tier, and a simple deploy story.

## Stack and rationale

| Choice | Why |
|---|---|
| **Astro 5** | Content-heavy sites with mostly static output. Frontmatter scripts run at build time, so GitHub data is fetched once and baked into HTML. |
| **Tailwind v4** | CSS-based config via `@theme` blocks aligns naturally with a design-tokens approach. No JS config file. |
| **MDX** | Case studies as long-form prose with optional embedded interactive components. |
| **Cloudflare Pages** | Same deploy pattern as my other Astro sites, so there is one mental model for both. Direct upload from Actions keeps the build and its credentials in one place, and Pages keeps every deployment for one-click rollback. |
| **Static-only output** | Site stays live even if every external dependency fails. Build is the only place anything can break. |

## The data pipeline

Three live signals on the home page reflect "what I'm currently working on":

1. **Activity sparkline** — last 90 days of commit activity, bucketed daily. Walks the commit history of every non-archived, non-fork repo I've pushed to in the window (across all branches), so private and collaborator work counts toward the total.
2. **Per-project last-update labels** — most recent default-branch commit per tracked repo.
3. **Currently-building text** — manually curated in `src/content/now.md`.

All three are baked at build time. Visitors load static HTML.

## The blog

Posts are MDX in `src/content/blog/`; the filename is the URL. `publishedAt` doubles as a release gate — a future-dated post has no page, no listing entry, no RSS item, and its URL 404s until a build runs after that timestamp. Since the cron fires every 6 hours, a post goes live within 6 hours of its date rather than at a precise moment. `draft: true` withholds one regardless of date.

Everything reads through `getPublishedPosts()` in `src/lib/content.ts`. Nothing else may call `getCollection('blog')` — that function is the only thing standing between a scheduled post and the public site.

Three taxonomy axes, documented in [`docs/POST_TAXONOMY.md`](docs/POST_TAXONOMY.md):

- **project** — a link. Supplies the technology row for free, so no post ever names a language.
- **category** — the *form* of the piece. Exactly one, from a closed list of eight.
- **tags** — the *subject*. Shared with project summaries, which is what makes `/tags/<tag>` list both.

An unrecognised category warns during the build and publishes anyway; `npm run validate:content` is what fails, in its own CI workflow separate from the release cron. A content typo can't delay a scheduled post, and a failed deploy is never mistaken for a content error.

RSS lives at `/rss.xml`, with autodiscovery in every page head.

### Sanitization layer

`src/lib/github.ts` is the single boundary between raw GitHub API responses and rendered output. It enforces a deny-by-default rule, drawn around quoting rather than around visibility: counts, dates, release tags, and language breakdowns always pass through, because they describe a repo rather than reproduce anything written in it. Commit messages, repo names, SHAs, and branches only pass through for repos explicitly opted in via the `allowlistContent` flag in `src/config/projects.ts`.

This matters because the authenticated PAT used at build time can see private repo activity. The aggregate sparkline reflects all my work (public + private), but no private content reaches the rendered page. When a public repo transitions to private (e.g., a free demo becoming a paid SaaS), flipping the project's `allowlistContent` flag to `false` is sufficient to stop content leakage on the next build. A private project still reports its version tag and languages, so its card is as complete as any other — a repo going private changes what the site can quote, not what it can count.

## Project structure

```
.
├── astro.config.mjs              # Astro + MDX + Tailwind v4
├── .github/workflows/
│   ├── deploy.yml                # Build + deploy to Cloudflare Pages; cron every 6h
│   └── validate-content.yml      # Frontmatter + typecheck, off the release path
├── scripts/
│   └── validate-content.ts       # npm run validate:content
├── docs/
│   ├── DESIGN_DOC.md             # Design system — maintained
│   ├── POST_TAXONOMY.md          # Category/tag rules — maintained
│   ├── MAINTENANCE.md            # Operational guide
│   ├── M3_Design.md              # Historical handoff, deliberately stale
│   └── TODO.md                   # Roadmap
└── src/
    ├── config/
    │   ├── projects.ts           # Single source of truth for projects
    │   └── taxonomy.ts           # Closed category list
    ├── content.config.ts         # Collection schemas: projects, blog, now
    ├── content/
    │   ├── now.md                # Currently-building text
    │   ├── projects/             # MDX project summaries
    │   └── blog/                 # MDX posts
    ├── lib/
    │   ├── github.ts             # GitHub fetch + sanitization layer
    │   ├── content.ts            # Release gating, taxonomy queries
    │   ├── stack.ts              # Which technologies to show, per surface
    │   └── dates.ts              # Freshness stamps, relative dates
    ├── components/               # ProjectCard, PostCard, PageHeader, …
    ├── layouts/BaseLayout.astro
    ├── pages/                    # Routes, incl. /blog, /tags, rss.xml.ts
    └── styles/global.css         # Tailwind + design tokens
```

## Run locally

```bash
npm install
cp .env.example .env             # optional: add a GITHUB_TOKEN
npm run dev
```

Open `http://localhost:7574`.

## Build

```bash
npm run build              # outputs to ./dist
npm run preview            # serve the build locally
npm run validate:content   # blog frontmatter checks (needs Node >= 22)
npm run typecheck          # astro check
```

`npm run dev` and `npm run preview` both bind port 7574 on all interfaces (`server` in `astro.config.mjs`), so other machines on the network can reach them.

## License

The source code in this repository is provided as a portfolio reference. Content (case studies, prose, design assets) is not licensed for reuse.
