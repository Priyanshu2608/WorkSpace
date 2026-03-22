'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  CheckSquare, Filter, ChevronDown, Plus, 
  Calendar, AlertCircle, Clock, Trash2, Maximize2, Zap 
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
  feature?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    project: {
      id: string;
      name: string;
    };
  };
  project?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Sorting & Grouping
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterQuick, setFilterQuick] = useState<'all' | 'due_soon' | 'critical' | 'completed'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'created'>('priority');
  const [groupBy, setGroupBy] = useState<'none' | 'priority' | 'status' | 'project'>('priority');
  
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
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated, feature: t.feature } : t));
  };

  const createTask = async () => {
    if (!form.title.trim()) {
      addToast('Please provide a task title', 'error');
      return;
    }
    const payload: any = {
      title: form.title,
      priority: form.priority,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    };
    if (form.featureId) payload.featureId = form.featureId;
    if (selectedProjectId) payload.projectId = selectedProjectId;

    const res = await fetch(`/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (res.ok) {
      addToast('Task created successfully', 'success');
      setShowModal(false);
      setForm({ ...form, title: '', dueDate: '', featureId: '' });
      setSelectedProjectId('');
      fetchTasks();
    }
  };

  const projects = [...new Set(tasks.map((t) => t.feature?.project.name || t.project?.name).filter(Boolean))];
  const statuses = [...new Set(tasks.map((t) => t.feature?.status).filter(Boolean))];
  const prioritiesArr = ['Critical', 'High', 'Medium', 'Low'];

  // 1. Filter
  let processedTasks = tasks.filter((t) => {
    const projectName = t.feature?.project.name || t.project?.name;
    const status = t.feature?.status || 'No Feature';

    if (filterProject && projectName !== filterProject) return false;
    if (filterStatus && status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    
    if (filterQuick === 'due_soon' && (!t.dueDate || t.done || new Date(t.dueDate).getTime() > Date.now() + 86400000 * 3)) return false;
    if (filterQuick === 'critical' && t.priority !== 'Critical') return false;
    if (filterQuick === 'completed' && !t.done) return false;
    if (filterQuick === 'all' && t.done) return false; // Default 'all' usually hides done
    
    return true;
  });

  // 2. Sort
  processedTasks = processedTasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (sortBy === 'deadline') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortBy === 'priority') {
      const pMap: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 };
      if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // 3. Group
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') return null;
    const groups: Record<string, TaskWithContext[]> = {};
    
    // Pre-seed groups for priority to guarantee order
    if (groupBy === 'priority') {
      prioritiesArr.forEach(p => groups[p] = []);
    }
    
    processedTasks.forEach(t => {
      const projectName = t.feature?.project.name || t.project?.name || 'No Project';
      const status = t.feature?.status || 'No Feature';
      
      const key = groupBy === 'priority' ? t.priority 
               : groupBy === 'status' ? status 
               : projectName;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    
    // Clean empty pre-seeded groups
    Object.keys(groups).forEach(k => { if (groups[k].length === 0) delete groups[k]; });
    return groups;
  }, [processedTasks, groupBy]);

  const formatDateLabel = (dateStr: string | null) => {
    if (!dateStr) return 'No Date';
    const date = new Date(dateStr);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const now = new Date();
    if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()) {
      return `Today, ${timeString}`;
    }
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeString}`;
  };

  const isOverdue = (dateStr: string | null, done: boolean) => {
    if (!dateStr || done) return false;
    return new Date(dateStr).getTime() < new Date().getTime();
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

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-secondary-container';
      case 'High': return 'text-error';
      case 'Medium': return 'text-[#5c4820]'; // on-warning
      case 'Low': return 'text-[#3a7577]';    // dark teal for info
      default: return 'text-on-surface-variant';
    }
  };

  const renderTaskRow = (task: TaskWithContext, idx: number) => {
    const overdue = isOverdue(task.dueDate, task.done);
    const pColor = getPriorityColor(task.priority);
    const pText = getPriorityTextColor(task.priority);
    
    return (
      <div
        key={task.id}
        className={`group flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 bg-surface-container-lowest rounded-2xl border transition-all animate-fade-in ${
          task.done 
            ? 'border-outline-variant/10 opacity-60' 
            : overdue 
              ? 'border-error/30 bg-error/5 shadow-sm' 
              : 'border-outline-variant/20 hover:border-outline-variant/40 hover:shadow-md hover:-translate-y-0.5'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={task.done}
            onChange={(e) => toggleTask(task.id, e.target.checked)}
            className="w-[1.125rem] h-[1.125rem] mt-0.5 sm:mt-0 rounded-md border-2 border-outline-variant focus:ring-primary accent-primary flex-shrink-0 cursor-pointer transition-all"
          />
          
          <div className="flex-1 min-w-0">
            <p className={`text-[0.9375rem] font-medium transition-all ${
              task.done ? 'line-through text-on-surface-variant' : 'text-on-surface group-hover:text-primary'
            }`}>
              {task.title}
            </p>
            
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              {task.feature?.project.name || task.project?.name ? (
                <span className="text-[0.625rem] font-bold uppercase tracking-wider text-on-surface-variant/70 bg-surface-container-high px-1.5 py-0.5 rounded shadow-sm">
                  {task.feature?.project.name || task.project?.name}
                </span>
              ) : (
                <span className="text-[0.625rem] font-bold uppercase tracking-wider text-on-surface-variant/50 border border-outline-variant/20 px-1.5 py-0.5 rounded border-dashed">
                  Global Issue
                </span>
              )}
              {task.feature?.title && (
                <span className="text-[0.6875rem] text-on-surface-variant/70 border-l border-outline-variant/20 pl-2">
                  {task.feature.title}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 pl-8 sm:pl-0 flex-shrink-0">
          {/* Inline Priority */}
          <div className="relative group/priority">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${pText} px-2 py-1 rounded-md bg-surface-container border border-outline-variant/5 cursor-pointer hover:border-outline-variant/20 transition-all`}>
              {task.priority === 'Critical' ? <Zap size={10} className="fill-current" /> : <div className={`w-1.5 h-1.5 rounded-full ${pColor}`} />}
              {task.priority}
            </div>
             <select 
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={task.priority}
              onChange={(e) => updateTaskDetails(task.id, { priority: e.target.value })}
              disabled={task.done}
            >
              {prioritiesArr.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Inline Deadline */}
          <div className="relative">
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md bg-surface-container border border-outline-variant/5 cursor-pointer hover:border-outline-variant/20 transition-all ${
              overdue ? 'text-error' : task.done ? 'text-on-surface-variant/50' : 'text-on-surface-variant hover:text-on-surface'
            }`}>
              <Calendar size={12} />
              {formatDateLabel(task.dueDate)}
            </div>
            <input 
              type="datetime-local" 
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              value={task.dueDate ? new Date(new Date(task.dueDate).getTime() - new Date(task.dueDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
              onChange={(e) => updateTaskDetails(task.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
              disabled={task.done}
            />
          </div>
          
          {/* Delete Action (only shows on hover) */}
          <button
            onClick={() => deleteTask(task.id)}
            className="p-1 text-on-surface-variant/30 hover:text-error transition-colors sm:opacity-0 group-hover:opacity-100 focus:opacity-100 ml-auto"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-family-display flex items-center gap-3 tracking-tight">
            <CheckSquare size={28} className="text-primary" /> My Tasks
          </h1>
          <div className="flex items-center gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
             <button onClick={() => setFilterQuick('all')} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${filterQuick === 'all' ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-outline-variant/10'}`}>
               Active Issues
             </button>
             <button onClick={() => setFilterQuick('due_soon')} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${filterQuick === 'due_soon' ? 'bg-warning/10 text-warning border-warning/20 shadow-sm' : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-outline-variant/10'}`}>
               Due Soon
             </button>
             <button onClick={() => setFilterQuick('critical')} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${filterQuick === 'critical' ? 'bg-error/10 text-error border-error/20 shadow-sm' : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-outline-variant/10'}`}>
               Critical
             </button>
             <button onClick={() => setFilterQuick('completed')} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${filterQuick === 'completed' ? 'bg-success/10 text-success border-success/20 shadow-sm' : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-outline-variant/10'}`}>
               Completed
             </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap bg-surface-container p-1.5 rounded-2xl border border-outline-variant/10 shadow-sm">
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="px-3 py-2 bg-transparent text-sm font-semibold text-on-surface focus:outline-none cursor-pointer hover:bg-surface-container-high rounded-xl transition-colors"
          >
            <option value="none" className="bg-surface-container">No Grouping</option>
            <option value="priority" className="bg-surface-container">Group: Priority</option>
            <option value="status" className="bg-surface-container">Group: Status</option>
            <option value="project" className="bg-surface-container">Group: Project</option>
          </select>
          <div className="w-px h-5 bg-outline-variant/20 mx-1" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-transparent text-sm font-semibold text-on-surface focus:outline-none cursor-pointer hover:bg-surface-container-high rounded-xl transition-colors"
          >
            <option value="deadline" className="bg-surface-container">Sort: Deadline</option>
            <option value="priority" className="bg-surface-container">Sort: Priority</option>
            <option value="created" className="bg-surface-container">Sort: Newest</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl transition-all ${
              showFilters || filterProject || filterStatus || filterPriority
                ? 'bg-primary/20 text-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Filter size={16} />
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient px-4 py-2 rounded-2xl text-[0.9375rem] font-bold inline-flex items-center gap-2 shadow-sm ml-1 hover:shadow-md transition-all duration-300"
          >
            <Plus size={18} /> New Issue
          </button>
        </div>
      </div>

      {/* Advanced Filters Area */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 animate-scale-in origin-top shadow-sm">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 bg-surface-container border border-outline-variant/15 rounded-xl text-sm font-medium focus:border-primary/40 focus:outline-none min-w-[140px]"
          >
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-surface-container border border-outline-variant/15 rounded-xl text-sm font-medium focus:border-primary/40 focus:outline-none min-w-[140px]"
          >
            <option value="">All Feature Status</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-surface-container border border-outline-variant/15 rounded-xl text-sm font-medium focus:border-primary/40 focus:outline-none min-w-[140px]"
          >
            <option value="">All Priorities</option>
            {prioritiesArr.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {(filterProject || filterStatus || filterPriority) && (
            <button
              onClick={() => { setFilterProject(''); setFilterStatus(''); setFilterPriority(''); }}
              className="text-xs text-primary font-bold hover:underline self-center ml-2"
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
            <div key={i} className="h-16 bg-surface-container rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : processedTasks.length > 0 ? (
        groupedTasks ? (
          <div className="space-y-10 animate-fade-in">
             {Object.keys(groupedTasks).map(groupKey => (
               <div key={groupKey} className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface flex items-center gap-3">
                     {groupKey} <span className="text-[0.625rem] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant/10">{groupedTasks[groupKey].length}</span>
                  </h3>
                  <div className="space-y-2">
                     {groupedTasks[groupKey].map((task, idx) => renderTaskRow(task, idx))}
                  </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="space-y-2 animate-fade-in">
            {processedTasks.map((task, idx) => renderTaskRow(task, idx))}
          </div>
        )
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl p-16 text-center border border-dashed border-outline-variant/30 shadow-sm mt-8">
          <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mx-auto mb-5 border border-outline-variant/10">
            <CheckSquare size={32} className="text-primary/60" />
          </div>
          <p className="text-on-surface text-lg font-bold font-family-display">
            {tasks.length === 0 ? 'Inbox Zero 🎉' : 'No tasks found'}
          </p>
          <p className="text-on-surface-variant text-sm mt-2 max-w-sm mx-auto">
            {tasks.length === 0 ? "You've conquered your tasks. Take a break or plan your next move." : 'Adjust your quick filters or search criteria to see more.'}
          </p>
          {tasks.length === 0 && (
             <button
              onClick={() => setShowModal(true)}
              className="mt-8 btn-gradient px-6 py-2.5 rounded-2xl text-[0.9375rem] font-bold shadow-md hover:shadow-lg transition-all"
             >
               Create New Issue
             </button>
          )}
        </div>
      )}

      {/* New Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Issue" size="md">
        <div className="space-y-5">
          <div>
            <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold block mb-2">
              Issue Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be addressed?"
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-xl flex-1 text-sm font-medium focus:border-primary/40 focus:outline-none"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold block mb-2">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-xl text-sm font-medium focus:border-primary/40 focus:outline-none"
              >
                {prioritiesArr.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold block mb-2">
                Deadline
              </label>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-xl text-sm font-medium focus:border-primary/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/10">
            <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold block mb-3">
              Attach to Project or Feature (Optional)
            </label>
            
            {projectsData.length === 0 ? (
               <div className="p-4 bg-surface-container-high rounded-xl text-sm text-on-surface-variant font-medium flex items-center gap-2">
                 <AlertCircle size={16} /> No projects available to attach to
               </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setForm({ ...form, featureId: '' });
                    }}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-xl text-sm font-medium focus:border-primary/40 focus:outline-none"
                  >
                    <option value="">No Project (Global)</option>
                    {projectsData.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  
                  <select
                    value={form.featureId}
                    onChange={(e) => setForm({ ...form, featureId: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-xl text-sm font-medium focus:border-primary/40 focus:outline-none disabled:opacity-50"
                    disabled={!selectedProjectId}
                  >
                    <option value="">No Feature</option>
                    {selectedProjectId && 
                      (projectsData.find(p => p.id === selectedProjectId)?.features || []).map(f => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                      ))
                    }
                  </select>
                </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-outline-variant/10">
            <button
              onClick={() => setShowModal(false)}
              className="px-5 py-2.5 rounded-2xl text-[0.9375rem] font-bold text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createTask}
              disabled={!form.title.trim()}
              className="btn-gradient px-6 py-2.5 rounded-2xl text-[0.9375rem] font-bold disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
            >
              Create Issue
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
