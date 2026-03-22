import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = session.userId;

  const [projectCount, taskStats, noteCount, wireframeCount, recentProjects, dueTasks, tasksByPriority] = await Promise.all([
    prisma.project.count({ where: { userId: uid } }),
    prisma.task.count({ where: { userId: uid, done: false } }),
    prisma.note.count({ where: { userId: uid } }),
    prisma.wireframe.count({ where: { userId: uid } }),
    prisma.project.findMany({
      where: { userId: uid },
      take: 4,
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { features: true } } },
    }),
    prisma.task.findMany({
      where: { userId: uid, done: false },
      take: 15,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        project: { select: { id: true, name: true } },
        feature: {
          include: { project: { select: { id: true, name: true } } },
        },
      },
    }),
    // Count tasks by priority
    Promise.all([
      prisma.task.count({ where: { userId: uid, done: false, priority: 'Critical' } }),
      prisma.task.count({ where: { userId: uid, done: false, priority: 'High' } }),
      prisma.task.count({ where: { userId: uid, done: false, priority: 'Medium' } }),
      prisma.task.count({ where: { userId: uid, done: false, priority: 'Low' } }),
    ]),
  ]);

  const [critical, high, medium, low] = tasksByPriority;

  return NextResponse.json({
    totalProjects: projectCount,
    openTasks: taskStats,
    totalNotes: noteCount,
    totalWireframes: wireframeCount,
    recentProjects,
    dueTasks,
    tasksByPriority: { critical, high, medium, low },
  });
}
