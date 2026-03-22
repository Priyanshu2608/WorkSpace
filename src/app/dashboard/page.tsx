'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderOpen,
  CheckSquare,
  StickyNote,
  Pencil,
  Plus,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface DashboardStats {
  totalProjects: number;
  openTasks: number;
  totalNotes: number;
  totalWireframes: number;
  recentProjects: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    updatedAt: string;
    _count: { features: number };
  }>;
  dueTasks: Array<{
    id: string;
    title: string;
    done: boolean;
    dueDate: string | null;
    priority: string;
    feature?: {
      title: string;
      project: { name: string };
    } | null;
    project?: {
      name: string;
    } | null;
  }>;
  tasksByPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    
    // Check if it's the exact same day
    if (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    ) {
      return 'Due today';
    }

    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days === 1) return 'Due tomorrow';
    if (days < 0) return `${Math.abs(days)}d overdue`;
    return `Due in ${days}d`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-[#ff5555]';
      case 'High': return 'bg-error';
      case 'Medium': return 'bg-warning';
      case 'Low': return 'bg-info';
      default: return 'bg-outline-variant';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-success/20 text-success';
      case 'In Progress': return 'bg-primary/20 text-primary';
      case 'Planning': return 'bg-warning/20 text-warning';
      default: return 'bg-outline-variant/20 text-on-surface-variant';
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-10 bg-surface-container rounded-lg w-64 mb-12" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
             <div className="h-64 bg-surface-container rounded-2xl w-full" />
             <div className="h-64 bg-surface-container rounded-2xl w-full" />
          </div>
          <div className="h-[400px] bg-surface-container rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Welcome Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-[family-name:var(--font-family-display)] tracking-tight">
            {getGreeting()} 👋
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm font-medium">{today}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/projects?new=true" className="px-5 py-2.5 rounded-xl text-sm font-medium bg-surface-container border border-outline-variant/10 text-on-surface hover:border-primary/40 hover:bg-surface-container-high transition-all flex items-center gap-2">
            <FolderOpen size={16} /> <span className="hidden sm:inline">New</span> Project
          </Link>
          <Link href="/notes?new=true" className="px-5 py-2.5 rounded-xl text-sm font-medium bg-surface-container border border-outline-variant/10 text-on-surface hover:border-primary/40 hover:bg-surface-container-high transition-all flex items-center gap-2">
            <StickyNote size={16} /> <span className="hidden sm:inline">New</span> Note
          </Link>
          <Link href="/tasks" className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm hover:shadow-primary/20 hover:-translate-y-0.5 transition-all">
            <Plus size={16} /> New Task
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left/Main Column: Tasks and Projects */}
        <div className="xl:col-span-2 space-y-10">
          
          {/* Priority Focus (Upcoming Tasks) */}
          <section>
            <div className="flex items-center justify-between mb-5 px-1">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-family-display)] text-on-surface">
                Priority Focus
              </h2>
              <Link href="/tasks" className="text-sm font-medium text-primary hover:underline flex items-center gap-1 transition-colors">
                All tasks <ArrowRight size={14} />
              </Link>
            </div>
            
            {stats?.dueTasks && stats.dueTasks.length > 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
                <div className="divide-y divide-outline-variant/5">
                  {stats.dueTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="group flex items-center justify-between p-4 px-5 hover:bg-surface-container/40 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)} shadow-sm ring-2 ring-background`} />
                        <div>
                          <p className={`text-sm font-medium ${task.done ? 'line-through text-on-surface-variant/50' : 'text-on-surface'}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-on-surface-variant/70 mt-1 flex items-center gap-1.5">
                            <FolderOpen size={10} className="inline opacity-60" />
                            {task.feature?.project.name || task.project?.name || 'Global Workspace'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 px-2">
                         {task.dueDate && (
                            <span className={`text-[0.6875rem] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                               new Date(task.dueDate) < new Date() && !task.done 
                                 ? 'text-error border border-error/20 bg-error/5' 
                                 : new Date(task.dueDate) <= new Date(Date.now() + 86400000)
                                   ? 'text-warning border border-warning/20 bg-warning/5'
                                   : 'text-on-surface-variant bg-surface-container'
                             }`}>
                               <Clock size={10} /> {formatDate(task.dueDate)}
                            </span>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-dashed border-outline-variant/20">
                <CheckSquare size={32} className="mx-auto text-on-surface-variant/40 mb-3" />
                <p className="text-on-surface-variant text-sm font-medium">You're all caught up!</p>
                <p className="text-on-surface-variant/70 text-xs mt-1">No upcoming tasks require your immediate attention.</p>
              </div>
            )}
          </section>

          {/* Recent Projects (Sleek Rows) */}
          <section>
            <div className="flex items-center justify-between mb-5 px-1">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-family-display)] text-on-surface">
                Active Projects
              </h2>
              <Link href="/projects" className="text-sm font-medium text-primary hover:underline flex items-center gap-1 transition-colors">
                View library <ArrowRight size={14} />
              </Link>
            </div>

            {stats?.recentProjects && stats.recentProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.recentProjects.slice(0,4).map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 hover:border-primary/30 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-base font-[family-name:var(--font-family-display)] group-hover:text-primary transition-colors line-clamp-1 pr-4">
                        {project.name}
                      </h3>
                      <span className={`px-2.5 py-1 flex-shrink-0 text-[0.625rem] font-bold tracking-wider uppercase rounded-full ${getStatusColor(project.status)}`}>
                         {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant/80 line-clamp-2 leading-relaxed min-h-[32px]">
                      {project.description || 'No project description provided.'}
                    </p>
                    <div className="mt-5 pt-3 border-t border-outline-variant/5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant/60 font-medium">
                      <span className="flex items-center gap-1.5"><CheckSquare size={12}/> {project._count.features} Features</span>
                      <span className="flex items-center gap-1.5"><Clock size={12}/> {new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-dashed border-outline-variant/20">
                 <FolderOpen size={32} className="mx-auto text-on-surface-variant/40 mb-3" />
                 <p className="text-on-surface-variant text-sm font-medium">Your workspace is empty</p>
                 <button className="text-primary text-sm font-medium mt-2 hover:underline">Create a new project</button>
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Analytics Sidebar */}
        <div className="space-y-6">
          <section className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm sticky top-6">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6 border-b border-outline-variant/10 pb-4">Workspace Pulse</h3>
            
            {/* Mini Stat Grid */}
            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
              <div>
                <p className="text-3xl font-bold font-[family-name:var(--font-family-display)] text-on-surface leading-none">{stats?.totalProjects ?? 0}</p>
                <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5 font-medium"><FolderOpen size={12}/> Projects</p>
              </div>
              <div>
                 <p className="text-3xl font-bold font-[family-name:var(--font-family-display)] text-primary leading-none">{stats?.openTasks ?? 0}</p>
                 <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5 font-medium"><CheckSquare size={12}/> Active Tasks</p>
              </div>
              <div>
                <p className="text-2xl font-semibold font-[family-name:var(--font-family-display)] text-on-surface leading-none">{stats?.totalNotes ?? 0}</p>
                <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5 font-medium"><StickyNote size={12}/> Notes</p>
              </div>
              <div>
                 <p className="text-2xl font-semibold font-[family-name:var(--font-family-display)] text-on-surface leading-none">{stats?.totalWireframes ?? 0}</p>
                 <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5 font-medium"><Pencil size={12}/> Wireframes</p>
              </div>
            </div>
            
            {/* Priority Breakdown */}
            {stats && stats.openTasks > 0 && (
              <div className="mt-8 pt-6 border-t border-outline-variant/10">
                <h3 className="text-[0.6875rem] font-bold text-on-surface-variant uppercase tracking-widest mb-5">Task Priority</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between group">
                    <span className="text-sm font-medium flex items-center gap-2.5 text-on-surface-variant group-hover:text-on-surface transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5555] shadow-sm"/> Critical
                    </span>
                    <span className="font-bold text-on-surface">{stats.tasksByPriority.critical}</span>
                  </div>
                  <div className="flex items-center justify-between group">
                    <span className="text-sm font-medium flex items-center gap-2.5 text-on-surface-variant group-hover:text-on-surface transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-error shadow-sm"/> High
                    </span>
                    <span className="font-bold text-on-surface">{stats.tasksByPriority.high}</span>
                  </div>
                  <div className="flex items-center justify-between group">
                    <span className="text-sm font-medium flex items-center gap-2.5 text-on-surface-variant group-hover:text-on-surface transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-warning shadow-sm"/> Medium
                    </span>
                    <span className="font-bold text-on-surface">{stats.tasksByPriority.medium}</span>
                  </div>
                  <div className="flex items-center justify-between group">
                    <span className="text-sm font-medium flex items-center gap-2.5 text-on-surface-variant group-hover:text-on-surface transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-info shadow-sm"/> Low
                    </span>
                    <span className="font-bold text-on-surface">{stats.tasksByPriority.low}</span>
                  </div>
                </div>
              </div>
            )}
            
          </section>
        </div>
      </div>
    </div>
  );
}
