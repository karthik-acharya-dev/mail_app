"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Paperclip, Loader2, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { emailApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ComposeModalProps {
  onClose: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  initialDraftId?: string;
}

export default function ComposeModal({ 
  onClose, 
  initialTo = "", 
  initialSubject = "", 
  initialBody = "",
  initialDraftId = ""
}: ComposeModalProps) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftId, setDraftId] = useState(initialDraftId);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveDraft = async () => {
    if (isSending) return;
    setIsSaving(true);
    try {
      const draft = await emailApi.saveDraft({ to, subject, body, draftId });
      setDraftId(draft.provider_message_id);
    } catch (error) {
      console.error("Failed to auto-save draft:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (!to && !subject && !body) return;
    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 2000);
    return () => clearTimeout(timer);
  }, [to, subject, body, draftId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    setIsSending(true);
    try {
      await emailApi.sendEmail({ to, subject, body, attachments, draftId });
      toast.success("Email sent successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to send email. Please check your connection.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/20 backdrop-blur-md z-40"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          width: isExpanded ? "90%" : "550px"
        }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 right-0 h-full bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300",
          isExpanded ? "sm:rounded-l-none" : "sm:rounded-l-[32px]"
        )}
      >
        {/* Modern Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-card/50 backdrop-blur-sm border-b border-border/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground/90">New Message</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={cn("w-2 h-2 rounded-full", isSaving ? "bg-yellow-500 animate-pulse" : "bg-green-500")} />
              <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest leading-none">
                {isSaving ? "Saving Draft..." : "Draft Saved"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-all"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-accent/50 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Form Body */}
        <form onSubmit={handleSend} className="flex-1 flex flex-col bg-background/30 px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center group">
              <span className="text-muted-foreground/60 text-sm font-medium w-12 group-focus-within:text-primary transition-colors">To</span>
              <input
                autoFocus
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[15px] p-2 placeholder:text-muted-foreground/30 font-medium"
                placeholder="recipient@example.com"
              />
            </div>
            
            <div className="h-[1px] bg-border/50 w-full" />
            
            <div className="flex items-center group">
              <span className="text-muted-foreground/60 text-sm font-medium w-12 group-focus-within:text-primary transition-colors">Sub</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[15px] p-2 font-bold placeholder:text-muted-foreground/30 tracking-tight"
                placeholder="What's this about?"
              />
            </div>

            <div className="h-[1px] bg-border/50 w-full mb-2" />
          </div>
          
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 py-4 bg-transparent border-none outline-none text-[16px] leading-relaxed resize-none placeholder:text-muted-foreground/20 font-medium"
            placeholder="Type your brilliant thoughts here..."
          />
          
          {/* Attachments List */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-4 flex flex-wrap gap-2 max-h-40 overflow-y-auto border-t border-border/50"
              >
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 pr-1 pl-3 py-1.5 bg-accent/30 border border-border/50 rounded-xl text-xs font-bold group">
                    <Paperclip className="w-3 h-3 text-primary/60" />
                    <span className="max-w-[150px] truncate text-muted-foreground">{file.name}</span>
                    <button 
                      type="button" 
                      onClick={() => removeAttachment(index)}
                      className="p-1 rounded-lg hover:bg-background text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Footer Toolbar */}
          <div className="pt-6 pb-10 border-t border-border/50 flex items-center justify-between mt-auto">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSending || !to}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {isSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Send
              </button>
              
              <div className="flex items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded-2xl transition-all"
                  title="Attach Files"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={onClose}
              className="p-3.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive rounded-2xl transition-all"
              title="Discard Draft"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
