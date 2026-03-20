import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const [projectCount, taskStats, noteCount, wireframeCount, recentProjects, dueTasks, tasksByPriority] = await Promise.all([
    prisma.project.count(),
    prisma.task.count({ where: { done: false } }),
    prisma.note.count(),
    prisma.wireframe.count(),
    prisma.project.findMany({
      take: 4,
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { features: true } } },
    }),
    prisma.task.findMany({
      where: { done: false },
      take: 15,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        feature: {
          include: { project: { select: { id: true, name: true } } },
        },
      },
    }),
    // Count tasks by priority
    Promise.all([
      prisma.task.count({ where: { done: false, priority: 'Critical' } }),
      prisma.task.count({ where: { done: false, priority: 'High' } }),
      prisma.task.count({ where: { done: false, priority: 'Medium' } }),
      prisma.task.count({ where: { done: false, priority: 'Low' } }),
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
