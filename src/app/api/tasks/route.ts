import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Task } from '@/models/Task';
import { Feature } from '@/models/Feature';
import { Project } from '@/models/Project';
import { getSession } from '@/lib/auth';

// GET all tasks across all projects with context
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const tasks = await Task.find({ userId: session.userId })
    .sort({ done: 1, dueDate: 1, createdAt: -1 })
    .lean();

  const projectIds = [...new Set(tasks.filter(t => t.projectId).map(t => t.projectId))];
  const featureIds = [...new Set(tasks.filter(t => t.featureId).map(t => t.featureId))];

  const [projects, features] = await Promise.all([
    Project.find({ _id: { $in: projectIds } }).select('name').lean(),
    Feature.find({ _id: { $in: featureIds } }).select('title projectId').lean()
  ]);

  // If a feature exists, we might also need to map its project if the task only has featureId
  // but let's just assemble what we have.
  const mappedTasks = tasks.map(t => {
    let taskProject: any = projects.find(p => p._id.toString() === t.projectId?.toString());
    let taskFeature: any = features.find(f => f._id.toString() === t.featureId?.toString());
    
    if (taskFeature) {
      const fProject: any = projects.find(p => p._id.toString() === taskFeature.projectId?.toString());
      taskFeature = { ...taskFeature, id: taskFeature._id.toString(), project: fProject ? { id: fProject._id.toString(), name: fProject.name } : null };
    }

    return {
      ...t,
      id: t._id.toString(),
      project: taskProject ? { id: taskProject._id.toString(), name: taskProject.name } : null,
      feature: taskFeature || null
    };
  });

  return NextResponse.json(mappedTasks);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  try {
    const data = await req.json();
    const task = await Task.create({
      userId: session.userId,
      title: data.title,
      done: data.done || false,
      priority: data.priority || 'Medium',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      featureId: data.featureId || null,
      projectId: data.projectId || null,
    });
    
    const created: any = task.toObject();
    created.id = created._id.toString();

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
