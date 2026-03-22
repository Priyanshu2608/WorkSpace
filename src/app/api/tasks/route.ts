import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET all tasks across all projects with context
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { userId: session.userId },
    include: {
      feature: {
        include: { project: { select: { id: true, name: true } } },
      },
      project: { select: { id: true, name: true } },
    },
    orderBy: [
      { done: 'asc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    const task = await prisma.task.create({
      data: {
        userId: session.userId,
        title: data.title,
        done: data.done || false,
        priority: data.priority || 'Medium',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        featureId: data.featureId || null,
        projectId: data.projectId || null,
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
