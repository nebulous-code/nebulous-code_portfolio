# nebulouscode — Design System

A reference for human and AI developers working on the portfolio. Treat it as the source of truth: if a color or font isn't here, don't introduce it without a discussion.

---

## 1. Brand at a glance

**Direction:** Bathysphere · Prussian blue field, moss green, burnt sienna.
**Mood:** Painted, matte, slightly off-true. Pigment-from-a-tube rather than digital RGB. Reads as a developer's site — terminal/IDE adjacent — but with editorial calm; not a Bloomberg dashboard, not a SaaS marketing page.
**Background philosophy:** Always dark, never pure black. The page is a deep ocean / night sky. Pure `#000` is forbidden.
**Color philosophy:** Blue is the field, moss and sienna are the brand accents. Neither accent should ever feel "decorative" — every color carries meaning (state, category, emphasis).

---

## 2. Color tokens

All colors below are the canonical hex values. Use these names as CSS custom properties (e.g. `--color-bg`, `--color-ink-muted`).

### Surfaces

| Token | Hex | Role |
|---|---|---|
| `bg` | `#0f1c2a` | Page background. The Prussian blue field. |
| `bg-raised` | `#182838` | Cards, modals, anything sitting on top of `bg`. |
| `bg-inset` | `#0a1520` | Wells, inputs, code blocks, anything sitting *below* the surface plane. Darker than `bg`. |
| `line` | `#243646` | Default border. 1px solid for cards, dividers, tables. |

**Rules**
- Never use `#000` or pure white anywhere.
- Don't introduce a fourth surface tone. If something needs to feel "different," change `line` weight or use a brand accent — don't invent a new gray.
- Gradients are forbidden on surfaces. Flat fills only — that's what makes the system feel painted.

### Ink (text)

| Token | Hex | Role |
|---|---|---|
| `ink` | `#ece4d6` | Primary text. Warm off-white — *not* pure white. Body copy, headlines. |
| `ink-muted` | `#9a9080` | Secondary text. Subtitles, descriptions, secondary buttons. |
| `ink-faint` | `#5e564a` | Meta text. Timestamps, label captions, "updated 22d ago." Small caps territory. |

**Rules**
- Three tiers, period. If something needs more emphasis than `ink`, use weight (500/600) or a brand accent — don't add a fourth ink.
- Body copy is `ink` at 13–16px depending on context. Anything below 13px should be `ink` or `ink-muted` only — `ink-faint` is too low contrast for readable prose.
- Italic body copy (Source Serif 4 italic) is a voice cue and stays at `ink-muted`.

### Brand accents

| Token | Hex | Role |
|---|---|---|
| `blue` | `#6a9bbd` | Harbor blue. Links, primary buttons, default chart series, active nav. |
| `blue-deep` | `#2c5475` | Blue fill at lower contrast. Selected states, secondary chart series. |
| `green` | `#6e8a5d` | Moss. The "active / shipping / healthy" color. Live indicators, in-progress badges, success states, "Currently Building" highlights. |
| `green-deep` | `#2d3d28` | Moss fill. Deep success backgrounds, filled-state accents. |
| `green-text` | `#789665` | Moss lightened until it clears 4.5:1 on `bg-raised`. Use whenever moss has to be *readable copy* rather than a fill or a mark — `green` itself is only 3.9:1 at body size. Same hue and saturation, brighter only. |
| `orange` | `#a8542e` | Burnt sienna. The "highlight / release / latest" color. Latest-day chart bar, version tags, callouts, hover states on certain links. |
| `orange-deep` | `#5c2c17` | Sienna fill. Filled buttons (rare), highlighted card backgrounds. |
| `orange-text` | `#ce764e` | Sienna lightened until it clears 4.5:1 on `bg-raised`. Use whenever sienna has to be *readable copy* — `orange` is 2.84:1 there, which fails even the graphics floor. Same hue and saturation, brighter only. |

**When to reach for which accent**
- **Blue** is the workhorse. If you're not sure, use blue. Most buttons, all links, default chart bars.
- **Moss green** signals *ongoing*: active project, healthy uptime, in-progress build, "I'm coding right now." Continuous states.
- **Burnt sienna** signals *recent*: latest push (the highlighted bar in the push chart), latest release tag, hover/active emphasis. Discrete events.
- Never use orange and green in the same component as the *only* differentiator — always anchor with blue or ink so the eye has a calm reference point.

