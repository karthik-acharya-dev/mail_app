import { google } from 'googleapis';
import { supabase } from '../utils/supabase';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
];

export const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

export const generateAuthUrl = (userId: string) => {
  const oAuth2Client = getOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: userId,
  });
};

export const handleCallback = async (code: string, userId: string) => {
  const oAuth2Client = getOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
  const userInfo = await oauth2.userinfo.get();
  const emailAddress = userInfo.data.email;

  if (!emailAddress) {
    throw new Error('Could not get email address from Google');
  }

  const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000);

  const { data, error } = await supabase
    .from('provider_accounts')
    .upsert(
      {
        user_id: userId,
        provider_type: 'gmail',
        email_address: emailAddress,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiryDate.toISOString(),
      },
      { onConflict: 'user_id, email_address' }
    );

  if (error) {
    console.error('Error saving provider account', error);
    throw error;
  }

  return tokens;
};

export const getUserOAuthClient = async (accountId: string) => {
  const { data: account, error } = await supabase
    .from('provider_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (error || !account) {
    throw new Error('Account not found or not connected');
  }

  const oAuth2Client = getOAuthClient();
  oAuth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: new Date(account.token_expiry).getTime(),
  });

  oAuth2Client.on('tokens', async (tokens) => {
    const updateData: any = {};
    if (tokens.access_token) updateData.access_token = tokens.access_token;
    if (tokens.refresh_token) updateData.refresh_token = tokens.refresh_token;
    if (tokens.expiry_date) updateData.token_expiry = new Date(tokens.expiry_date).toISOString();

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('provider_accounts')
        .update(updateData)
        .eq('id', accountId);
    }
  });

  return { oAuth2Client, emailAddress: account.email_address, userId: account.user_id };
};

/**
 * Helper to recursively find and decode the body from Gmail message parts
 */
const getBody = (payload: any, mimeType: string): string => {
  if (!payload) return '';
  if (payload.mimeType === mimeType && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf8');
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const result = getBody(part, mimeType);
      if (result) return result;
    }
  }
  return '';
};

/**
 * Helper to recursively find all attachments in Gmail message parts
 */
const getAttachments = (parts: any[]): any[] => {
  let attachments: any[] = [];
  if (!parts) return attachments;
  for (const part of parts) {
    const filename = part.filename || '';
    const attachmentId = part.body?.attachmentId;
    
    if (attachmentId) {
      console.log(`[GmailService] Found attachment/media: ${filename || 'inline'} (${part.mimeType})`);
      attachments.push({
        filename: filename || 'attachment',
        mimeType: part.mimeType,
        size: part.body?.size,
        attachmentId: attachmentId
      });
    }
    
    if (part.parts) {
      attachments = attachments.concat(getAttachments(part.parts));
    }
  }
  return attachments;
};

