'use client';

import { useState } from 'react';
import { Calendar, Link as LinkIcon, Tag, Save } from 'lucide-react';
import { Project, PROJECT_STATUSES } from '@/types';
import { StatusBadge } from '@/components/shared/Badge';
import { useToast } from '@/components/shared/Toast';

interface ProjectOverviewProps {
  project: Project;
  onUpdate: () => void;
}

export default function ProjectOverview({ project, onUpdate }: ProjectOverviewProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: project.name,
    description: project.description || '',
    status: project.status,
    githubUrl: project.githubUrl || '',
    tags: project.tags || '',
    startDate: project.startDate ? project.startDate.split('T')[0] : '',
    targetDate: project.targetDate ? project.targetDate.split('T')[0] : '',
  });
  const { addToast } = useToast();

  const save = async () => {
    await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setEditing(false);
    addToast('Project updated');
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <StatusBadge status={project.status} />
        <button
          onClick={() => editing ? save() : setEditing(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            editing ? 'btn-gradient' : 'border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          {editing ? <><Save size={14} /> Save Changes</> : 'Edit'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5">
              Project Name
            </label>
            {editing ? (
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
              />
            ) : (
              <p className="text-lg font-semibold font-[family-name:var(--font-family-display)]">{project.name}</p>
            )}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5">
              Description
            </label>
            {editing ? (
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none resize-none"
              />
            ) : (
              <p className="text-sm text-on-surface-variant">{project.description || 'No description'}</p>
            )}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5">
              Status
            </label>
            {editing ? (
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <StatusBadge status={project.status} />
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5 flex items-center gap-1.5">
              <LinkIcon size={12} /> GitHub Repository
            </label>
            {editing ? (
              <input
                value={form.githubUrl}
                onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                placeholder="https://github.com/user/repo"
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
              />
            ) : project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary-fixed transition-colors flex items-center gap-1.5"
              >
                <LinkIcon size={14} /> {project.githubUrl}
              </a>
            ) : (
              <p className="text-sm text-on-surface-variant">No repository linked</p>
            )}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5 flex items-center gap-1.5">
              <Tag size={12} /> Tags
            </label>
            {editing ? (
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="react, typescript, web"
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
              />
            ) : project.tags ? (
              <div className="flex flex-wrap gap-1.5">
                {project.tags.split(',').map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-surface-bright rounded-full text-xs text-on-surface-variant">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">No tags</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5 flex items-center gap-1.5">
                <Calendar size={12} /> Start Date
              </label>
              {editing ? (
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
                />
              ) : (
                <p className="text-sm text-on-surface-variant">
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5 flex items-center gap-1.5">
                <Calendar size={12} /> Target Date
              </label>
              {editing ? (
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
                />
              ) : (
                <p className="text-sm text-on-surface-variant">
                  {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : 'Not set'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
