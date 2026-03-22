import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await req.json();
  const task = await prisma.task.create({
    data: {
      title: data.title,
      done: data.done || false,
      priority: data.priority || 'Medium',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      featureId: id,
      userId: session.userId,
    },
  });
  return NextResponse.json(task, { status: 201 });
}
