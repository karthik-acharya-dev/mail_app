"use client";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { User, Tag, Star, Trash2, Mail, MailOpen } from "lucide-react";

interface EmailListProps {
  emails: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleRead: (id: string, currentStatus: boolean) => void;
}

export default function EmailList({ emails, selectedId, onSelect, onToggleStar, onDelete, onToggleRead }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <div className="mb-2 opacity-20">📭</div>
        No emails found.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/30">
      {emails.map((email, i) => {
        const isSelected = email.id === selectedId;
        const isUnread = email.is_read === false;
        
        // Basic parser for sender name
        const senderMatch = email.sender?.match(/^(.*?)\s*<.*>$/);
        const senderName = senderMatch ? senderMatch[1].replace(/"/g, '') : (email.sender || 'Unknown');

        // Filter system labels to only show interesting ones
        const displayLabels = (email.labels || []).filter((l: string) => 
          !['INBOX', 'UNREAD', 'CATEGORY_PERSONAL', 'SENT', 'CHAT'].includes(l)
        );

        return (
          <motion.li
            key={email.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(email.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(email.id);
                }
              }}
              className={cn(
                "w-full text-left p-4 transition-all flex flex-col gap-1 relative overflow-hidden group email-card-hover border-l-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                isSelected ? "bg-accent/50 border-primary" : "border-transparent",
                isUnread && !isSelected ? "bg-primary/5 shadow-inner" : ""
              )}
            >
              {isUnread && (
                <div className="absolute top-0 right-0 p-1 opacity-20">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
              )}
              <div className="flex items-center justify-between w-full mb-0.5">
                <div className="flex items-center gap-2 overflow-hidden">
                  {isUnread && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                  )}
                  <span className={cn(
                    "text-sm truncate",
                    isUnread ? "font-bold text-foreground" : "font-semibold text-muted-foreground"
                  )} title={senderName}>
                    {senderName}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(email.id);
                    }}
                    className={cn(
                      "transition-all ml-1 opacity-0 group-hover:opacity-100",
                      email.labels?.includes('STARRED') ? "opacity-100 text-yellow-500" : "text-muted-foreground/40 hover:text-yellow-500"
                    )}
                  >
                    <Star className={cn("w-3.5 h-3.5", email.labels?.includes('STARRED') && "fill-current")} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(email.id);
                    }}
                    className="transition-all ml-1 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleRead(email.id, !!email.is_read);
                    }}
                    className="transition-all ml-1 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-primary"
                    title={email.is_read ? "Mark as unread" : "Mark as read"}
                  >
                    {email.is_read ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] uppercase font-medium text-muted-foreground/70 whitespace-nowrap ml-2">
                  {formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })}
                </span>
              </div>
              
              <h4 className={cn(
                "text-sm truncate",
                isUnread ? "font-bold text-foreground" : "font-medium text-foreground/80"
              )}>
                {email.subject || '(No Subject)'}
              </h4>
              
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 opacity-80">
                {email.snippet}
              </p>

              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                {/* CRM Client Link Badge */}
                {email.client && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold shadow-sm">
                    <User className="w-2.5 h-2.5" />
                    <span className="uppercase tracking-tight">{email.client.clients?.name || 'Linked Client'}</span>
                  </div>
                )}

                {/* Email Labels/Folders */}
                {displayLabels.map((label: string) => (
                  <div key={label} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-medium border border-border/50">
                    <Tag className="w-2.5 h-2.5 opacity-50" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
