"use client";
import { motion } from "framer-motion";
import { Mail, Globe, Shield, Zap, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { authApi } from "@/lib/api";

export default function OnboardingView() {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnect = async (provider: 'google' | 'microsoft') => {
    setIsConnecting(provider);
    try {
      if (provider === 'google') {
        const url = await authApi.getGoogleAuthUrl();
        window.location.href = url;
      } else {
        alert("Microsoft 365 integration is coming soon!");
      }
    } catch (error) {
      console.error("Failed to get auth URL", error);
      alert("Failed to connect. Please try again.");
    } finally {
      setIsConnecting(null);
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-6 bg-gradient-to-br from-background to-accent/20 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
      >
        {/* Value Proposition */}
        <div className="space-y-8">
          <div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold w-fit mb-4 border border-primary/20"
            >
              WELCOME TO MAIL CRM
            </motion.div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              Connect your <span className="gradient-text">World</span> of Email.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Transform your inbox into a powerful relationship engine. Link emails to clients, 
              track conversations, and nunca miss a beat.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">Privacy First</h3>
                <p className="text-sm text-muted-foreground">We never read your personal emails. Only business conversations you choose to link are indexed.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">Near-Real-Time Sync</h3>
                <p className="text-sm text-muted-foreground">Background workers keep your CRM data in sync with your provider metadata.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Options */}
        <div className="bg-card border border-border shadow-2xl rounded-3xl p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Mail className="w-32 h-32" />
          </div>

          <div className="relative">
            <h2 className="text-2xl font-bold mb-2">Connect an account</h2>
            <p className="text-sm text-muted-foreground mb-8">Select your provider to begin syncing your mailbox.</p>

            <div className="space-y-3">
              <button
                onClick={() => handleConnect('google')}
                disabled={!!isConnecting}
                className="w-full h-14 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl flex items-center justify-between px-6 transition-all hover:shadow-lg disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                   <svg className="w-6 h-6" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.64 24.55c0-1.65-.15-3.23-.42-4.75H24v9h12.75c-.55 2.86-2.15 5.28-4.57 6.91l7.1 5.5c4.15-3.83 6.56-9.48 6.56-16.66z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.1-5.5c-2.2 1.47-5.02 2.34-8.79 2.34-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span className="font-bold">Google Workspace</span>
                </div>
                {isConnecting === 'google' ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <ArrowRight className="w-5 h-5 text-gray-400" />}
              </button>

              <button
                onClick={() => handleConnect('microsoft')}
                disabled={!!isConnecting}
                className="w-full h-14 bg-[#2F2F2F] hover:bg-black text-white rounded-2xl flex items-center justify-between px-6 transition-all hover:shadow-lg disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  <span className="font-bold">Microsoft 365</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500" />
              </button>

              <div className="pt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span>Private IMAP/SMTP Support coming next month</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
