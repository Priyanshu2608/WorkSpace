import { create } from 'zustand';
import { Project, Feature, Task } from '@/types';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  features: Feature[];
  loading: boolean;

  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  fetchFeatures: (projectId: string) => Promise<void>;
  createFeature: (projectId: string, data: Partial<Feature>) => Promise<Feature>;
  updateFeature: (id: string, data: Partial<Feature>) => Promise<void>;
  deleteFeature: (id: string) => Promise<void>;

  createTask: (featureId: string, data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  features: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    const res = await fetch('/api/projects');
    const projects = await res.json();
    set({ projects, loading: false });
  },

  fetchProject: async (id: string) => {
    set({ loading: true });
    const res = await fetch(`/api/projects/${id}`);
    const currentProject = await res.json();
    set({ currentProject, loading: false });
  },

  createProject: async (data) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const project = await res.json();
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  updateProject: async (id, data) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
      currentProject: state.currentProject?.id === id ? updated : state.currentProject,
    }));
  },

  deleteProject: async (id) => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));
  },

  fetchFeatures: async (projectId) => {
    const res = await fetch(`/api/projects/${projectId}/features`);
    const features = await res.json();
    set({ features });
  },

  createFeature: async (projectId, data) => {
    const res = await fetch(`/api/projects/${projectId}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const feature = await res.json();
    set((state) => ({ features: [...state.features, feature] }));
    return feature;
  },

  updateFeature: async (id, data) => {
    const res = await fetch(`/api/features/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    set((state) => ({
      features: state.features.map((f) => (f.id === id ? updated : f)),
    }));
  },

  deleteFeature: async (id) => {
    await fetch(`/api/features/${id}`, { method: 'DELETE' });
    set((state) => ({
      features: state.features.filter((f) => f.id !== id),
    }));
  },

  createTask: async (featureId, data) => {
    const res = await fetch(`/api/features/${featureId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const task = await res.json();
    // Refresh features to get updated tasks
    const feature = get().features.find((f) => f.id === featureId);
    if (feature) {
      await get().fetchFeatures(feature.projectId);
    }
    return task;
  },

  updateTask: async (id, data) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await res.json();
    // We need to refresh features to get updated task state
    const { features, currentProject } = get();
    if (currentProject) {
      await get().fetchFeatures(currentProject.id);
    }
  },

  deleteTask: async (id) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    const { currentProject } = get();
    if (currentProject) {
      await get().fetchFeatures(currentProject.id);
    }
  },
}));
