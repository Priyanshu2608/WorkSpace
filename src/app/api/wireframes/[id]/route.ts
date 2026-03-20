import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wireframe = await prisma.wireframe.findUnique({ where: { id } });
  if (!wireframe) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(wireframe);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  const { id } = await params;
  await prisma.wireframe.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