**Forbidden uses**
- No saturated red. The brand has no red. (Wine, garnet, etc. were rejected — don't sneak them back in.)
- No teal, no purple, no yellow. The brand is four colors only: ink-warm, blue, moss, sienna.
- No accent on a full-page background. Accents tint elements, never fields.

---

## 3. Typography

Three typefaces, each with a clear job. Don't blur the boundaries.

### Recursive Mono Casual — Body & prose

- Google Fonts: `Recursive` (variable axes: `MONO`, `CASL`, `wght`, `slnt`).
- Used for: **all running prose** — case-study body, paragraph copy, list items, descriptions, longer-form text anywhere on the site.
- Why: monospace structure (keeps the developer-site feel) with a hand-drawn casualness that reads like real prose. Fixes the fatigue Departure Mono caused at body length.
- **Required font-variation-settings:** `"MONO" 1, "CASL" 1, "wght" 400` for body. The `MONO` axis must be `1` (fully monospaced); `CASL` must be `1` (fully casual). Don't use Recursive Sans or Recursive Linear — those are different products.
- For italic, set `"slnt" -8` instead of using `font-style: italic` (Recursive uses a slant axis).
- Weights via `wght`: 400 body, 500 inline emphasis (`<strong>`), 600 reserved for rare callouts.
- Letter-spacing: 0 default. Don't track casual mono — it's designed to flow.
- Body size: 14px / 1.65 line-height in case-study and long-form contexts.

### Departure Mono — UI chrome, data, meta

- Google Fonts: `Departure+Mono`
- Used for: KPIs, eyebrow labels, button text, badges/tags, tag labels, timestamps, footer meta, code blocks, terminal prompts, navigation labels, chart labels.
- **Not for body prose.** It is fatiguing at paragraph length — that's why Recursive carries the body. Departure stays the "developer voice" of the chrome.
- Weights: regular only. Use `font-weight: 500` sparingly for KPI values; otherwise stay at 400.
- Letter-spacing: `0.04em–0.08em` on uppercase eyebrows/labels. `0` on label text.
- Case: lowercase by default for UI labels. Uppercase only for eyebrow labels (e.g. `LAST PUSH`) at small sizes with letter-spacing.

### Source Serif 4 — Display, headlines, voice

- Google Fonts: `Source+Serif+4`
- Used for: headlines (display, h1, h2, h3), project titles, section headers, italic voice copy (lede paragraphs, taglines, pull quotes).
- Italic Source Serif body — used in **ledes and pull quotes only**, not in running prose (running prose is Recursive). Italic = voice cue, roman = display.
- Weights: 400 (body italic), 500 (display), 600 (rare emphasis).
- Letter-spacing: `-0.01em` on display sizes ≥24px. Default on smaller.

### Boundary rules

- **Body prose → Recursive Mono Casual.** Always.
- **Headline → Source Serif 4.** Always.
- **UI label, KPI, badge, eyebrow, code, meta, button → Departure Mono.** Always.
- **Lede paragraph or pull quote → Source Serif 4 italic.** Voice moments only.
- Inline `<code>` inside Recursive prose: use Departure Mono at `0.9em` so the code visibly differs from the surrounding mono body.

### Type scale

| Name | Size | Line height | Font | Use |
|---|---|---|---|---|
| `display` | 36–48px | 1.1 | Source Serif 4, 500 | Hero headline only. One per page. |
| `h1` | 28px | 1.15 | Source Serif 4, 500 | Section headers (Recent Activity, Projects). |
| `h2` | 22px | 1.2 | Source Serif 4, 500 | Project card titles. |
| `lede` | 17–18px | 1.55 | Source Serif 4, 400 italic | Lede paragraphs, pull quotes, voice copy. |
| `body` | 14px | 1.65 | Recursive Mono Casual, 400 (`MONO 1, CASL 1`) | All running prose — case-study body, descriptions, list items. |
| `body-ui` | 13px | 1.55 | Departure Mono, 400 | Short UI strings (button labels, descriptions inside cards ≤2 lines). |
| `kpi` | 14–18px | 1.25 | Departure Mono, 500 | KPI values inside cards. |
| `label` | 11–12px | 1.4 | Departure Mono, 400 | Inline labels, button text, tags. |
| `eyebrow` | 9–11px | 1.4 | Departure Mono, 400, uppercase, `0.06–0.08em` tracking | Section eyebrows, KPI keys (`LAST PUSH`). |
| `meta` | 10–11px | 1.4 | Departure Mono, 400 | Timestamps, footer, secondary meta. |

**Rules**
- Don't pair Source Serif 4 with non-italic body copy unless it's a headline. Italic = voice, roman = display.
- Never set Departure Mono below 9px — it loses legibility.
- Don't run Recursive without `MONO=1, CASL=1`. The non-mono / linear variants are off-brand.
- No fourth typeface. If a system font feels needed, you've made an error somewhere else.

---

## 4. Spacing & layout

Use a 4px base grid. Allowed spacing values: `4, 6, 8, 10, 12, 14, 18, 22, 28, 36, 48px`.

- **Card padding:** 18–22px.
- **Section spacing:** 28–48px between major sections.
- **Inline gap:** 6–10px (button rows, tag rows).
- **KPI grid gap:** 1px (so the `line` token shows through as the divider).

### Borders & radii


- Default border: `1px solid var(--color-line)`.
- Radii are deliberate and tight — the painted aesthetic doesn't like rounded blobs:
  - `2px` — small chips, badges, KPI cells.
  - `3–4px` — buttons, inputs.
  - `6–8px` — cards, surfaces.
  - No radii ≥12px anywhere. No fully circular avatars unless we change this rule on purpose (status dots are the exception — those are perfect circles).

### Shadows

Don't use them. The system is flat. If something needs to "lift," raise its surface tone (`bg` → `bg-raised`) or add a 1px `line` border. No `box-shadow` on cards, buttons, modals.

---

## 5. Component patterns

### Calls to action

**This site has no buttons.** Every call to action is a text link — no fill, no border, no padding box. That is a deliberate rule, not an omission. The system is flat and painted; a raised affordance has nothing to rise from, and a page of outlined boxes reads as a form rather than a portfolio.

- **Shape:** Departure Mono 12px, `letter-spacing: 0.02em`, no underline at rest, trailing ` →`.
- **Primary:** `color: blue`. The action you actually want taken.
- **Secondary:** `color: ink-muted`. Available, but not the pitch.
- **Hover:** underline. No color shift, no background, no transform.
- **Focus:** the global `a:focus-visible` ring covers every one of them, because they are all anchors.
- **Size:** 12px in dense contexts — card footers, summary page nav rows. **18px when the call to action sits in a page header or hero**, matching the lede directly above it; at 12px it gets dwarfed by an 18px italic summary. Steps down to 16px with the lede below 640px.

One component owns this: `src/components/ActionLink.astro`. It appends the arrow and adds `target="_blank" rel="noopener"` to off-site hrefs, so neither can be forgotten at a call site.

**The arrow is the tell**, and it points the way you travel:

| Direction | Form | Meaning |
|---|---|---|
| forward | `label →` | takes you onward — a project, a demo, a post, a download |
| back | `← label` | returns you to where you came from — `← all projects`, `← all posts` |

Both are `ActionLink` with `direction`; the arrow and its side are the component's job, never the call site's. A back link is still a call to action, so it behaves like one — same font, same tones, underline on hover. Only the arrow differs.

Links that are *not* calls to action never carry an arrow at all:

- inline links inside running prose
- project card and post card titles (they shift color instead)
- contact channel values in the KPI grid
- taxonomy chips

**Forbidden**

- Outlined buttons. Filled buttons. Anything `<button>`-shaped used for navigation.
- A call to action without an arrow, or an arrow on a link that doesn't navigate.
- An arrow pointing the wrong way for the direction of travel.

### Page header (every page)

Eyebrow, title, lede, optional actions row, then a 1px `line` rule. One component: `src/components/PageHeader.astro`. There are no size variants — one type scale across every page, regardless of container width.

The eyebrow is a **freshness stamp** wherever the page has hand-written content that can go stale: `last updated: August 2026`, formatted by `src/lib/dates.ts` so the wording and format can't drift. Pages whose content is derived rather than written (contact) carry no eyebrow at all. The projects listing derives its stamp from the most recent summary, so it re-dates itself.

Format dates in **UTC**. These are date-only values that parse as UTC midnight; formatting them locally renders the previous day west of Greenwich, and at a month boundary names the wrong month outright.

### Badges / tags

- Outline style only (transparent fill, colored border + text). 1px border, 2–3px radius, `padding: 2–3px 6–7px`, mono uppercase 9–10px, `letter-spacing: 0.06em`.
- Color encodes state:
  - `green` — active / shipping / live
  - `blue` — neutral / category
  - `orange` — release / highlight
  - `ink-muted` — idle / draft / archived

### KPI grid (the project-card pattern)

A grid of small stat cells. The pattern:
- `display: grid`, `grid-template-columns: repeat(N, 1fr)`, `gap: 1px`, `background: line`, wrapped in a `border: 1px solid line; border-radius: 3–4px; overflow: hidden`. Each cell is `bg-inset` so the 1px gap reads as a hairline divider.
- Cell content: eyebrow label on top, value below. Value can be `ink` (neutral), `green` (continuous), or `orange` (recent).

### Push chart (signature element)

- Bar chart of pushes per day, ~90 days.
- Bars: `blue` at varying opacity (0.4–1.0) based on count.
- The most recent day (today): `orange`. This is the system's signature "latest = sienna" rule.
- Empty days: `blue` at 0.18 opacity, ~1.5px tall (always show a tick so the eye reads the timeline).
- No axis lines. Only a 1px `line` baseline at the bottom.
- Always show total count + max/day in the eyebrow row above the chart.

### Sparklines (per-project)

- **Bars, not a stroke.** 13 weekly buckets across ~90 days, in `green`.
- Opacity scales with count. Empty weeks keep a faint tick (0.18) so the timeline reads continuous rather than truncated.
- Scales to its own maximum. Cards show their own rhythm and are deliberately *not* comparable to each other — the KPI cells carry the absolute numbers.
- Hidden entirely, eyebrow label included, when every bucket is zero. Thirteen empty buckets under a label reads as broken, not as idle.
- No axis, no gridlines, no labels.

A 1px stroke with a terminal end-cap was the original spec, and it was built. Real commit data killed it: the work here is bursty — a handful of active days separated by long gaps — so at 120px wide a polyline rendered each burst as a one-pixel needle on a flat line. Bars survive sparse data; strokes don't. Weekly buckets rather than daily for the same reason: 91 daily bars at that width are sub-pixel.

### The technology row

Appears on project cards, project summary pages, post cards, and post pages. Always `green-text`, mono 11px, lowercase, middle-dot separated — the same fact reads the same way everywhere it shows up.

**Two sources, merged for display:**

| Source | Origin | Behaviour |
|---|---|---|
| languages | GitHub languages API | measured; re-derived every build; filtered to ≥12% of repo bytes |
| `stack` | `src/config/projects.ts` | asserted by hand; always shown |

`stack` exists because the API measures *bytes of code*, so anything used rather than written is invisible to it. The card dashboard reports no SQL at all — 0.06% Mako from Alembic templates is its only database trace. Merged for display because a reader doesn't care which half was counted; kept separate in config because only one half self-corrects.

**How many show, by surface:**

| Surface | Rule |
|---|---|
| project card, post card | **three at most**, guaranteeing at least one language and one stack entry when both exist; a spare slot goes to a language first |
| project summary, post page | **everything** |

The guarantee is the point. Quiet-Cube's card reads `rust · vue · postgres` — JavaScript is dropped so the database isn't hidden — while its summary page reads `rust · vue · javascript · postgres`. A single-language repo still fills the row from stack: Chip-8 shows `rust · cargo · tauri`.

Selection lives in `src/lib/stack.ts`, not in the data layer. How many to show is a display decision and it differs per surface, so the API layer applies only the floor and returns everything above it.

**Posts never store any of this.** A post inherits its technology row from the project it links to, so the same fact can't drift between a post and the project card.

### Reuse over resemblance

`ProjectCard` and `PostCard` are the only two card designs. Every surface that lists projects or posts renders one of them:

| Surface | Renders |
|---|---|
| `/`, `/projects` | `ProjectCard` |
| `/blog`, `/blog/category/…` | `PostCard` |
| `/tags/…` | both — projects pinned above posts |
| project summary, "Writing" section | `PostCard` |

A tag page that hand-rolled its own list would be a third card design drifting from the other two the first time either changed. Same reasoning as `PageHeader` and `ProjectStatsGrid`: if a block appears twice, it becomes a component.

`ProjectStatsGrid` follows the same rule — the four-cell KPI strip appears on the project card *and* at the top of the summary page, so the numbers stay in view while reading the writeup. One component, one set of labels, one relative-date helper (`src/lib/dates.ts`) shared with the active/idle badge so a commit can't be described two ways on one card.

### Post card (blog listing)

One row in `/blog` and in every taxonomy listing. Same card shell as the project card — `bg-raised`, 1px `line`, `radius-lg`, 22px Source Serif title — so the two read as siblings.

1. Eyebrow date + title, stacked.
2. Summary: mono-casual body, 14px, `ink-muted`.
3. **Taxonomy line** — project, category, technology. One line, that order.
4. **Tag chips** — `blue`, linking to `/tags/…`.
5. Footer: freshness stamp on the left when the post has been revised, `read post →` on the right.

#### The taxonomy line

Mono 11px, middle-dot separated, in a fixed order because each part answers a different question and reading them in sequence is how someone would say it aloud:

| Segment | Question | Colour |
|---|---|---|
| project | which thing is this about | `ink-muted`, links to the summary |
| category | what kind of writing is this | `orange-text`, links to the category |
| technology | built with what | `green-text`, inherited from the project |

Any segment can be absent — a post with no project starts at the category.

**Separators hang off a wrapper span, never off the anchor.** A `::before` on a link is *inside* that link, which makes the dot clickable and underlines it on hover along with the label. Each segment is wrapped in `.seg`, and the rule is `.seg + .seg::before`. That also means a missing segment can't strand a leading dot.

**Chips are for tags only.** They're the many-valued, free-form axis, the axis shared with project summaries, and the only thing here a reader browses sideways into.

### Taxonomy vocabularies

**`docs/POST_TAXONOMY.md` is the source of truth** for what the axes mean, the closed list of eight categories, and how to choose between them. What follows is only how they render.

Three axes, and they answer three different questions. Keeping them separate is what makes filtering useful instead of noisy.

| Axis | Question | Cardinality | Reserved? |
|---|---|---|---|
| `project` | **Which thing is this about?** A link, not a string. | zero or one | n/a |
| `category` | **How is this written?** The form of the piece. | exactly one | yes, closed at eight |
| `tags` | **What is it about?** The subject. | zero or more | no |

There is deliberately **no `languages` axis**. It existed briefly and was removed: linking a post to a project already supplies language, stack, and repo, so storing them again would create a second source that drifts. A post linked to `chip8-emulator` renders `rust` without anyone typing it, pulled from the same GitHub-derived data the project card uses.

#### category — the form, never the subject

Renders as a line of type, not a chip — see the post card below. Lives at `/blog/category/…`.

Categories apply to posts only. A project summary has no form or tone to describe, so the axis doesn't reach it.

#### project — a link, and what it gives you for free

Sits at the same taxonomy level as category: a grouping you can browse by. The project summary page *is* that grouping page, since it already lists the posts written about it.

Linking also inherits the project's whole technology row — measured languages and asserted stack both — rendered in `green-text` beside the project name.

#### tags — the subject, spanning both content types

Tags are the one axis shared by posts **and** project summaries, which is what connects them: `pokemon` surfaces the card dashboard alongside any Pokémon posts. That's why they live at site level, **`/tags/<tag>` is canonical for every tag**, rather than under `/blog/`. Those pages list project summaries first, then posts.

**Tags are written in MDX frontmatter and nowhere else** — for posts and project summaries alike. `src/config/projects.ts` deliberately has no `tags` field; a second list would drift from the first.

A tag is anything not derivable from the project link. Languages, frameworks, and stack never become tags — the link covers those, and `stack` closes the gap where the languages API can't see something.

#### Enforcement

**An unknown reserved value warns; it never blocks.** A typo must not stop a scheduled post from publishing on time. The build logs a `[blog]` warning and ships; `npm run validate:content` fails, in its own CI workflow, off the release path. See `MAINTENANCE.md`.

Tags have no such check — nothing can validate a free-form vocabulary. Re-read this section when adding one.

### Inputs

- `background: bg-inset`, `border: 1px solid line`, `border-radius: 4px`, `padding: 8px 12px`, mono 13px, `color: ink`.
- Focus state: `border-color: blue`, no glow / shadow.
- Terminal-style prompt (used in search/command UI): a `~` in `green`, path in `ink-faint`, `$` in `orange`, then the typed command in `ink`. Cursor is a 7×14 `ink` block at 0.8 opacity.

### Cards (project pattern)

The project card is the system's most important component. Structure:
1. Eyebrow + title row: eyebrow ("project · active") in `ink-faint`, title in Source Serif 4. Status badge (top-right) in the relevant accent.
2. Description: 1–2 lines, mono 12px, `ink-muted`.
3. Technology row: middle-dot separated, lowercase, mono 11px, `green-text`. **Three at most on a card; everything on a summary page.** See "The technology row" below.
4. KPI grid: 4 cells — last push, latest release, total commits, commits 30d.
5. Footer row: activity chart on the left under an eyebrow label, calls to action on the right — `project summary →` in `ink-muted`, the live link in blue, in that order so the primary action lands on the far edge.

**Code is deliberately absent from the card.** It lives on the project summary page instead. The interesting thing is the built product and the writeup; source is the audit trail, and it earns its place two clicks in rather than on the pitch.

**A cell only exists if it can be populated.** "Open PRs" was specified here and cut after it read `0` on every card — a row of zeros reads deader than a dash, because a dash says "not applicable" while a zero says "nothing is happening." Check the real data before adding a cell.

**Languages carry a 12% floor.** Without one the row fills with build output and stray config; the floor sits where it does because a flagship project's second language was at 14.7%. The *cap* is not applied here — see below.

---

## 6. Voice & content

Not strictly visual, but the design depends on copy holding its end up.

- **Tense:** present, active. "Building a Game Boy emulator." Not "I built a Game Boy emulator."
- **Numbers:** use real numbers with units. `47 commits / 30d`, not `lots of commits recently`.
- **Capitalization:** Title Case for project names and section headers; lowercase for UI labels (`case study →`, not `Case Study →`).
- **Punctuation:** middle dots (`·`) separate metadata segments. En-dashes (`—`) for asides. No em-dashes squashed without spaces.
- **No emoji.** Ever. Status is communicated by color + label, never by 🟢 or 🚀.
- **No buzzwords.** No "passionate," "synergy," "leverage," "10x," "ninja."

---

## 7. CSS custom properties (drop-in)

```css
:root {
  /* Surfaces */
  --color-bg:         #0f1c2a;
  --color-bg-raised:  #182838;
  --color-bg-inset:   #0a1520;
  --color-line:       #243646;

  /* Ink */
  --color-ink:        #ece4d6;
  --color-ink-muted:  #9a9080;
  --color-ink-faint:  #5e564a;

  /* Accents */
  --color-blue:       #6a9bbd;
  --color-blue-deep:  #2c5475;
  --color-green:      #6e8a5d;
  --color-green-deep: #2d3d28;
  --color-green-text: #789665;
  --color-orange:     #a8542e;
  --color-orange-deep:#5c2c17;
  --color-orange-text:#ce764e;

  /* Type */
  --font-mono:    "Departure Mono", ui-monospace, SFMono-Regular, monospace;
  --font-serif:   "Source Serif 4", Georgia, serif;
  --font-body:    "Recursive", ui-monospace, SFMono-Regular, monospace;

  /* Apply to any element using --font-body */
  /* font-family: var(--font-body); font-variation-settings: "MONO" 1, "CASL" 1, "wght" 400; */
  /* For italic body: font-variation-settings: "MONO" 1, "CASL" 1, "wght" 400, "slnt" -8; */

  /* Radii */
  --radius-xs: 2px;
  --radius-sm: 3px;
  --radius-md: 4px;
  --radius-lg: 6px;
  --radius-xl: 8px;

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 6px;
  --space-3: 8px;
  --space-4: 10px;
  --space-5: 12px;
  --space-6: 14px;
  --space-7: 18px;
  --space-8: 22px;
  --space-9: 28px;
  --space-10: 36px;
  --space-11: 48px;
}

html, body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-body);
  font-variation-settings: "MONO" 1, "CASL" 1, "wght" 400;
  font-size: 14px;
  line-height: 1.65;
}

/* Italic body uses the slant axis, not font-style */
.body-italic {
  font-variation-settings: "MONO" 1, "CASL" 1, "wght" 400, "slnt" -8;
}

/* UI chrome — labels, KPIs, eyebrows, badges, code, meta */
.ui, .eyebrow, .kpi, .badge, code {
  font-family: var(--font-mono);
}

/* Display & headlines */

h1, h2, h3, .display, .lede {
  font-family: var(--font-serif);
}
```

### Google Fonts import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Departure+Mono&family=Recursive:slnt,CASL,MONO,wght@-15..0,0..1,0..1,400..600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&display=swap"
>
```

---

## 8. Accessibility notes

- `ink` (`#ece4d6`) on `bg` (`#0f1c2a`): contrast ratio ≈ 12.4:1. AAA for body.
- `ink-muted` on `bg`: ≈ 5.8:1. AA for body, AAA for large text. Don't use for body below 14px.
- `ink-faint` on `bg`: ≈ 2.4:1. Below AA. Reserved for non-essential meta — never use it for actionable text.
- `blue` on `bg`: ≈ 5.6:1. AA for body — fine for links and button labels.
- `green` on `bg`: ≈ 4.7:1. AA for large text only — don't use moss for body-size text on the page background. It's a fill/badge color, not a copy color. On `bg-raised` (inside a card) it drops to 3.9:1, which is below AA for text but still clears the 3:1 floor WCAG applies to non-text graphics — which is why the activity bars may be `green` while the language row beside them must not.
- `green-text` on `bg-raised`: ≈ 4.5:1. This is the moss to use when the thing is *copy*. Reach for it rather than shrinking or bolding `green` into compliance.
- Measure, don't estimate. Every ratio in this section was computed against the actual token pair, not eyeballed. A color that looks fine on a card can be a point-and-a-half short.
- `orange` on `bg`: ≈ 4.1:1. Borderline AA large. Treat as a marker color, not a text color. On `bg-raised` it collapses to **2.84:1** — below even the 3:1 non-text floor, so inside a card it can't legitimately mark a graphic either.
- `orange-text` on `bg-raised`: ≈ 4.5:1. This is the sienna for anything that is *copy*. The category line on a post card uses it. Never reach for `orange` and compensate with size or weight — reach for this.
- Never communicate state with color alone. The active badge is `green` *and* says "active." The latest push bar is `orange` *and* sits at the rightmost position.

---

## 9. Don't do these

- Pure black `#000` or pure white `#fff` anywhere.
- Gradients on surfaces, buttons, or text.
- Box shadows. Anywhere.
- Outlined or filled buttons. Calls to action are text links with a trailing arrow — see §5.
- An arrow on a link that doesn't navigate, or a call to action without one.
- A KPI cell, badge, or chart that has no data to show. Hide it, or don't build it.
- Adding a fifth color (red, purple, teal, yellow) — the palette is closed.
- Emoji as functional UI.
- JetBrains Mono, Inter, Roboto, or system-ui as body font. The brand fonts are the brand.
- Departure Mono in running prose — it's UI chrome only. Body copy is Recursive Mono Casual.
- Recursive Sans or Recursive Linear (`MONO 0` or `CASL 0`). Body uses `MONO 1, CASL 1` exclusively.
- Decorative iconography drawn in SVG. Use real assets or text labels.
- Border radii ≥ 12px outside of perfect-circle status dots.
- Text below 9px in any context.
- Communicating state by color alone (always pair color + label).

---

## 10. File structure suggestion (Astro)

```
src/
  styles/
    global.css           # Tailwind v4 @theme block — the tokens above
  components/
    ActionLink.astro     # the one call-to-action treatment
    Badge.astro
    Eyebrow.astro
    KpiCell.astro
    KpiGrid.astro
    Logo.astro
    PageHeader.astro     # eyebrow / title / lede / actions / rule
    ProjectCard.astro    # the system's most important component
    ProjectLinks.astro   # back link + outbound links on a summary page
    Prose.astro          # running-prose styles for MDX and static copy
    PushChart.astro      # signature 90-day site-wide chart
    Sparkline.astro      # compact per-project weekly bars
  layouts/
    BaseLayout.astro     # <html> shell, font links, sticky nav, footer
  lib/
    dates.ts             # freshness-stamp wording and format
```

**Everything is Astro. The site ships zero JavaScript files.** An earlier version of this doc reserved Vue for "anything interactive or data-driven"; nothing ever needed it, and the integration was emitting a 70 kB runtime chunk that no page referenced. Charts are static inline SVG rendered at build time.

The one exception is a ~700-byte inline script in `BaseLayout.astro` that converts the baked build timestamp into a relative "deployed 3h ago" label. It's inline rather than bundled precisely so it doesn't reintroduce a JS request — it is smaller than the round trip would cost.

If something genuinely needs a framework later, add it back deliberately. Don't assume it's already there.

