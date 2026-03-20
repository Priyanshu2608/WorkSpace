'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Plus, FolderOpen, Search, LayoutGrid, List,
  CheckCircle2, Clock, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { Project, PROJECT_STATUSES, timeAgo } from '@/types';
import { StatusBadge } from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';
import { useToast } from '@/components/shared/Toast';

function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [form, setForm] = useState({
    name: '', description: '', status: 'Planning',
    githubUrl: '', tags: ''
  });
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === 'true') setShowModal(true);
  }, [searchParams]);

  const createProject = async () => {
    if (!form.name.trim()) return;
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        githubUrl: form.githubUrl || undefined,
        tags: form.tags || undefined
      }),
    });
    const project = await res.json();
    setProjects((prev) => [project, ...prev]);
    setForm({ name: '', description: '', status: 'Planning', githubUrl: '', tags: '' });
    setShowModal(false);
    addToast('Project created successfully', 'success');
  };

  const filtered = projects
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => statusFilter === 'All' || p.status === statusFilter);

  const getProjectStats = (project: Project) => {
    const features = project.features || [];
    const allTasks = features.flatMap((f) => f.tasks || []);
    const doneTasks = allTasks.filter((t) => t.done);
    const progress = allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0;
    return { featureCount: features.length, taskCount: allTasks.length, doneCount: doneTasks.length, progress };
  };

  const statusCounts = {
    All: projects.length,
    ...PROJECT_STATUSES.reduce((acc, s) => ({ ...acc, [s]: projects.filter(p => p.status === s).length }), {} as Record<string, number>)
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-family-display">Projects</h1>
          <p className="text-on-surface-variant text-sm mt-1">{projects.length} total projects</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-gradient px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status filters */}
        <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
          {['All', ...PROJECT_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-primary/20 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright/50'
              }`}
            >
              {s}
              <span className="ml-1.5 opacity-60">{statusCounts[s] || 0}</span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-surface-container border border-outline-variant/10 rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none transition-colors"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 bg-surface-container rounded-lg p-0.5">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant'}`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant'}`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Projects content */}
      {loading ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-2'}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`bg-surface-container rounded-xl animate-pulse ${view === 'grid' ? 'h-48' : 'h-16'}`} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((project, idx) => {
              const stats = getProjectStats(project);
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group block bg-surface-container rounded-xl border border-outline-variant/10 hover:border-primary/25 transition-all duration-200 animate-fade-in overflow-hidden"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Progress bar at top */}
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${stats.progress}%` }} />
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <StatusBadge status={project.status} />
                      <ArrowUpRight size={14} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <h3 className="font-semibold font-family-display text-[0.9375rem] group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
                      {project.description || 'No description'}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-4 text-[0.6875rem] text-on-surface-variant">
                      <span className="inline-flex items-center gap-1">
                        <AlertCircle size={11} />
                        {stats.featureCount} features
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        {stats.doneCount}/{stats.taskCount} tasks
                      </span>
                      {stats.progress > 0 && (
                        <span className="text-primary font-medium">{stats.progress}%</span>
                      )}
                    </div>

                    {/* Tags */}
                    {project.tags && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {project.tags.split(',').slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-surface-bright rounded-full text-[0.625rem] text-on-surface-variant">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/8">
                      <span className="text-[0.625rem] text-on-surface-variant/50 inline-flex items-center gap-1">
                        <Clock size={10} />
                        {timeAgo(project.updatedAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1">
            {filtered.map((project, idx) => {
              const stats = getProjectStats(project);
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group flex items-center gap-4 bg-surface-container rounded-xl px-4 py-3.5 border border-outline-variant/10 hover:border-primary/20 transition-all animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                        {project.name}
                      </h3>
                      <StatusBadge status={project.status} />
                    </div>
                    {project.description && (
                      <p className="text-xs text-on-surface-variant mt-0.5 truncate">{project.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-5 text-[0.6875rem] text-on-surface-variant shrink-0">
                    <span>{stats.featureCount} features</span>
                    <span>{stats.doneCount}/{stats.taskCount} tasks</span>
                    {stats.progress > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${stats.progress}%` }} />
                        </div>
                        <span className="text-primary font-medium">{stats.progress}%</span>
                      </div>
                    )}
                    <span className="text-on-surface-variant/50">{timeAgo(project.updatedAt)}</span>
                  </div>
                  <ArrowUpRight size={14} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-surface-container rounded-xl p-16 text-center border border-outline-variant/10">
          <FolderOpen size={44} className="mx-auto text-on-surface-variant/40 mb-4" />
          <p className="text-on-surface-variant text-sm">
            {search || statusFilter !== 'All' ? 'No matching projects' : 'No projects yet'}
          </p>
          <p className="text-on-surface-variant/50 text-xs mt-1">
            {search || statusFilter !== 'All' ? 'Try adjusting your filters' : 'Start organizing your work'}
          </p>
          {!search && statusFilter === 'All' && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 btn-gradient px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2"
            >
              <Plus size={14} /> Create your first project
            </button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Project" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My awesome project"
              className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the project..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5">
                Tags
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="react, typescript..."
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5">
              GitHub Repository
            </label>
            <input
              type="text"
              value={form.githubUrl}
              onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
              placeholder="https://github.com/user/repo"
              className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant/10">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-bright transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createProject}
              disabled={!form.name.trim()}
              className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              Create Project
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-8 bg-surface-container rounded-lg w-48" /></div>}>
      <ProjectsContent />
    </Suspense>
  );
}
