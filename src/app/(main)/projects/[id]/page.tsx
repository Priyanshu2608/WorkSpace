'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Trash2, Layout, GitBranch,
  FileText, PenTool, Code, Layers
} from 'lucide-react';
import { Project } from '@/types';
import { StatusBadge } from '@/components/shared/Badge';
import ProjectOverview from '@/components/project/ProjectOverview';
import KanbanBoard from '@/components/project/KanbanBoard';
import ProjectNotes from '@/components/project/ProjectNotes';
import ProjectWireframes from '@/components/project/ProjectWireframes';
import ProjectGitHub from '@/components/project/ProjectGitHub';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useToast } from '@/components/shared/Toast';

const TABS = [
  { name: 'Overview', icon: Layout },
  { name: 'Features', icon: Layers },
  { name: 'Notes', icon: FileText },
  { name: 'Wireframes', icon: PenTool },
  { name: 'GitHub', icon: Code },
];

export default function ProjectWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) { router.push('/projects'); return; }
    const data = await res.json();
    setProject(data);
    setLoading(false);
  };

  useEffect(() => { fetchProject(); }, [id]);

  const deleteProject = async () => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    addToast('Project deleted');
    router.push('/projects');
  };

  if (loading || !project) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-surface-container rounded-lg w-48" />
        <div className="h-10 bg-surface-container rounded-lg w-full" />
        <div className="h-64 bg-surface-container rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/projects')}
            className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold font-family-display">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            {project.description && (
              <p className="text-sm text-on-surface-variant mt-0.5">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDelete(true)}
            className="p-2 rounded-lg hover:bg-error-container/20 transition-colors text-on-surface-variant hover:text-error"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Tabs — pill/segment style */}
      <div className="flex gap-0.5 bg-surface-container rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab, idx) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.name}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === idx
                  ? 'bg-primary/15 text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright/40'
              }`}
            >
              <Icon size={14} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 0 && <ProjectOverview project={project} onUpdate={fetchProject} />}
        {activeTab === 1 && <KanbanBoard projectId={id} projectName={project.name} />}
        {activeTab === 2 && <ProjectNotes projectId={id} />}
        {activeTab === 3 && <ProjectWireframes projectId={id} />}
        {activeTab === 4 && <ProjectGitHub project={project} onUpdate={fetchProject} />}
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={deleteProject}
        title="Delete Project"
        message="This will permanently delete the project and all its features, notes, and wireframes."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
