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
};

export const emailApi = {
  getEmails: () => api.get('/emails').then(res => res.data),
  syncEmails: () => api.post('/emails/sync').then(res => res.data),
  sendEmail: (data: { to: string; subject: string; body: string }) => api.post('/emails/send', data).then(res => res.data),
  linkToClient: (emailId: string, clientId: string) => api.post('/emails/link', { emailId, clientId }).then(res => res.data),
  searchEmails: (query: string) => api.get(`/emails/search?q=${query}`).then(res => res.data),
};

export const clientApi = {
  getClients: () => api.get('/clients').then(res => res.data),
  createClient: (data: { name: string; email?: string; company?: string }) => api.post('/clients', data).then(res => res.data),
};
