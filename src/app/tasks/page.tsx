'use client';

import { useEffect, useState } from 'react';
import { 
  CheckSquare, Filter, ChevronDown, Plus, 
  Calendar, AlertCircle, Clock, Trash2, Maximize2 
} from 'lucide-react';
import Badge, { StatusBadge } from '@/components/shared/Badge';
import { useToast } from '@/components/shared/Toast';
import Modal from '@/components/shared/Modal';
import { Project, PRIORITIES } from '@/types';

interface TaskWithContext {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  priority: string;
  feature: {
    id: string;
    title: string;
    status: string;
    priority: string;
    project: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Sorting
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'created'>('deadline');
  
  // New Task Modal
  const [showModal, setShowModal] = useState(false);
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const [form, setForm] = useState({
    title: '',
    featureId: '',
    priority: 'Medium',
    dueDate: '',
  });

  const { addToast } = useToast();

  const fetchTasks = async () => {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  };

  const fetchProjectsData = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjectsData(data);
    if (data.length > 0) {
      setSelectedProjectId(data[0].id);
      if (data[0].features && data[0].features.length > 0) {
        setForm(prev => ({ ...prev, featureId: data[0].features[0].id }));
      }
    }
  };

  useEffect(() => { 
    fetchTasks(); 
    fetchProjectsData();
  }, []);

  // Update feature options when project changes
  useEffect(() => {
    if (selectedProjectId) {
      const proj = projectsData.find(p => p.id === selectedProjectId);
      if (proj && proj.features && proj.features.length > 0) {
        // Only override if the current feature isn't in this project
        const featureExists = proj.features.find(f => f.id === form.featureId);
        if (!featureExists) {
          setForm(prev => ({ ...prev, featureId: proj.features![0].id }));
        }
      } else {
        setForm(prev => ({ ...prev, featureId: '' }));
      }
    }
  }, [selectedProjectId, projectsData]);

