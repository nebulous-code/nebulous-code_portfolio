# Deploying to Cloudflare Pages

Runbook for hosting nebulouscode.com on Cloudflare Pages. Covers one-time setup, the pilot, cutover from Render, and the gotchas worth knowing before they bite.

Day to day you do none of this: push to `main` and `.github/workflows/deploy.yml` builds and ships. This file is for the one-time setup and for the next time something looks wrong.

## Approach: build in Actions, direct-upload with Wrangler

The build happens in GitHub Actions and Wrangler uploads the finished `dist/` with `wrangler pages deploy`. Cloudflare's git integration is deliberately not used.

The reason is accountability. Under Render, the workflow POSTed a deploy hook and checked only that the POST was accepted; the build ran later, elsewhere, and its result never came back. A failed build left the previous site up and still showed a green check in Actions. Building in Actions makes the job that reports success the job that actually built.

The second reason is credentials. The build needs a cross-repo PAT to read GitHub data, and that already has to live in Actions secrets. Building here means one place holds secrets instead of two.

This mirrors how `astro_sites` deploys its five sites, with one simplification: that repo has Pages Functions and must deploy from each site's directory so `functions/` is detected. This site's contact page is a `mailto:` link, so there are no Functions and the deploy runs from the repo root.

## One-time setup

### 1. Cloudflare credentials

- **API token** — dashboard, My Profile, API Tokens, Create Token, custom token with permission **Account - Cloudflare Pages - Edit**.
- **Account ID** — Workers & Pages page, right panel, or the hex string in the dashboard URL. A scoped Pages token cannot auto-detect it; omitting it fails with *"Failed to automatically retrieve account IDs for the logged in user."*

### 2. GitHub repo secrets

Settings, Secrets and variables, Actions. Three secrets:

| Secret | Value |
|---|---|
| `GH_DATA_TOKEN` | Fine-grained PAT with read access to the tracked repos, including private ones |
| `CLOUDFLARE_API_TOKEN` | From step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | From step 1 |

**The PAT cannot be named `GITHUB_TOKEN`.** GitHub reserves the `GITHUB_` prefix for its own automatic token and rejects any secret using it. That automatic token is also no use here: it is scoped to this repo alone and cannot read the other project repos. `deploy.yml` maps `GH_DATA_TOKEN` back onto the `GITHUB_TOKEN` environment variable at build time, so `src/lib/github.ts` is unaware of the rename.

If either Cloudflare secret is missing, the deploy step fails immediately and names the one that is absent. This is deliberate: Wrangler's own error for an absent token is an authentication failure that reads like a bad credential rather than a missing one, which sends you looking in the wrong place.

### 3. Create the Pages project

Nothing to do — `deploy.yml` creates it on the first run if it doesn't exist, with `--production-branch main`, then deploys. Push, and the project appears at `https://nebulouscode.pages.dev`.

The production branch is the detail worth understanding. Every deploy passes `--branch main`, so if the project's production branch is named anything else, all of them land in the *preview* environment, which carries its own separate variables. Creating the project from the workflow sets it explicitly instead of leaving it to a dashboard default, which is why this is not done by clicking through the UI.

The check is a `pages project list` call, so on every run after the first it costs one API request and does nothing.

## Pilot

Deploy to `pages.dev` while DNS still points at Render. Zero risk, and it validates the parts that only break in production.

Check:

- Pages load; fonts, layout and images render.
- **The KPI cells have real values** — this is the one that proves `GH_DATA_TOKEN` works from Actions. Em-dashes everywhere means the token failed and the build swallowed it, exactly as designed. Confirm against a card you know has data.
- The "deployed" stamp in the header shows a recent time.
- `/rss.xml` and `/sitemap-index.xml` return 200.
- Caching is right (see below).

Verify the headers, which neither `astro dev` nor `astro preview` can tell you:

```bash
curl -sI https://nebulouscode.pages.dev/ | grep -i cache-control
#   public, max-age=0, must-revalidate
curl -sI https://nebulouscode.pages.dev/_astro/<hashed>.css | grep -i cache-control
#   public, max-age=31536000, immutable
```

## Cutover

1. Add the custom domain in the Pages project: Workers & Pages, `nebulouscode`, Custom domains.
2. Because the zone is already in this Cloudflare account, the DNS record is created automatically. There is no nameserver change and no propagation wait.
3. Decide the canonical hostname and make the redirect match it — see below.
4. Confirm the live site, then suspend the Render service.
5. Delete `render.yaml` and `.github/workflows/scheduled-rebuild.yml`.

Keep Render running until the Cloudflare domain is confirmed good. Both can serve simultaneously; only DNS decides who answers.

### Canonical hostname

Settle this at cutover. Render served `www` as canonical while the build declares the apex:

```
https://nebulouscode.com/      301 -> https://www.nebulouscode.com/
canonical tag / sitemap / RSS:  https://nebulouscode.com/
```

Every canonical tag, sitemap entry, Open Graph URL and RSS link points at the apex, which then redirects away to `www`. Search engines are being told the canonical URL is one that does not serve content.

The cheaper fix is to make the apex canonical, since that is what `astro.config.mjs` already claims: add `nebulouscode.com` as the custom domain and add a Cloudflare redirect rule sending `www` to the apex. No code change.

The alternative is to keep `www` and change `site:` in `astro.config.mjs`, which requires a rebuild and touches every generated URL.

## Analytics

Cloudflare Web Analytics is enabled per project in the dashboard: Workers & Pages, `nebulouscode`, Analytics. Cloudflare injects the beacon automatically on the next deployment, so nothing is added to this repo.

It is free, cookieless, and needs no consent banner. It does add a third-party script from `static.cloudflareinsights.com` to every page, on a site that otherwise ships no JavaScript at all. That tradeoff was made deliberately; it is one dashboard toggle to reverse.

## Rollback

Pages keeps every deployment. Workers & Pages, `nebulouscode`, Deployments, then "Rollback to this deployment" on any previous build. This is faster than reverting a commit and waiting for a rebuild, and it is a capability the Render setup did not have.

## Limits

The free plan allows 500 builds per month, 20,000 files, and 25 MiB per asset. The 6-hour cron is about 120 deploys a month plus pushes, so there is comfortable headroom. Direct uploads may not count as "builds" at all — the docs do not say — but it fits either way.

## Gotchas

- **Secrets cannot start with `GITHUB_`.** The PAT is `GH_DATA_TOKEN`.
- **Name the production branch `main`** at project creation, and always deploy with `--branch main`, or deploys land in the preview environment with different variables.
- **Wrangler comes from the lockfile**, never `npx wrangler@4`. An unpinned call resolves to whatever Cloudflare published that morning, and a bad release takes deploys down. Bump it deliberately with `npm i -D wrangler@<version>`.
- **`_headers` rules do not override each other, they accumulate.** A request matching two rules inherits both, and a repeated header is comma-joined. `public/_headers` uses `! Cache-Control` to detach the inherited value before setting the asset rule; without it, hashed assets get `max-age=0` followed by `max-age=31536000` and are never cached. The file says so too — do not remove that line.
- **Environment variable changes need a redeploy** to take effect.
- **Pages adds a trailing slash.** `/projects` 308s to `/projects/`. Internal links omit the slash, so each first visit to a route costs one cached redirect. Harmless, and the sitemap already uses trailing slashes.
