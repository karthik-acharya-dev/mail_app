-- 1. Supported Provider Accounts
CREATE TABLE IF NOT EXISTS public.provider_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'gmail',
  email_address TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email_address)
);

-- 2. Emails (Metadata + HTML Body)
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.provider_accounts(id) ON DELETE CASCADE,
  provider_message_id TEXT NOT NULL,
  subject TEXT,
  sender TEXT,
  recipients JSONB,
  snippet TEXT,
  body_html TEXT, -- Store full HTML content for Option E
  body_plain TEXT,
  labels TEXT[],
  is_read BOOLEAN DEFAULT FALSE,
  has_attachments BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(snippet, '') || ' ' || coalesce(sender, ''))
  ) STORED,
  UNIQUE(user_id, provider_message_id) 
);

CREATE INDEX IF NOT EXISTS emails_search_idx ON public.emails USING GIN (search_vector);

-- 3. CRM Clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Linking
CREATE TABLE IF NOT EXISTS public.email_client_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email_id, client_id)
);