export const fetchUnsyncedEmails = async (accountId: string) => {
  console.log(`[GmailService] Syncing account: ${accountId}`);
  const { oAuth2Client, userId } = await getUserOAuthClient(accountId);
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  // 1. Get all message references in parallel streams
  const [listRes, trashRes, draftRes, spamRes, starredRes] = await Promise.all([
    gmail.users.messages.list({ userId: 'me', maxResults: 100, includeSpamTrash: true }),
    gmail.users.messages.list({ userId: 'me', q: 'label:TRASH', maxResults: 50, includeSpamTrash: true }),
    gmail.users.messages.list({ userId: 'me', q: 'label:DRAFT', maxResults: 50, includeSpamTrash: true }),
    gmail.users.messages.list({ userId: 'me', q: 'label:SPAM', maxResults: 50, includeSpamTrash: true }),
    gmail.users.messages.list({ userId: 'me', q: 'label:STARRED', maxResults: 50, includeSpamTrash: false }),
  ]);

  const allMessages = [
    ...(listRes.data.messages || []),
    ...(trashRes.data.messages || []),
    ...(draftRes.data.messages || []),
    ...(spamRes.data.messages || []),
    ...(starredRes.data.messages || [])
  ];
  
  const uniqueMessageIds = Array.from(new Set(allMessages.map(m => (m as any).id))).filter(Boolean);
  console.log(`[GmailService] Found ${uniqueMessageIds.length} unique messages to process`);

  // 2. Optimization: Fetch all existing message IDs in one go to see what we can skip
  const { data: existingRecords } = await supabase
    .from('emails')
    .select('provider_message_id, labels')
    .eq('account_id', accountId)
    .in('provider_message_id', uniqueMessageIds);

  const existingMap = new Map(existingRecords?.map(r => [r.provider_message_id, r.labels]) || []);

  // 3. Process messages in parallel chunks of 20 to avoid rate limits while being very fast
  const CHUNK_SIZE = 20;
  const emailsToUpsert: any[] = [];
  
  for (let i = 0; i < uniqueMessageIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueMessageIds.slice(i, i + CHUNK_SIZE);
    
    const chunkResults = await Promise.all(chunk.map(async (messageId) => {
      try {
        // Only fetch full data if it's new
        if (existingMap.has(messageId as string)) return null;

        const msgData = await gmail.users.messages.get({
          userId: 'me',
          id: messageId as string,
        });

        const payload = msgData.data.payload;
        const headers = payload?.headers;
        const findHeader = (name: string) => headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const subject = findHeader('Subject');
        const sender = findHeader('From');
        const recipients = {
          to: [findHeader('To')],
          cc: [findHeader('Cc')].filter(Boolean),
        };
        const timestamp = findHeader('Date') ? new Date(findHeader('Date')).toISOString() : new Date().toISOString();
        
        const bodyHtml = getBody(payload, 'text/html');
        const bodyPlain = getBody(payload, 'text/plain');
        const labels = msgData.data.labelIds || [];
        const isRead = !labels.includes('UNREAD');
        const attachmentsList = getAttachments(payload?.parts || []);

        return {
          user_id: userId,
          account_id: accountId,
          provider_message_id: messageId,
          subject,
          sender,
          recipients,
          snippet: msgData.data.snippet || '',
          body_html: bodyHtml || bodyPlain,
          body_plain: bodyPlain,
          labels,
          is_read: isRead,
          has_attachments: attachmentsList.length > 0,
          attachments: attachmentsList,
          timestamp
        };
      } catch (err) {
        console.error(`[GmailService] Error fetching message ${messageId}:`, err);
        return null;
      }
    }));

    emailsToUpsert.push(...chunkResults.filter(Boolean));
  }

  // 4. Bulk Upsert everything in a single database transaction
  if (emailsToUpsert.length > 0) {
    console.log(`[GmailService] Bulk saving ${emailsToUpsert.length} new/updated emails...`);
    const { error: bulkErr } = await supabase
      .from('emails')
      .upsert(emailsToUpsert, { onConflict: 'user_id, provider_message_id' });
    
    if (bulkErr) console.error('[GmailService] Bulk upsert error:', bulkErr.message);
  }

  await supabase.from('provider_accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', accountId);
  return emailsToUpsert;
};

export const getAttachment = async (accountId: string, messageId: string, attachmentId: string) => {
  const { oAuth2Client } = await getUserOAuthClient(accountId);
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const response = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId,
    id: attachmentId,
  });

  return response.data;
};

export const sendGmailEmail = async (
  accountId: string, 
  to: string, 
  subject: string, 
  bodyText: string, 
  attachments: Express.Multer.File[] = []
) => {
  const { oAuth2Client } = await getUserOAuthClient(accountId);
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const boundary = `__boundary_${Date.now()}__`;
  
  let message = "";

  if (attachments.length === 0) {
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      bodyText,
    ];
    message = messageParts.join('\n');
  } else {
    const messageParts = [
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      bodyText,
      '',
    ];

    for (const file of attachments) {
      messageParts.push(`--${boundary}`);
      messageParts.push(`Content-Type: ${file.mimetype}; name="${file.originalname}"`);
      messageParts.push(`Content-Transfer-Encoding: base64`);
      messageParts.push(`Content-Disposition: attachment; filename="${file.originalname}"`);
      messageParts.push('');
      messageParts.push(file.buffer.toString('base64'));
      messageParts.push('');
    }

    messageParts.push(`--${boundary}--`);
    message = messageParts.join('\n');
  }

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });

  return res.data;
};
