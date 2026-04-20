"use client";
import { useState, useEffect, useCallback } from "react";
import EmailList from "../../components/EmailList";
import EmailDetail from "../../components/EmailDetail";
import ComposeModal from "../../components/ComposeModal";
import OnboardingView from "../../components/OnboardingView";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, RefreshCcw, Mail, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { emailApi, authApi } from "@/lib/api";

export default function EmailPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  
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
        data = await emailApi.getEmails();
      }
      setEmails(data || []);
    } catch (error) {
      console.error("Failed to load emails", error);
    } finally {
      setIsLoading(false);
    }
  }, [query, isConnected]);

  useEffect(() => {
    if (isConnected !== null) {
      loadEmails();
    }
  }, [loadEmails, isConnected]);

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

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
            <h2 className="font-semibold text-lg">{query ? 'Search Results' : 'Inbox'}</h2>
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
             <div className="flex flex-col items-center justify-center h-64 opacity-30">
               <Mail className="w-12 h-12 mb-2" />
               <p className="text-sm">Inbox is empty</p>
             </div>
          ) : (
            <EmailList emails={emails} selectedId={selectedEmailId} onSelect={setSelectedEmailId} />
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
            <h3 className="text-lg font-semibold text-foreground/80 mb-1">Your Inbox</h3>
            <p className="text-sm opacity-60 px-8">Select an email from the list to view its contents and link it to your CRM database.</p>
          </div>
        ) : (
          <EmailDetail
            email={selectedEmail}
            onClose={() => setSelectedEmailId(null)}
            onLinkToClient={async (clientId) => {
              try {
                await emailApi.linkToClient(selectedEmailId, clientId);
                await loadEmails();
              } catch (error) {
                console.error("Linking failed:", error);
              }
            }}
          />
        )}
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <ComposeModal onClose={() => setIsComposeOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
