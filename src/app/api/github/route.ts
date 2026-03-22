import { NextResponse } from 'next/server';
import { 
  getRepoInfo, 
  getRepoCommits, 
  getRepoBranches, 
  getRepoCollaborators, 
  getRepoPulls, 
  parseGitHubUrl 
} from '@/lib/github';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  if (!repo) return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });

  const parsed = parseGitHubUrl(repo);
  if (!parsed) return NextResponse.json({ error: 'Invalid GitHub URL or owner/repo format' }, { status: 400 });

  try {
    const [info, commits, branches, collaborators, pulls] = await Promise.all([
      getRepoInfo(parsed.owner, parsed.repo),
      getRepoCommits(parsed.owner, parsed.repo, 10),
      getRepoBranches(parsed.owner, parsed.repo),
      getRepoCollaborators(parsed.owner, parsed.repo),
      getRepoPulls(parsed.owner, parsed.repo),
    ]);
    return NextResponse.json({ info, commits, branches, collaborators, pulls });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch GitHub data' },
      { status: 500 }
    );
  }
}
