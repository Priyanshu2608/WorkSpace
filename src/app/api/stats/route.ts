import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Project } from '@/models/Project';
import { Feature } from '@/models/Feature';
import { Task } from '@/models/Task';
import { Note } from '@/models/Note';
import { Wireframe } from '@/models/Wireframe';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';
import { getUserPullRequests } from '@/lib/github';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = session.userId;

  await connectToDatabase();

  const [projectCount, taskStats, noteCount, wireframeCount, rawRecentProjects, rawDueTasks, tasksByPriority, userTuple] = await Promise.all([
    Project.countDocuments({ userId: uid }),
    Task.countDocuments({ userId: uid, done: false }),
    Note.countDocuments({ userId: uid }),
    Wireframe.countDocuments({ userId: uid }),
    Project.find({ userId: uid })
      .sort({ updatedAt: -1 })
      .limit(4)
      .lean(),
    Task.find({ userId: uid, done: false })
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(15)
      .lean(),
    // Count tasks by priority
    Promise.all([
      Task.countDocuments({ userId: uid, done: false, priority: 'Critical' }),
      Task.countDocuments({ userId: uid, done: false, priority: 'High' }),
      Task.countDocuments({ userId: uid, done: false, priority: 'Medium' }),
      Task.countDocuments({ userId: uid, done: false, priority: 'Low' }),
    ]),
    User.findById(uid).select('githubToken').lean(),
  ]);

  // Aggregate recent projects with feature counts
  const recentProjectIds = rawRecentProjects.map(p => p._id);
  const featureCounts = await Feature.aggregate([
    { $match: { projectId: { $in: recentProjectIds } } },
    { $group: { _id: '$projectId', count: { $sum: 1 } } }
  ]);

  const recentProjects = rawRecentProjects.map(p => {
    const pIdStr = p._id.toString();
    const count = featureCounts.find(c => c._id.toString() === pIdStr)?.count || 0;
    return { ...p, id: pIdStr, _count: { features: count } };
  });

  // Populate Due Tasks references
  const dueTaskProjects = await Project.find({ _id: { $in: rawDueTasks.map(t => t.projectId).filter(Boolean) } }).select('name').lean();
  const dueTaskFeatures = await Feature.find({ _id: { $in: rawDueTasks.map(t => t.featureId).filter(Boolean) } }).select('title projectId').lean();
  
  const dueTasks = rawDueTasks.map(t => {
    let taskProject: any = dueTaskProjects.find(p => p._id.toString() === t.projectId?.toString());
    let taskFeature: any = dueTaskFeatures.find(f => f._id.toString() === t.featureId?.toString());
    
    if (taskFeature) {
      const fProject: any = dueTaskProjects.find(p => p._id.toString() === taskFeature.projectId?.toString());
      taskFeature = { ...taskFeature, id: taskFeature._id.toString(), project: fProject ? { id: fProject._id.toString(), name: fProject.name } : null };
    }

    return {
      ...t,
      id: t._id.toString(),
      project: taskProject ? { id: taskProject._id.toString(), name: taskProject.name } : null,
      feature: taskFeature || null
    };
  });

  const [critical, high, medium, low] = tasksByPriority as number[];
  const user = userTuple as { githubToken?: string } | null;

  const hasGithubToken = !!user?.githubToken;
  let githubPullRequests = [];

  if (hasGithubToken) {
    githubPullRequests = await getUserPullRequests(user.githubToken!);
  }

  return NextResponse.json({
    totalProjects: projectCount,
    openTasks: taskStats,
    totalNotes: noteCount,
    totalWireframes: wireframeCount,
    recentProjects,
    dueTasks,
    tasksByPriority: { critical, high, medium, low },
    hasGithubToken,
    githubPullRequests,
  });
}
