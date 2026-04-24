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

const NOTE_STYLE = "bg-card text-foreground border-border hover:border-primary/30 hover:shadow-md transition-all duration-200";

export default function NotesPage({ isMini = false }: { isMini?: boolean }) {
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
      color: NOTE_STYLE,
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
    <div className={cn("h-full flex flex-col bg-background overflow-hidden relative", isMini ? "px-3 pt-2 pb-10" : "px-8 lg:px-12 pt-6 pb-20")}>
      {!isMini && (
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
      )}

      {isMini && (
        <div className="mb-4">
          <button 
            onClick={addNote}
            className="w-full flex items-center justify-center gap-2 bg-accent/40 text-foreground py-3 rounded-xl font-bold hover:bg-accent transition-all border border-border/50"
          >
            <Plus className="w-4 h-4" />
            Add a note...
          </button>
        </div>
      )}

      <div className={cn("flex-1 w-full mx-auto overflow-y-auto pb-10 custom-scrollbar pr-4 -mr-4", isMini ? "" : "max-w-7xl")}>
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-70">
            <div className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center mb-4">
              <StickyNote className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-bold mb-1">No notes yet</h3>
          </div>
        ) : (
          <div className={cn("grid gap-4 items-start pb-10", isMini ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
            <AnimatePresence>
              {notes.map((note) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={note.id}
                  onClick={() => setEditingNote(note)}
                  whileHover={{ y: -2 }}
                  className={cn(
                    "p-4 rounded-xl border flex flex-col min-h-[140px] transition-all cursor-pointer group",
                    NOTE_STYLE
                  )}
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-base line-clamp-1 flex-1">{note.title || "Untitled"}</h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => deleteNote(note.id, e)}
                        className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium whitespace-pre-wrap line-clamp-4 opacity-80 flex-1">
                    {note.content || "Empty note..."}
                  </p>
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
                "relative z-10 w-full max-w-2xl rounded-[24px] overflow-hidden flex flex-col border shadow-2xl h-[70vh] max-h-[800px]",
                "bg-card text-foreground border-border"
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
