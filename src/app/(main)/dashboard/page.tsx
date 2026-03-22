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
      case 'Critical': return 'bg-secondary-container';
      case 'High': return 'bg-error';
      case 'Medium': return 'bg-warning';
      case 'Low': return 'bg-info';
      default: return 'bg-outline-variant';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-success/20 text-[#3a7577]';
      case 'In Progress': return 'bg-primary/15 text-primary-container';
      case 'Planning': return 'bg-warning/40 text-on-tertiary';
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
          <Link href="/projects?new=true" className="px-5 py-2.5 rounded-2xl text-[0.9375rem] font-semibold bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:border-primary/40 hover:shadow-sm transition-all duration-300 flex items-center gap-2">
            <FolderOpen size={18} className="text-primary"/> <span className="hidden sm:inline">New</span> Project
          </Link>
          <Link href="/notes?new=true" className="px-5 py-2.5 rounded-2xl text-[0.9375rem] font-semibold bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:border-primary/40 hover:shadow-sm transition-all duration-300 flex items-center gap-2">
            <StickyNote size={18} className="text-info"/> <span className="hidden sm:inline">New</span> Note
          </Link>
          <Link href="/tasks" className="btn-gradient px-6 py-2.5 rounded-2xl text-[0.9375rem] font-bold flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <Plus size={18} /> New Task
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
              <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="divide-y divide-outline-variant/20">
                  {stats.dueTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="group flex items-center justify-between p-4 px-6 hover:bg-surface-container-high transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1.5 w-3 h-3 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)} shadow-sm`} />
                        <div>
                          <p className={`text-[0.9375rem] font-semibold ${task.done ? 'line-through text-on-surface-variant/50' : 'text-on-surface'}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-on-surface-variant font-medium mt-1 flex items-center gap-1.5">
                            <FolderOpen size={12} className="inline opacity-60 text-primary" />
                            {task.feature?.project.name || task.project?.name || 'Global Workspace'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 pl-4 pr-1">
                         {task.dueDate && (
                            <span className={`text-[0.75rem] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm ${
                               new Date(task.dueDate) < new Date() && !task.done 
                                 ? 'text-error border border-error/20 bg-error/10' 
                                 : new Date(task.dueDate) <= new Date(Date.now() + 86400000)
                                   ? 'text-on-tertiary border border-warning/50 bg-warning/30'
                                   : 'text-on-surface-variant border border-outline-variant/30 bg-surface-container-high'
                             }`}>
                               <Clock size={12} /> {formatDate(task.dueDate)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {stats.recentProjects.slice(0,4).map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-[1.0625rem] font-[family-name:var(--font-family-display)] group-hover:text-primary transition-colors line-clamp-1 pr-4">
                        {project.name}
                      </h3>
                      <span className={`px-2.5 py-1 flex-shrink-0 text-[0.6875rem] font-bold tracking-wider uppercase rounded-full shadow-sm ${getStatusColor(project.status)}`}>
                         {project.status}
                      </span>
                    </div>
                    <p className="text-[0.875rem] text-on-surface-variant font-medium line-clamp-2 leading-relaxed min-h-[40px]">
                      {project.description || 'No project description provided.'}
                    </p>
                    <div className="mt-5 pt-4 border-t border-outline-variant/20 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><CheckSquare size={14} className="text-primary"/> {project._count.features} Features</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} className="text-secondary"/> min ago</span>
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
          <section className="bg-surface-container-lowest rounded-3xl p-7 border border-outline-variant/30 shadow-sm sticky top-8">
            <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-[0.15em] mb-7 border-b border-outline-variant/20 pb-4">Workspace Pulse</h3>
            
            {/* Mini Stat Grid */}
            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
              <div>
                <p className="text-4xl font-extrabold font-[family-name:var(--font-family-display)] text-on-surface leading-none">{stats?.totalProjects ?? 0}</p>
                <p className="text-xs text-on-surface-variant mt-2.5 flex items-center gap-1.5 font-bold uppercase tracking-wider"><FolderOpen size={14} className="text-primary"/> Projects</p>
              </div>
              <div>
                 <p className="text-4xl font-extrabold font-[family-name:var(--font-family-display)] text-primary leading-none">{stats?.openTasks ?? 0}</p>
                 <p className="text-xs text-on-surface-variant mt-2.5 flex items-center gap-1.5 font-bold uppercase tracking-wider"><CheckSquare size={14} className="text-error"/> Tasks</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold font-[family-name:var(--font-family-display)] text-on-surface leading-none">{stats?.totalNotes ?? 0}</p>
                <p className="text-xs text-on-surface-variant mt-2.5 flex items-center gap-1.5 font-bold uppercase tracking-wider"><StickyNote size={14} className="text-info"/> Notes</p>
              </div>
              <div>
                 <p className="text-3xl font-extrabold font-[family-name:var(--font-family-display)] text-on-surface leading-none">{stats?.totalWireframes ?? 0}</p>
                 <p className="text-xs text-on-surface-variant mt-2.5 flex items-center gap-1.5 font-bold uppercase tracking-wider"><Pencil size={14} className="text-warning"/> Boards</p>
              </div>
            </div>
            
            {/* Priority Breakdown */}
            {stats && stats.openTasks > 0 && (
              <div className="mt-8 pt-6 border-t border-outline-variant/20">
                <h3 className="text-[0.6875rem] font-black text-on-surface-variant uppercase tracking-widest mb-5">Task Priority</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between group cursor-default">
                    <span className="text-[0.9375rem] font-semibold flex items-center gap-3 text-on-surface-variant group-hover:text-on-surface transition-colors">
                      <div className="w-3 h-3 rounded-full bg-secondary-container shadow-sm"/> Critical
                    </span>
                    <span className="font-bold text-on-surface">{stats.tasksByPriority.critical}</span>
                  </div>
                  <div className="flex items-center justify-between group cursor-default">
                    <span className="text-[0.9375rem] font-semibold flex items-center gap-3 text-on-surface-variant group-hover:text-on-surface transition-colors">
                      <div className="w-3 h-3 rounded-full bg-error shadow-sm"/> High
                    </span>
                    <span className="font-bold text-on-surface">{stats.tasksByPriority.high}</span>
                  </div>
                  <div className="flex items-center justify-between group cursor-default">
                    <span className="text-[0.9375rem] font-semibold flex items-center gap-3 text-on-surface-variant group-hover:text-on-surface transition-colors">
                      <div className="w-3 h-3 rounded-full bg-warning shadow-sm"/> Medium
                    </span>
                    <span className="font-bold text-on-surface">{stats.tasksByPriority.medium}</span>
                  </div>
                  <div className="flex items-center justify-between group cursor-default">
                    <span className="text-[0.9375rem] font-semibold flex items-center gap-3 text-on-surface-variant group-hover:text-on-surface transition-colors">
                      <div className="w-3 h-3 rounded-full bg-info shadow-sm"/> Low
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
