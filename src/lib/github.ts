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
 *   the token, the events endpoint can only return public events; with it,
 *   private repo events are included in the count (but their content is
 *   scrubbed by getCommitActivity unless the repo is on the content allowlist).
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

interface GitHubEventCommit {
  sha: string;
  message: string;
}

interface GitHubPushEventPayload {
  ref?: string;
  commits?: GitHubEventCommit[];
}

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: GitHubPushEventPayload;
}

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

export interface RecentCommit {
  date: string;
  repoName?: string; // only present for allowlisted repos
  message?: string; // only present for allowlisted repos
  url?: string; // only present for allowlisted repos
}

export interface ProjectActivity {
  repo: string;
  lastCommitDate: string | null;
  lastCommitMessage: string | null; // null if not allowlisted or fetch failed
}

async function ghFetch(path: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'nebulouscode-portfolio-build',
  };
  if (TOKEN) {
    headers['Authorization'] = `Bearer ${TOKEN}`;
  }

  const res = await fetch(`${GITHUB_API}${path}`, { headers });
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
    const repos = (await ghFetch(
      `/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&page=${page}&sort=pushed`,
    )) as Array<{ full_name: string; archived: boolean; fork: boolean; pushed_at: string }>;
    allRepos = allRepos.concat(repos);
    if (repos.length < 100) break;
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
 * Fetches the latest commit on the default branch for each tracked repo.
 * The commit message is only included for repos on the content allowlist;
 * for others, the date is returned but the message is null. This is the
 * core rule that protects private SaaS repos from leaking via the project
 * cards.
 */
export async function getProjectActivity(): Promise<ProjectActivity[]> {
  const repos = getTrackedRepos();
  const allowlist = getContentAllowlist();

  const results = await Promise.all(
    repos.map(async (repo): Promise<ProjectActivity> => {
      try {
        const commits = (await ghFetch(
          `/repos/${repo}/commits?per_page=1`,
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
 * Fetches a list of recent commits suitable for an "activity feed" display.
 * Only commits from allowlisted repos are returned. Non-allowlisted activity
 * already contributes to the sparkline; it deliberately does NOT appear here
 * because this list shows commit *content*.
 */
export async function getRecentPublicCommits(
  username: string,
  limit = 10,
): Promise<RecentCommit[]> {
  const allowlist = getContentAllowlist();
  const out: RecentCommit[] = [];

  try {
    const path = TOKEN
      ? `/users/${username}/events?per_page=100`
      : `/users/${username}/events/public?per_page=100`;
    const events = (await ghFetch(path)) as GitHubEvent[];

    for (const event of events) {
      if (event.type !== 'PushEvent') continue;
      if (!allowlist.has(event.repo.name)) continue;

      const commits = event.payload.commits ?? [];
      for (const c of commits) {
        out.push({
          date: event.created_at,
          repoName: event.repo.name,
          message: c.message.split('\n')[0],
          url: `https://github.com/${event.repo.name}/commit/${c.sha}`,
        });
        if (out.length >= limit) return out;
      }
    }
  } catch (err) {
    console.warn('[github] getRecentPublicCommits failed:', err);
    return [];
  }

  return out;
}
