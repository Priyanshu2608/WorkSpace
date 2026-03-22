import { GitHubRepo, GitHubCommit, GitHubBranch, GitHubCollaborator, GitHubPullRequest } from '@/types';

const GITHUB_API = 'https://api.github.com';

const getHeaders = (token?: string | null): Record<string, string> => {
  const t = token || process.env.GITHUB_ACCESS_TOKEN;
  return t ? { Authorization: `token ${t}` } : {};
};

export async function getRepoInfo(owner: string, repo: string, token?: string | null): Promise<GitHubRepo> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: getHeaders(token) });
  if (!res.ok) {
    if (res.status === 403 || res.status === 404) throw new Error('Repository not found or rate limited');
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

export async function getRepoCommits(owner: string, repo: string, count = 10, token?: string | null): Promise<GitHubCommit[]> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=${count}`, { headers: getHeaders(token) });
  if (!res.ok) {
    if (res.status === 403 || res.status === 404) return [];
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return null;
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace('.git', '') };
  } catch {
    // Try parsing as owner/repo format
    const parts = url.split('/').filter(Boolean);
    if (parts.length === 2) return { owner: parts[0], repo: parts[1] };
    return null;
  }
}

export async function getRepoBranches(owner: string, repo: string, token?: string | null): Promise<GitHubBranch[]> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/branches?per_page=10`, { headers: getHeaders(token) });
  if (!res.ok) {
    if (res.status === 403 || res.status === 404) return [];
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

export async function getRepoCollaborators(owner: string, repo: string, token?: string | null): Promise<GitHubCollaborator[]> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contributors?per_page=10`, { headers: getHeaders(token) });
  if (!res.ok) {
    if (res.status === 403 || res.status === 404 || res.status === 401) return []; // Fallback gracefully if contributors forbidden
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

export async function getRepoPulls(owner: string, repo: string, token?: string | null): Promise<GitHubPullRequest[]> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls?state=open&per_page=5`, { headers: getHeaders(token) });
  if (!res.ok) {
    if (res.status === 403 || res.status === 404) return [];
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}
