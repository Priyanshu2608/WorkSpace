import { NextResponse } from 'next/server';
import { 
  getRepoInfo, 
  getRepoCommits, 
  getRepoBranches, 
  getRepoCollaborators, 
  getRepoPulls, 
  parseGitHubUrl 
} from '@/lib/github';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  if (!repo) return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });

  const parsed = parseGitHubUrl(repo);
  if (!parsed) return NextResponse.json({ error: 'Invalid GitHub URL or owner/repo format' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { githubToken: true } });
  const token = user?.githubToken;

  try {
    const [info, commits, branches, collaborators, pulls] = await Promise.all([
      getRepoInfo(parsed.owner, parsed.repo, token),
      getRepoCommits(parsed.owner, parsed.repo, 10, token),
      getRepoBranches(parsed.owner, parsed.repo, token),
      getRepoCollaborators(parsed.owner, parsed.repo, token),
      getRepoPulls(parsed.owner, parsed.repo, token),
    ]);
    return NextResponse.json({ info, commits, branches, collaborators, pulls });
  } catch (error) {
    console.error('GitHub fetch failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch GitHub data' },
      { status: 500 }
    );
  }
}
