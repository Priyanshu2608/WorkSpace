export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  githubUrl: string | null;
  tags: string | null;
  startDate: string | null;
  targetDate: string | null;
  features?: Feature[];
  notes?: Note[];
  wireframes?: Wireframe[];
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  labels: string | null;
  order: number;
  featureNumber: number;
  dueDate: string | null;
  tasks?: Task[];
  projectId: string;
  project?: Project;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: string;
  dueDate: string | null;
  featureId: string;
  feature?: Feature;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  template: string | null;
  projectId: string | null;
  project?: Project | null;
  createdAt: string;
  updatedAt: string;
}

export interface Wireframe {
  id: string;
  name: string;
  data: string;
  projectId: string | null;
  project?: Project | null;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

export type KanbanColumn = 'Backlog' | 'In Progress' | 'Review' | 'Done';
export const KANBAN_COLUMNS: KanbanColumn[] = ['Backlog', 'In Progress', 'Review', 'Done'];
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
export type ProjectStatus = 'Planning' | 'In Progress' | 'Done';
export const PROJECT_STATUSES: ProjectStatus[] = ['Planning', 'In Progress', 'Done'];

export const FEATURE_LABELS = [
  'Bug', 'Enhancement', 'Documentation', 'Design', 'Refactor',
  'Performance', 'Security', 'Testing', 'DevOps', 'UX'
];

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(date).toLocaleDateString();
}
