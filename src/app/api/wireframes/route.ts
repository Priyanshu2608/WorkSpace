import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const wireframes = await prisma.wireframe.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(wireframes);
}

export async function POST(req: Request) {
  const data = await req.json();
  const wireframe = await prisma.wireframe.create({
    data: {
      name: data.name || 'Untitled Board',
      data: data.data || '{}',
      projectId: data.projectId || null,
    },
  });
  return NextResponse.json(wireframe, { status: 201 });
}
