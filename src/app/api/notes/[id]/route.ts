import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Note } from '@/models/Note';
import { getSession } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const note = await Note.findOne({ _id: id, userId: session.userId }).lean();
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  
  return NextResponse.json({ ...note, id: note._id.toString() });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  
  const existing = await Note.findOne({ _id: id, userId: session.userId }).lean();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.template !== undefined) updateData.template = data.template;

  const note = await Note.findByIdAndUpdate(id, updateData, { new: true }).lean();
  return NextResponse.json({ ...note, id: note!._id.toString() });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const existing = await Note.findOne({ _id: id, userId: session.userId });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await Note.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
