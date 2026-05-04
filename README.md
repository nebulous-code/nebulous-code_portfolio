# nebulouscode.com

Personal portfolio site. Astro 5 + Vue islands + Tailwind v4, deployed to
Render as a static site, with GitHub activity data baked in at build time
on a 6-hour schedule.

This is **slice 1 of 5** — the structural skeleton. Visually it's intentionally
unstyled. Real design comes in slice 3 once design tokens are settled.

## What's here

```
.
├── astro.config.mjs              # Astro + Vue + MDX + Tailwind v4 wiring
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TS config, with ~/* path alias for src/
├── render.yaml                   # Render deployment config
├── .github/workflows/
│   └── scheduled-rebuild.yml     # Cron + manual trigger for rebuilds
├── src/
│   ├── config/
│   │   └── projects.ts           # Single source of truth for all projects
│   ├── content.config.ts         # Astro content collection schema
│   ├── content/
│   │   ├── now.md                # Manually-curated "currently building"
│   │   └── projects/             # MDX case studies
│   ├── lib/
│   │   └── github.ts             # GitHub fetch + sanitization layer
│   ├── components/
│   │   ├── ProjectCard.astro     # Visibility-aware project card
│   │   └── ActivitySparkline.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro           # Home (dashboard)
│   │   ├── about.astro
│   │   ├── projects/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro      # Dynamic case study route
│   │   ├── resume.astro
│   │   └── contact.astro
│   └── styles/
│       └── global.css            # Tailwind v4 + placeholder tokens
└── ...
```

## Run locally

```bash
npm install
cp .env.example .env             # add your GITHUB_TOKEN if you want to test
                                 # private-repo data flowing through
npm run dev
```

Open http://localhost:4321.

Without a `GITHUB_TOKEN`, the sparkline will use the unauthenticated public
events feed (60 req/hr per IP, public events only). With one, it uses the
authenticated endpoint that includes your private repo activity in the count
— which is the whole point of the sanitization layer.

## Deploy setup (one-time)

1. Push this repo to GitHub.
2. In Render, create a new **Static Site** pointing at the repo. The
   `render.yaml` config will be detected automatically.
3. In Render, add an environment variable `GITHUB_TOKEN` — a fine-grained
   PAT with `Contents: read` and `Metadata: read` for your repos.
4. In Render, copy the **Deploy Hook URL** (Settings → Deploy Hook).
5. In GitHub, add a repository secret `RENDER_DEPLOY_HOOK_URL` with the
   value from step 4.
6. In Render, add your custom domain `nebulouscode.com`.

The cron job in `.github/workflows/scheduled-rebuild.yml` will start
firing every 6 hours and trigger a fresh build with up-to-date data. You
can also click **Run workflow** in the GitHub Actions tab to rebuild on
demand.

## How the data pipeline works

The "developer is a verb" feel comes from three live signals on the home page:

1. **Activity sparkline** — last 90 days of commit activity, bucketed by
   day. Pulled from GitHub's events feed. Includes private repo activity
   when authenticated, but only as counts and dates; no commit content
   or repo names from private repos ever leaves `src/lib/github.ts`.

2. **Per-project last-update labels** — each tracked project's most
   recent default-branch commit. Date is always shown; commit message is
   only shown when the project's `allowlistContent` flag is `true`.

3. **Currently-building text** — manually edited in `src/content/now.md`.
   Bypass the GitHub API entirely; this is the part you control directly.

All three are baked into static HTML at build time. Visitors load plain
HTML; no API calls happen at request time.

## Adding a new project

1. Add an entry to `PROJECTS` in `src/config/projects.ts`.
2. Create `src/content/projects/<slug>.mdx` with matching frontmatter.
3. Decide:
   - `visibility`: `'public'`, `'private-saas'`, or `'private-wip'`
   - `allowlistContent`: only `true` for public repos you're comfortable
     showing commit messages from.
4. Commit and push. Next scheduled rebuild (or a manual trigger) picks
   it up.

### When a project transitions public → private SaaS

This is the path you'll most likely take ("free demo gets users → paywall
features → close the source"). To handle it:

1. Make the GitHub repo private.
2. Update the entry in `src/config/projects.ts`:
   - Change `visibility` to `'private-saas'`
   - Set `allowlistContent` to `false`
   - Add `productUrl` pointing to the live product
   - Remove `liveDemoUrl` (or keep it pointing at a marketing landing page)
3. Update the case study to remove anything that's now competitive
   intelligence — replace "view code" affordances with an architecture
   write-up section.
4. Push. The next build will:
   - Continue counting commits in the sparkline (auth'd PAT can see it)
   - Stop showing commit messages on the project card
   - Stop showing "View code" links
   - Show "Visit product" instead

The sanitization layer in `src/lib/github.ts` is deny-by-default, so
forgetting step 2's `allowlistContent: false` is the *only* failure
mode that could leak — and even then, you'd need the repo to also still
be marked `'public'` in visibility, which you'd have to actively keep.

## Build order (what's left)

- **Slice 1 (this):** Structural skeleton.
- **Slice 2:** Pick one case study (Pokémon dashboard) and finish it
  end-to-end. Real prose, real screenshots, real polish.
- **Slice 3:** Design handoff. Generate a spec for Claude design covering
  tokens, component palette, dashboard reference notes. Replace placeholder
  styles in `src/styles/global.css` with the real tokens.
- **Slice 4:** GitHub integration polish — verify counts match
  expectations, tune the sparkline visualization, add the per-project
  last-update labels.
- **Slice 5:** Remaining case studies, resume page (HTML + PDF), real
  contact links, polish pass.

## Notes on framework choice

- **Astro** because it's purpose-built for content-heavy sites and bakes
  perfectly into static HTML. Vue components run as "islands" — only
  hydrated where interactivity is actually needed.
- **Vue 3** for any interactive bits (e.g., a project filter in slice 5).
  Keeps the framework you already know in the picture.
- **Tailwind v4** for styling. v4's CSS-based config (`@theme` blocks)
  fits cleanly with the design tokens approach for slice 3.
- **MDX** for case studies because it lets you embed live mini-demos,
  charts, and interactive components inside long-form prose — useful for
  the "show me something working" feel.
