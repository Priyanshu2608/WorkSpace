'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Calendar, Tag, AlertCircle, Clock, Plus,
  Trash2, CheckCircle2, Circle, ChevronDown, MoreHorizontal
} from 'lucide-react';
import { Feature, Task, PRIORITIES, FEATURE_LABELS, timeAgo } from '@/types';
import { useToast } from '@/components/shared/Toast';

interface FeatureDetailPanelProps {
  feature: Feature;
  projectPrefix: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function FeatureDetailPanel({ feature, projectPrefix, onClose, onUpdate }: FeatureDetailPanelProps) {
  const [title, setTitle] = useState(feature.title);
  const [description, setDescription] = useState(feature.description || '');
  const [priority, setPriority] = useState(feature.priority);
  const [status, setStatus] = useState(feature.status);
  const [labels, setLabels] = useState<string[]>(feature.labels ? feature.labels.split(',').map(l => l.trim()) : []);
  const [dueDate, setDueDate] = useState(feature.dueDate ? feature.dueDate.split('T')[0] : '');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  const panelRef = useRef<HTMLDivElement>(null);

  // Save changes
  const saveChanges = async () => {
    setSaving(true);
    await fetch(`/api/features/${feature.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || null,
        priority,
        status,
        labels: labels.length > 0 ? labels.join(',') : null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      }),
    });
    setSaving(false);
    onUpdate();
  };

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title !== feature.title || description !== (feature.description || '') ||
        priority !== feature.priority || status !== feature.status ||
        dueDate !== (feature.dueDate ? feature.dueDate.split('T')[0] : '')) {
        saveChanges();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [title, description, priority, status, dueDate]);

  // Save labels immediately
  useEffect(() => {
    const currentLabels = feature.labels ? feature.labels.split(',').map(l => l.trim()) : [];
    if (JSON.stringify(labels) !== JSON.stringify(currentLabels)) {
      saveChanges();
    }
  }, [labels]);

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    await fetch(`/api/features/${feature.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle }),
    });
    setNewTaskTitle('');
    onUpdate();
  };

  const toggleTask = async (taskId: string, done: boolean) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
    onUpdate();
  };

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    onUpdate();
  };

  const deleteFeature = async () => {
    await fetch(`/api/features/${feature.id}`, { method: 'DELETE' });
    addToast('Feature deleted');
    onClose();
    onUpdate();
  };

  const toggleLabel = (label: string) => {
    setLabels(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const tasks = feature.tasks || [];
  const doneTasks = tasks.filter(t => t.done).length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const priorityColors: Record<string, string> = {
    Low: 'text-info', Medium: 'text-warning', High: 'text-error', Critical: 'text-[#ff5555]'
  };

  const statusOptions = ['Backlog', 'In Progress', 'Review', 'Done'];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 side-panel-overlay z-40" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 w-[520px] max-w-[90vw] bg-surface-container-low border-l border-outline-variant/15 z-50 overflow-y-auto animate-slide-in-right"
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-low/95 backdrop-blur-sm border-b border-outline-variant/10 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-on-surface-variant/50 bg-surface-container px-2 py-0.5 rounded">
              {projectPrefix}-{feature.featureNumber}
            </span>
            {saving && <span className="text-[0.625rem] text-primary animate-pulse">Saving...</span>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={deleteFeature}
              className="p-2 rounded-lg hover:bg-error-container/20 transition-colors text-on-surface-variant hover:text-error"
              title="Delete feature"
            >
              <Trash2 size={15} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-semibold font-family-display bg-transparent border-none outline-none placeholder:text-on-surface-variant/30"
            placeholder="Feature title..."
          />

          {/* Metadata grid */}
          <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm">
            {/* Status */}
            <span className="text-on-surface-variant text-xs flex items-center gap-1.5">
              <Circle size={12} /> Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-surface-container border border-outline-variant/10 rounded-lg px-2.5 py-1.5 text-xs focus:border-primary/30 focus:outline-none"
            >
              {statusOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Priority */}
            <span className="text-on-surface-variant text-xs flex items-center gap-1.5">
              <AlertCircle size={12} /> Priority
            </span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={`bg-surface-container border border-outline-variant/10 rounded-lg px-2.5 py-1.5 text-xs focus:border-primary/30 focus:outline-none ${priorityColors[priority] || ''}`}
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Due Date */}
            <span className="text-on-surface-variant text-xs flex items-center gap-1.5">
              <Calendar size={12} /> Due Date
            </span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-surface-container border border-outline-variant/10 rounded-lg px-2.5 py-1.5 text-xs focus:border-primary/30 focus:outline-none"
            />

            {/* Labels */}
            <span className="text-on-surface-variant text-xs flex items-center gap-1.5">
              <Tag size={12} /> Labels
            </span>
            <div className="relative">
              <button
                onClick={() => setShowLabelPicker(!showLabelPicker)}
                className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {labels.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {labels.map(l => (
                      <span key={l} className={`px-2 py-0.5 rounded-full text-[0.625rem] font-medium label-${l.toLowerCase()}`}>
                        {l}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-on-surface-variant/40">Add labels...</span>
                )}
              </button>

              {showLabelPicker && (
                <div className="absolute top-full left-0 mt-1 bg-surface-container-high border border-outline-variant/15 rounded-xl p-2 z-20 w-56 shadow-ambient animate-scale-in">
                  {FEATURE_LABELS.map(l => (
                    <button
                      key={l}
                      onClick={() => toggleLabel(l)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        labels.includes(l) ? 'bg-primary/10 text-primary' : 'hover:bg-surface-bright text-on-surface-variant'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full label-${l.toLowerCase()}`} />
                        {l}
                      </span>
                      {labels.includes(l) && <CheckCircle2 size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Created */}
            <span className="text-on-surface-variant text-xs flex items-center gap-1.5">
              <Clock size={12} /> Created
            </span>
            <span className="text-xs text-on-surface-variant/60">{timeAgo(feature.createdAt)}</span>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-on-surface-variant font-medium mb-2">Description</h4>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a detailed description..."
              rows={4}
              className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/10 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary/30 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Sub-tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">
                Sub-tasks
                {tasks.length > 0 && (
                  <span className="ml-2 text-primary normal-case">{doneTasks}/{tasks.length}</span>
                )}
              </h4>
              {tasks.length > 0 && (
                <span className="text-xs text-on-surface-variant/50">{progress}%</span>
              )}
            </div>

            {/* Progress bar */}
            {tasks.length > 0 && (
              <div className="progress-bar mb-3">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            )}

            {/* Task list */}
            <div className="space-y-1">
              {tasks.map((task: Task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container transition-colors"
                >
                  <button
                    onClick={() => toggleTask(task.id, !task.done)}
                    className={`shrink-0 transition-colors ${task.done ? 'text-success' : 'text-on-surface-variant/30 hover:text-on-surface-variant'}`}
                  >
                    {task.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>
                  <span className={`flex-1 text-sm ${task.done ? 'line-through text-on-surface-variant/40' : ''}`}>
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-on-surface-variant/30 hover:text-error transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add task input */}
            <div className="mt-2 flex items-center gap-2">
              <Plus size={14} className="text-on-surface-variant/30 shrink-0" />
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Add a sub-task..."
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-on-surface-variant/30"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
