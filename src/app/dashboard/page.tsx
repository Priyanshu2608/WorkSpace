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
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import Badge, { StatusBadge } from '@/components/shared/Badge';

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
    feature: {
      title: string;
      project: { name: string };
    };
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

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-[#ff5555]';
      case 'High': return 'text-error';
      case 'Medium': return 'text-warning';
      case 'Low': return 'text-info';
      default: return 'text-on-surface-variant';
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
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-container rounded-lg w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-container rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold font-family-display">
          {getGreeting()} 👋
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">{today}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderOpen} label="Total Projects" value={stats?.totalProjects ?? 0} />
        <StatCard icon={CheckSquare} label="Open Tasks" value={stats?.openTasks ?? 0} />
        <StatCard icon={StickyNote} label="Notes" value={stats?.totalNotes ?? 0} />
        <StatCard icon={Pencil} label="Wireframes" value={stats?.totalWireframes ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Projects */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold font-family-display">
                Recent Projects
              </h2>
              <Link
                href="/projects"
                className="text-sm text-primary hover:text-primary-fixed flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {stats?.recentProjects && stats.recentProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.recentProjects.map((project, idx) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group block bg-surface-container rounded-xl p-5 border border-outline-variant/10 hover:border-primary/30 transition-all duration-200"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <StatusBadge status={project.status} />
                      <ExternalLink size={14} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-semibold text-sm font-family-display group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2">
                      {project.description || 'No description'}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
                      <span>{project._count.features} features</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container rounded-xl p-8 text-center border border-outline-variant/10">
                <FolderOpen size={32} className="mx-auto text-on-surface-variant mb-3" />
                <p className="text-on-surface-variant text-sm">No projects yet</p>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-primary hover:text-primary-fixed transition-colors"
                >
                  <Plus size={14} /> Create your first project
                </Link>
              </div>
            )}
          </section>

          {/* Task Priority Summary */}
          {stats && stats.openTasks > 0 && (
            <section>
              <h2 className="text-lg font-semibold font-family-display mb-4">Tasks Overview</h2>
              <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-2xl font-bold text-[#ff5555]">{stats.tasksByPriority.critical}</span>
                    <span className="text-xs text-on-surface-variant mt-1 uppercase tracking-wider">Critical</span>
                  </div>
                  <div className="w-px h-8 bg-outline-variant/20" />
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-2xl font-bold text-error">{stats.tasksByPriority.high}</span>
                    <span className="text-xs text-on-surface-variant mt-1 uppercase tracking-wider">High</span>
                  </div>
                  <div className="w-px h-8 bg-outline-variant/20" />
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-2xl font-bold text-warning">{stats.tasksByPriority.medium}</span>
                    <span className="text-xs text-on-surface-variant mt-1 uppercase tracking-wider">Medium</span>
                  </div>
                  <div className="w-px h-8 bg-outline-variant/20" />
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-2xl font-bold text-info">{stats.tasksByPriority.low}</span>
                    <span className="text-xs text-on-surface-variant mt-1 uppercase tracking-wider">Low</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Due Tasks & Actions */}
        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold font-family-display">
                Upcoming Tasks
              </h2>
              <Link
                href="/tasks"
                className="text-sm text-primary hover:text-primary-fixed flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            
            {stats?.dueTasks && stats.dueTasks.length > 0 ? (
              <div className="bg-surface-container rounded-xl border border-outline-variant/10 divide-y divide-outline-variant/10 overflow-hidden">
                {stats.dueTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col p-4 hover:bg-surface-container-high/50 transition-colors relative"
                  >
                    {/* Priority Indicator Accent */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${getPriorityColor(task.priority)}`} />

                    <div className="flex items-start gap-3 pl-2">
                       {/* Priority Icon/Dot */}
                       <div className={`mt-1 flex-shrink-0 ${getPriorityTextColor(task.priority)}`}>
                         {task.priority === 'Critical' ? <AlertCircle size={14} /> : <div className={`w-2 h-2 rounded-full mt-1 ${getPriorityColor(task.priority)}`} />}
                       </div>
                       
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${task.done ? 'line-through text-on-surface-variant/50' : 'text-on-surface'}`}>
                          {task.title}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 line-clamp-1">
                          <span className="text-xs text-on-surface-variant/70 truncate max-w-[120px]">
                            {task.feature.project.name}
                          </span>
                          
                          {task.dueDate && (
                            <span className={`text-[0.6875rem] font-medium flex items-center gap-1 ${
                              new Date(task.dueDate) < new Date() && !task.done 
                                ? 'text-error' 
                                : new Date(task.dueDate) <= new Date(Date.now() + 86400000)
                                  ? 'text-warning'
                                  : 'text-info'
                            }`}>
                              <Clock size={10} /> {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container rounded-xl p-8 text-center border border-outline-variant/10">
                <CheckSquare size={32} className="mx-auto text-on-surface-variant mb-3" />
                <p className="text-on-surface-variant text-sm">No upcoming tasks</p>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-lg font-semibold font-family-display mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-col gap-3">
              <Link
                href="/tasks"
                className="btn-gradient w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus size={16} /> New Task
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/projects?new=true"
                  className="py-2.5 rounded-xl text-xs font-medium border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all flex items-center justify-center gap-2"
                >
                  <FolderOpen size={14} /> Project
                </Link>
                <Link
                  href="/notes?new=true"
                  className="py-2.5 rounded-xl text-xs font-medium border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all flex items-center justify-center gap-2"
                >
                  <StickyNote size={14} /> Note
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
