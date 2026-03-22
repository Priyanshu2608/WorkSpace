import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      features: { include: { tasks: true } },
      _count: { select: { notes: true, wireframes: true } },
    },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const project = await prisma.project.create({
    data: {
      userId: session.userId,
      name: data.name,
      description: data.description || null,
      status: data.status || 'Planning',
      githubUrl: data.githubUrl || null,
      tags: data.tags || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
