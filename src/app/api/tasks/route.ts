import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all tasks across all projects with context
export async function GET() {
  const tasks = await prisma.task.findMany({
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
  try {
    const data = await req.json();
    const task = await prisma.task.create({
      data: {
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
