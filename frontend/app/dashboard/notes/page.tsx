"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, StickyNote, Trash2, Edit2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  timestamp: string;
}

const COLORS = [
  "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800/50",
  "bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800/50",
  "bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800/50",
  "bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-100 border-pink-200 dark:border-pink-800/50",
  "bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800/50",
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mailcrm_notes");
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("mailcrm_notes", JSON.stringify(notes));
    }
  }, [notes, mounted]);

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "New Note",
      content: "",
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      timestamp: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
    setEditingNote(newNote);
  };

  const deleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Delete this note?")) {
      setNotes(notes.filter(n => n.id !== id));
      if (editingNote?.id === id) setEditingNote(null);
    }
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates } : n));
    if (editingNote?.id === id) {
      setEditingNote({ ...editingNote, ...updates });
    }
  };

  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col pt-6 pb-20 px-8 lg:px-12 bg-background overflow-hidden relative">
      <div className="flex items-center justify-between mb-8 z-10 w-full max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight pb-1">Notes Space</h1>
          <p className="text-muted-foreground font-medium">Jot down your thoughts, reminders, and client updates right here.</p>
        </div>
        <button 
          onClick={addNote}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Add Note
        </button>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto pb-10 custom-scrollbar pr-4 -mr-4">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-70">
            <div className="w-24 h-24 bg-accent rounded-3xl flex items-center justify-center mb-6">
              <StickyNote className="w-12 h-12 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-bold mb-2">No notes yet</h3>
            <p className="text-muted-foreground w-full max-w-md">Click "Add Note" to create a sticky note. Your notes are saved automatically to your local workspace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start pb-10">
            <AnimatePresence>
              {notes.map((note) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={note.id}
                  onClick={() => setEditingNote(note)}
                  whileHover={{ y: -4 }}
                  className={cn(
                    "p-5 rounded-2xl border shadow-sm cursor-pointer group flex flex-col min-h-[200px] transition-all",
                    note.color
                  )}
                >
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <h3 className="font-bold text-lg line-clamp-1 flex-1">{note.title || "Untitled"}</h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNote(note);
                        }}
                        className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => deleteNote(note.id, e)}
                        className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium whitespace-pre-wrap line-clamp-6 opacity-80 flex-1">
                    {note.content || "Empty note..."}
                  </p>
                  <div className="mt-4 text-[10px] uppercase tracking-wider font-bold opacity-50">
                    {new Date(note.timestamp).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {editingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-md"
              onClick={() => setEditingNote(null)}
            />
            <motion.div
              layoutId={editingNote.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "relative z-10 w-full max-w-2xl rounded-[32px] overflow-hidden flex flex-col border shadow-2xl h-[70vh] max-h-[800px]",
                editingNote.color
              )}
            >
              <div className="px-8 flex items-center justify-between pt-6 pb-2 border-b border-black/10 dark:border-white/10">
                <input 
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => updateNote(editingNote.id, { title: e.target.value })}
                  className="bg-transparent border-none outline-none font-bold text-2xl w-full pr-4 placeholder:text-current/40"
                  placeholder="Note Title"
                />
                <button 
                  onClick={() => setEditingNote(null)}
                  className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <textarea 
                value={editingNote.content}
                onChange={(e) => updateNote(editingNote.id, { content: e.target.value })}
                className="w-full flex-1 bg-transparent border-none outline-none resize-none p-8 text-lg font-medium leading-relaxed placeholder:text-current/30 custom-scrollbar"
                placeholder="Start typing your note here..."
                autoFocus
              />
              <div className="px-8 py-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-sm opacity-60 font-bold">
                <span>Last updated: {new Date(editingNote.timestamp).toLocaleString()}</span>
                <button 
                  onClick={() => deleteNote(editingNote.id)}
                  className="flex items-center gap-2 hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
