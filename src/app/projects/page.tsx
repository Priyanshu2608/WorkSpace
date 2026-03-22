'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Plus, FolderOpen, Search, LayoutGrid, List,
  CheckCircle2, Clock, AlertCircle, ArrowRight, Github
} from 'lucide-react';
import { Project, PROJECT_STATUSES, timeAgo } from '@/types';
import { StatusBadge } from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';
import { useToast } from '@/components/shared/Toast';

// Premium deterministic gradient generator
const getCoverGradient = (seedStr: string) => {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 60) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 70%, 40%), hsl(${h2}, 80%, 20%))`;
};

// Deterministic emoji generator
const getEmoji = (seedStr: string) => {
  const emojis = ['🚀', '🌟', '⚡️', '🔥', '💎', '🎯', '💡', '🛠️', '📦', '🎨', '🧩', '📈'];
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  return emojis[Math.abs(hash) % emojis.length];
};

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

  const statusCounts: Record<string, number> = {
    All: projects.length,
    ...PROJECT_STATUSES.reduce((acc, s) => ({ ...acc, [s]: projects.filter(p => p.status === s).length }), {} as Record<string, number>)
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-family-display flex items-center gap-3 tracking-tight">
            <FolderOpen size={28} className="text-primary" /> Projects
          </h1>
          <p className="text-on-surface-variant text-sm mt-2 font-medium">Your workspace has {projects.length} total projects</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-gradient px-5 py-2.5 rounded-2xl text-[0.9375rem] font-bold inline-flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap justify-between bg-surface-container rounded-3xl p-2 border border-outline-variant/10 shadow-sm">
        {/* Status filters */}
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar flex-nowrap">
          {['All', ...PROJECT_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-2xl text-[0.9375rem] font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                statusFilter === s
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-transparent'
              }`}
            >
              {s}
              <span className={`px-1.5 py-0.5 rounded-full text-[0.625rem] ${statusFilter === s ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {statusCounts[s] || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
            <input
              type="text"
              placeholder="Search library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/15 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none transition-colors"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-1 flex-shrink-0">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-primary/10 text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-primary/10 text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Projects content */}
      {loading ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-2'}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`bg-surface-container rounded-2xl animate-pulse ${view === 'grid' ? 'h-[280px]' : 'h-16'}`} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((project, idx) => {
              const stats = getProjectStats(project);
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group flex flex-col bg-surface-container-lowest rounded-3xl border border-outline-variant/10 hover:border-primary/30 hover:shadow-md transition-all duration-300 animate-fade-in overflow-hidden relative shadow-sm hover:-translate-y-1"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Premium Auto-Generated Cover */}
                  <div className="h-28 w-full relative overflow-hidden shrink-0" style={{ background: getCoverGradient(project.name + project.id) }}>
                     <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent" />
                     <div className="absolute bottom-3 left-4 text-3xl drop-shadow-lg scale-100 group-hover:scale-110 transition-transform origin-bottom-left">
                       {getEmoji(project.name)}
                     </div>
                     <div className="absolute top-3 right-3">
                       <StatusBadge status={project.status} />
                     </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold font-family-display text-lg group-hover:text-primary transition-colors pr-6">
                      {project.name}
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-2 line-clamp-2 leading-relaxed flex-1">
                      {project.description || 'No description provided.'}
                    </p>

                    {/* Progress tracking */}
                    <div className="mt-5 space-y-2">
                       <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                          <span>Progress</span>
                          <span className={stats.progress === 100 ? 'text-success' : 'text-primary'}>{stats.progress}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${stats.progress === 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${stats.progress}%` }} />
                       </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between mt-5 pt-4 border-t border-outline-variant/10 text-xs text-on-surface-variant font-medium">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> {stats.doneCount}/{stats.taskCount} Tasks
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} /> {timeAgo(project.updatedAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Proper Database Table View (Notion / Linear Style) */
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm animate-fade-in">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-outline-variant/10 bg-surface-container-high/30">
                     <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Project Name</th>
                     <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant w-40 border-l border-outline-variant/5">Status</th>
                     <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant w-48 border-l border-outline-variant/5">Progress</th>
                     <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant w-32 border-l border-outline-variant/5 text-right">Features</th>
                     <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant w-40 border-l border-outline-variant/5 text-right">Last Updated</th>
                     <th className="px-4 py-3 border-l border-outline-variant/5 w-12"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-outline-variant/5">
                   {filtered.map((project) => {
                     const stats = getProjectStats(project);
                     return (
                       <tr key={project.id} className="group hover:bg-surface-container/40 transition-colors">
                         <td className="px-5 py-4">
                            <Link href={`/projects/${project.id}`} className="flex flex-col">
                               <span className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                                  <span>{getEmoji(project.name)}</span> {project.name}
                               </span>
                               {project.description && <span className="text-xs text-on-surface-variant truncate mt-1 max-w-[400px]">{project.description}</span>}
                            </Link>
                         </td>
                         <td className="px-5 py-4 border-l border-outline-variant/5">
                            <StatusBadge status={project.status} />
                         </td>
                         <td className="px-5 py-4 border-l border-outline-variant/5">
                            <div className="flex items-center gap-3">
                               <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${stats.progress === 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${stats.progress}%` }} />
                               </div>
                               <span className="text-xs font-bold text-on-surface-variant min-w-[3ch] text-right">{stats.progress}%</span>
                            </div>
                         </td>
                         <td className="px-5 py-4 border-l border-outline-variant/5 text-right text-sm font-medium text-on-surface-variant">
                            {stats.featureCount}
                         </td>
                         <td className="px-5 py-4 border-l border-outline-variant/5 text-right text-xs text-on-surface-variant/70">
                            {timeAgo(project.updatedAt)}
                         </td>
                         <td className="px-4 py-4 border-l border-outline-variant/5 text-right whitespace-nowrap">
                            <Link href={`/projects/${project.id}`} className="p-2 text-on-surface-variant hover:text-primary transition-colors inline-block rounded-lg hover:bg-primary/10">
                               <ArrowRight size={16} />
                            </Link>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
          </div>
        )
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl p-16 text-center border border-dashed border-outline-variant/20 mt-8 shadow-sm">
          <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mx-auto mb-5 border border-outline-variant/10">
            <FolderOpen size={32} className="text-primary/60" />
          </div>
          <p className="text-on-surface text-lg font-bold font-family-display">
            {search || statusFilter !== 'All' ? 'No projects matched' : 'Your library is empty'}
          </p>
          <p className="text-on-surface-variant text-sm mt-2 max-w-sm mx-auto">
            {search || statusFilter !== 'All' ? 'Adjust your search query or filters to find what you are looking for.' : 'Start organizing your work by creating your first awesome project.'}
          </p>
          {!search && statusFilter === 'All' && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-8 btn-gradient px-6 py-2.5 rounded-2xl text-[0.9375rem] font-bold shadow-md hover:shadow-lg transition-all"
            >
              Construct Project
            </button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Initialize New Project" size="md">
        <div className="space-y-5">
           <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10 text-xs text-on-surface-variant/80 flex items-start gap-3">
              <FolderOpen size={16} className="text-primary shrink-0 mt-0.5" />
              <p>WorkSpace auto-generates a unique gradient cover and premium emoji based on your project name to help you identify it instantly on the board.</p>
           </div>
          <div>
            <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold block mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Next.js SaaS Boilerplate"
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl text-sm font-medium focus:border-primary/40 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold block mb-2">
              Goal / Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What are we building?"
              rows={3}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl text-sm font-medium focus:border-primary/40 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold block mb-2">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl text-sm font-medium focus:border-primary/40 focus:outline-none"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold block mb-2">
                Tags
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="react, typescript..."
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl text-sm font-medium focus:border-primary/40 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold block mb-2">
              GitHub Repository
            </label>
            <div className="relative">
               <Github size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
               <input
                 type="text"
                 value={form.githubUrl}
                 onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                 placeholder="https://github.com/user/repo"
                 className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl text-sm font-medium focus:border-primary/40 focus:outline-none"
               />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/10">
            <button
              onClick={() => setShowModal(false)}
              className="px-5 py-2.5 text-[0.9375rem] font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createProject}
              disabled={!form.name.trim()}
              className="btn-gradient px-6 py-2.5 rounded-2xl text-[0.9375rem] font-bold disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
            >
              Initialize Project
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4 max-w-6xl mx-auto"><div className="h-10 bg-surface-container rounded-xl w-64 mb-8" /><div className="h-[400px] bg-surface-container rounded-2xl" /></div>}>
      <ProjectsContent />
    </Suspense>
  );
}