  const toggleTask = async (taskId: string, done: boolean) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done } : t)));
    addToast(done ? 'Task completed!' : 'Task reopened');
  };

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== taskId));
    addToast('Task deleted');
  };

  const updateTaskDetails = async (taskId: string, details: Partial<TaskWithContext>) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    const updated = await res.json();
    
    // Update local state with the returned full task to preserve feature/project context
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated, feature: t.feature } : t));
  };

  const createTask = async () => {
    if (!form.title.trim() || !form.featureId) {
      addToast('Please fill all required fields', 'error');
      return;
    }
    
    const res = await fetch(`/api/features/${form.featureId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      }),
    });
    
    if (res.ok) {
      addToast('Task created successfully', 'success');
      setShowModal(false);
      setForm({ ...form, title: '', dueDate: '' });
      fetchTasks(); // Reload to get full context
    }
  };

  const projects = [...new Set(tasks.map((t) => t.feature.project.name))];
  const statuses = [...new Set(tasks.map((t) => t.feature.status))];
  const prioritiesArr = ['Critical', 'High', 'Medium', 'Low'];

  // 1. Filter
  let processedTasks = tasks.filter((t) => {
    if (filterProject && t.feature.project.name !== filterProject) return false;
    if (filterStatus && t.feature.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  // 2. Sort
  processedTasks = processedTasks.sort((a, b) => {
    // Done tasks always go to bottom
    if (a.done !== b.done) return a.done ? 1 : -1;
    
    if (sortBy === 'deadline') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortBy === 'priority') {
      const pMap: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 };
      const valA = pMap[a.priority] || 99;
      const valB = pMap[b.priority] || 99;
      
      if (valA !== valB) return valA - valB;
      // Secondary sort by date
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else {
      // By Created
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const formatDateLabel = (dateStr: string | null) => {
    if (!dateStr) return 'No Date';
    
    const date = new Date(dateStr);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const now = new Date();
    // Check if it's the exact same day
    if (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    ) {
      return `Today, ${timeString}`;
    }

    return `${dateString}, ${timeString}`;
  };

  const isOverdue = (dateStr: string | null, done: boolean) => {
    if (!dateStr || done) return false;
    return new Date(dateStr).getTime() < new Date().getTime();
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

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-family-display flex items-center gap-2">
            <CheckSquare size={24} className="text-primary" /> My Tasks
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {tasks.filter((t) => !t.done).length} open · {tasks.filter((t) => t.done).length} completed
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none flex-1 md:flex-none"
          >
            <option value="deadline">Sort by Deadline</option>
            <option value="priority">Sort by Priority</option>
            <option value="created">Sort by Newest</option>
          </select>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl transition-all ${
              showFilters || filterProject || filterStatus || filterPriority
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'bg-surface-container border border-outline-variant/15 text-on-surface-variant hover:bg-surface-bright'
            }`}
          >
            <Filter size={16} />
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Filters Area */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-surface-container rounded-xl border border-outline-variant/10 animate-scale-in origin-top">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/15 rounded-lg text-sm focus:border-primary/40 focus:outline-none min-w-[140px]"
          >
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/15 rounded-lg text-sm focus:border-primary/40 focus:outline-none min-w-[140px]"
          >
            <option value="">All Feature Status</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/15 rounded-lg text-sm focus:border-primary/40 focus:outline-none min-w-[140px]"
          >
            <option value="">All Priorities</option>
            {prioritiesArr.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {(filterProject || filterStatus || filterPriority) && (
            <button
              onClick={() => { setFilterProject(''); setFilterStatus(''); setFilterPriority(''); }}
              className="text-xs text-primary font-medium hover:underline self-center ml-2"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      ) : processedTasks.length > 0 ? (
        <div className="space-y-3">
          {processedTasks.map((task, idx) => {
            const overdue = isOverdue(task.dueDate, task.done);
            const pColor = getPriorityColor(task.priority);
            const pText = getPriorityTextColor(task.priority);
            
            return (
              <div
                key={task.id}
                className={`group flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 bg-surface-container rounded-xl border transition-all animate-fade-in ${
                  task.done 
                    ? 'border-outline-variant/10 opacity-70 bg-opacity-50' 
                    : overdue 
                      ? 'border-error/30 shadow-[0_0_15px_rgba(255,180,171,0.05)]' 
                      : 'border-outline-variant/15 hover:border-primary/30 hover:shadow-ambient'
                }`}
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                {/* Visual Priority Line */}
                <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${pColor} ${task.done ? 'opacity-30' : 'opacity-100'}`} />

                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0 pl-1">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(e) => toggleTask(task.id, e.target.checked)}
                    className="w-5 h-5 mt-0.5 sm:mt-0 rounded-md border-2 border-outline-variant focus:ring-primary accent-primary flex-shrink-0 cursor-pointer transition-all"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-[0.9375rem] font-medium transition-all ${
                      task.done ? 'line-through text-on-surface-variant' : 'text-on-surface'
                    }`}>
                      {task.title}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                      <span className="text-[0.6875rem] text-on-surface-variant font-medium bg-surface-container-high px-1.5 py-0.5 rounded">
                        {task.feature.project.name}
                      </span>
                      <span className="text-[0.6875rem] text-on-surface-variant/70 border-l border-outline-variant/20 pl-2">
                        {task.feature.title}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pl-9 sm:pl-0 flex-shrink-0">
                  {/* Inline Priority selector */}
                  <div className="relative group/priority">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${pText} px-2 py-1 rounded bg-surface-container-high cursor-pointer hover:bg-surface-bright transition-colors`}>
                      {task.priority === 'Critical' ? <AlertCircle size={12} /> : <div className={`w-1.5 h-1.5 rounded-full ${pColor}`} />}
                      {task.priority}
                    </div>
                     {/* Hidden select that spans the div for quick changing */}
                     <select 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      value={task.priority}
                      onChange={(e) => updateTaskDetails(task.id, { priority: e.target.value })}
                      disabled={task.done}
                    >
                      {prioritiesArr.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Inline Deadline Editor */}
                  <div className="relative">
                    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-surface-container-high cursor-pointer hover:bg-surface-bright transition-colors ${
                      overdue ? 'text-error font-medium' : task.done ? 'text-on-surface-variant' : 'text-on-surface-variant hover:text-on-surface'
                    }`}>
                      <Calendar size={12} />
                      {formatDateLabel(task.dueDate)}
                    </div>
                    {/* Hidden input for editing */}
                    <input 
                      type="datetime-local" 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      value={task.dueDate ? new Date(new Date(task.dueDate).getTime() - new Date(task.dueDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => updateTaskDetails(task.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      disabled={task.done}
                    />
                  </div>
                  
                  {/* Delete Action */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded-lg text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-colors sm:opacity-0 group-hover:opacity-100 focus:opacity-100 ml-auto"
                    title="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface-container rounded-xl p-16 text-center border border-outline-variant/10 shadow-ambient">
          <div className="w-16 h-16 bg-surface-container-high rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckSquare size={32} className="text-on-surface-variant/60" />
          </div>
          <p className="text-on-surface-variant text-base font-medium">
            {tasks.length === 0 ? 'You\'re all caught up!' : 'No tasks match your filters'}
          </p>
          <p className="text-on-surface-variant/50 text-sm mt-1 max-w-xs mx-auto">
            {tasks.length === 0 ? 'Enjoy your empty to-do list, or create a new task to get started.' : 'Try clearing your filters to see more tasks.'}
          </p>
          {tasks.length === 0 && (
             <button
              onClick={() => setShowModal(true)}
              className="mt-6 px-5 py-2.5 rounded-xl text-sm font-medium bg-surface-container-high hover:bg-surface-bright transition-all border border-outline-variant/10 inline-flex items-center gap-2"
             >
               <Plus size={16} /> Create Task
             </button>
          )}
        </div>
      )}

      {/* New Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Task" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
              >
                {prioritiesArr.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5">
                Deadline
              </label>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-outline-variant/10">
            <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-3">
              Attach to Feature *
            </label>
            
            {projectsData.length === 0 ? (
               <div className="p-3 bg-error-container/10 border border-error/20 rounded-lg text-sm text-error flex items-center gap-2">
                 <AlertCircle size={14} /> You need to create a project and feature first.
               </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-lg text-sm focus:border-primary/40 focus:outline-none"
                  >
                    {projectsData.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  
                  <select
                    value={form.featureId}
                    onChange={(e) => setForm({ ...form, featureId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-lg text-sm focus:border-primary/40 focus:outline-none disabled:opacity-50"
                    disabled={!selectedProjectId}
                  >
                    {selectedProjectId ? 
                      (projectsData.find(p => p.id === selectedProjectId)?.features || []).map(f => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                      )) : 
                      <option value="">Select a project first...</option>
                    }
                  </select>
                </div>
            )}
            
            {selectedProjectId && (projectsData.find(p => p.id === selectedProjectId)?.features || []).length === 0 && (
               <p className="text-xs text-error mt-2">This project has no features. Add a feature first.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-outline-variant/10">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-bright transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createTask}
              disabled={!form.title.trim() || !form.featureId}
              className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              Create Task
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
