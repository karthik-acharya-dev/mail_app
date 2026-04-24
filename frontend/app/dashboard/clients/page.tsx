"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Plus, Search, Building2, Mail, X, Loader2, Trash2, ArrowRight, History, Calendar, ExternalLink } from "lucide-react";
import { clientApi, emailApi } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import EmailDetail from "@/app/components/EmailDetail";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", company: "", email: "" });
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientEmails, setClientEmails] = useState<any[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await clientApi.getClients();
      setClients(data);
    } catch (error) {
      toast.error("Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleLinkToClient = async (clientId: string) => {
    if (!selectedEmail) return;
    try {
      await emailApi.linkToClient(selectedEmail.id, clientId);
      toast.success("Client updated");
      const emails = await clientApi.getClientEmails(selectedClient.id);
      setClientEmails(emails);
    } catch (error) {
      toast.error("Failed to link client");
    }
  };

  const handleUnlinkFromClient = async () => {
    if (!selectedEmail) return;
    try {
      await emailApi.unlinkFromClient(selectedEmail.id);
      toast.success("Unlinked successfully");
      const emails = await clientApi.getClientEmails(selectedClient.id);
      setClientEmails(emails);
      setSelectedEmail(null);
    } catch (error) {
      toast.error("Failed to unlink");
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newClient.name) return toast.error("Name is required");
      await clientApi.createClient(newClient);
      toast.success("Client added successfully");
      setIsModalOpen(false);
      setNewClient({ name: "", company: "", email: "" });
      fetchClients();
    } catch (error) {
      toast.error("Failed to add client");
    }
  };

  const handleDeleteClient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      await clientApi.deleteClient(id);
      toast.success("Client deleted");
      if (selectedClient?.id === id) setSelectedClient(null);
      fetchClients();
    } catch (error) {
      toast.error("Failed to delete client");
    }
  };

  const handleSelectClient = async (client: any) => {
    setSelectedClient(client);
    setLoadingEmails(true);
    try {
      const emails = await clientApi.getClientEmails(client.id);
      setClientEmails(emails);
    } catch (error) {
      toast.error("Failed to fetch client history");
    } finally {
      setLoadingEmails(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col pt-4 px-6 max-w-[1600px] mx-auto w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 uppercase italic leading-none">Clients CRM</h1>
          <p className="text-[11px] text-muted-foreground mt-1 font-bold uppercase tracking-wider opacity-60">Relationship Management Hub</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/10"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Client
        </button>
      </div>

      <div className="flex-1 flex gap-8 min-h-0 pb-10">
        {/* Left Side: Client List */}
        <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-y-auto custom-scrollbar pr-2">
          <div className="relative shrink-0 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by name or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card/40 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all"
            />
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredClients.map((client, i) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSelectClient(client)}
                  className={cn(
                    "group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                    selectedClient?.id === client.id 
                      ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" 
                      : "bg-card border-border hover:border-primary/20 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/20 to-blue-500/20 text-primary flex items-center justify-center font-black text-sm shrink-0">
                      {client.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate leading-tight">{client.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium"><Building2 className="w-3 h-3" /> {client.company || "Personal"}</span>
                        {client.email && <span className="flex items-center gap-1">• {client.email}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleDeleteClient(client.id, e)}
                      className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </motion.div>
              ))}
              
              {filteredClients.length === 0 && (
                <div className="py-20 text-center opacity-50">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-lg">No clients found</p>
                  <p className="text-sm">Start by adding your first business contact.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Client Detail & History */}
        <div className="w-[450px] shrink-0">
          <AnimatePresence mode="wait">
            {selectedClient ? (
              <motion.div
                key={selectedClient.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full glass-panel rounded-[32px] border border-primary/20 p-8 flex flex-col shadow-2xl relative overflow-hidden"
              >
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-[80px] -z-10" />

                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 rounded-[22px] bg-primary text-primary-foreground flex items-center justify-center font-black text-2xl shadow-xl shadow-primary/20 mb-3">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <h2 className="text-xl font-black tracking-tight">{selectedClient.name}</h2>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider opacity-60">{selectedClient.company || "Private Individual"}</p>
                  
                  <div className="flex gap-2 mt-4">
                    <div className="px-3 py-1.5 bg-accent/50 rounded-lg text-[10px] font-bold border border-border flex items-center gap-2">
                       <Mail className="w-3 h-3" />
                       {selectedClient.email || "No email provided"}
                    </div>
                  </div>
                </div>

                  <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 mb-6 uppercase tracking-widest text-[10px] font-black text-muted-foreground">
                    <History className="w-3 h-3" />
                    Linked Communication History
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {loadingEmails ? (
                      <div className="flex items-center justify-center py-10 opacity-50">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : clientEmails.length > 0 ? (
                      clientEmails.map((email, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={email.id}
                          onClick={() => setSelectedEmail(email)}
                          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group cursor-pointer hover:shadow-lg"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-[10px] bg-accent px-2 py-0.5 rounded-full text-muted-foreground font-bold flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {format(new Date(email.timestamp), "MMM dd, yyyy")}
                            </span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="font-bold text-sm truncate pr-4">{email.subject || "(No Subject)"}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{email.snippet}</div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-20 text-center opacity-30 flex flex-col items-center">
                        <Loader2 className="w-8 h-8 mb-4 stroke-1" />
                        <p className="font-bold text-sm">No linked emails yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full border-2 border-dashed border-border rounded-[32px] flex flex-col items-center justify-center text-center p-12 opacity-30">
                <Search className="w-12 h-12 mb-4" />
                <h3 className="font-bold text-lg">Select a client</h3>
                <p className="text-sm">Click on a client to view their detailed information and linked email history.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Email Detail Modal Overlay */}
      <AnimatePresence>
        {selectedEmail && (
          <div className="fixed top-16 right-0 bottom-0 left-0 z-[100] flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmail(null)}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-4xl h-full bg-background shadow-2xl border-l border-border ml-auto"
            >
               <EmailDetail 
                  email={selectedEmail}
                  onClose={() => setSelectedEmail(null)}
                  onLinkToClient={handleLinkToClient}
                  onUnlinkFromClient={handleUnlinkFromClient}
               />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Client Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8 rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter shrink-0">ADD NEW CLIENT</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddClient} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2">FULL NAME</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full bg-accent/20 border-2 border-transparent focus:border-primary/50 rounded-2xl px-6 py-4 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2">COMPANY / ORG</label>
                  <input
                    type="text"
                    value={newClient.company}
                    onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                    placeholder="e.g. Tesla Inc."
                    className="w-full bg-accent/20 border-2 border-transparent focus:border-primary/50 rounded-2xl px-6 py-4 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    placeholder="e.g. john@tesla.com"
                    className="w-full bg-accent/20 border-2 border-transparent focus:border-primary/50 rounded-2xl px-6 py-4 outline-none transition-all font-bold"
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-muted rounded-2xl font-bold hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30"
                  >
                    CREATE CLIENT
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
