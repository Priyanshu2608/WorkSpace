'use client';

import { useEffect, useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Plus, GripVertical, ChevronDown, CheckCircle2, Circle,
  Calendar, MoreHorizontal, Search, Filter
} from 'lucide-react';
import { Feature, Task, KANBAN_COLUMNS, PRIORITIES, timeAgo } from '@/types';
import { useToast } from '@/components/shared/Toast';
import FeatureDetailPanel from './FeatureDetailPanel';

interface KanbanBoardProps {
  projectId: string;
  projectName?: string;
}

export default function KanbanBoard({ projectId, projectName }: KanbanBoardProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());
  const quickAddRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Project prefix for "PROJ-1" style IDs
  const projectPrefix = (projectName || 'PROJ')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4);

  const fetchFeatures = async () => {
    const res = await fetch(`/api/projects/${projectId}/features`);
    const data = await res.json();
    setFeatures(data);
    setLoading(false);
    // Re-select the feature if the panel is open
    if (selectedFeature) {
      const updated = data.find((f: Feature) => f.id === selectedFeature.id);
      if (updated) setSelectedFeature(updated);
      else setSelectedFeature(null);
    }
  };

  useEffect(() => { fetchFeatures(); }, [projectId]);

  // Quick add feature (inline, no modal)
  const quickAddFeature = async (column: string) => {
    if (!quickAddTitle.trim()) {
      setQuickAddColumn(null);
      return;
    }
    const nextNumber = features.length > 0 ? Math.max(...features.map(f => f.featureNumber)) + 1 : 1;
    await fetch(`/api/projects/${projectId}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: quickAddTitle,
        status: column,
        priority: 'Medium',
        featureNumber: nextNumber,
      }),
    });
    setQuickAddTitle('');
    setQuickAddColumn(null);
    fetchFeatures();
    addToast('Feature created');
  };

  const updateFeature = async (id: string, data: Partial<Feature>) => {
    await fetch(`/api/features/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchFeatures();
  };

  const addTaskInline = async (featureId: string) => {
    const title = newTaskInputs[featureId];
    if (!title?.trim()) return;
    await fetch(`/api/features/${featureId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setNewTaskInputs(prev => ({ ...prev, [featureId]: '' }));
    fetchFeatures();
  };

  const toggleTask = async (taskId: string, done: boolean) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
    fetchFeatures();
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    updateFeature(draggableId, { status: newStatus, order: destination.index });
  };

  const getColumnFeatures = (column: string) => {
    let items = features.filter((f) => f.status === column);
    if (searchQuery) {
      items = items.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (priorityFilter !== 'All') {
      items = items.filter(f => f.priority === priorityFilter);
    }
    return items.sort((a, b) => a.order - b.order);
  };

  const toggleTasksExpanded = (featureId: string) => {
    setExpandedTasks(prev => {
      const set = new Set(prev);
      set.has(featureId) ? set.delete(featureId) : set.add(featureId);
      return set;
    });
  };

  const toggleColumnCollapsed = (column: string) => {
    setCollapsedColumns(prev => {
      const set = new Set(prev);
      set.has(column) ? set.delete(column) : set.add(column);
      return set;
    });
  };

  const columnConfig: Record<string, { bgClass: string, accent: string; dotColor: string; accentClass: string }> = {
    'Backlog': { bgClass: 'bg-surface-container/50', accent: 'border-outline-variant/40', dotColor: 'bg-outline-variant', accentClass: 'col-accent-backlog' },
    'In Progress': { bgClass: 'bg-warning/10', accent: 'border-warning/40', dotColor: 'bg-warning', accentClass: 'col-accent-inprogress' },
    'Review': { bgClass: 'bg-primary/10', accent: 'border-primary/40', dotColor: 'bg-primary', accentClass: 'col-accent-review' },
    'Done': { bgClass: 'bg-success/10', accent: 'border-success/40', dotColor: 'bg-success', accentClass: 'col-accent-done' },
  };

  const priorityClass: Record<string, string> = {
    Low: 'priority-low', Medium: 'priority-medium', High: 'priority-high', Critical: 'priority-critical'
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col} className="w-[280px] shrink-0 h-64 bg-surface-container rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Board Controls */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
          <input
            type="text"
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant/10 rounded-lg text-xs placeholder:text-on-surface-variant/40 focus:border-primary/30 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-0.5 bg-surface-container rounded-lg p-0.5">
          {['All', ...PRIORITIES].map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2 py-1 rounded-md text-[0.6875rem] font-medium transition-colors ${
                priorityFilter === p ? 'bg-primary/15 text-primary' : 'text-on-surface-variant/60 hover:text-on-surface-variant'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="text-xs text-on-surface-variant/40 ml-auto">{features.length} features</span>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
          {KANBAN_COLUMNS.map((column) => {
            const config = columnConfig[column];
            const columnFeatures = getColumnFeatures(column);
            const isCollapsed = collapsedColumns.has(column);

            return (
              <div key={column} className={`shrink-0 ${isCollapsed ? 'w-10' : 'w-[280px]'} transition-all duration-200`}>
                {isCollapsed ? (
                  /* Collapsed column */
                  <button
                    onClick={() => toggleColumnCollapsed(column)}
                    className="h-full min-h-[300px] w-10 bg-surface-container rounded-xl border border-outline-variant/10 flex flex-col items-center pt-4 gap-2 hover:border-outline-variant/25 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                    <span className="text-[0.625rem] font-medium text-on-surface-variant writing-mode-vertical" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                      {column}
                    </span>
                    <span className="text-[0.625rem] text-on-surface-variant/50 mt-1">{columnFeatures.length}</span>
                  </button>
                ) : (
                  <>
                    {/* Column Header */}
                    <div className="mb-2">
                      <div className={`h-0.5 rounded-full ${config.accentClass} mb-3`} />
                      <div className="flex items-center justify-between px-1">
                        <button
                          onClick={() => toggleColumnCollapsed(column)}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <div className={`w-2.5 h-2.5 rounded-sm ${config.dotColor}`} />
                          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{column}</h3>
                          <span className="text-[0.625rem] font-medium text-on-surface-variant/40 bg-surface-container-high rounded-full px-1.5 py-0.5">
                            {columnFeatures.length}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setQuickAddColumn(column);
                            setTimeout(() => quickAddRef.current?.focus(), 50);
                          }}
                          className="p-1 rounded-md hover:bg-surface-container-high transition-colors text-on-surface-variant/50 hover:text-on-surface-variant"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Droppable area */}
                    <Droppable droppableId={column}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-2 min-h-[100px] p-1.5 rounded-xl transition-all duration-200 ${
                            snapshot.isDraggingOver
                              ? `bg-primary/10 border border-dashed ${config.accent} animate-column-pulse`
                              : `${config.bgClass} border border-transparent`
                          }`}
                        >
                          {columnFeatures.map((feature, index) => {
                            const tasks = feature.tasks || [];
                            const doneTasks = tasks.filter((t: Task) => t.done).length;
                            const taskProgress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
                            const isExpanded = expandedTasks.has(feature.id);

                            return (
                              <Draggable key={feature.id} draggableId={feature.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`kanban-card bg-surface-container rounded-xl border border-outline-variant/8 ${priorityClass[feature.priority] || ''} ${
                                      snapshot.isDragging ? 'is-dragging shadow-ambient' : ''
                                    }`}
                                  >
                                    {/* Card content */}
                                    <div className="p-3">
                                      {/* Header row: drag handle + ID + actions */}
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <div {...provided.dragHandleProps} className="text-on-surface-variant/25 hover:text-on-surface-variant cursor-grab shrink-0">
                                          <GripVertical size={12} />
                                        </div>
                                        <span className="text-[0.625rem] font-mono text-on-surface-variant/35">
                                          {projectPrefix}-{feature.featureNumber}
                                        </span>
                                        <div className="flex-1" />
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setSelectedFeature(feature); }}
                                          className="p-0.5 rounded text-on-surface-variant/25 hover:text-on-surface-variant transition-colors"
                                        >
                                          <MoreHorizontal size={13} />
                                        </button>
                                      </div>

                                      {/* Title - clickable */}
                                      <button
                                        onClick={() => setSelectedFeature(feature)}
                                        className="text-left w-full"
                                      >
                                        <p className="text-[0.8125rem] font-medium leading-snug hover:text-primary transition-colors">
                                          {feature.title}
                                        </p>
                                      </button>

                                      {/* Labels */}
                                      {feature.labels && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {feature.labels.split(',').map(l => (
                                            <span key={l.trim()} className={`px-1.5 py-px rounded-full text-[0.5625rem] font-medium label-${l.trim().toLowerCase()}`}>
                                              {l.trim()}
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      {/* Bottom row: tasks + due date */}
                                      <div className="flex items-center gap-2 mt-2.5">
                                        {/* Priority dot */}
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                          { Low: 'bg-info', Medium: 'bg-warning', High: 'bg-error', Critical: 'bg-[#ff5555]' }[feature.priority] || 'bg-outline-variant'
                                        }`} />

                                        {/* Task count chip */}
                                        {tasks.length > 0 && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); toggleTasksExpanded(feature.id); }}
                                            className="inline-flex items-center gap-1 text-[0.625rem] text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
                                          >
                                            <CheckCircle2 size={10} />
                                            {doneTasks}/{tasks.length}
                                            <ChevronDown size={9} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                          </button>
                                        )}

                                        <div className="flex-1" />

                                        {/* Due date */}
                                        {feature.dueDate && (
                                          <span className={`inline-flex items-center gap-1 text-[0.625rem] ${
                                            new Date(feature.dueDate) < new Date() ? 'text-error' : 'text-on-surface-variant/50'
                                          }`}>
                                            <Calendar size={9} />
                                            {new Date(feature.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          </span>
                                        )}

                                        {/* Time ago */}
                                        <span className="text-[0.5625rem] text-on-surface-variant/30">
                                          {timeAgo(feature.updatedAt)}
                                        </span>
                                      </div>

                                      {/* Task progress bar */}
                                      {tasks.length > 0 && (
                                        <div className="progress-bar mt-2">
                                          <div className="progress-bar-fill" style={{ width: `${taskProgress}%` }} />
                                        </div>
                                      )}
                                    </div>

                                    {/* Expandable tasks */}
                                    {isExpanded && tasks.length > 0 && (
                                      <div className="px-3 pb-3 pt-0 border-t border-outline-variant/8">
                                        <div className="space-y-0.5 mt-2">
                                          {tasks.map((task: Task) => (
                                            <label key={task.id} className="flex items-center gap-2 py-1 cursor-pointer group">
                                              <button
                                                onClick={(e) => { e.preventDefault(); toggleTask(task.id, !task.done); }}
                                                className={`shrink-0 ${task.done ? 'text-success' : 'text-on-surface-variant/25 hover:text-on-surface-variant/50'}`}
                                              >
                                                {task.done ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                                              </button>
                                              <span className={`text-xs ${task.done ? 'line-through text-on-surface-variant/30' : 'text-on-surface-variant/80'}`}>
                                                {task.title}
                                              </span>
                                            </label>
                                          ))}
                                          {/* Inline add task */}
                                          <div className="flex items-center gap-2 mt-1">
                                            <Plus size={11} className="text-on-surface-variant/20 shrink-0" />
                                            <input
                                              type="text"
                                              value={newTaskInputs[feature.id] || ''}
                                              onChange={(e) => setNewTaskInputs(prev => ({ ...prev, [feature.id]: e.target.value }))}
                                              onKeyDown={(e) => e.key === 'Enter' && addTaskInline(feature.id)}
                                              placeholder="Add task..."
                                              className="flex-1 bg-transparent text-xs outline-none placeholder:text-on-surface-variant/20"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {/* Quick add at bottom */}
                    {quickAddColumn === column ? (
                      <div className="mt-2 p-1.5">
                        <input
                          ref={quickAddRef}
                          type="text"
                          value={quickAddTitle}
                          onChange={(e) => setQuickAddTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') quickAddFeature(column);
                            if (e.key === 'Escape') { setQuickAddColumn(null); setQuickAddTitle(''); }
                          }}
                          onBlur={() => {
                            if (!quickAddTitle.trim()) { setQuickAddColumn(null); setQuickAddTitle(''); }
                          }}
                          placeholder="Feature title... (Enter to create)"
                          className="quick-add-input"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setQuickAddColumn(column);
                          setTimeout(() => quickAddRef.current?.focus(), 50);
                        }}
                        className="w-full mt-2 p-2.5 rounded-xl text-xs text-on-surface-variant/30 hover:text-on-surface-variant/60 hover:bg-surface-container/50 transition-all flex items-center justify-center gap-1.5 border border-dashed border-transparent hover:border-outline-variant/15"
                      >
                        <Plus size={12} /> Add feature
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Feature Detail Side Panel */}
      {selectedFeature && (
        <FeatureDetailPanel
          feature={selectedFeature}
          projectPrefix={projectPrefix}
          onClose={() => setSelectedFeature(null)}
          onUpdate={fetchFeatures}
        />
      )}
    </>
  );
}
