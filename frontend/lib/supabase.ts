import { createClient } from '@supabase/supabase-js';

// Setup supabase client for frontend. Replace with actual vars on deployment.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
