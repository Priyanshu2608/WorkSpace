'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

function WireframesContent() {
  const [wireframes, setWireframes] = useState<Wireframe[]>([]);
  const [selected, setSelected] = useState<Wireframe | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const fetchWireframes = async () => {
    const res = await fetch('/api/wireframes');
    const all: Wireframe[] = await res.json();
    setWireframes(all.filter((w) => !w.projectId));
    setLoading(false);
  };

  useEffect(() => { fetchWireframes(); }, []);
  useEffect(() => {
    if (searchParams.get('new') === 'true') setShowCreate(true);
  }, [searchParams]);

  const create = async () => {
    if (!newName.trim()) return;
    const res = await fetch('/api/wireframes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
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
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              ← Back to Gallery
            </button>
            <h2 className="text-lg font-semibold font-[family-name:var(--font-family-display)]">{selected.name}</h2>
          </div>
        </div>
        <div className="h-[calc(100vh-140px)] min-h-[600px] rounded-xl overflow-hidden border border-outline-variant/10 relative z-10">
          <ExcalidrawWrapper initialData={selected.data} onSave={saveWireframe} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-family-display)]">Wireframes</h1>
          <p className="text-on-surface-variant text-sm mt-1">Standalone Excalidraw boards</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-gradient px-5 py-2.5 rounded-2xl text-[0.9375rem] font-bold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus size={18} /> New Board
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-container rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : wireframes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wireframes.map((wf, idx) => (
            <div
              key={wf.id}
              className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10 hover:border-primary/30 hover:shadow-md transition-all duration-300 group cursor-pointer animate-fade-in shadow-sm hover:-translate-y-1"
              style={{ animationDelay: `${idx * 60}ms` }}
              onClick={() => setSelected(wf)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary-container/20 text-primary">
                  <Pencil size={16} />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDelete(wf.id); }}
                  className="p-1.5 rounded text-on-surface-variant/30 opacity-0 group-hover:opacity-100 hover:text-error transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{wf.name}</h3>
              <p className="text-[0.625rem] text-on-surface-variant mt-1.5">
                Last edited {new Date(wf.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl p-16 text-center border border-dashed border-outline-variant/30 shadow-sm mt-8">
          <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mx-auto mb-5 border border-outline-variant/10">
            <Pencil size={32} className="text-primary/60" />
          </div>
          <p className="text-on-surface text-lg font-bold font-family-display mt-4">No wireframes yet</p>
          <p className="text-on-surface-variant text-sm mt-2 max-w-sm mx-auto">Start sketching your ideas by creating your first board.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-8 btn-gradient px-6 py-2.5 rounded-2xl text-[0.9375rem] font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
          >
            <Plus size={18} /> Create your first board
          </button>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Wireframe" size="sm">
        <div className="space-y-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="Board name"
            className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl text-sm font-medium focus:border-primary/40 focus:outline-none"
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/10">
            <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-[0.9375rem] font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-2xl transition-colors">Cancel</button>
            <button onClick={create} disabled={!newName.trim()} className="btn-gradient px-6 py-2.5 rounded-2xl text-[0.9375rem] font-bold disabled:opacity-50 shadow-md hover:shadow-lg transition-all">Create</button>
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

export default function WireframesPage() {
  return (
    <Suspense fallback={<div className="animate-pulse"><div className="h-8 bg-surface-container rounded-lg w-48" /></div>}>
      <WireframesContent />
    </Suspense>
  );
}
