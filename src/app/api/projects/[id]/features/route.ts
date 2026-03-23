import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Feature } from '@/models/Feature';
import { Task } from '@/models/Task';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  
  const features = await Feature.find({ projectId: id }).sort({ order: 1 }).lean();
  const featureIds = features.map(f => f._id);
  const tasks = await Task.find({ featureId: { $in: featureIds } }).lean();

  const populated = features.map(f => ({
    ...f,
    id: f._id.toString(),
    tasks: tasks.filter(t => t.featureId?.toString() === f._id.toString()).map(t => ({ ...t, id: t._id.toString() }))
  }));

  return NextResponse.json(populated);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  const data = await req.json();
  
  const status = data.status || 'Backlog';
  
  const [maxOrderFeature, maxNumberFeature] = await Promise.all([
    Feature.findOne({ projectId: id, status }).sort({ order: -1 }).lean(),
    Feature.findOne({ projectId: id }).sort({ featureNumber: -1 }).lean()
  ]);

  const nextOrder = maxOrderFeature ? maxOrderFeature.order + 1 : 0;
  const nextNumber = maxNumberFeature ? maxNumberFeature.featureNumber + 1 : 1;

  const feature = await Feature.create({
    title: data.title,
    description: data.description || null,
    status,
    priority: data.priority || 'Medium',
    labels: data.labels || null,
    order: nextOrder,
    featureNumber: data.featureNumber || nextNumber,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    projectId: id,
  });

  const created: any = feature.toObject();
  created.id = created._id.toString();
  created.tasks = [];

  return NextResponse.json(created, { status: 201 });
}
