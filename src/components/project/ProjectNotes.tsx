'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Save, Clock } from 'lucide-react';
import { Note } from '@/types';
import { useToast } from '@/components/shared/Toast';

interface ProjectNotesProps {
  projectId: string;
}

export default function ProjectNotes({ projectId }: ProjectNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { addToast } = useToast();

  const fetchNotes = async () => {
    const res = await fetch(`/api/notes?projectId=${projectId}`);
    const data = await res.json();
    setNotes(data);
    if (data.length > 0 && !selectedNote) {
      setSelectedNote(data[0]);
      setContent(data[0].content);
    }
  };

  useEffect(() => { fetchNotes(); }, [projectId]);

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

  // Auto-save every 30 seconds
  useEffect(() => {
    if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    saveTimerRef.current = setInterval(() => {
      if (selectedNote && content !== selectedNote.content) {
        saveNote();
      }
    }, 30000);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [selectedNote, content, saveNote]);

  const createNote = async () => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Note', projectId }),
    });
    const note = await res.json();
    setNotes((prev) => [note, ...prev]);
    setSelectedNote(note);
    setContent(note.content);
    addToast('Note created');
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)]">
      {/* Note List */}
      <div className="w-56 flex-shrink-0 space-y-2">
        <button
          onClick={createNote}
          className="w-full px-3 py-2 rounded-xl text-sm font-medium border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all flex items-center justify-center gap-2"
        >
          <Plus size={14} /> New Note
        </button>
        <div className="space-y-1 overflow-y-auto max-h-[calc(100%-48px)]">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setSelectedNote(note);
                setContent(note.content);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                selectedNote?.id === note.id
                  ? 'bg-primary-container/20 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <p className="font-medium truncate">{note.title}</p>
              <p className="text-[0.625rem] mt-0.5 opacity-60">
                {new Date(note.updatedAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 bg-surface-container rounded-xl border border-outline-variant/10 flex flex-col">
        {selectedNote ? (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
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
              <div className="flex items-center gap-3">
                {lastSaved && (
                  <span className="text-[0.625rem] text-on-surface-variant flex items-center gap-1">
                    <Clock size={10} /> Saved {lastSaved.toLocaleTimeString()}
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
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your notes here..."
              className="flex-1 p-4 bg-transparent text-sm leading-relaxed resize-none focus:outline-none placeholder:text-on-surface-variant/30"
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
            Select or create a note to start editing
          </div>
        )}
      </div>
    </div>
  );
}
