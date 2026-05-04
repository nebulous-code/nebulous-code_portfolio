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
     liveDemoUrl: 'https://my-new-project.nebulouscode.com', // optional
     tags: ['vue', 'whatever'],
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
     - vue
   hasArchitectureSection: false
   ---

   ## Problem
   ...
   ```

3. Commit and push. Next scheduled rebuild (or manual trigger) picks it up.

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
| `productUrl` | For `private-saas`: the live product URL. |
| `liveDemoUrl` | For `public`: the live demo URL (e.g., subdomain). |
| `tags` | Free-form tags for filtering. |

## Transitioning public → private SaaS

The expected path: a free demo project gains real users, gets paywalled features, and the source goes private. The site is built to handle this without redesign.

1. **GitHub**: change the repo to private.
2. **`src/config/projects.ts`** for that project entry:
   - `visibility`: `'public'` → `'private-saas'`
   - `allowlistContent`: `true` → `false`
   - Add `productUrl: 'https://...'`
   - Optionally update `liveDemoUrl` (or remove it if there's no separate demo)
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
