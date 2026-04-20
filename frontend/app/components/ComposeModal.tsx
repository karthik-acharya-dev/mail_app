"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Send, Paperclip, Loader2 } from "lucide-react";
import { emailApi } from "@/lib/api";
import { toast } from "sonner";

interface ComposeModalProps {
  onClose: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

export default function ComposeModal({ 
  onClose, 
  initialTo = "", 
  initialSubject = "", 
  initialBody = "" 
}: ComposeModalProps) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!to || !subject || !body) return;
    
    setIsSending(true);
    try {
      await emailApi.sendEmail({ to, subject, body, attachments });
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
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[500px] bg-card border border-border shadow-2xl rounded-t-xl sm:rounded-xl z-50 overflow-hidden flex flex-col"
        style={{ height: "calc(100vh - 40px)", maxHeight: "600px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border text-sm font-medium">
          New Message
          <button onClick={onClose} className="p-1 rounded hover:bg-background/80 text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Form Body */}
        <form onSubmit={handleSend} className="flex-1 flex flex-col">
          <div className="px-4 py-2 border-b border-border flex items-center">
            <span className="text-muted-foreground text-sm w-12">To</span>
            <input
              autoFocus
              type="email"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50"
              placeholder="recipient@example.com"
            />
          </div>
          
          <div className="px-4 py-2 border-b border-border flex items-center">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-muted-foreground/50"
              placeholder="Subject"
            />
          </div>
          
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 p-4 bg-transparent border-none outline-none text-sm resize-none"
            placeholder="Write your message here..."
          />
          
          {/* Attachments List */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto border-t border-border bg-secondary/5">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 px-2 py-1 bg-background border border-border rounded-md text-[11px] group">
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button 
                    type="button" 
                    onClick={() => removeAttachment(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Footer Actions */}
          <div className="px-4 py-3 border-t border-border bg-secondary/20 flex items-center justify-between">
            <button
              type="submit"
              disabled={isSending || !to}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </button>
            
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
              className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
