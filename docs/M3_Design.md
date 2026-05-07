# Handoff: M3 Slices D & E

You are picking up an in-progress portfolio site at `nebulouscode.com`. Most of the design system is built. Your job is to finish the remaining page layouts (slice D) and do the polish pass (slice E). This document is the spec — follow it strictly. Where you genuinely need to deviate, document the reason in your commit message.

Read this entire document before writing code. Then read `docs/DESIGN.md` for the design tokens, component patterns, and "don't do these" rules. The DESIGN.md is the source of truth for visual decisions; this doc is the source of truth for what to build and how to integrate it with the existing system.

---

## Project context

- **Stack**: Astro 5 + Vue islands + Tailwind v4 + MDX, deployed to Render as a static site.
- **Data**: GitHub activity (commits across active repos in last 90 days) is fetched at build time via `src/lib/github.ts` and baked into static HTML. A scheduled GitHub Action triggers a Render rebuild every 6 hours.
- **The site mostly works.** The home page is fully styled. The data pipeline works. M1 (skeleton) and M2 (deferred — case study writing happens later) are not your concern. Your scope is M3.
- **Where things live**:
  - `src/components/` — atoms (Eyebrow, Badge, KpiCell, KpiGrid, Button, Sparkline) and composites (PushChart, ProjectCard).
  - `src/layouts/BaseLayout.astro` — site shell with sticky nav and minimal footer.
  - `src/pages/` — routes. Home (`/`) is done. The rest needs work.
  - `src/content/projects/*.mdx` — case study bodies (placeholder content; do not write content).
  - `src/styles/global.css` — design tokens.
  - `src/config/projects.ts` — project metadata. **Single source of truth for all projects.**
  - `src/lib/github.ts` — GitHub data pipeline with sanitization layer.
  - `docs/DESIGN.md` — design system spec.
  - `docs/MAINTENANCE.md` — operational guide.

---

## Slice D — page layouts (your primary scope)

The home page is done. The remaining routes:

1. `/projects` — projects index
2. `/projects/[slug]` — individual case study
3. `/about` — about page
4. `/resume` — resume page
5. `/contact` — contact page

Build them in the order listed. After each, verify `npm run dev` shows the page rendering without errors before moving on.

### D1: Projects index (`src/pages/projects/index.astro`)

**Container**: `.container-wide`.

**Layout**:

1. Hero block (top of page):
   - `display`-sized headline (Source Serif 4, 48px, weight 500): "Projects"
   - `lede` italic paragraph (Source Serif 4 italic, 18px, ink-muted, max-width 640px): one sentence describing the page. Suggested: *"Things I've built. Each has a longer case study with the decisions, the dead ends, and what I'd do differently."*
2. Section divider (1px line border-top, full width inside container).
3. Project grid:
   - Same 2-column responsive grid pattern as home page (`grid-template-columns: repeat(2, 1fr)` at 800px+, single column below).
   - Use the existing `ProjectCard` component. Pass `project`, `activity` (from `getProjectActivity`), and leave `sparkline` as default empty array (per-project sparkline data is M4 work).
   - Show **all** featured projects (`getFeaturedProjects()`). The home page also shows these; that overlap is intentional for now.

**Data fetching** (in frontmatter):

```ts
import { getFeaturedProjects } from '~/config/projects';
import { getProjectActivity } from '~/lib/github';

const projects = getFeaturedProjects();
const projectActivity = await getProjectActivity();
const activityByRepo = new Map(projectActivity.map((p) => [p.repo, p]));
```

**Future extension** (do not implement now): tag-based filter UI. Leave a comment like `{/* TODO M5: tag filter (small Vue island) */}` where the filter would go.

**Visual rhythm**: hero, section divider, grid. The grid should have padding-block above and below so the section feels deliberate, not crammed against the divider.

### D2: Individual case study page (`src/pages/projects/[slug].astro`)

This is the most distinct page. Long-form prose layout. **Use Recursive Mono Casual for body copy** (per DESIGN.md §3 — Recursive is for running prose, Departure Mono is for chrome only).

**Container**: `.container-narrow`.

**Layout**:

1. **Header block**:
   - `meta` text above title (Departure Mono, 11px, ink-faint, uppercase tracking): publication date formatted as `LONG_MONTH YYYY`.
   - `display`-sized title (Source Serif 4, 36-48px depending on title length, weight 500). Use the MDX frontmatter's `title`.
   - `lede` italic paragraph (Source Serif 4 italic, 17-18px, ink-muted, max-width 640px). Use the MDX frontmatter's `summary`.
   - Action links row: "live demo →" (if `liveDemoUrl` set), "code →" (if `visibility === 'public'`), "visit product →" (if `visibility === 'private-saas'` and `productUrl` set). Each link is `font-mono`, 12px, blue. Use the conditional pattern from `ProjectCard.astro` for the visibility-aware logic.

