"use client";
import { format } from "date-fns";
import { ArrowLeft, UserPlus, Reply, Forward, Star, MoreVertical, X, Search, Check, Plus, Loader2, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { clientApi } from "@/lib/api";

interface EmailDetailProps {
  email: any;
  onClose: () => void;
  onLinkToClient: (clientId: string) => void;
  onReply?: (email: any) => void;
  onForward?: (email: any) => void;
}

export default function EmailDetail({ email, onClose, onLinkToClient, onReply, onForward }: EmailDetailProps) {
  const [showCRM, setShowCRM] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (showCRM) {
      setIsLoading(true);
      clientApi.getClients()
        .then(setClients)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [showCRM]);

  // Auto-resize iframe based on content
  const handleIframeLoad = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const body = iframeRef.current.contentWindow.document.body;
      const html = iframeRef.current.contentWindow.document.documentElement;
      const height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
      iframeRef.current.style.height = `${height + 50}px`;
    }
  };

  if (!email) return null;

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLink = async (clientId: string) => {
    setLinkingId(clientId);
    try {
      await onLinkToClient(clientId);
      setShowCRM(false);
    } finally {
      setLinkingId(null);
    }
  };

  // Safe HTML content with base styles for the iframe
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #374151;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            font-size: 15px;
          }
          a { color: #2563eb; text-decoration: none; }
          a:hover { text-decoration: underline; }
          img { max-width: 100%; height: auto; }
          blockquote { border-left: 3px solid #e5e7eb; padding-left: 1rem; color: #6b7280; margin: 1rem 0; }
          @media (prefers-color-scheme: dark) {
            body { color: #d1d5db; }
            blockquote { border-left-color: #374151; }
          }
        </style>
      </head>
      <body>
        ${email.body_html || email.snippet || '(No content)'}
      </body>
    </html>
  `;

  return (
    <div className="h-full flex relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col min-w-0"
      >
        {/* Header Actions */}
        <div className="h-16 px-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex bg-accent/50 p-1 rounded-xl">
              <button 
                onClick={() => onReply?.(email)}
                className="px-3 py-1.5 rounded-lg hover:bg-background text-muted-foreground transition-all flex items-center gap-2 text-xs font-medium"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
              <button 
                onClick={() => onForward?.(email)}
                className="px-3 py-1.5 rounded-lg hover:bg-background text-muted-foreground transition-all flex items-center gap-2 text-xs font-medium"
              >
                <Forward className="w-3.5 h-3.5" />
                Forward
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!email.client ? (
              <button
                onClick={() => setShowCRM(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-xs font-bold shadow-lg shadow-primary/20"
              >
                <UserPlus className="w-4 h-4" />
                Link to CRM
              </button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                {email.client.clients?.name || 'Linked to CRM'}
              </div>
            )}
            <div className="h-4 w-[1px] bg-border mx-1" />
            <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
              <Star className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-12 py-10 max-w-5xl mx-auto w-full">
          <h1 className="text-3xl font-extrabold mb-10 tracking-tight text-foreground/90 leading-tight">{email.subject || "(No Subject)"}</h1>
          
          <div className="flex items-start justify-between mb-8 pb-8 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[18px] bg-linear-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                {email.sender?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <div className="font-bold text-[16px] text-foreground/90">{email.sender}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  to me <div className="w-1 h-1 rounded-full bg-border" /> {format(new Date(email.timestamp), "MMM d, h:mm a")}
                </div>
              </div>
            </div>
            {email.has_attachments && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/50 text-muted-foreground text-xs font-medium">
                <Paperclip className="w-3.5 h-3.5" />
                Attachments
              </div>
            )}
          </div>
          
          {/* Option E: Full HTML Rendering via Iframe */}
          <div className="w-full">
            <iframe
              ref={iframeRef}
              srcDoc={srcDoc}
              onLoad={handleIframeLoad}
              className="w-full border-none pointer-events-auto"
              title="Email Body"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
            />
          </div>
          
          <div className="mt-12 pt-8 border-t border-border/50">
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => onReply?.(email)}
                 className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/80 transition-all flex items-center gap-2"
               >
                 <Reply className="w-3.5 h-3.5" />
                 Reply
               </button>
               <button 
                 onClick={() => onForward?.(email)}
                 className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-accent transition-all flex items-center gap-2"
               >
                 <Forward className="w-3.5 h-3.5" />
                 Forward
               </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CRM Side Panel (same as before) */}
      <AnimatePresence>
        {showCRM && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCRM(false)}
              className="absolute inset-0 bg-background/20 backdrop-blur-[2px] z-20"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-2xl z-30 flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-accent/20">
                <h3 className="font-bold text-sm">Link to Client</h3>
                <button onClick={() => setShowCRM(false)} className="p-1.5 rounded-lg hover:bg-background/80 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 border-b border-border">
                <div className="relative group">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary rounded-xl pl-9 pr-4 py-2 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-32 opacity-50">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => handleLink(client.id)}
                      disabled={linkingId !== null}
                      className="w-full text-left p-3 rounded-xl hover:bg-accent transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-sm group-hover:text-primary transition-colors">{client.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{client.company || client.email || 'No organization'}</div>
                      </div>
                      {linkingId === client.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-primary transition-all scale-75 group-hover:scale-100" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">No clients found</p>
                    <button className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1 mx-auto">
                      <Plus className="w-3 h-3" />
                      Create New Client
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
