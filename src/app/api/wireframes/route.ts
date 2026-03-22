import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wireframes = await prisma.wireframe.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(wireframes);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const wireframe = await prisma.wireframe.create({
    data: {
      userId: session.userId,
      name: data.name || 'Untitled Board',
      data: data.data || '{}',
      projectId: data.projectId || null,
    },
  });
  return NextResponse.json(wireframe, { status: 201 });
}
