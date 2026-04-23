"use client";
import { useState, useEffect } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  color: string;
}

const COLORS = [
  { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", dot: "bg-blue-500" },
  { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20", dot: "bg-purple-500" },
  { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20", dot: "bg-green-500" },
  { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20", dot: "bg-orange-500" },
  { bg: "bg-pink-500/10", text: "text-pink-500", border: "border-pink-500/20", dot: "bg-pink-500" },
];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", time: "12:00", colorIndex: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mailcrm_events");
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load events", e);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("mailcrm_events", JSON.stringify(events));
    }
  }, [events, mounted]);

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: newEvent.time,
      color: JSON.stringify(COLORS[newEvent.colorIndex])
    };

    setEvents([...events, event]);
    setNewEvent({ title: "", time: "12:00", colorIndex: 0 });
    setIsAddModalOpen(false);
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  if (!mounted) return null;

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight pb-1">Calendar</h1>
          <p className="text-muted-foreground font-medium">{format(currentMonth, "MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-4 bg-card border border-border p-1.5 rounded-2xl shadow-sm">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-accent rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 font-bold text-sm bg-accent/50 hover:bg-accent rounded-xl transition-all"
          >
            Today
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-accent rounded-xl transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map(day => (
          <div key={day} className="text-center text-xs uppercase tracking-widest font-extrabold text-muted-foreground/60 py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const interval = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px bg-border/20 border border-border/50 rounded-3xl overflow-hidden shadow-2xl shadow-primary/5">
        {interval.map((d, i) => {
          const isSelected = isSameDay(d, selectedDate);
          const isToday = isSameDay(d, new Date());
          const isCurrentMonth = isSameMonth(d, monthStart);
          const dayEvents = events.filter(e => e.date === format(d, "yyyy-MM-dd"));

          return (
            <div
              key={i}
              onClick={() => onDateClick(d)}
              className={cn(
                "min-h-[120px] p-3 bg-card transition-all cursor-pointer relative group",
                !isCurrentMonth ? "bg-accent/5 opacity-40" : "",
                isSelected ? "ring-2 ring-primary ring-inset z-10" : "hover:bg-accent/30"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold transition-all",
                  isToday ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : isSelected ? "text-primary" : "text-foreground/70"
                )}>
                  {format(d, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground/40 group-hover:text-primary transition-colors">
                    {dayEvents.length} {dayEvents.length === 1 ? 'Event' : 'Events'}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => {
                  const colors = JSON.parse(event.color);
                  return (
                    <div 
                      key={event.id}
                      className={cn("text-[10px] font-bold px-2 py-1 rounded-lg truncate border", colors.bg, colors.text, colors.border)}
                    >
                      {event.time} {event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] font-bold text-muted-foreground pl-1">
                    + {dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEventList = () => {
    const selectedEvents = events.filter(e => e.date === format(selectedDate, "yyyy-MM-dd"));
    
    return (
      <div className="w-full lg:w-80 flex flex-col pt-4 lg:pt-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight">
            {isSameDay(selectedDate, new Date()) ? "Today's" : format(selectedDate, "MMM d")}
          </h2>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all shadow-sm"
            title="Add Event"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {selectedEvents.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center opacity-40">
              <CalendarIcon className="w-8 h-8 mb-3" />
              <p className="text-sm font-bold">No events scheduled</p>
            </div>
          ) : (
            selectedEvents.sort((a, b) => a.time.localeCompare(b.time)).map(event => {
              const colors = JSON.parse(event.color);
              return (
                <div 
                  key={event.id}
                  className={cn("p-4 rounded-2xl border transition-all hover:scale-[1.02] relative group", colors.bg, colors.border)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-2 h-2 rounded-full", colors.dot)} />
                    <span className={cn("text-[10px] font-extrabold uppercase tracking-widest", colors.text)}>
                      {event.time}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground leading-tight">{event.title}</h3>
                  <button 
                    onClick={() => deleteEvent(event.id)}
                    className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col pt-6 pb-20 px-8 lg:px-12 bg-background overflow-hidden">
      <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col lg:flex-row gap-12">
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {renderHeader()}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {renderDays()}
            {renderCells()}
          </div>
        </div>
        {renderEventList()}
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-md"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-md bg-card border border-border shadow-2xl rounded-[32px] overflow-hidden p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Add Event</h2>
                  <p className="text-sm font-medium text-muted-foreground">{format(selectedDate, "EEEE, MMMM d")}</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-accent transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground ml-1">Event Title</label>
                  <input 
                    autoFocus
                    type="text"
                    required
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="E.g. Project Meeting"
                    className="w-full bg-accent/30 border-transparent focus:border-primary/50 rounded-2xl px-5 py-3.5 outline-none font-bold placeholder:text-muted-foreground/30 transition-all text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground ml-1">Time</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input 
                        type="time"
                        required
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        className="w-full bg-accent/30 border-transparent focus:border-primary/50 rounded-2xl pl-12 pr-4 py-3.5 outline-none font-bold transition-all text-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground ml-1">Label Color</label>
                    <div className="flex items-center justify-between bg-accent/30 rounded-2xl px-4 py-3.5 h-[58px]">
                      {COLORS.map((color, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewEvent({...newEvent, colorIndex: i})}
                          className={cn(
                            "w-6 h-6 rounded-full transition-all ring-offset-background",
                            color.dot,
                            newEvent.colorIndex === i ? "ring-2 ring-primary ring-offset-4 scale-110" : "hover:scale-125"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 mt-4"
                >
                  Create Event
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
