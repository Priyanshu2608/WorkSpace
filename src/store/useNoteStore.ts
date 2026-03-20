import { create } from 'zustand';
import { Note } from '@/types';

interface NoteStore {
  notes: Note[];
  currentNote: Note | null;
  loading: boolean;

  fetchNotes: (projectId?: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  createNote: (data: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  currentNote: null,
  loading: false,

  fetchNotes: async (projectId?: string) => {
    set({ loading: true });
    const url = projectId ? `/api/notes?projectId=${projectId}` : '/api/notes';
    const res = await fetch(url);
    const notes = await res.json();
    set({ notes, loading: false });
  },

  setCurrentNote: (note) => set({ currentNote: note }),

  createNote: async (data) => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const note = await res.json();
    set((state) => ({ notes: [note, ...state.notes] }));
    return note;
  },

  updateNote: async (id, data) => {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? updated : n)),
      currentNote: state.currentNote?.id === id ? updated : state.currentNote,
    }));
  },

  deleteNote: async (id) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      currentNote: state.currentNote?.id === id ? null : state.currentNote,
    }));
  },
}));
