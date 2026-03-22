'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Trash2, Clock, Save, BookOpen, Lightbulb, CalendarDays, ArrowLeft, MoreVertical, Sparkles } from 'lucide-react';
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

  // ---------- DETAIL VIEW (FULL SCREEN EDITOR) ----------
  if (selectedNote) {
    return (
      <div className="h-[calc(100vh-64px)] -mt-4 -mb-8 flex flex-col animate-fade-in bg-surface rounded-t-2xl border-x border-t border-outline-variant/10 shadow-lg overflow-hidden">
        {/* Sleek Breadcrumb Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-outline-variant/10 bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => {
                saveNote(); // Save before exiting
                setSelectedNote(null);
                fetchNotes(); // Refresh to get updated list
              }}
              className="text-on-surface-variant hover:text-primary flex items-center gap-2 text-sm font-medium transition-colors"
            >
               <ArrowLeft size={16} /> All Notes
            </button>
            <div className="hidden sm:block w-px h-4 bg-outline-variant/20 mx-1" />
            <span className="hidden sm:block text-sm font-medium text-on-surface-variant/60 truncate max-w-[200px]">
              {selectedNote.title || 'Untitled'}
            </span>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            {lastSaved && (
              <span className="hidden md:flex text-xs text-on-surface-variant/70 items-center gap-1.5 mr-2">
                <Clock size={12} /> Last edited {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={saveNote}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button 
               onClick={() => setShowDelete(selectedNote.id)}
               className="p-1.5 text-error/70 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
            >
               <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-surface-container-lowest overflow-y-auto w-full relative">
          <div className="mx-auto w-full max-w-[900px] px-4 sm:px-8 md:px-12 py-12 pb-40">
            
            {/* Inline Title (Notion Style) */}
            <div className="mb-8 pl-[40px] md:pl-[54px] pr-4">
              <textarea
                value={selectedNote.title}
                onChange={async (e) => {
                  const title = e.target.value;
                  setSelectedNote({ ...selectedNote, title });
                  await fetch(`/api/notes/${selectedNote.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title }),
                  });
                }}
                className="bg-transparent text-4xl sm:text-5xl font-bold font-[family-name:var(--font-family-display)] focus:outline-none w-full placeholder:text-on-surface-variant/20 text-on-surface resize-none leading-tight"
                placeholder="Untitled Document"
                rows={1}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                }}
                style={{ overflow: 'hidden' }}
              />
            </div>

            <BlockEditor
              initialContent={selectedNote.content}
              onChange={(md) => setContent(md)}
            />
          </div>
        </div>

        {/* Delete Confirmation for active note */}
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

  // ---------- MASTER VIEW (NOTE GRID) ----------
  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-family-display)]">Personal Notes</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-surface-container border border-outline-variant/15 rounded-full text-sm focus:border-primary/40 focus:outline-none transition-all focus:w-72"
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-gradient px-5 py-2.5 rounded-full text-sm font-medium inline-flex items-center gap-2 shadow-sm hover:shadow-primary/20 transition-all"
          >
            <Plus size={16} /> New Note
          </button>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-surface-container rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 pb-20">
            {filtered.map((note) => {
              const tpl = TEMPLATES.find(t => t.id === note.template) || TEMPLATES[0];
              const Icon = tpl.icon;
              return (
              <div
                key={note.id}
                className="group break-inside-avoid flex flex-col bg-surface-container-lowest hover:bg-surface-container-high rounded-3xl p-6 lg:p-7 cursor-pointer border border-outline-variant/15 hover:border-primary/40 transition-all duration-300 relative shadow-sm hover:shadow-ambient"
                onClick={() => { setSelectedNote(note); setContent(note.content); }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm">
                        <Icon size={14} />
                     </div>
                     <h3 className="font-bold text-lg leading-tight line-clamp-2 text-on-surface group-hover:text-primary transition-colors">{note.title || 'Untitled Note'}</h3>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDelete(note.id); }}
                    className="absolute top-6 right-6 p-2 rounded-full text-on-surface-variant/0 opacity-0 group-hover:opacity-100 bg-surface-container-high hover:bg-error/10 hover:text-error transition-all shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {/* Visual snippet of markdown content stripped of hashes */}
                <p className="text-[0.9375rem] text-on-surface-variant/80 leading-relaxed line-clamp-6 mb-8 whitespace-pre-wrap">
                  {note.content.replace(/#|\*/g, '').trim().substring(0, 300) || 'Empty note...'}
                </p>
                <div className="mt-auto pt-4 border-t border-outline-variant/10 flex items-center justify-between text-xs font-semibold tracking-wide text-on-surface-variant/60">
                  <span className="flex items-center gap-1.5"><Clock size={12}/> {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                     <ArrowLeft size={12} className="text-primary transform rotate-180" />
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant/30">
            <BookOpen size={48} className="mx-auto text-on-surface-variant/30 mb-4" />
            <h3 className="text-lg font-medium text-on-surface">No notes found</h3>
            <p className="text-on-surface-variant mt-2 max-w-sm mx-auto">Create a new note or study template to start capturing your thoughts.</p>
            <button
               onClick={() => setShowCreate(true)}
               className="mt-6 text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
               <Plus size={16}/> Create your first note
            </button>
          </div>
        )}
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
