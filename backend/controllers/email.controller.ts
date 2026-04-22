import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { fetchUnsyncedEmails, sendGmailEmail, getAttachment } from '../services/gmail.service';

export const getEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { folder } = req.query;
    
    let query = supabase
      .from('emails')
      .select('*, client:email_client_links(client_id, clients(name))')
      .eq('user_id', userId);

    if (folder === 'sent') {
      query = query.filter('labels', 'cs', '{"SENT"}').filter('labels', 'not.cs', '{"TRASH"}');
    } else if (folder === 'drafts') {
      query = query.filter('labels', 'cs', '{"DRAFT"}').filter('labels', 'not.cs', '{"TRASH"}');
    } else if (folder === 'starred') {
      query = query.filter('labels', 'cs', '{"STARRED"}').filter('labels', 'not.cs', '{"TRASH"}');
    } else if (folder === 'spam') {
      query = query.filter('labels', 'cs', '{"SPAM"}');
    } else if (folder === 'trash') {
      query = query.filter('labels', 'cs', '{"TRASH"}');
    } else if (folder === 'all') {
      query = query.filter('labels', 'not.cs', '{"TRASH"}');
    } else {
      query = query.filter('labels', 'cs', '{"INBOX"}').filter('labels', 'not.cs', '{"TRASH"}').filter('labels', 'not.cs', '{"SPAM"}');
    }

    const { data: emails, error } = await query
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;
    console.log(`[getEmails] Returning ${emails.length} emails. Sample attachments:`, emails.slice(0, 3).map(e => ({ id: e.id, hasAttachments: e.has_attachments, attachmentCount: e.attachments?.length })));
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

export const saveDraft = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { to, subject, body, draftId } = req.body;

    // Find the primary gmail account
    const { data: account, error: accError } = await supabase
      .from('provider_accounts')
      .select('id, email_address')
      .eq('user_id', userId)
      .eq('provider_type', 'gmail')
      .single();

    if (accError || !account) {
      return res.status(404).json({ error: 'No Gmail account connected' });
    }

    const draftData = {
      user_id: userId,
      account_id: account.id,
      subject: subject || '(No Subject)',
      sender: account.email_address,
      recipients: { to: [to].filter(Boolean) },
      snippet: (body || '').substring(0, 200),
      body_plain: body || '',
      labels: ['DRAFT'],
      is_read: true,
      timestamp: new Date().toISOString(),
      provider_message_id: draftId || `local-draft-${Date.now()}`
    };

    const { data, error } = await supabase
      .from('emails')
      .upsert(draftData, { onConflict: 'user_id, provider_message_id' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Save Draft Error:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
};

export const sendEmail = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { to, subject, body, draftId } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the primary gmail account
    const { data: account, error: accError } = await supabase
      .from('provider_accounts')
      .select('id, email_address')
      .eq('user_id', userId)
      .eq('provider_type', 'gmail')
      .single();

    if (accError || !account) {
      return res.status(404).json({ error: 'No Gmail account connected' });
    }

    const attachments = (req.files as Express.Multer.File[]) || [];
    const receipt = await sendGmailEmail(account.id, to, subject, body, attachments);
    
    // If it was a draft, delete it
    if (draftId) {
      await supabase.from('emails').delete().eq('user_id', userId).eq('provider_message_id', draftId);
    }

    // Save to database so it shows up in "Sent" folder immediately
    await supabase.from('emails').insert({
      user_id: userId,
      account_id: account.id,
      provider_message_id: receipt.id,
      subject,
      sender: account.email_address, // The user is the sender
      recipients: { to: [to] },
      snippet: body.substring(0, 200),
      body_plain: body,
      labels: ['SENT'],
      is_read: true,
      has_attachments: attachments.length > 0,
      timestamp: new Date().toISOString()
    });

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

export const toggleStar = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { emailId } = req.body;

    const { data: email, error: fetchError } = await supabase
      .from('emails')
      .select('labels')
      .eq('id', emailId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    let labels = email.labels || [];
    if (labels.includes('STARRED')) {
      labels = labels.filter((l: string) => l !== 'STARRED');
    } else {
      labels = [...labels, 'STARRED'];
    }

    const { error: updateError } = await supabase
      .from('emails')
      .update({ labels })
      .eq('id', emailId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
    res.json({ success: true, isStarred: labels.includes('STARRED') });
  } catch (error) {
    console.error('Toggle Star Error:', error);
    res.status(500).json({ error: 'Failed to toggle star' });
  }
};

export const deleteEmail = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { emailId } = req.body;

    const { data: email, error: fetchError } = await supabase
      .from('emails')
      .select('labels')
      .eq('id', emailId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    let labels = email.labels || [];
    
    // If it's already in Trash, or if user wants permanent delete
    if (labels.includes('TRASH')) {
      const { error: deleteError } = await supabase
        .from('emails')
        .delete()
        .eq('id', emailId)
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;
      return res.json({ success: true, permanent: true });
    }

    // Move to trash
    labels = [...labels.filter((l: string) => !['INBOX', 'SENT', 'DRAFT'].includes(l)), 'TRASH'];

    const { error: updateError } = await supabase
      .from('emails')
      .update({ labels })
      .eq('id', emailId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
    res.json({ success: true, trashed: true });
  } catch (error) {
    console.error('Delete Email Error:', error);
    res.status(500).json({ error: 'Failed to delete email' });
  }
};

export const toggleReadStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { emailId, isRead } = req.body;

    const { error } = await supabase
      .from('emails')
      .update({ is_read: isRead })
      .eq('id', emailId)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true, is_read: isRead });
  } catch (error) {
    console.error('Toggle Read Status Error:', error);
    res.status(500).json({ error: 'Failed to update read status' });
  }
};

export const downloadAttachment = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { emailId, attachmentId } = req.query;

    if (!emailId || !attachmentId) {
      return res.status(400).json({ error: 'Missing emailId or attachmentId' });
    }

    const { data: email, error: fetchError } = await supabase
      .from('emails')
      .select('account_id, provider_message_id, attachments')
      .eq('id', emailId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const attachmentMetadata = email.attachments?.find((a: any) => a.attachmentId === attachmentId);
    if (!attachmentMetadata) {
      return res.status(404).json({ error: 'Attachment metadata not found' });
    }

    const attachmentData = await getAttachment(email.account_id, email.provider_message_id, attachmentId as string);
    
    if (!attachmentData.data) {
      return res.status(404).json({ error: 'Attachment data not found' });
    }

    const buffer = Buffer.from(attachmentData.data, 'base64');
    
    res.setHeader('Content-Type', attachmentMetadata.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachmentMetadata.filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Download Attachment Error:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
};
