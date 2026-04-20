"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Plus, Search, Building2, Mail, X, Loader2 } from "lucide-react";
import { clientApi } from "@/lib/api";
import { toast } from "sonner";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", company: "", email: "" });

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

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col pt-8 px-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients CRM</h1>
          <p className="text-muted-foreground mt-1">Manage your CRM entities to link with emails.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-10 pr-4 py-3 outline-none transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="group glass-panel rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {client.name.charAt(0)}
                </div>
              </div>
              
              <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{client.name}</h3>
              
              <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  {client.company || "No Company"}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  {client.email || "No Email"}
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredClients.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card/30 rounded-xl border border-dashed border-border">
              No clients found. Add your first client to get started.
            </div>
          )}
        </div>
      )}

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
              className="relative w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Background gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] pointer-events-none" />

              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Add New Client</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddClient} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    placeholder="e.g. Elon Musk"
                    className="w-full bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <input
                    type="text"
                    value={newClient.company}
                    onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                    placeholder="e.g. Tesla"
                    className="w-full bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    placeholder="e.g. elon@tesla.com"
                    className="w-full bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 outline-none transition-all"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-95"
                  >
                    Create Client
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
