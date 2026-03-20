import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const task = await prisma.task.create({
    data: {
      title: data.title,
      done: data.done || false,
      priority: data.priority || 'Medium',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      featureId: id,
    },
  });
  return NextResponse.json(task, { status: 201 });
}
