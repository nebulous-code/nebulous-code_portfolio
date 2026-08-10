/**
 * GitHub data pipeline.
 *
 * This module is the single boundary between "raw GitHub API responses" and
 * "data that gets baked into the static site." Anything that goes from the
 * GitHub API to the rendered page MUST pass through a function in this file.
 * That makes the sanitization rules easy to audit in one place.
 *
 * Authentication:
 *   Reads from the GITHUB_TOKEN environment variable. Should be a fine-grained
 *   PAT with read access to public repos and to private repos you own. Without
 *   the token, repo discovery and commit history are limited to public repos;
 *   with it, private and collaborator repos contribute to the activity count
 *   too (counts only — content is gated by the allowlist rules below).
 *
 * Sanitization rules (the deny-by-default stance):
 *   - Counts and dates ALWAYS pass through, regardless of repo visibility.
 *     This is what powers the sparkline. A count of activity does not leak
 *     proprietary information.
 *   - Repo names, commit messages, SHAs, branch names ONLY pass through for
 *     repos in the content allowlist (PROJECTS entries with
 *     allowlistContent: true).
 *   - For everything else, the data is reduced to {date, count} tuples
 *     before any rendering happens.
 *
 * Resilience:
 *   - If a fetch fails (404, 403, network error), the function logs a warning
 *     and returns a degraded-but-valid result. The build does not crash.
 *   - This matters for the public→private transition: when a previously-public
 *     repo flips to private, the next build will start failing per-project
 *     fetches for that repo. The site keeps working; the affected card just
 *     shows less detail.
 */

import { getContentAllowlist, getTrackedRepos } from '~/config/projects';

const GITHUB_API = 'https://api.github.com';
const TOKEN = import.meta.env['GITHUB_TOKEN'] ?? process.env['GITHUB_TOKEN']

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
  html_url: string;
}

/**
 * Public-facing shape returned to the build pipeline. Note that no fields
 * here can leak content from non-allowlisted repos: `repoName` and `message`
 * are optional and only set when the source repo is allowlisted.
 */
export interface ActivityPoint {
  date: string; // ISO date, YYYY-MM-DD
  count: number;
}

export interface ProjectActivity {
  repo: string;
  lastCommitDate: string | null;
  lastCommitMessage: string | null; // null if not allowlisted or fetch failed
}

/**
 * Per-project card stats. Counts are always populated (they're just numbers);
 * `latestRelease` and `languages` describe repo *content* and are therefore
 * gated behind the allowlist, so a repo going private stops disclosing its
 * tech stack and version tags on the next build.
 */
export interface ProjectStats {
  repo: string;
  totalCommits: number | null;
  commits30d: number | null;
  latestRelease: string | null; // tag name; null if no release or not allowlisted
  languages: string[]; // empty if none clear the floor or not allowlisted
  activityWeeks: ActivityPoint[]; // 13 weekly buckets, oldest first
}

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'nebulouscode-portfolio-build',
  };
  if (TOKEN) {
    headers['Authorization'] = `Bearer ${TOKEN}`;
  }
  return headers;
}

