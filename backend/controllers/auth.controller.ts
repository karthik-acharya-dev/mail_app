import { Request, Response } from 'express';
import { generateAuthUrl, handleCallback } from '../services/gmail.service';
import { supabase } from '../utils/supabase';

export const getGoogleAuthUrl = (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const url = generateAuthUrl(userId);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate auth url' });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const userId = state as string;
    await handleCallback(code as string, userId);

    // Redirect to frontend dashboard
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard/email`);
  } catch (error) {
    console.error('Google Callback Error', error);
    res.status(500).json({ error: 'Failed to handle google callback' });
  }
};

export const getConnectionStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { data: accounts } = await supabase
      .from('provider_accounts')
      .select('provider_type, email_address, last_synced_at')
      .eq('user_id', userId);

    if (accounts && accounts.length > 0) {
      res.json({ isConnected: true, accounts });
    } else {
      res.json({ isConnected: false, accounts: [] });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const disconnectAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Remove the provider account from the database
    const { error } = await supabase
      .from('provider_accounts')
      .delete()
      .eq('user_id', userId)
      .eq('provider_type', 'gmail');

    if (error) throw error;
    
    // Also delete any emails synced for this account (optional but cleaner)
    await supabase.from('emails').delete().eq('user_id', userId);

    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    console.error('Disconnect Error:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
};
