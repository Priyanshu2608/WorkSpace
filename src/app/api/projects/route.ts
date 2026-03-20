import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      features: { include: { tasks: true } },
      _count: { select: { notes: true, wireframes: true } },
    },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const data = await req.json();
  const project = await prisma.project.create({
    data: {
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
