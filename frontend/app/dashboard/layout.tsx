"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Mail, Users, Settings, LogOut, Search, Send, FileText, Archive, Star, Trash2, ShieldAlert, StickyNote, Calendar, X, Plus, Menu, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import CalendarPage from "./calendar/page";
import NotesPage from "./notes/page";

const navItems = [
  { icon: Mail, label: "Inbox", href: "/dashboard/email" },
  { icon: Star, label: "Starred", href: "/dashboard/email/starred" },
  { icon: Archive, label: "All Mail", href: "/dashboard/email/all" },
  { icon: Send, label: "Sent", href: "/dashboard/email/sent" },
  { icon: FileText, label: "Drafts", href: "/dashboard/email/drafts" },
  { icon: ShieldAlert, label: "Spam", href: "/dashboard/email/spam" },
  { icon: Trash2, label: "Trash", href: "/dashboard/email/trash" },
  { icon: Users, label: "Clients", href: "/dashboard/clients" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [mounted, setMounted] = useState(false);
  const [activeRightPanel, setActiveRightPanel] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Determine actual expanded state (either pinned open or temporarily hovered)
  const isExpanded = isSidebarOpen || isHovered;

  useEffect(() => {
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUnreadCount(0);
        return;
      }

      const { count } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .contains('labels', ['INBOX']);
      setUnreadCount(count || 0);
    };
    fetchUnread();
    
    // Subscribe to changes
    const channel = supabase
      .channel('unread-count')
      .on('postgres_changes', { event: '*', table: 'emails' }, fetchUnread)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`${pathname}?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(pathname);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      {/* Top Header (Full Width) */}
      <header className="h-16 border-b border-border bg-card/40 backdrop-blur-xl flex items-center justify-between px-4 z-50 sticky top-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-accent rounded-full transition-colors outline-none"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="flex items-center gap-2 pr-6">
            <div className="bg-primary p-1.5 rounded-lg text-primary-foreground flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <span className="font-black text-lg tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 hidden sm:block">MAIL CRM</span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl px-4">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mail"
              className="w-full bg-accent/30 focus:bg-background focus:ring-1 focus:ring-primary/20 border-transparent focus:border-primary/30 text-sm rounded-xl pl-11 pr-4 py-2.5 transition-all outline-none"
            />
          </div>
        </form>

        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-background hover:scale-105 active:scale-95 transition-all outline-none"
          >
            U
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-[90]" 
                  onClick={() => setShowProfileMenu(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-card border border-border shadow-2xl rounded-3xl p-6 z-[100] overflow-hidden backdrop-blur-2xl ring-1 ring-white/10"
                >
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                      U
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">User Member</span>
                      <span className="text-xs text-muted-foreground truncate">user@example.com</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Link 
                      href="/dashboard/settings" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full text-destructive hover:bg-destructive/10 transition-colors group text-left"
                    >
                      <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar (Below Header) */}
        <aside 
          onMouseEnter={() => !isSidebarOpen && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "h-full border-r border-border bg-card/40 backdrop-blur-xl flex flex-col z-30 transition-all duration-300 ease-in-out select-none",
            isExpanded ? "w-64" : "w-16"
          )}
        >
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === "/dashboard/email"
                ? pathname === "/dashboard/email" || pathname === "/dashboard/email/"
                : pathname === item.href;
              
              const isInbox = item.label === "Inbox";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-r-full transition-all duration-200 group relative",
                    isExpanded ? "px-4 py-2 my-1 h-10 gap-3" : "px-0 py-2 justify-center h-12 w-12 mx-auto",
                    isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  )}
                  title={!isExpanded ? item.label : ""}
                >
                  <div className="relative">
                    <item.icon className={cn("w-5 h-5 min-w-[20px]", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                    {isInbox && unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background ring-1 ring-red-500/20 shadow-sm" />
                    )}
                  </div>
                  {isExpanded && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                      <span className="truncate text-sm">{item.label}</span>
                      {isInbox && unreadCount > 0 && (
                        <span className="text-xs font-bold text-primary ml-2 pr-2">{unreadCount}</span>
                      )}
                    </div>
                  )}
                  {isActive && !isExpanded && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col z-10 relative overflow-hidden">
          <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 overflow-hidden relative">
              {children}
            </div>

            {/* Right Side Panel Content (Gmail style) */}
            {activeRightPanel && (
              <aside className="w-80 border-l border-border bg-card/60 backdrop-blur-xl flex flex-col z-20 animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold capitalize">{activeRightPanel}</h3>
                  <button 
                    onClick={() => setActiveRightPanel(null)}
                    className="p-1 hover:bg-accent rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {activeRightPanel === 'notes' && <div className="p-0 h-full"><NotesMini /></div>}
                  {activeRightPanel === 'calendar' && <div className="p-0 h-full"><CalendarMini /></div>}
                </div>
              </aside>
            )}

            {/* Thin Right Sidebar with Icons (Gmail style) */}
            <aside className="w-14 border-l border-border bg-card/40 backdrop-blur-xl flex flex-col items-center py-4 gap-4 z-40">
              <button 
                onClick={() => setActiveRightPanel(activeRightPanel === 'calendar' ? null : 'calendar')}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200 group relative",
                  activeRightPanel === 'calendar' ? "bg-blue-500/10 text-blue-500 shadow-sm" : "hover:bg-blue-500/5 text-muted-foreground hover:text-blue-500"
                )}
                title="Calendar"
              >
                <Calendar className="w-5 h-5" />
                {activeRightPanel === 'calendar' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-500 rounded-l-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
              </button>
              <button 
                onClick={() => setActiveRightPanel(activeRightPanel === 'notes' ? null : 'notes')}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200 group relative",
                  activeRightPanel === 'notes' ? "bg-amber-500/10 text-amber-500 shadow-sm" : "hover:bg-amber-500/5 text-muted-foreground hover:text-amber-500"
                )}
                title="Keep Notes"
              >
                <StickyNote className="w-5 h-5" />
                {activeRightPanel === 'notes' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-amber-500 rounded-l-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
              </button>
              <div className="w-8 h-px bg-border my-2" />
              <button className="p-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-primary transition-all opacity-50 cursor-not-allowed">
                <Plus className="w-5 h-5" />
              </button>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

// Mini versions of the components for the right sidebar
function CalendarMini() {
  return (
    <div className="h-full overflow-x-hidden p-2">
      <CalendarPage isMini={true} />
    </div>
  );
}

function NotesMini() {
  return (
    <div className="h-full overflow-x-hidden p-2">
      <NotesPage isMini={true} />
    </div>
  );
}
