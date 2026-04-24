"use client";
import Link from "next/link";
import { Mail, ArrowRight, Zap, Shield, Globe, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    // For MVP testing, you can use a simple passwordless signin
    // or just direct the user to the Supabase login UI.
    // Here we'll use a standard Supabase OAuth trigger if configured.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard/email`,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        }
      }
    });
    if (error) console.error("Login Error:", error.message);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />

      <main className="z-10 text-center max-w-4xl px-4 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center mb-8 gap-3"
        >
          <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30 text-primary">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            NextGen <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Mail CRM</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl"
        >
          A unified, blazing-fast email interface built for professionals. Directly integrated with your Gmail and seamlessly connected to your CRM workflow.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {session ? (
            <Link
              href="/dashboard/email"
              className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-primary-foreground transition-all duration-200 bg-primary border border-transparent rounded-full hover:bg-primary/90 hover:scale-105"
            >
              Enter Dashboard
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <button
              onClick={handleLogin}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-primary-foreground transition-all duration-200 bg-primary border border-transparent rounded-full hover:bg-primary/90 hover:scale-105 shadow-xl shadow-primary/20"
            >
              <LogIn className="mr-2 w-5 h-5" />
              Sign in with Google
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </motion.div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: "Lightning Fast", desc: "Built on Next.js 14 and Express for ultimate speed." },
            { icon: Shield, title: "Secure OAuth", desc: "Directly connect to Gmail using secure Google OAuth 2.0." },
            { icon: Globe, title: "CRM Sync", desc: "Instantly link important emails to CRM entities." }
          ].map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              className="p-8 rounded-3xl bg-card border border-border shadow-lg flex flex-col items-center text-center hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
