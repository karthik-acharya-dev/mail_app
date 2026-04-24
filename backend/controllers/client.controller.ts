import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';

export const getClients = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    // For MVP testing, we'll fetch clients that belong to this user OR have no user_id (global test clients)
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(clients);
  } catch (error) {
    console.error('Fetch Clients Error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { name, email, company } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert({ user_id: userId, name, email, company })
      .select()
      .single();

    if (error) throw error;
    res.json(client);
  } catch (error: any) {
    console.error('Create Client Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create client' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
};

export const getClientEmails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: links, error } = await supabase
      .from('email_client_links')
      .select('email_id, emails(*)')
      .eq('client_id', id);

    if (error) throw error;
    
    const emails = links?.map(link => link.emails).filter(Boolean) || [];
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client emails' });
  }
};
