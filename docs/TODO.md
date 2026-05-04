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

- [ ] **Set up Render**
  - [ ] Create a new Static Site pointing at this repo
  - [ ] Add `GITHUB_TOKEN` env var with the PAT
  - [ ] Copy the Deploy Hook URL
  - [ ] Add `nebulouscode.com` as a custom domain and configure DNS

- [ ] **Wire up the GitHub Action**
  - [ ] Add `RENDER_DEPLOY_HOOK_URL` as a repo secret
  - [ ] Manually trigger the workflow once to confirm it fires a Render build
  - [ ] Confirm the cron schedule is active (it'll show up in the Actions tab)

- [ ] **Smoke test on production**
  - [ ] Visit nebulouscode.com after first deploy
  - [ ] Confirm the sparkline renders (even if data is sparse)
  - [ ] Confirm project cards show "Updated X days ago"
  - [ ] Confirm clicking through to a case study works

- [ ] **Commit the docs/ split** (this README rework)

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

Outline:

- Write a design spec (`docs/design-spec.md` probably) for Claude design covering:
  - Design tokens: color palette (dark only), type scale, spacing scale, radii, shadow rules
  - Component inventory: project card states, sparkline styling, case study layout, navigation
  - "Dashboard-feeling" reference notes: real dashboards to draw from, anti-patterns to avoid
  - Accessibility constraints (contrast minimums, focus states, motion)
- Hand off to Claude design
- Implement the resulting tokens in `src/styles/global.css` (Tailwind v4 `@theme` block)
- Apply tokens across components, replacing all inline styles
- Iterate until the home page reads as "deliberate engineer" not "tailwind defaults"

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
