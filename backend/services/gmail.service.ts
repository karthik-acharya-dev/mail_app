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
  if (payload.mimeType === mimeType && payload.body.data) {
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

export const fetchUnsyncedEmails = async (accountId: string) => {
  const { oAuth2Client, userId } = await getUserOAuthClient(accountId);
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 100,
  });

  const messages = response.data.messages || [];
  const fetchedEmails = [];

  for (const message of messages) {
    const { data: existing } = await supabase
      .from('emails')
      .select('id')
      .eq('provider_message_id', message.id)
      .eq('account_id', accountId)
      .single();

    if (existing) continue;

    const msgData = await gmail.users.messages.get({
      userId: 'me',
      id: message.id as string,
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
    
    // Extract full bodies for Option E
    const bodyHtml = getBody(payload, 'text/html');
    const bodyPlain = getBody(payload, 'text/plain');

    const labels = msgData.data.labelIds || [];
    const isRead = !labels.includes('UNREAD');
    
    // Simple attachment detection
    const hasAttachments = !!payload?.parts?.some((p: any) => p.filename && p.filename.length > 0);

    const { data: savedEmail } = await supabase.from('emails').insert({
      user_id: userId,
      account_id: accountId,
      provider_message_id: message.id,
      subject,
      sender,
      recipients,
      snippet: msgData.data.snippet || '',
      body_html: bodyHtml || bodyPlain, // Favor HTML if available
      body_plain: bodyPlain,
      labels,
      is_read: isRead,
      has_attachments: hasAttachments,
      timestamp
    }).select().single();
    
    if (savedEmail) {
      fetchedEmails.push(savedEmail);
    }
  }

  await supabase.from('provider_accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', accountId);

  return fetchedEmails;
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
