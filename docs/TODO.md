# TODO

Roadmap for nebulouscode.com. Organized by milestone. Earlier milestones are detailed; later ones are sketched and will be expanded as they approach.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Milestone 1 — Skeleton

**Goal:** the URL works, all routes navigate, the data pipeline architecture is in place even if not fully wired.

### Closing out M1

These are the remaining tasks to finish M1 and have a deployable site:

- [x] **Verify the project locally**
  - [x] `npm install` succeeds
  - [x] `npm run dev` starts and `http://localhost:4321` loads
  - [x] All routes navigate without 404 (`/`, `/about`, `/projects`, `/projects/pokemon-dashboard`, `/projects/cube-practice`, `/projects/chip8-emulator`, `/resume`, `/contact`)
  - [x] `npm run build` succeeds and produces `dist/`

- [x] **Confirm or correct the repo names** in `src/config/projects.ts`. The scaffolded values are best guesses (`nebulous-code/pokemon-dashboard` etc.) — if any are wrong, the per-project "last update" labels will silently miss until corrected.

- [x] **Create a fine-grained PAT** on GitHub with `Contents: read` and `Metadata: read` for the relevant repos. Save it somewhere safe; you'll use it in two places.

- [x] **Set up Render**
  - [x] Create a new Static Site pointing at this repo
  - [x] Add `GITHUB_TOKEN` env var with the PAT
  - [x] Copy the Deploy Hook URL
  - [x] Add `nebulouscode.com` as a custom domain and configure DNS

- [x] **Wire up the GitHub Action**
  - [x] Add `RENDER_DEPLOY_HOOK_URL` as a repo secret
  - [x] Manually trigger the workflow once to confirm it fires a Render build
  - [x] Confirm the cron schedule is active (it'll show up in the Actions tab)

- [x] **Smoke test on production**
  - [x] Visit nebulouscode.com after first deploy
  - [x] Confirm the sparkline renders (even if data is sparse)
  - [x] Confirm project cards show "Updated X days ago"
  - [x] Confirm clicking through to a case study works

- [x] **Commit the docs/ split** (this README rework)

Retro: 

- Vite env loading: import.meta.env is the dev-server path, process.env is the build-time path, the ?? fallback handles both
- GitHub events API quirk: /users/{u}/events (authenticated) does not include the commits array in PushEvent payloads, only /users/{u}/events/public does. We're counting pushes, not commits, as a result. The label says "pushes" intentionally. Might change this in the future.
 
### Known M1 limitations (deferred to later milestones)

- Visually unstyled — placeholder palette in `src/styles/global.css` will be replaced in M3
- "Currently Building" text is hardcoded in `src/pages/index.astro`; should read from `src/content/now.md` (M5)
- No tag filter on `/projects` index (M5)
- Resume page is a stub (M5)
- Contact page has placeholder email and missing LinkedIn (M5)
- Case studies are TODO outlines (M2 for Pokémon, M5 for the others)

---

## Milestone 2 — First complete case study (Pokémon dashboard)

**Goal:** one project, fully written up to a quality I'd be proud to point a hiring manager at. Use it as the template for everything else.

Outline:

- Write the Pokémon dashboard case study end-to-end in `src/content/projects/pokemon-dashboard.mdx`
  - Problem framing
  - Approach + scope decisions (vertical slices, what was cut)
  - Key technical decisions: TCGdex over eBay Finding API, Vue + FastAPI + Postgres choice, Magikarp dark theme, box-and-whisker charts, URL-persisted filters
  - What was learned (honest section — surprises, dead ends)
  - What's next
- Capture screenshots of the live dashboard at meaningful states
- Decide on screenshot handling: static files in `public/`, or embedded as MDX components?
- Add any inline interactive demos that make sense (small price-distribution sample, etc.)
- Cross-link from the case study to the live demo subdomain
- Once polished, treat this MDX file as the canonical template for case studies

---

## Milestone 3 — Design handoff

**Goal:** replace placeholder styles with a real design system. The site should look like the dashboard-feeling vibe we're aiming for, not a template.

- [x] Write design spec (`docs/DESIGN_DOC.md`)
- [x] Implement tokens in `src/styles/global.css` (Tailwind v4 `@theme` block)
- [x] Atoms + composites: Eyebrow, Badge, KpiCell, KpiGrid, Button, Sparkline, PushChart, ProjectCard
- [x] Home page styled
- [x] Slice D — page layouts
  - [x] D1 `/projects` index (hero + project grid)
  - [x] D2 `/projects/[slug]` case study (header, MDX in `<Prose>`, footer)
  - [x] D3 `/about` (header + prose body)
  - [x] D4 `/resume` (header + PDF download placeholder + prose body)
  - [x] D5 `/contact` (header + KpiGrid with link cells)
- [x] Slice E — polish
  - [x] E1 hover/focus states (global `a:focus-visible` outline added; nav inherits)
  - [x] E2 a11y (`aria-current="page"` on active nav, single `<h1>` per page, no skipped levels)
  - [x] E3 transitions audit (only `background-color`/`color` 120ms ease — no transforms)
  - [x] E5 don't-do-these audit (palette closed; no shadows/gradients; only Departure Mono for chrome and `<code>`; Recursive prose stays MONO 1 CASL 1)
- [ ] E4 Lighthouse smoke test — needs to be run by user in Chrome devtools (cannot run headless from agent). Targets: 95+ across the four categories.

---

## Milestone 4 — GitHub data polish

**Goal:** the live data signals work the way they're supposed to, look right, and degrade gracefully.

Outline:

- Verify the events feed gives accurate counts (compare against your actual recent activity)
- Tune the sparkline visualization based on real data shape
- Confirm the public/private split is working as designed (private repo activity counted, no content leaked)
- Add explicit error handling for edge cases (empty feed, all-zero days, future-dated commits from clock skew)
- Consider adding a "currently building" subsection that cross-references the most recently active tracked repo
- Decide whether to add a small `/api/refresh-status` style endpoint that shows when the last build ran (helpful for debugging staleness)

---

## Milestone 5 — Content and polish

**Goal:** everything else is finished. The site is ready to send to recruiters.

Outline:

- Write Cube Practice case study
- Write Chip-8 emulator case study
- Resume page: HTML version using the design system + PDF download
- Contact page: real email, LinkedIn, any other channels
- Refactor "Currently Building" to read from `src/content/now.md` properly
- Add tag filter to `/projects` index (small Vue island)
- About page: expand to include the small business + PM background framing as differentiators
- Final polish pass: meta tags, OpenGraph images, sitemap, favicon
- Run Lighthouse, fix any accessibility or performance issues
- Cross-browser smoke test

---

## Future / not in any milestone

Things to consider after the site is launched:

- RSS feed for case study updates
- Privacy-respecting analytics (Plausible or self-hosted Umami)
- Game Boy emulator project added when it exists
- Possible blog distinct from project case studies if writing volume justifies it
