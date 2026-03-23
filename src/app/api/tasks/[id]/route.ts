import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Task } from '@/models/Task';
import { Feature } from '@/models/Feature';
import { Project } from '@/models/Project';
import { getSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  
  const existing = await Task.findOne({ _id: id, userId: session.userId }).lean();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.done !== undefined) updateData.done = data.done;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

  const task = await Task.findByIdAndUpdate(id, updateData, { new: true }).lean();
  
  let taskProject: any = null;
  if (task!.projectId) {
    taskProject = await Project.findById(task!.projectId).select('name').lean();
  }
  
  let taskFeature: any = null;
  if (task!.featureId) {
    taskFeature = await Feature.findById(task!.featureId).select('title projectId').lean();
    if (taskFeature && taskFeature.projectId) {
      const fProject: any = await Project.findById(taskFeature.projectId).select('name').lean();
      taskFeature.project = fProject ? { id: fProject._id.toString(), name: fProject.name } : null;
    }
    if (taskFeature) taskFeature.id = taskFeature._id.toString();
  }

  return NextResponse.json({
    ...task,
    id: task!._id.toString(),
    project: taskProject ? { id: taskProject._id.toString(), name: taskProject.name } : null,
    feature: taskFeature || null
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const existing = await Task.findOne({ _id: id, userId: session.userId });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await Task.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