/** Returns the raw Response so callers can read pagination headers. */
async function ghFetchRaw(path: string): Promise<Response> {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: ghHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub fetch failed: ${path} -> ${res.status}`);
  }
  return res;
}

async function ghFetch(path: string): Promise<unknown> {
  return (await ghFetchRaw(path)).json();
}

/**
 * Like ghFetch, but treats 404 as "this resource doesn't exist" rather than an
 * error. GitHub returns 404 from /releases/latest for a repo that has never
 * cut a release, which is the normal case here, not a failure.
 */
async function ghFetchOrNull(path: string): Promise<unknown | null> {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: ghHeaders() });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`GitHub fetch failed: ${path} -> ${res.status}`);
  }
  return res.json();
}

/**
 * Fetches commit activity across all tracked repos for the last N days,
 * bucketed by date. Walks each repo's default-branch commit history via
 * /repos/{owner}/{repo}/commits — more accurate than the events feed,
 * which has a recency bias and prunes data older than ~30-45 days.
 *
 * Filters to commits authored by `username` so co-authored or collaborator
 * commits in shared repos don't inflate the chart.
 *
 * Like the events-based version, this returns counts and dates only —
 * no commit content. Safe to render regardless of repo visibility.
 */

export async function getCommitActivity(
  username: string,
  days = 90,
): Promise<ActivityPoint[]> {
  const buckets = new Map<string, number>();
  const seenShas = new Set<string>();
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
  const since = new Date(cutoffMs).toISOString();

  // Step 1: discover all owned repos. Paginate up to 5 pages (500 repos).
  // Filter out archived, forks, and repos with no recent activity.
  let allRepos: Array<{ full_name: string; archived: boolean; fork: boolean; pushed_at: string }> = [];
  for (let page = 1; page <= 5; page++) {
    try {
      const repos = (await ghFetch(
        `/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&page=${page}&sort=pushed`,
      )) as Array<{ full_name: string; archived: boolean; fork: boolean; pushed_at: string }>;
      allRepos = allRepos.concat(repos);
      if (repos.length < 100) break;
    } catch (err) {
      console.warn(`[github] repo discovery failed on page ${page}:`, err);
      break;
    }
  }
  if (allRepos.length === 0) {
    console.warn('[github] repo discovery returned no repos - activity chart will render flat');
  }

  const activeRepos = allRepos.filter(
    (r) =>
      !r.archived &&
      !r.fork &&
      Date.parse(r.pushed_at) >= cutoffMs,
  );

  console.log(
    `[github] Scanning ${activeRepos.length} active repos (out of ${allRepos.length} owned)`,
  );

  // Step 2: for each active repo, list branches and walk commits per branch.
  // Two levels of parallelism: repos in parallel, branches within repo in parallel.
  await Promise.all(
    activeRepos.map(async (repo) => {
      try {
        const branches = (await ghFetch(
          `/repos/${repo.full_name}/branches?per_page=100`,
        )) as { name: string }[];

        await Promise.all(
         branches.map(async (branch) => {
            for (let page = 1; page <= 5; page++) {
              const commits = (await ghFetch(
                `/repos/${repo.full_name}/commits?sha=${encodeURIComponent(branch.name)}&since=${since}&author=${username}&per_page=100&page=${page}`,
              )) as GitHubCommit[];

              for (const commit of commits) {
                if (seenShas.has(commit.sha)) continue;
                seenShas.add(commit.sha);
                const day = commit.commit.author.date.slice(0, 10);
                buckets.set(day, (buckets.get(day) ?? 0) + 1);
              }

              if (commits.length < 100) break;
            }
          }),
        );
      } catch (err) {
        console.warn(`[github] getCommitActivity failed for ${repo.full_name}:`, err);
      }
    }),
  );

  const points: ActivityPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    points.push({ date: key, count: buckets.get(key) ?? 0 });
  }

  console.log(
    '[github] Commit activity:',
    points.reduce((sum, p) => sum + p.count, 0),
    'unique commits across',
    activeRepos.length,
    'active repos (all branches)',
  );

  return points;
}

/**
 * Fetches the latest commit authored by `username` on the default branch for
 * each tracked repo. This drives the "last push" cell and the active/idle
 * badge on the project cards.
 *
 * The author filter is load-bearing, not a nicety. Unfiltered, any scheduled
 * automation committing to a repo (a weekly stats bot, a dependency updater)
 * keeps that project reading "last push: today · active" forever, so a card
 * advertises work nobody is doing. Filtering to the account owner means the
 * badge reflects human activity and a paused project goes idle on its own.
 * It also keeps this function consistent with getProjectStats, which has
 * always filtered by author.
 *
 * The commit message is only included for repos on the content allowlist;
 * for others, the date is returned but the message is null. This is the
 * core rule that protects private SaaS repos from leaking via the project
 * cards.
 */
export async function getProjectActivity(
  username: string,
): Promise<ProjectActivity[]> {
  const repos = getTrackedRepos();
  const allowlist = getContentAllowlist();

  const results = await Promise.all(
    repos.map(async (repo): Promise<ProjectActivity> => {
      try {
        const commits = (await ghFetch(
          `/repos/${repo}/commits?author=${username}&per_page=1`,
        )) as GitHubCommit[];
        const latest = commits[0];
        if (!latest) {
          return { repo, lastCommitDate: null, lastCommitMessage: null };
        }
        return {
          repo,
          lastCommitDate: latest.commit.author.date,
          lastCommitMessage: allowlist.has(repo)
            ? latest.commit.message.split('\n')[0] ?? null
            : null,
        };
      } catch (err) {
        console.warn(`[github] getProjectActivity failed for ${repo}:`, err);
        return { repo, lastCommitDate: null, lastCommitMessage: null };
      }
    }),
  );

  return results;
}

/**
 * A language must account for at least this share of a repo's bytes to be
 * shown. Without a floor the list fills with build output and stray config —
 * a 394-byte HTML file is not something the project is "written in".
 */
const LANGUAGE_FLOOR = 0.12;
const MAX_LANGUAGES = 3;

/**
 * Window for the per-card activity chart. Weekly rather than daily buckets
 * because that chart is ~120px wide: 91 daily bars would be sub-pixel, and
 * these repos are worked in bursts, so a one-day spike would disappear.
 */
const ACTIVITY_WEEKS = 13;
const ACTIVITY_DAYS = ACTIVITY_WEEKS * 7;

/** ISO date `offset` days before today, matching the API's date keys. */
function dayKey(offset: number): string {
  return new Date(Date.now() - offset * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

/** Commits within the most recent `days` days of a day-keyed bucket map. */
function sumRecentDays(daily: Map<string, number>, days: number): number {
  let total = 0;
  for (let i = 0; i < days; i++) {
    total += daily.get(dayKey(i)) ?? 0;
  }
  return total;
}

/** Collapses daily counts into ACTIVITY_WEEKS 7-day buckets, oldest first. */
function weeklyBuckets(daily: Map<string, number>): ActivityPoint[] {
  const weeks: ActivityPoint[] = [];
  for (let w = ACTIVITY_WEEKS - 1; w >= 0; w--) {
    let count = 0;
    for (let d = 0; d < 7; d++) {
      count += daily.get(dayKey(w * 7 + d)) ?? 0;
    }
    // Dated by the first day of the bucket, which is what the tooltip shows.
    weeks.push({ date: dayKey(w * 7 + 6), count });
  }
  return weeks;
}

/**
 * Fetches the per-project KPI values shown on the project cards: total commits,
 * commits in the last 30 days, the latest release tag, and the dominant
 * languages.
 *
 * Each of the four fetches is independently guarded — one failing (or a repo
 * having no releases at all) degrades that single cell to null rather than
 * taking down the card or the build.
 */
export async function getProjectStats(username: string): Promise<ProjectStats[]> {
  const repos = getTrackedRepos();
  const allowlist = getContentAllowlist();
  const since = new Date(
    Date.now() - ACTIVITY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  return Promise.all(
    repos.map(async (repo): Promise<ProjectStats> => {
      const stats: ProjectStats = {
        repo,
        totalCommits: null,
        commits30d: null,
        latestRelease: null,
        languages: [],
        activityWeeks: [],
      };

      // Total commits on the default branch. GitHub exposes no count, so ask
      // for a single commit and read the last page number out of the Link
      // header — one request instead of walking the whole history.
      try {
        const res = await ghFetchRaw(`/repos/${repo}/commits?per_page=1`);
        const lastPage = /[?&]page=(\d+)>;\s*rel="last"/.exec(
          res.headers.get('link') ?? '',
        )?.[1];
        stats.totalCommits = lastPage
          ? Number(lastPage)
          : ((await res.json()) as unknown[]).length;
      } catch (err) {
        console.warn(`[github] total commits failed for ${repo}:`, err);
      }

      // A single walk over the activity window feeds both the commits-30d
      // cell and the weekly activity chart. Filtered to `username` so
      // collaborator work in a shared repo doesn't inflate either number.
      try {
        const daily = new Map<string, number>();
        for (let page = 1; page <= 5; page++) {
          const commits = (await ghFetch(
            `/repos/${repo}/commits?since=${since}&author=${username}&per_page=100&page=${page}`,
          )) as GitHubCommit[];
          for (const commit of commits) {
            const day = commit.commit.author.date.slice(0, 10);
            daily.set(day, (daily.get(day) ?? 0) + 1);
          }
          if (commits.length < 100) break;
        }
        stats.commits30d = sumRecentDays(daily, 30);
        stats.activityWeeks = weeklyBuckets(daily);
      } catch (err) {
        console.warn(`[github] commit history failed for ${repo}:`, err);
      }

      // Everything below describes repo content, so it stops here for repos
      // that aren't explicitly allowlisted.
      if (!allowlist.has(repo)) {
        return stats;
      }

      try {
        const release = (await ghFetchOrNull(
          `/repos/${repo}/releases/latest`,
        )) as { tag_name?: string } | null;
        stats.latestRelease = release?.tag_name ?? null;
      } catch (err) {
        console.warn(`[github] latest release failed for ${repo}:`, err);
      }

      try {
        const bytes = (await ghFetch(`/repos/${repo}/languages`)) as Record<
          string,
          number
        >;
        const total = Object.values(bytes).reduce((sum, n) => sum + n, 0);
        if (total > 0) {
          const ranked = Object.entries(bytes).sort((a, b) => b[1] - a[1]);
          const major = ranked.filter(([, n]) => n / total >= LANGUAGE_FLOOR);
          // An unusually even split can leave nothing above the floor; still
          // show the leader rather than an empty row.
          stats.languages = (major.length > 0 ? major : ranked.slice(0, 1))
            .slice(0, MAX_LANGUAGES)
            .map(([name]) => name);
        }
      } catch (err) {
        console.warn(`[github] languages failed for ${repo}:`, err);
      }

      return stats;
    }),
  );
}
