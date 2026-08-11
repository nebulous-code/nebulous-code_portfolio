# Maintenance

Operational notes for nebulouscode.com. This is the file to consult when adding a new project, debugging a broken build, or transitioning a project's visibility.

## One-time deploy setup

1. **Render**: create a new Static Site pointing at this repo. The `render.yaml` config will be detected automatically.
2. **Render → Environment**: add `GITHUB_TOKEN` as a secret. Use a fine-grained PAT with:
   - **Resource owner**: your account
   - **Repository access**: All repositories (or just the ones tracked in `src/config/projects.ts`)
   - **Permissions**: `Contents: read`, `Metadata: read`
3. **Render → Settings → Deploy Hook**: copy the URL.
4. **GitHub repo → Settings → Secrets and variables → Actions**: add a secret `RENDER_DEPLOY_HOOK_URL` with the URL from step 3.
5. **Render → Custom Domain**: add `nebulouscode.com` and follow the DNS instructions.

After this, the cron in `.github/workflows/scheduled-rebuild.yml` fires every 6 hours and triggers a fresh Render build with up-to-date GitHub data.

## Daily operation

The site mostly maintains itself. The only routine touchpoint is `src/content/now.md`, which holds the "Currently Building" text. Update it when focus shifts between projects.

To force an immediate rebuild (e.g., to reflect a commit that just happened):

- Open the GitHub repo's **Actions** tab
- Select the **scheduled-rebuild** workflow
- Click **Run workflow** → **Run workflow**

The next build will pick up fresh data within ~2 minutes.

## Adding a new project

1. Add an entry to `PROJECTS` in `src/config/projects.ts`:

   ```ts
   {
     slug: 'my-new-project',
     name: 'My New Project',
     tagline: 'One-sentence pitch.',
     repo: 'nebulous-code/my-new-project',
     visibility: 'public',
     tracked: true,
     featured: true,
     allowlistContent: true,
     liveUrl: 'https://my-new-project.nebulouscode.com', // optional
     linkKind: 'product', // 'demo' (default) or 'product'
     stack: ['postgres'], // optional: tech Linguist can't see
   }
   ```

2. Create `src/content/projects/my-new-project.mdx` with frontmatter that matches the slug:

   ```mdx
   ---
   slug: my-new-project
   title: My New Project
   summary: One-sentence summary.
   publishedAt: 2026-MM-DD
   tags:
     - subject_tag
   hasArchitectureSection: false
   ---

   ## Problem
   ...
   ```

3. Commit and push. Next scheduled rebuild (or manual trigger) picks it up.

**Tags live in the MDX, not in `projects.ts`.** That's the canonical list, and it's the same axis blog posts use — `/tags/<tag>` shows summaries and posts together.

**Tags are subjects, not stack.** `emulator`, `pokemon`, `rubiks_cube` — never `rust`, `vue`, `postgres`. Languages come from the repo automatically and anything Linguist can't see goes in `stack`. See `docs/POST_TAXONOMY.md`.

### How the technology row is built

Two sources, merged for display:

| Source | Where | Behaviour |
|---|---|---|
| languages | GitHub languages API | measured, re-derived every build, filtered to ≥12% of bytes |
| `stack` | `src/config/projects.ts` | asserted by hand, always shown |

**Cards show three**, guaranteeing at least one of each kind when both exist, with any spare slot going to a language first. **Summary and post pages show everything.** So Quiet-Cube's card reads `rust · vue · postgres` — JavaScript is dropped so the database isn't hidden — while its summary page reads `rust · vue · javascript · postgres`.

### Field reference

| Field | Notes |
|---|---|
| `slug` | URL slug. Must match the MDX frontmatter `slug`. |
| `name` | Display name. The repo can be renamed without affecting the site. |
| `repo` | `owner/name` format. Used by the data pipeline. |
| `visibility` | `'public'`, `'private-saas'`, or `'private-wip'`. Drives card affordances. |
| `tracked` | If true, contributes to the activity sparkline (count + date only). |
| `featured` | If true, appears on home page and `/projects` index. |
| `allowlistContent` | Opt-in to showing commit messages, SHAs, branch names. Default-deny. Should always be `false` if `visibility !== 'public'`. |
| `liveUrl` | Where a visitor can use the thing. Shown on the card and the summary page. Omit if there's nowhere to send them yet. |
| `linkKind` | How `liveUrl` is labeled: `'demo'` (default) or `'product'`. Independent of `visibility` — an open repo can still be a real product. |
| `stack` | Technologies the GitHub languages API can't see, because they're used rather than written — Postgres, Docker, a framework. Merged with the measured languages for display. Typed as a union, so a typo is a TypeScript error. |

## Adding a blog post

Create `src/content/blog/my-post.mdx`. **The filename is the URL** — this post lands at `/blog/my-post`.

```mdx
---
title: Why TCGdex over the eBay API
summary: One or two sentences. Shown on listings and in the RSS feed.
publishedAt: 2026-08-20        # release gate — see below
updatedAt: 2026-08-25          # optional
category: design_decisions     # exactly one, from src/config/taxonomy.ts
tags:                          # optional, free-form subjects, snake_case
  - pokemon
project: pokemon-dashboard     # optional, a slug from src/config/projects.ts
draft: false                   # optional, defaults to false
---

## A heading

Body copy.
```

