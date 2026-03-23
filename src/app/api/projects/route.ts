import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Project } from '@/models/Project';
import { Feature } from '@/models/Feature';
import { Task } from '@/models/Task';
import { Note } from '@/models/Note';
import { Wireframe } from '@/models/Wireframe';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const projects = await Project.find({ userId: session.userId }).sort({ updatedAt: -1 }).lean();
  const projectIds = projects.map(p => p._id);

  const [features, tasks, notesCounts, wireframesCounts] = await Promise.all([
    Feature.find({ projectId: { $in: projectIds } }).lean(),
    Task.find({ projectId: { $in: projectIds } }).lean(),
    Note.aggregate([{ $match: { projectId: { $in: projectIds } } }, { $group: { _id: '$projectId', count: { $sum: 1 } } }]),
    Wireframe.aggregate([{ $match: { projectId: { $in: projectIds } } }, { $group: { _id: '$projectId', count: { $sum: 1 } } }])
  ]);

  const mappedProjects = projects.map(p => {
    const projectIdStr = p._id.toString();
    const pFeatures = features.filter(f => f.projectId?.toString() === projectIdStr).map(f => ({
      ...f,
      id: f._id.toString(),
      tasks: tasks.filter(t => t.featureId?.toString() === f._id.toString()).map(t => ({ ...t, id: t._id.toString() }))
    }));
    
    const notesCount = notesCounts.find(c => c._id.toString() === projectIdStr)?.count || 0;
    const wireframesCount = wireframesCounts.find(c => c._id.toString() === projectIdStr)?.count || 0;

    return {
      ...p,
      id: projectIdStr,
      features: pFeatures,
      _count: { notes: notesCount, wireframes: wireframesCount }
    };
  });

  return NextResponse.json(mappedProjects);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const data = await req.json();
  const project = await Project.create({
    userId: session.userId,
    name: data.name,
    description: data.description || null,
    status: data.status || 'Planning',
    githubUrl: data.githubUrl || null,
    tags: data.tags || null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    targetDate: data.targetDate ? new Date(data.targetDate) : null,
  });
  
  const created = project.toObject();
  created.id = created._id.toString();

  return NextResponse.json(created, { status: 201 });
}
