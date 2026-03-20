import { GitHubRepo, GitHubCommit } from '@/types';

const GITHUB_API = 'https://api.github.com';

export async function getRepoInfo(owner: string, repo: string): Promise<GitHubRepo> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function getRepoCommits(owner: string, repo: string, count = 10): Promise<GitHubCommit[]> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=${count}`);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
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
