import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { fetchUnsyncedEmails, sendGmailEmail } from '../services/gmail.service';

export const getEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { data: emails, error } = await supabase
      .from('emails')
      .select('*, client:email_client_links(client_id, clients(name))')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};

export const syncEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Find the primary gmail account for this user
    const { data: account, error: accError } = await supabase
      .from('provider_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('provider_type', 'gmail')
      .single();

    if (accError || !account) {
      return res.status(404).json({ error: 'No Gmail account connected' });
    }

    const newEmails = await fetchUnsyncedEmails(account.id);
    res.json({ message: 'Sync complete', count: newEmails.length });
  } catch (error) {
    console.error('Manual Sync Error:', error);
    res.status(500).json({ error: 'Failed to sync emails' });
  }
};

export const sendEmail = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { to, subject, body } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the primary gmail account
    const { data: account, error: accError } = await supabase
      .from('provider_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('provider_type', 'gmail')
      .single();

    if (accError || !account) {
      return res.status(404).json({ error: 'No Gmail account connected' });
    }

    const receipt = await sendGmailEmail(account.id, to, subject, body);
    
    res.json({ message: 'Email sent successfully', provider_message_id: receipt.id });
  } catch (error) {
    console.error('Send Email Error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

export const linkToClient = async (req: Request, res: Response) => {
  try {
    const { emailId, clientId } = req.body;
    
    if (!emailId || !clientId) {
      return res.status(400).json({ error: 'Missing emailId or clientId' });
    }

    const { data, error } = await supabase
      .from('email_client_links')
      .insert({ email_id: emailId, client_id: clientId })
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to link email to client' });
  }
};

export const searchEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.json([]);
    }

    // Professional Full Text Search using the GIN index and tsquery
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .textSearch('search_vector', q, {
        type: 'websearch',
        config: 'english'
      })
      .order('timestamp', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ error: 'Failed to search emails' });
  }
};
