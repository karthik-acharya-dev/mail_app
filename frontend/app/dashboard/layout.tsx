"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Mail, Users, Settings, LogOut, Search, Send, FileText, Archive, Star, Trash2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

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

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/40 backdrop-blur-xl flex flex-col z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl text-primary-foreground">
            <Mail className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight gradient-text">Mail CRM</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard/email" 
              ? pathname === "/dashboard/email" || pathname === "/dashboard/email/"
              : pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl w-full hover:bg-destructive/10 text-destructive transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col z-10 relative">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/40 backdrop-blur-xl flex items-center justify-between px-6">
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emails, clients..."
                className="w-full bg-input/50 focus:bg-input border-transparent focus:border-primary/50 text-sm rounded-full pl-10 pr-4 py-2 transition-all outline-none"
              />
            </div>
          </form>
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-background">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
}
