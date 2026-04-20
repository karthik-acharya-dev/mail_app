"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Send, Paperclip, Loader2 } from "lucide-react";

interface ComposeModalProps {
  onClose: () => void;
}

export default function ComposeModal({ onClose }: ComposeModalProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    // await emailApi.sendEmail({ to, subject, body });
    // Simulate delay
    setTimeout(() => {
      setIsSending(false);
      onClose();
    }, 1500);
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
            
            <button type="button" className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
