import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Feature } from '@/models/Feature';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';
import { getSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const existing = await Feature.findById(id).lean();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const project = await Project.findById(existing.projectId).lean();
  if (!project || project.userId.toString() !== session.userId) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }

  const data = await req.json();
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.labels !== undefined) updateData.labels = data.labels;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

  const feature = await Feature.findByIdAndUpdate(id, updateData, { new: true }).lean();
  const tasks = await Task.find({ featureId: id }).lean();
  
  return NextResponse.json({ 
    ...feature, 
    id: feature!._id.toString(), 
    tasks: tasks.map(t => ({ ...t, id: t._id.toString() })) 
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const existing = await Feature.findById(id).lean();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const project = await Project.findById(existing.projectId).lean();
  if (!project || project.userId.toString() !== session.userId) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }

  await Feature.findByIdAndDelete(id);
  await Task.deleteMany({ featureId: id });
  return NextResponse.json({ success: true });
}
