'use client';

import { useState, useEffect } from 'react';
import { X, Github, CheckCircle, Key } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [githubToken, setGithubToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (isOpen) {
      fetchUser();
    }
  }, [isOpen]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setHasToken(data.hasGithubToken);
      }
    } catch (e) {
      console.error('Failed to fetch user', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubToken }),
      });
      if (res.ok) {
        setHasToken(true);
        setGithubToken('');
        setMessage({ text: 'Token saved successfully!', type: 'success' });
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save token');
      }
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-surface-dim/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-surface-dim overflow-hidden relative">
        <div className="absolute top-4 right-4">
          <button 
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:bg-surface-dim rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8">
          <h2 className="text-2xl font-extrabold text-on-surface mb-6 flex items-center gap-3">
            <SettingsIcon /> User Settings
          </h2>
          
          <div className="bg-surface-dim rounded-2xl p-6 border border-outline-variant/30">
            <h3 className="font-bold text-on-surface flex items-center gap-2 mb-2">
              <Github size={18} /> GitHub Personal Access Token
            </h3>
            <p className="text-sm text-on-surface-variant mb-4 leading-relaxed font-medium">
              Add your personal access token to fetch extended repository details like branches, PRs, and collaborators without hitting public rate limits.
            </p>
            
            {loading ? (
              <div className="animate-pulse h-10 bg-surface-container-high rounded-xl w-full" />
            ) : (
              <div className="space-y-4">
                {hasToken && (
                  <div className="flex items-center gap-2 text-success font-bold text-sm bg-success/10 px-4 py-2 rounded-xl mb-4 border border-success/20">
                    <CheckCircle size={16} /> Token is currently set
                  </div>
                )}
                
                <div>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder={hasToken ? "Enter a new token to update" : "ghp_xxxxxxxxxxxx"}
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-transparent focus:border-primary focus:outline-none transition-all font-medium text-on-surface shadow-sm"
                  />
                </div>
                
                {message.text && (
                  <div className={`text-sm font-bold text-center p-2 rounded-lg ${message.type === 'error' ? 'text-error bg-error/10' : 'text-success bg-success/10'}`}>
                    {message.text}
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving || !githubToken}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Key size={18} />
                  {saving ? 'Saving...' : (hasToken ? 'Update Token' : 'Save Token')}
                </button>
                
                <p className="text-xs text-on-surface-variant text-center font-medium opacity-80 mt-2">
                  Your token is securely stored and never exposed to the client.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}