2. **Section divider** (1px line, full width inside container).

3. **Body content** (the MDX renders here):
   - The MDX body is rendered via Astro's content collections.
   - Apply prose styles via a wrapper element (e.g., `<div class="prose">`):
     - Body text: Recursive (`var(--font-body)`), 14px, line-height 1.65, `font-variation-settings: "MONO" 1, "CASL" 1, "wght" 400`, color `var(--color-ink)`.
     - Bold text (`<strong>`): same font, `"wght" 500`.
     - Italic body inside prose: `font-variation-settings: "MONO" 1, "CASL" 1, "wght" 400, "slnt" -8`. **Do not use `font-style: italic`**; Recursive uses the slant axis.
     - Headings inside prose (`h2`, `h3`): Source Serif 4, weight 500, `letter-spacing: -0.01em`.
       - `h2`: 24-26px, with generous margin-top (var(--space-10)) and margin-bottom (var(--space-5)).
       - `h3`: 18-20px, smaller margins.
     - Inline `<code>`: Departure Mono (`var(--font-mono)`), 0.9em, color `var(--color-blue)`. (Per DESIGN.md: inline code in Recursive prose uses Departure Mono so it visibly differs from surrounding mono body.)
     - Code blocks (`<pre>`): `var(--color-bg-inset)` background, 1px line border, `border-radius: var(--radius-md)`, `padding: var(--space-6)`, overflow-x auto. Inside, use Departure Mono.
     - Blockquotes: `border-left: 2px solid var(--color-blue)`, padding-inline-start `var(--space-6)`, color `var(--color-ink-muted)`.
     - Lists (`ul`, `ol`): standard indentation, but bullet color `var(--color-ink-faint)`. Items get `margin-block: var(--space-3)` for breathing room.
     - Paragraphs: `margin-block: var(--space-6)`.
     - Links inside prose: blue, with underline on hover. Existing global link styles are fine.

4. **Footer block** (after MDX body):
   - Section divider.
   - Same action links as the header (live demo, code, etc.) — visitors who reach the bottom shouldn't have to scroll back up.
   - "← all projects" ghost link back to `/projects`.

**Data fetching**:

```ts
import { getCollection, render } from 'astro:content';
import { getProjectBySlug } from '~/config/projects';

export async function getStaticPaths() {
  const entries = await getCollection('projects');
  return entries.map((entry) => ({
    params: { slug: entry.data.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const project = getProjectBySlug(entry.data.slug);
```

**Frontmatter integration**: the existing case study MDX files have `slug`, `title`, `summary`, `publishedAt`, `tags`, `hasArchitectureSection` per `src/content.config.ts`. Do not change the schema.

### D3: About page (`src/pages/about.astro`)

**Container**: `.container-narrow`.

**Layout**:

1. Header block:
   - `meta` eyebrow (uppercase tracking): "ABOUT"
   - `display` headline: "About"
   - `lede` italic paragraph: a one-sentence positioning statement. Use the existing placeholder content in the file as a starting point.
2. Section divider.
3. Body block (Recursive Mono Casual prose, same styles as case study body):
   - The existing About page placeholder content is fine. Do not rewrite content; just apply the prose styles.
   - Reuse the prose CSS — extract it into a shared CSS file or component if it'll be repeated more than twice. (It will: about, resume, case study, contact all have prose. Make a `src/styles/prose.css` that gets imported where needed.)

### D4: Resume page (`src/pages/resume.astro`)

**Container**: `.container-narrow`.

**Layout**:

1. Header block (same pattern as About): meta eyebrow "RESUME", display headline "Resume", italic lede.
2. Action row: "download PDF →" link. PDF doesn't exist yet; link should target `/resume.pdf` and that's fine — broken link will be fixed in M5. Style as a secondary button or a primary action link.
3. Section divider.
4. Body: structured resume content. Since the actual resume content isn't part of M3 (that's an M5 task), put a placeholder block:
   ```astro
   <div class="prose">
     <p><em>HTML resume coming in M5. The PDF download will land at the same time.</em></p>
     <p>For now, the projects page tells the story.</p>
     <p><a href="/projects">See projects →</a></p>
   </div>
   ```

### D5: Contact page (`src/pages/contact.astro`)

**Container**: `.container-narrow`.

**Layout**:

1. Header block: meta eyebrow "CONTACT", display headline "Contact", italic lede ("The fastest way to reach me is email. I'm also on GitHub and occasionally LinkedIn.").
2. Section divider.
3. Body: a small KPI-grid-style block listing channels. Use the existing `KpiGrid` and `KpiCell` components — but with a twist: each cell's value is a clickable link.
   - 3 cells: email, github, linkedin
   - Cell values are short — the actual address/handle, not full URLs
   - Wrap each cell's content in a link
   - Pull email from a constant at the top of the file: `const EMAIL = 'hello@nebulouscode.com';` (this is placeholder; user will replace)
   - GitHub: `https://github.com/nebulous-code`
   - LinkedIn: TODO placeholder (link to `#` for now, leave a TODO comment)

