'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Wireframe } from '@/types';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useToast } from '@/components/shared/Toast';
import dynamic from 'next/dynamic';

const ExcalidrawWrapper = dynamic(() => import('@/components/wireframes/ExcalidrawEditor'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-on-surface-variant">Loading editor...</div>,
});

interface ProjectWireframesProps {
  projectId: string;
}

export default function ProjectWireframes({ projectId }: ProjectWireframesProps) {
  const [wireframes, setWireframes] = useState<Wireframe[]>([]);
  const [selected, setSelected] = useState<Wireframe | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const { addToast } = useToast();

  const fetchWireframes = async () => {
    const res = await fetch(`/api/wireframes`);
    const all: Wireframe[] = await res.json();
    setWireframes(all.filter((w) => w.projectId === projectId));
  };

  useEffect(() => { fetchWireframes(); }, [projectId]);

  const create = async () => {
    if (!newName.trim()) return;
    const res = await fetch('/api/wireframes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, projectId }),
    });
    const wf = await res.json();
    setWireframes((prev) => [wf, ...prev]);
    setNewName('');
    setShowCreate(false);
    setSelected(wf);
    addToast('Wireframe created');
  };

  const saveWireframe = async (data: string) => {
    if (!selected) return;
    setWireframes((prev) => prev.map((w) => w.id === selected.id ? { ...w, data } : w));
    setSelected((prev) => prev ? { ...prev, data } : null);
    await fetch(`/api/wireframes/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
  };

  const deleteWireframe = async (id: string) => {
    await fetch(`/api/wireframes/${id}`, { method: 'DELETE' });
    setWireframes((prev) => prev.filter((w) => w.id !== id));
    if (selected?.id === id) setSelected(null);
    addToast('Wireframe deleted');
  };

  if (selected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              ← Back
            </button>
            <h3 className="text-sm font-semibold">{selected.name}</h3>
          </div>
        </div>
        <div className="h-[calc(100vh-240px)] min-h-[600px] rounded-xl overflow-hidden border border-outline-variant/10 relative z-10">
          <ExcalidrawWrapper
            initialData={selected.data}
            onSave={saveWireframe}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowCreate(true)}
        className="px-4 py-2 rounded-xl text-sm font-medium border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all flex items-center gap-2"
      >
        <Plus size={14} /> New Board
      </button>

      {wireframes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {wireframes.map((wf) => (
            <div
              key={wf.id}
              className="bg-surface-container rounded-xl p-4 border border-outline-variant/10 hover:border-primary/30 transition-all group cursor-pointer"
              onClick={() => setSelected(wf)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Pencil size={14} className="text-primary" />
                  <h4 className="text-sm font-medium">{wf.name}</h4>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDelete(wf.id); }}
                  className="p-1 rounded text-on-surface-variant/30 opacity-0 group-hover:opacity-100 hover:text-error transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-[0.625rem] text-on-surface-variant">
                Last edited {new Date(wf.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container rounded-xl p-8 text-center border border-outline-variant/10">
          <Pencil size={28} className="mx-auto text-on-surface-variant mb-2" />
          <p className="text-sm text-on-surface-variant">No wireframes yet</p>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Wireframe" size="sm">
        <div className="space-y-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="Board name"
            className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-bright transition-colors">Cancel</button>
            <button onClick={create} disabled={!newName.trim()} className="btn-gradient px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Create</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!showDelete}
        onClose={() => setShowDelete(null)}
        onConfirm={() => showDelete && deleteWireframe(showDelete)}
        title="Delete Wireframe"
        message="Are you sure you want to delete this wireframe?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
