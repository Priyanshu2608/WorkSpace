'use client';

import { useEffect, useState } from 'react';
import { Github, Star, ExternalLink, GitCommit, AlertCircle, Link as LinkIcon, Search } from 'lucide-react';
import { Project, GitHubRepo, GitHubCommit } from '@/types';
import Badge from '@/components/shared/Badge';
import { useToast } from '@/components/shared/Toast';

interface ProjectGitHubProps {
  project: Project;
  onUpdate: () => void;
}

export default function ProjectGitHub({ project, onUpdate }: ProjectGitHubProps) {
  const [repoInfo, setRepoInfo] = useState<GitHubRepo | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState(false);
  const [url, setUrl] = useState(project.githubUrl || '');
  const { addToast } = useToast();

  const fetchGitHub = async (repoUrl: string) => {
    if (!repoUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/github?repo=${encodeURIComponent(repoUrl)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setRepoInfo(data.info);
        setCommits(data.commits);
      }
    } catch {
      setError('Failed to fetch GitHub data');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (project.githubUrl) fetchGitHub(project.githubUrl);
  }, [project.githubUrl]);

  const saveUrl = async () => {
    await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ githubUrl: url }),
    });
    setEditingUrl(false);
    onUpdate();
    if (url) fetchGitHub(url);
    addToast('GitHub URL updated');
  };

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium flex items-center gap-1.5">
            <Github size={14} /> Repository URL
          </label>
          {!editingUrl && (
            <button
              onClick={() => setEditingUrl(true)}
              className="text-xs text-primary hover:text-primary-fixed transition-colors"
            >
              {project.githubUrl ? 'Change' : 'Add'}
            </button>
          )}
        </div>
        {editingUrl ? (
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/15 rounded-lg text-sm focus:border-primary/40 focus:outline-none"
              autoFocus
            />
            <button onClick={saveUrl} className="btn-gradient px-4 py-2 rounded-lg text-sm font-medium">
              Save
            </button>
            <button onClick={() => setEditingUrl(false)} className="px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-bright transition-colors">
              Cancel
            </button>
          </div>
        ) : project.githubUrl ? (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary-fixed transition-colors flex items-center gap-1.5"
          >
            <LinkIcon size={14} /> {project.githubUrl} <ExternalLink size={12} />
          </a>
        ) : (
          <p className="text-sm text-on-surface-variant">No repository linked</p>
        )}
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="h-32 bg-surface-container rounded-xl animate-pulse" />
          <div className="h-48 bg-surface-container rounded-xl animate-pulse" />
        </div>
      )}

      {error && (
        <div className="bg-error-container/10 border border-error/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-error flex-shrink-0" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {repoInfo && (
        <>
          {/* Repo Info */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold font-[family-name:var(--font-family-display)] flex items-center gap-2">
                  <Github size={20} /> {repoInfo.name}
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">{repoInfo.description || 'No description'}</p>
              </div>
              <a href={repoInfo.html_url} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-on-surface">
                <ExternalLink size={16} />
              </a>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                <Star size={14} className="text-warning" /> {repoInfo.stargazers_count}
              </div>
              {repoInfo.language && (
                <Badge variant="primary">{repoInfo.language}</Badge>
              )}
              <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                <AlertCircle size={14} /> {repoInfo.open_issues_count} issues
              </div>
            </div>
          </div>

          {/* Recent Commits */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-on-surface-variant">
              <GitCommit size={16} /> Recent Commits
            </h3>
            <div className="bg-surface-container rounded-xl border border-outline-variant/10 divide-y divide-outline-variant/10">
              {commits.slice(0, 8).map((commit) => (
                <a
                  key={commit.sha}
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 px-4 py-3 hover:bg-surface-container-high/50 transition-colors group"
                >
                  <code className="text-[0.625rem] text-primary font-mono mt-0.5 flex-shrink-0">
                    {commit.sha.slice(0, 7)}
                  </code>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate group-hover:text-primary transition-colors">
                      {commit.commit.message.split('\n')[0]}
                    </p>
                    <p className="text-[0.625rem] text-on-surface-variant mt-0.5">
                      {commit.commit.author.name} • {new Date(commit.commit.author.date).toLocaleDateString()}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
