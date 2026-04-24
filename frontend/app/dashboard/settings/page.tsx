"use client";
import { useState, useEffect } from "react";
import { Mail, Shield, CheckCircle2, AlertCircle, Trash2, LogOut, ExternalLink, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { emailApi, authApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Get provider account from supabase directly or via API
      const { data, error } = await supabase
        .from('provider_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (data) setAccount(data);
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard/settings`,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline'
        }
      }
    });
    if (error) toast.error("Failed to start connection");
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Google account? This will remove all synced emails from this application.")) return;
    
    try {
      await authApi.disconnectAccount();
      toast.success("Disconnected successfully");
      setAccount(null);
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  return (
    <div className="h-full flex flex-col pt-8 pb-20 px-8 lg:px-12 bg-background overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground font-medium">Manage your connected accounts, security, and application preferences.</p>
        </header>

        <section className="space-y-8">
          {/* Account Connection Card */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-accent/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-lg">Connected Accounts</h2>
              </div>
              <button 
                onClick={fetchStatus}
                className="p-2 hover:bg-accent rounded-xl transition-all"
                title="Refresh Status"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
            </div>

            <div className="p-8">
              {loading ? (
                <div className="py-10 flex flex-col items-center justify-center opacity-50">
                  <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                  <p className="font-bold text-sm">Loading your connections...</p>
                </div>
              ) : account ? (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-accent/20 border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center shadow-sm">
                      <img 
                        src="https://www.google.com/favicon.ico" 
                        alt="Google" 
                        className="w-6 h-6"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">Google Workspace</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-extrabold uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          Authenticated
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">{account.email_address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      onClick={handleDisconnect}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-bold text-sm transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Google account linked</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mb-6">Connect your Google account to sync your emails and start managing your CRM.</p>
                  <button 
                    onClick={handleConnect}
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Link Google Account
                  </button>
                </div>
              )}
            </div>

            <div className="px-8 py-4 bg-accent/5 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              Your data is encrypted and synced directly between Google and your private CRM database.
            </div>
          </div>

          {/* Profile Section */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-accent/5 flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg">Personal Profile</h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                  <div className="w-full bg-accent/20 border border-border/50 rounded-xl px-4 py-3 font-medium text-foreground/70">
                    User Member
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                  <div className="w-full bg-accent/20 border border-border/50 rounded-xl px-4 py-3 font-medium text-foreground/70">
                    {user?.email || "Loading..."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
