import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const wireframe = await prisma.wireframe.findUnique({ where: { id, userId: session.userId } });
  if (!wireframe) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(wireframe);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  
  const existing = await prisma.wireframe.findUnique({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const wireframe = await prisma.wireframe.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.data !== undefined && { data: data.data }),
    },
  });
  return NextResponse.json(wireframe);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.wireframe.findUnique({ where: { id, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.wireframe.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
