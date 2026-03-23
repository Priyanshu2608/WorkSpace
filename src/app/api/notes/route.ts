import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Note } from '@/models/Note';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  
  const query: any = { userId: session.userId };
  if (projectId) query.projectId = projectId;
  else query.projectId = null;

  const notes = await Note.find(query).sort({ updatedAt: -1 }).lean();
  
  return NextResponse.json(notes.map(n => ({ ...n, id: n._id.toString() })));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const data = await req.json();
  const note = await Note.create({
    userId: session.userId,
    title: data.title || 'Untitled Note',
    content: data.content || '',
    template: data.template || null,
    projectId: data.projectId || null,
  });
  
  const created: any = note.toObject();
  created.id = created._id.toString();

  return NextResponse.json(created, { status: 201 });
}
