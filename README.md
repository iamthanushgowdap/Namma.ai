# AutoEngage — Instagram DM & Comment AI Automation Platform

AutoEngage is a full-stack SaaS application built to automate Instagram Direct Messages (DMs) and comments. It features real Meta OAuth integration, secure symmetric token encryption, an internal AI intent-classification response engine, a unified live inbox utilizing Supabase Realtime, and custom keyword-triggered comment replies.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Next.js API Routes, Server Actions, Cryptography (AES-256-GCM).
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth, Supabase Realtime).

---

## Getting Started

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

---

## Supabase Database Setup

1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Open the [supabase-schema.sql](file:///c:/Users/choco/OneDrive/Documents/AutoEngage/supabase-schema.sql) file.
3. Paste and run the DDL query. This will:
   - Create all necessary tables (`profiles`, `workspaces`, `instagram_accounts`, `automations`, `automation_rules`, `conversations`, `messages`, `webhook_events`, `ai_settings`).
   - Enable Row Level Security (RLS) policies isolating user data by workspace.
   - Configure triggers that automatically provision profiles and default workspaces on user signup.
4. Go to **Database** -> **Replication** -> **Source** and enable replication on the `messages` and `conversations` tables to support Supabase Realtime in the chat inbox.

---

## Meta App Setup

To connect with Instagram, you must set up a Meta App inside the [Meta App Dashboard](https://developers.facebook.com/):

### 1. App Configuration
- Create a **Business App**.
- Add the **Instagram Graph API** and **Messenger API (Instagram)** products to your app.
- Configure permissions under App Review (for production) or add test accounts (for development):
  - `instagram_basic`
  - `instagram_manage_messages`
  - `instagram_manage_comments`
  - `pages_show_list`
  - `pages_read_engagement`
  - `pages_manage_metadata`

### 2. Configure Webhooks
- In the Facebook App Dashboard under **Webhooks**, select **Instagram** from the dropdown.
- Click **Subscribe to this object** and set:
  - **Callback URL**: `https://<your-domain>/api/webhooks/instagram`
  - **Verify Token**: Match the `META_VERIFY_TOKEN` configured in your `.env.local` file.
- Subscribe to the following fields:
  - `messages`
  - `messaging_postbacks`
  - `comments`

---

## Local Development & Webhook Testing

Since Meta must reach your local server to send webhooks, you must use a tunnel service like **ngrok**:

1. Start your local Next.js dev server:
   ```bash
   npm run dev
   ```
2. In a separate terminal, start an ngrok tunnel on port 3000:
   ```bash
   ngrok http 3000
   ```
3. Copy the secure HTTPS URL provided by ngrok (e.g. `https://xxxx.ngrok-free.app`).
4. Update your Facebook App Webhook configuration Callback URL to `https://xxxx.ngrok-free.app/api/webhooks/instagram`.
5. Update the OAuth Redirect URL inside Facebook Login settings to:
   `https://xxxx.ngrok-free.app/api/auth/instagram/callback`

---

## Vercel Deployment

1. Push your code to GitHub.
2. Link your repository to **Vercel**.
3. Add all environment variables listed in `.env.example` in Vercel settings.
4. Set the Facebook Webhook Callback URL and Facebook OAuth redirect URL in your Meta App Dashboard to your Vercel deployment URL.