This treatment turns the contact page into a small dashboard rather than a list. Reinforces the design system.

---

## Slice E — polish (your secondary scope)

Do these after slices D1-D5 are complete and rendering. Each is small but real.

### E1: Hover and focus states audit

Walk through every interactive element on every page. Verify:

- **Hover** on links: color shift to `var(--color-blue)` or text-decoration: underline. Per spec, no transforms.
- **Focus-visible** on links and buttons: 2px blue outline at 2px offset (`outline: 2px solid var(--color-blue); outline-offset: 2px;`). The Button component already has this; verify nav links and inline links also have it. Add to global link styles if missing.
- **Hover** on nav links: color shift from `ink-muted` to `ink`. Active state stays blue with underline.
- **Hover** on project cards: subtle. Either lift slightly via `bg-raised` going slightly lighter (use `color-mix`), or shift the title color. **Do not animate transforms** per spec.
- **Hover** on action links inside cards: underline only.

Implementation note: prefer the global `:focus-visible` pseudo-class over `:focus`. Mouse users don't see a focus ring; keyboard users do. Critical for accessibility.

### E2: Accessibility verification

Verify against DESIGN.md §8:

- **Color contrast**: spot-check that body text on backgrounds meets the spec's stated ratios. Use browser devtools' color contrast checker on representative elements.
- **No color-only state**: every status indicator (badges, KPI cells, etc.) pairs color with a text label. Verify no element communicates state by color alone.
- **Keyboard navigation**: tab through every page top to bottom. Every interactive element should be reachable, focus state should be visible, tab order should be logical.
- **`aria-current="page"`** on the active nav link in BaseLayout. Currently the active state is visual only; add the ARIA attribute to the active nav item.
- **Image `alt` attributes**: any `<img>` should have alt text. If decorative, `alt=""`. (There may not be any images yet; if so, this is a no-op.)
- **Heading hierarchy**: each page has exactly one `<h1>`, and headings don't skip levels. The `display` class is typically on `<h1>`; section eyebrows are `<span>`, not headings.

### E3: Transitions

Per spec, the only transition the system uses is `background-color 120ms ease`. Verify:

- Buttons have it (Button component already does).
- Nav link hover has it.
- Card hover has it.
- Nothing else animates. No transforms, no opacity transitions, no entrance animations. The site is static and fast.

### E4: Performance smoke test

Run Lighthouse in Chrome devtools on the home page and case study page. Targets:

- Performance: 95+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

If any score is below 90, document the cause in your commit message. Don't chase 100s — diminishing returns at the top.

Common culprits: missing `alt` text (accessibility), missing meta description (SEO), CLS from web fonts (performance — usually unfixable without subsetting). The web font CLS is a known cost we accept for using Google Fonts.

### E5: Final pass against DESIGN.md "don't do these"

Walk through DESIGN.md §9. Verify:

- No pure black `#000` or pure white `#fff`.
- No gradients on surfaces, buttons, or text.
- No box shadows.
- No fifth color.
- No emoji as functional UI.
- No system fonts as body font.
- No Departure Mono in running prose.
- No Recursive Sans/Linear (`MONO 0` or `CASL 0`).
- No border radii ≥ 12px.
- No text below 9px.

If you find any violations, fix them.

---

## Conventions to follow (learned the hard way)

These came from the human-built parts of the codebase. Follow them; don't deviate.

### Astro JSX gotchas

**Use plain `class` attributes, not `class:list`, inside `.map()` callbacks.** The `class:list` directive parses fine in some positions and breaks in others — particularly when the JSX is the return value of a `.map()`. Compute the class string outside the JSX:

```astro
{items.map((item) => {
  const linkClass = isActive(item) ? 'link active' : 'link';
  return <a href={item.href} class={linkClass}>{item.label}</a>;
})}
```

**Use ternaries with `null`, not `&&` short-circuit, for conditional JSX inside `.map()`.** Multi-attribute JSX inside `&&` blocks confuses Astro's parser:

```astro
{/* This breaks. */}
{condition && <a href={x} class="y" target="_blank">label</a>}

{/* This works. */}
{condition ? <a href={x} class="y" target="_blank">label</a> : null}
```

**Literal curly braces in text**: wrap in a string expression or use HTML entities:

```astro
<h1>Nicholas {'{nebulous-code}'}</h1>
{/* OR */}
<h1>Nicholas &#123;nebulous-code&#125;</h1>
```

### Env var loading

`process.env` works at build time on Render but **does not work in the dev server**. Use the dual pattern:

