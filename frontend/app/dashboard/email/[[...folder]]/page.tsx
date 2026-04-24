"use client";
import { useState, useEffect, useCallback } from "react";
import EmailList from "@/app/components/EmailList";
import EmailDetail from "@/app/components/EmailDetail";
import ComposeModal from "@/app/components/ComposeModal";
import OnboardingView from "@/app/components/OnboardingView";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, RefreshCcw, Mail, Loader2 } from "lucide-react";
import { useSearchParams, useParams } from "next/navigation";
import { emailApi, authApi } from "@/lib/api";

export default function EmailPage() {
  const params = useParams();
  const folderArr = params?.folder as string[];
  const folder = folderArr?.[0] || "inbox";
  
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [composeData, setComposeData] = useState<{ to?: string; subject?: string; body?: string, draftId?: string }>({});
  const [autoSyncAttempted, setAutoSyncAttempted] = useState(false);
  
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  // Check if any accounts are connected
  useEffect(() => {
    authApi.getConnectionStatus()
      .then(res => {
        setIsConnected(res.isConnected);
      })
      .catch(err => {
        console.error("Auth status check failed", err);
        setIsConnected(false);
      });
  }, []);

  const loadEmails = useCallback(async () => {
    if (isConnected === false) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      let data;
      if (query) {
        data = await emailApi.searchEmails(query);
      } else {
        data = await emailApi.getEmails(folder);
      }
      setEmails(data || []);
    } catch (error) {
      console.error("Failed to load emails", error);
    } finally {
      setIsLoading(false);
    }
  }, [query, isConnected, folder]);

  useEffect(() => {
    if (isConnected !== null) {
      loadEmails();
    }
  }, [loadEmails, isConnected]);

  // Auto-sync on first load if empty
  useEffect(() => {
    if (isConnected === true && emails.length === 0 && !isSyncing && !isLoading && !autoSyncAttempted && !query) {
      setAutoSyncAttempted(true);
      handleSync();
    }
  }, [isConnected, emails.length, isSyncing, isLoading, autoSyncAttempted, query]);

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  useEffect(() => {
    if (selectedEmail && selectedEmail.labels?.includes('DRAFT')) {
      setComposeData({
        to: selectedEmail.recipients?.to?.[0] || "",
        subject: selectedEmail.subject,
        body: selectedEmail.body_plain || selectedEmail.snippet,
        draftId: selectedEmail.provider_message_id
      });
      setIsComposeOpen(true);
      setSelectedEmailId(null); // Reset selection so draft can be re-opened if closed
    }
  }, [selectedEmailId, selectedEmail]);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await emailApi.syncEmails();
      await loadEmails();
    } catch (error) {
       console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReply = (email: any) => {
    setComposeData({
      to: email.sender,
      subject: `Re: ${email.subject}`,
      body: `\n\nOn ${new Date(email.timestamp).toLocaleString()}, ${email.sender} wrote:\n> ${email.snippet}`
    });
    setIsComposeOpen(true);
  };

  const handleForward = (email: any) => {
    setComposeData({
      to: "",
      subject: `Fwd: ${email.subject}`,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${email.sender}\nDate: ${new Date(email.timestamp).toLocaleString()}\nSubject: ${email.subject}\n\n${email.snippet}`
    });
    setIsComposeOpen(true);
  };

  // 1. Loading State (Initial)
  if (isConnected === null) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  // 2. Onboarding State (No accounts connected)
  if (isConnected === false) {
    return <OnboardingView />;
  }

  // 3. Main Dashboard State
  return (
    <div className="h-full flex relative overflow-hidden">
      {/* Left List Pane */}
      <div className={`flex flex-col h-full bg-card/30 border-r border-border backdrop-blur-md transition-all duration-300 ${selectedEmailId ? 'w-full md:w-[400px] lg:w-[450px] hidden md:flex' : 'w-full'}`}>
        <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg capitalize">{query ? 'Search Results' : folder}</h2>
            {query && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20">
                "{query}"
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Sync Inbox"
            >
              <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Compose
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="w-8 h-8 border-primary animate-spin" />
              <p className="text-xs text-muted-foreground animate-pulse">Loading {query ? 'results' : 'inbox'}...</p>
            </div>
          ) : emails.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
               {isSyncing ? (
                 <SyncStatusAnimation />
               ) : (
                 <div className="flex flex-col items-center justify-center opacity-30 text-center">
                   <Mail className="w-12 h-12 mb-2" />
                   <p className="text-sm">
                     {folder === 'sent' ? 'No sent emails' : 
                      folder === 'drafts' ? 'No drafts' :
                      folder === 'starred' ? 'No starred messages' :
                      folder === 'trash' ? 'Trash is empty' :
                      folder === 'all' ? 'No messages' : 'Inbox is empty'}
                   </p>
                   <button 
                     onClick={handleSync}
                     className="mt-4 text-xs font-bold text-primary hover:underline underline-offset-4"
                   >
                     Try syncing again
                   </button>
                 </div>
               )}
             </div>
          ) : (
            <EmailList 
              emails={emails} 
              selectedId={selectedEmailId} 
              onSelect={setSelectedEmailId} 
              onToggleStar={async (id) => {
                try {
                  await emailApi.toggleStar(id);
                  await loadEmails();
                } catch (error) {
                  console.error("Star toggle failed:", error);
                }
              }}
              onDelete={async (id) => {
                const targetEmail = emails.find(e => e.id === id);
                const isPermanent = targetEmail?.labels?.includes('TRASH');
                const confirmMsg = isPermanent 
                  ? "This will permanently delete this email. Continue?" 
                  : "Move this email to trash?";

                if (!confirm(confirmMsg)) return;

                try {
                  await emailApi.deleteEmail(id);
                  if (selectedEmailId === id) setSelectedEmailId(null);
                  await loadEmails();
                } catch (error) {
                  console.error("Deletion failed:", error);
                }
              }}
              onToggleRead={async (id, currentStatus) => {
                try {
                  await emailApi.markReadStatus(id, !currentStatus);
                  await loadEmails();
                } catch (error) {
                  console.error("Read status toggle failed:", error);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className={`flex-1 h-full bg-background overflow-hidden relative ${!selectedEmailId ? 'hidden md:flex flex-col items-center justify-center' : 'block'}`}>
        {!selectedEmailId ? (
          <div className="text-center text-muted-foreground flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mb-6 shadow-inner ring-1 ring-border/50">
              <Mail className="w-10 h-10 opacity-30" />
            </div>
            <h3 className="text-lg font-semibold text-foreground/80 mb-1">
              Your {folder === 'sent' ? 'Sent Messages' : 
                    folder === 'drafts' ? 'Drafts' :
                    folder === 'starred' ? 'Starred Messages' :
                    folder === 'trash' ? 'Trashed Messages' :
                    folder === 'all' ? 'All Mail' : 'Inbox'}
            </h3>
            <p className="text-sm opacity-60 px-8">Select an email from the list to view its contents and link it to your CRM database.</p>
          </div>
        ) : (
          <EmailDetail
            email={selectedEmail}
            onClose={() => setSelectedEmailId(null)}
            onReply={handleReply}
            onForward={handleForward}
            onToggleStar={async () => {
              if (!selectedEmailId) return;
              try {
                await emailApi.toggleStar(selectedEmailId);
                await loadEmails();
              } catch (error) {
                console.error("Star toggle failed:", error);
              }
            }}
            onDelete={async () => {
              if (!selectedEmailId) return;
              const isPermanent = selectedEmail.labels?.includes('TRASH');
              const confirmMsg = isPermanent 
                ? "This will permanently delete this email. Continue?" 
                : "Move this email to trash?";
              
              if (!confirm(confirmMsg)) return;

              try {
                await emailApi.deleteEmail(selectedEmailId);
                setSelectedEmailId(null);
                await loadEmails();
              } catch (error) {
                console.error("Deletion failed:", error);
              }
            }}
            onLinkToClient={async (clientId) => {
              try {
                await emailApi.linkToClient(selectedEmailId, clientId);
                await loadEmails();
              } catch (error) {
                console.error("Linking failed:", error);
              }
            }}
            onUnlinkFromClient={async () => {
              if (!selectedEmailId) return;
              try {
                await emailApi.unlinkFromClient(selectedEmailId);
                await loadEmails();
              } catch (error) {
                console.error("Unlinking failed:", error);
              }
            }}
          />
        )}
      </div>

      {/* Auto-mark as read logic */}
      <EmailReadHandler 
        selectedEmail={selectedEmail} 
        onMarkRead={async (id) => {
          await emailApi.markReadStatus(id, true);
          loadEmails();
        }} 
      />

      {/* Compose Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <ComposeModal 
            onClose={() => {
              setIsComposeOpen(false);
              setComposeData({});
            }} 
            initialTo={composeData.to}
            initialSubject={composeData.subject}
            initialBody={composeData.body}
            initialDraftId={composeData.draftId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SyncStatusAnimation() {
  const [msgIndex, setMsgIndex] = useState(0);
  const messages = [
    "Linking your Google account...",
    "Syncing your latest emails...",
    "Organizing your inbox...",
    "Almost there, finalizing data...",
    "We are live to go! Preparing dashboard..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center max-w-sm mx-auto">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="relative w-28 h-28 bg-card border border-border rounded-[40px] flex items-center justify-center shadow-2xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent group-hover:from-primary/10 transition-colors" />
          <RefreshCcw className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>
      
      <div className="h-20 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={msgIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-3"
          >
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground/90 leading-tight">
              {messages[msgIndex]}
            </h3>
            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary/40"
                  />
                ))}
              </div>
              <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                Processing Data
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmailReadHandler({ selectedEmail, onMarkRead }: { selectedEmail: any, onMarkRead: (id: string) => void }) {
  useEffect(() => {
    if (selectedEmail && !selectedEmail.is_read) {
      onMarkRead(selectedEmail.id);
    }
  }, [selectedEmail, onMarkRead]);
  return null;
}
