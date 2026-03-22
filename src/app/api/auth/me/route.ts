import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, githubToken: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Mask the token if it exists so the frontend knows it's set without exposing it
  const hasGithubToken = !!user.githubToken;

  return NextResponse.json({ 
    user: { id: user.id, name: user.name, email: user.email }, 
    hasGithubToken 
  }, { status: 200 });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { githubToken } = await req.json();
    await prisma.user.update({
      where: { id: session.userId },
      data: { githubToken: githubToken || null }
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