```ts
const TOKEN = import.meta.env['MY_VAR'] ?? process.env['MY_VAR'];
```

`import.meta.env` is what Vite exposes via the `.env` file in dev. `process.env` is what Render injects in production builds. The `??` chain handles both. Already in use in `src/lib/github.ts`; follow the same pattern if you add new env-var reads.

### Scoped styles + dynamically-inserted HTML

Astro scopes styles to the component automatically. When you use `set:html`, the injected content does **not** get the scoped class hash, so descendant selectors won't match unless you wrap them in `:global()`:

```css
.now-text :global(strong) {
  /* applies to <strong> tags inside content rendered via set:html */
}
```

This is on the home page already; follow the pattern when needed.

### Inline styles for dynamic colors

Astro's scoped styles can't reference runtime JS values. For dynamic colors (e.g., a `tone` prop on a component), use inline `style` attributes:

```astro
const colorVar = tone === 'green' ? 'var(--color-green)' : 'var(--color-ink)';
---
<span style={`color: ${colorVar};`}>...</span>
```

This is the pattern in `Eyebrow.astro`, `Badge.astro`, `KpiCell.astro`. Keep it consistent.

### Component imports

Use **relative paths** for sibling components (`./Eyebrow.astro`), and the **`~/` alias** for cross-directory imports (`~/lib/github`, `~/config/projects`, `~/layouts/BaseLayout.astro`). Both work; the convention helps readability — relative paths signal "next to me," alias paths signal "elsewhere in the project."

### The sanitization layer (do not break this)

`src/lib/github.ts` is the **single boundary** between raw GitHub API responses and rendered HTML. The deny-by-default rule:

- **Counts and dates always pass through**, regardless of repo visibility.
- **Repo names, commit messages, SHAs, branch names** only pass through for repos in the content allowlist (projects with `allowlistContent: true` in `src/config/projects.ts`).

If you add new functions to `src/lib/github.ts` that fetch data from GitHub, follow the same rule. The portfolio site can have private repos contributing to the activity sparkline without leaking commit content. Don't bypass this.

### Fault tolerance

Every function in `src/lib/github.ts` catches errors and returns degraded-but-valid data (empty arrays, null fields). The build does not crash on a single failed fetch. If you add new fetches, follow this pattern.

### Variable-width container pattern

`BaseLayout.astro` exposes two utilities (`.container-wide`, `.container-narrow`) via `:global()`. Pages opt in by wrapping their content. **The layout does not impose a width by default.** When building a new page, pick the right container based on content shape:

- **Cards, grids, dashboards**: `.container-wide` (1100px max).
- **Prose, long-form content**: `.container-narrow` (720px max).

### Naming convention

- The user is `nebulous-code` everywhere — username, GitHub references, mental model. The exception is the domain `nebulouscode.com` (no hyphen).

---

## Definition of done

You are done with this handoff when:

1. All five remaining pages (D1-D5) render without console errors and look like they belong to the same design system as the home page.
2. The slice E checklist (E1-E5) is complete.
3. `npm run build` succeeds with no warnings.
4. `npm run dev` shows no console errors when navigating between pages.
5. A walk-through of every page on a desktop browser shows: consistent navigation, consistent typography hierarchy, working hover/focus states, no design system violations from DESIGN.md §9.
6. You have **not** modified `src/lib/github.ts`, `src/config/projects.ts`, or `src/components/*` (the existing atoms and composites). If you think one needs changes, write a separate commit and explain why in the message.
7. Mobile (≤640px) viewport works for every page. Test in Chrome devtools' device emulation.
8. The TODO list in `docs/TODO.md` has M3 closeout items checked off.

---

## What is explicitly NOT in scope

Don't do these unless asked:

- Writing case study content (the MDX bodies). The placeholder text is fine.
- Resume PDF generation.
- The tag filter on `/projects` (Vue island, M5).
- Per-project sparkline data (`getProjectSparkline`-style fetch, M4).
- The remaining KPIs on project cards (latest release, commits 30d, open PRs — M4).
- Real email/LinkedIn URLs on the contact page.
- Image generation (OG images, favicon, etc. — M5).
- Modifying the design tokens or DESIGN.md.

If you find yourself wanting to do any of these, stop and ask.

---

## Commit message style

One commit per slice (D1, D2, D3, D4, D5, E). Format:

```
M3 D1: projects index

- Hero block with display + lede
- Project grid using existing ProjectCard
- Section divider pattern matching home page
```

If you encountered an interesting decision or a gotcha, note it in the body. The commit log is part of the project documentation.

---

## When you finish

Update `docs/TODO.md` to mark M3 complete. The next milestone is M4 (data pipeline polish — adding latest release, commits 30d, open PRs to project cards). Don't start M4. Hand back to the user.
