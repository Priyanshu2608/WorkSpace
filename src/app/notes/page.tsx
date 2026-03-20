'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Trash2, Clock, Save, BookOpen, Lightbulb, CalendarDays } from 'lucide-react';
import { Note } from '@/types';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useToast } from '@/components/shared/Toast';
import BlockEditor from '@/components/shared/BlockEditor';

const TEMPLATES = [
  {
    id: 'cornell',
    name: '📚 Cornell Study Notes',
    icon: BookOpen,
    content: `# 📚 Cornell Notes: [Topic]\n\n**Date:** ${new Date().toLocaleDateString()}\n**Course/Subject:** \n\n---\n\n## 🎯 Objectives / Essential Questions\n- What is the main idea?\n\n## 📝 Notes\n*Take detailed notes here during the lecture or reading.*\n- \n- \n\n## 🔑 Cues / Keywords\n*Distill the notes into key terms and questions.*\n- \n- \n\n## 📝 Summary\n*Write a brief summary of the entire session.*`,
  },
  {
    id: 'exam',
    name: '🎓 Exam Prep',
    icon: Search,
    content: `# 🎓 Exam Preparation\n\n**Exam Date:** \n\n## 📌 Core Topics to Cover\n- [ ] Topic 1\n- [ ] Topic 2\n\n## 📖 Key Definitions\n- **Term 1:** Definition\n- **Term 2:** Definition\n\n## ❓ Practice Questions\n1. Question 1?\n   - *Answer*\n2. Question 2?\n   - *Answer*\n\n## ⚠️ Weak Areas to Review\n- `,
  },
  {
    id: 'meeting',
    name: '⏱️ Meeting Minutes',
    icon: Clock,
    content: `# ⏱️ Meeting Minutes\n\n**Date:** ${new Date().toLocaleDateString()}\n**Attendees:** \n\n## 📋 Agenda\n1. \n2. \n\n## 💬 Discussion Notes\n- \n- \n\n## ✅ Action Items\n- [ ] Action 1 (Assigned to: )\n- [ ] Action 2 (Assigned to: )`,
  },
  {
    id: 'brainstorm',
    name: '💡 Project Brainstorming',
    icon: Lightbulb,
    content: `# 💡 Project Idea: \n\n## 🎯 The Problem\nWhat problem are we trying to solve?\n\n## 🌟 The Solution (Pitch)\nHow does this project solve it?\n\n## 👥 Target Audience\n- \n\n## 🛠️ Technical Approach\n- Frontend: \n- Backend: \n\n## 🚀 Immediate Next Steps\n- [ ] \n- [ ] `,
  },
];

function NotesContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const fetchNotes = async () => {
    const res = await fetch('/api/notes');
    const data = await res.json();
    setNotes(data);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, []);
  useEffect(() => {
    if (searchParams.get('new') === 'true') setShowCreate(true);
  }, [searchParams]);

  const saveNote = useCallback(async () => {
    if (!selectedNote) return;
    setSaving(true);
    await fetch(`/api/notes/${selectedNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    setLastSaved(new Date());
  }, [selectedNote, content]);

  useEffect(() => {
    if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    saveTimerRef.current = setInterval(() => {
      if (selectedNote && content !== selectedNote.content) saveNote();
    }, 30000);
    return () => { if (saveTimerRef.current) clearInterval(saveTimerRef.current); };
  }, [selectedNote, content, saveNote]);

  const createNote = async (template?: string) => {
    const tpl = template ? TEMPLATES.find((t) => t.id === template) : null;
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle || (tpl ? tpl.name : 'Untitled Note'),
        content: tpl ? tpl.content : '',
        template: template || null,
      }),
    });
    const note = await res.json();
    setNotes((prev) => [note, ...prev]);
    setSelectedNote(note);
    setContent(note.content);
    setNewTitle('');
    setShowCreate(false);
    addToast('Note created');
  };

  const deleteNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote?.id === id) { setSelectedNote(null); setContent(''); }
    addToast('Note deleted');
  };

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-family-display)]">Personal Notes</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-gradient px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2"
        >
          <Plus size={16} /> New Note
        </button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Note List Panel */}
        <div className="w-72 flex-shrink-0 flex flex-col">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-surface-container rounded-xl animate-pulse" />
              ))
            ) : filtered.length > 0 ? (
              filtered.map((note) => (
                <div
                  key={note.id}
                  className={`group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all ${
                    selectedNote?.id === note.id
                      ? 'bg-primary-container/20 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                  onClick={() => { setSelectedNote(note); setContent(note.content); }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{note.title}</p>
                    <p className="text-[0.625rem] mt-0.5 opacity-60">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDelete(note.id); }}
                    className="p-1 rounded text-on-surface-variant/30 opacity-0 group-hover:opacity-100 hover:text-error transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-4">No notes found</p>
            )}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="flex-1 bg-surface-container rounded-xl border border-outline-variant/10 flex flex-col">
          {selectedNote ? (
            <>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/10">
                <input
                  value={selectedNote.title}
                  onChange={async (e) => {
                    const title = e.target.value;
                    setSelectedNote({ ...selectedNote, title });
                    await fetch(`/api/notes/${selectedNote.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title }),
                    });
                    fetchNotes();
                  }}
                  className="bg-transparent text-lg font-semibold font-[family-name:var(--font-family-display)] focus:outline-none flex-1"
                />
                <div className="flex items-center gap-3 flex-shrink-0">
                  {lastSaved && (
                    <span className="text-[0.625rem] text-on-surface-variant flex items-center gap-1">
                      <Clock size={10} /> {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                  <button
                    onClick={saveNote}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium btn-gradient flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save size={12} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
              <BlockEditor
                initialContent={selectedNote.content}
                onChange={(md) => setContent(md)}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
              Select or create a note to start editing
            </div>
          )}
        </div>
      </div>

      {/* Create Note Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Note">
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-1.5">
              Title
            </label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title"
              className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/15 rounded-xl text-sm focus:border-primary/40 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-on-surface-variant font-medium block mb-2">
              Start from template
            </label>
            <div className="grid grid-cols-1 gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => createNote(tpl.id)}
                  className="flex items-center gap-3 px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all text-left group"
                >
                  <tpl.icon size={18} className="text-primary flex-shrink-0" />
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-bright transition-colors">Cancel</button>
            <button onClick={() => createNote()} className="btn-gradient px-5 py-2 rounded-lg text-sm font-medium">Blank Note</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!showDelete}
        onClose={() => setShowDelete(null)}
        onConfirm={() => showDelete && deleteNote(showDelete)}
        title="Delete Note"
        message="Are you sure you want to delete this note? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="animate-pulse"><div className="h-8 bg-surface-container rounded-lg w-48" /></div>}>
      <NotesContent />
    </Suspense>
  );
}
