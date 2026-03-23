import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Project } from '@/models/Project';
import { Feature } from '@/models/Feature';
import { Task } from '@/models/Task';
import { Note } from '@/models/Note';
import { Wireframe } from '@/models/Wireframe';
import { getSession } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const { id } = await params;
  const project = await Project.findOne({ _id: id, userId: session.userId }).lean();
  
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [features, tasks, notes, wireframes] = await Promise.all([
    Feature.find({ projectId: id }).sort({ order: 1 }).lean(),
    Task.find({ projectId: id }).lean(),
    Note.find({ projectId: id, userId: session.userId }).sort({ updatedAt: -1 }).lean(),
    Wireframe.find({ projectId: id, userId: session.userId }).sort({ updatedAt: -1 }).lean()
  ]);

  const pFeatures = features.map(f => ({
    ...f,
    id: f._id.toString(),
    tasks: tasks.filter(t => t.featureId?.toString() === f._id.toString()).map(t => ({ ...t, id: t._id.toString() }))
  }));

  const result = {
    ...project,
    id: project._id.toString(),
    features: pFeatures,
    notes: notes.map(n => ({ ...n, id: n._id.toString() })),
    wireframes: wireframes.map(w => ({ ...w, id: w._id.toString() }))
  };

  return NextResponse.json(result);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const { id } = await params;
  
  const existing = await Project.findOne({ _id: id, userId: session.userId });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.githubUrl !== undefined) updateData.githubUrl = data.githubUrl;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.targetDate !== undefined) updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;

  const project = await Project.findByIdAndUpdate(id, updateData, { new: true }).lean();
  
  return NextResponse.json({ ...project, id: project!._id.toString() });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const { id } = await params;
  
  const existing = await Project.findOne({ _id: id, userId: session.userId });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await Project.findByIdAndDelete(id);
  // Also delete cascading references (features, tasks, notes, wireframes attached to this project)
  await Promise.all([
    Feature.deleteMany({ projectId: id }),
    Task.deleteMany({ projectId: id }),
    Note.deleteMany({ projectId: id }),
    Wireframe.deleteMany({ projectId: id }),
  ]);

  return NextResponse.json({ success: true });
}
