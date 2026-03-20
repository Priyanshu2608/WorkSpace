import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const notes = await prisma.note.findMany({
    where: projectId ? { projectId } : { projectId: null },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const data = await req.json();
  const note = await prisma.note.create({
    data: {
      title: data.title || 'Untitled Note',
      content: data.content || '',
      template: data.template || null,
      projectId: data.projectId || null,
    },
  });
  return NextResponse.json(note, { status: 201 });
}
