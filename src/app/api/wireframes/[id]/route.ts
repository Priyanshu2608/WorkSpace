import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Wireframe } from '@/models/Wireframe';
import { getSession } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  
  const wireframe = await Wireframe.findOne({ _id: id, userId: session.userId }).lean();
  if (!wireframe) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  
  return NextResponse.json({ ...wireframe, id: wireframe._id.toString() });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  
  const existing = await Wireframe.findOne({ _id: id, userId: session.userId }).lean();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.data !== undefined) updateData.data = data.data;

  const wireframe = await Wireframe.findByIdAndUpdate(id, updateData, { new: true }).lean();
  return NextResponse.json({ ...wireframe, id: wireframe!._id.toString() });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const existing = await Wireframe.findOne({ _id: id, userId: session.userId });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await Wireframe.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