Then `npm run validate:content` before committing.

### Scheduling

`publishedAt` is the release gate. A post dated in the future doesn't exist on the site — no page, no listing entry, no RSS item, and its URL 404s — until a build runs after that timestamp.

The cron fires every 6 hours, so **a post appears within 6 hours of its timestamp, not at a precise moment**. A date-only value (`2026-08-20`) is treated as UTC midnight and goes live at the 00:00 UTC build that day. For finer control use a full timestamp: `2026-08-20T14:00:00Z`.

`draft: true` withholds a post regardless of date. Use it for something not ready; use a future date for something finished and scheduled.

To release something early, change the date and either wait for the next cron or trigger a rebuild from the Actions tab.

### Categories and tags

**`docs/POST_TAXONOMY.md` is the source of truth** for what the axes mean and how to pick between them. Read it before adding a category.

`category` is a closed list of eight in `src/config/taxonomy.ts`; `tags` are free-form subjects in snake_case.

**There is no `languages` field.** Linking a post to a project supplies its languages automatically — they render beside the project name, pulled from the same GitHub data the project card uses. Never type a language, framework, or stack anywhere on a post; that's what the project link is for.

**A typo never delays a release.** Two separate layers, on purpose:

| | On a bad value |
|---|---|
| `npm run build` (what Render runs) | logs `[blog] unknown category …` and **publishes anyway** |
| `npm run validate:content` | **exits 1**, naming the file and the value |

The `validate-content` GitHub workflow runs the second one on every push and PR. It is deliberately separate from `scheduled-rebuild`, which never consults it. So a mistyped category turns one check red and delays nothing, and a failed deploy is never mistaken for a content error.

Renaming a category after posts exist means editing their frontmatter and breaking any shared `/blog/category/…` URL — worth settling the vocabulary early.

### Linking a post to a project

Set `project:` to a slug from `src/config/projects.ts`. Three things happen:

- that project's summary page grows a "Writing" section listing its posts (hidden when there are none)
- the post links back to the project
- the post **inherits the project's languages**, shown beside the project name

Validation fails if the slug doesn't match a real project, so a rename can't silently orphan the link.

### Tags reach project summaries too

Project summary MDX files carry `tags` as well, and `/tags/<tag>` lists posts and summaries together — that shared axis is what connects the two content types. Categories don't apply to summaries; a summary has no form or tone to describe.

## Transitioning public → private SaaS

The expected path: a free demo project gains real users, gets paywalled features, and the source goes private. The site is built to handle this without redesign.

1. **GitHub**: change the repo to private.
2. **`src/config/projects.ts`** for that project entry:
   - `visibility`: `'public'` → `'private-saas'`
   - `allowlistContent`: `true` → `false`
   - Point `liveUrl` at the product and set `linkKind: 'product'` if it isn't already
3. **Case study MDX**: review the prose and remove anything that's now competitive intelligence (specific feature roadmap items, internal architectural details that give away differentiators). Set `hasArchitectureSection: true` and add an architecture section that substitutes for the missing "View Code" affordance.
4. Commit and push.

Next build will:

- Continue counting commits in the sparkline (PAT can read private repos)
- Stop showing commit messages on the project card
- Replace "View Code" links with "Visit product" links
- Keep the case study live with its new framing

The deny-by-default sanitization in `src/lib/github.ts` means the only way to leak content from a private repo is to leave both `visibility: 'public'` and `allowlistContent: true`. As long as you flip both, you're safe.

## Removing a project

To stop showing a project entirely (without deleting history):

- Set `featured: false` to remove it from cards but keep it in the sparkline.
- Set `tracked: false` to also remove it from the sparkline.
- Delete the `src/content/projects/<slug>.mdx` file to remove the case study route.

The most aggressive version (untrack + unfeatured + delete MDX) makes the project invisible to the site entirely on the next build.

## Debugging

### Build fails

Check the Render build log first. Common causes:

- **`GITHUB_TOKEN` not set or expired**: rotate the PAT in Render's environment settings.
- **A tracked repo doesn't exist or was renamed**: the `getProjectActivity` call logs a warning per failing repo but doesn't crash. If it crashes, check `src/lib/github.ts` for an unhandled path.
- **Astro version mismatch**: pin versions in `package.json` if a transitive update breaks the build.

### Sparkline looks empty

- Confirm the build is using an authenticated PAT (Render env var present).
- Check the events feed has activity in the last 90 days.
- Force-trigger a rebuild and watch the build log for warnings from `[github]`.

### A private repo's content is showing on the site

Audit `src/config/projects.ts`. The repo should have `visibility !== 'public'` AND `allowlistContent: false`. If both are correct and content is still showing, the issue is upstream of the sanitization layer — open `src/lib/github.ts` and look for any code path that returns repo content without checking the allowlist.

## Cost

- **Render static**: free tier is sufficient.
- **GitHub Actions**: ~120 cron runs per month, each ~10 seconds. Far below the free tier ceiling for personal accounts.
- **Domain**: registrar cost only.

## Updating dependencies

```bash
npm outdated
npm update
npm run build       # verify the build still works
```

Astro and Tailwind are the two to watch. Tailwind v4 is still maturing; check release notes before major-version bumps.
