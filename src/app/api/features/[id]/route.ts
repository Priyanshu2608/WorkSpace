import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.feature.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } }
  });

  if (!existing || existing.project.userId !== session.userId) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }

  const data = await req.json();
  const feature = await prisma.feature.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.labels !== undefined && { labels: data.labels }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
    },
    include: { tasks: true },
  });
  return NextResponse.json(feature);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.feature.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } }
  });

  if (!existing || existing.project.userId !== session.userId) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }

  await prisma.feature.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
