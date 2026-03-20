import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const features = await prisma.feature.findMany({
    where: { projectId: id },
    include: { tasks: true },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(features);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const maxOrder = await prisma.feature.aggregate({
    where: { projectId: id, status: data.status || 'Backlog' },
    _max: { order: true },
  });
  const maxNumber = await prisma.feature.aggregate({
    where: { projectId: id },
    _max: { featureNumber: true },
  });
  const feature = await prisma.feature.create({
    data: {
      title: data.title,
      description: data.description || null,
      status: data.status || 'Backlog',
      priority: data.priority || 'Medium',
      labels: data.labels || null,
      order: (maxOrder._max.order ?? -1) + 1,
      featureNumber: data.featureNumber || (maxNumber._max.featureNumber ?? 0) + 1,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId: id,
    },
    include: { tasks: true },
  });
  return NextResponse.json(feature, { status: 201 });
}
