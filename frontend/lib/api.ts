import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const authApi = {
  getGoogleAuthUrl: () => api.get('/auth/google/url').then(res => res.data.url),
  getConnectionStatus: () => api.get('/auth/status').then(res => res.data),
  disconnectAccount: () => api.post('/auth/disconnect').then(res => res.data),
};

export const emailApi = {
  getEmails: (folder: string = 'inbox') => api.get(`/emails?folder=${folder}`).then(res => res.data),
  syncEmails: () => api.post('/emails/sync').then(res => res.data),
  sendEmail: (data: { to: string; subject: string; body: string; attachments?: File[] }) => {
    const formData = new FormData();
    formData.append('to', data.to);
    formData.append('subject', data.subject);
    formData.append('body', data.body);
    
    if (data.attachments) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    return api.post('/emails/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
  saveDraft: (data: { to?: string; subject?: string; body?: string; draftId?: string }) => 
    api.post('/emails/save-draft', data).then(res => res.data),
  toggleStar: (emailId: string) => api.post('/emails/toggle-star', { emailId }).then(res => res.data),
  deleteEmail: (emailId: string) => api.post('/emails/delete', { emailId }).then(res => res.data),
  markReadStatus: (emailId: string, isRead: boolean) => api.post('/emails/toggle-read', { emailId, isRead }).then(res => res.data),
  linkToClient: (emailId: string, clientId: string) => api.post('/emails/link', { emailId, clientId }).then(res => res.data),
  unlinkFromClient: (emailId: string) => api.post('/emails/unlink', { emailId }).then(res => res.data),
  searchEmails: (query: string) => api.get(`/emails/search?q=${query}`).then(res => res.data),
  getAttachmentUrl: (emailId: string, attachmentId: string) => `${API_URL}/emails/attachment?emailId=${emailId}&attachmentId=${attachmentId}`,
};

export const clientApi = {
  getClients: () => api.get('/clients').then(res => res.data),
  createClient: (data: { name: string; email?: string; company?: string }) => api.post('/clients', data).then(res => res.data),
  deleteClient: (id: string) => api.delete(`/clients/${id}`).then(res => res.data),
  getClientEmails: (id: string) => api.get(`/clients/${id}/emails`).then(res => res.data),
};
