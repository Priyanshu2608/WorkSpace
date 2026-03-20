import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all tasks across all projects with context
export async function GET() {
  const tasks = await prisma.task.findMany({
    include: {
      feature: {
        include: { project: { select: { id: true, name: true } } },
      },
    },
    orderBy: [
      { done: 'asc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
  });
  return NextResponse.json(tasks);
}
