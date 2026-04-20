# NextGen Mail CRM

A scalable Email Application (like Gmail UI) integrated with external email providers and CRM linking built with Next.js, Express, and Supabase.

## Features
1. **Authentication:** Supabase Auth
2. **Email Integration:** Google OAuth 2.0 and Gmail API
3. **UI:** Modern, high-performance UI using Next.js App Router, Tailwind CSS, and Framer Motion.
4. **CRM Linking:** Link any synced email to CRM identities.
5. **Background Sync:** Express Cron Job fetches unread/unsynced emails automatically every 5 minutes.

## Setup Instructions

### Pre-requisites
- Node.js 18+
- Supabase Project
- Google Cloud Project (for OAuth Client ID/Secret)

### 1. Database Configuration (Supabase)
In your Supabase SQL Editor, run the schema found in `backend/database.sql` to initialize `gmail_accounts`, `emails`, `clients`, and `email_client_links` tables. Be sure to use Supabase Auth and turn on Row Level Security if required for production.

### 2. Backend Setup
1. CD into the backend `cd backend`
2. Configure `.env`: Copy `.env.example` to `.env` and fill the variables.
```env
PORT=5000
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```
3. Run `npm install`
4. Start backend: `npm run dev`

### 3. Frontend Setup
1. CD into the frontend `cd frontend`
2. Configure local ENV vars based on backend API. Create `.env.local` inside frontend folder:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
3. Run `npm install`
4. Start frontend: `npm run dev`

### Project Structure
- `backend/controllers`: Request handlers
- `backend/services`: Third party api handlers (Gmail)
- `backend/jobs`: node-cron sync jobs
- `backend/routes`: Express Routers
- `frontend/app/dashboard`: Main UI App layout and subpages
- `frontend/app/components`: Reusable UI components
- `frontend/lib`: Helper functions and singleton instances

## Notes
- To test the aesthetic presentation without DB config, the UI components gracefully fallback to mock data defined in the `page.tsx` files.
- You do NOT run an SMTP server; emails sync exclusively over Gmail REST API.
