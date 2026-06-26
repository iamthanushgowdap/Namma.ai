-- Namma.ai Supabase Database Schema DDL
-- This file configures the tables, triggers, indexes, and RLS policies.

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Workspaces Table
create table public.workspaces (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null
);

-- Enable RLS on Workspaces
alter table public.workspaces enable row level security;

create policy "Users can view workspaces they own"
  on public.workspaces for select
  using (auth.uid() = owner_id);

create policy "Users can insert workspaces they own"
  on public.workspaces for insert
  with check (auth.uid() = owner_id);

create policy "Users can update workspaces they own"
  on public.workspaces for update
  using (auth.uid() = owner_id);

create policy "Users can delete workspaces they own"
  on public.workspaces for delete
  using (auth.uid() = owner_id);

-- 3. Instagram Accounts Table
create table public.instagram_accounts (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  instagram_user_id text not null unique,
  username text not null,
  access_token_encrypted text not null,
  connected_at timestamptz default now() not null
);

-- Enable RLS on Instagram Accounts
alter table public.instagram_accounts enable row level security;

create policy "Users can view their workspace instagram accounts"
  on public.instagram_accounts for select
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "Users can insert their workspace instagram accounts"
  on public.instagram_accounts for insert
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "Users can update their workspace instagram accounts"
  on public.instagram_accounts for update
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "Users can delete their workspace instagram accounts"
  on public.instagram_accounts for delete
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

-- 4. Webhook Events Table
create table public.webhook_events (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz default now() not null
);

-- Enable RLS on Webhook Events
alter table public.webhook_events enable row level security;

create policy "Users can view their workspace webhook events"
  on public.webhook_events for select
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "Service role or webhook can insert webhook events"
  on public.webhook_events for insert
  with check (true); -- Allow backend route insertion without active user session

-- 5. Automations Table
create table public.automations (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  trigger_type text default 'comment_keyword' not null, -- 'comment_keyword', 'dm_keyword', 'ai_fallback'
  status text default 'active' not null, -- 'active', 'inactive'
  created_at timestamptz default now() not null
);

-- Enable RLS on Automations
alter table public.automations enable row level security;

create policy "Users can manage automations"
  on public.automations for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

-- 6. Automation Rules Table
create table public.automation_rules (
  id uuid default gen_random_uuid() primary key,
  automation_id uuid references public.automations(id) on delete cascade not null,
  keyword text not null,
  response_message text not null
);

-- Enable RLS on Automation Rules
alter table public.automation_rules enable row level security;

create policy "Users can manage automation rules"
  on public.automation_rules for all
  using (automation_id in (
    select id from public.automations where workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  ));

-- 7. Conversations Table
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  instagram_user_id text not null,
  status text default 'active' not null, -- 'active', 'pending', 'resolved'
  created_at timestamptz default now() not null,
  unique (workspace_id, instagram_user_id)
);

-- Enable RLS on Conversations
alter table public.conversations enable row level security;

create policy "Users can manage conversations"
  on public.conversations for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

-- 8. Messages Table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender text not null, -- 'user', 'instagram_user', 'ai'
  content text not null,
  created_at timestamptz default now() not null
);

-- Enable RLS on Messages
alter table public.messages enable row level security;

create policy "Users can manage messages"
  on public.messages for all
  using (conversation_id in (
    select id from public.conversations where workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  ));

-- 9. AI Settings Table
create table public.ai_settings (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null unique,
  greeting_response text default 'Hello! How can we help you today?' not null,
  pricing_response text default 'Here is our pricing information: Basic is $29/mo, Pro is $79/mo.' not null,
  support_response text default 'Our support team has been notified. We will get back to you shortly.' not null,
  product_response text default 'We offer state-of-the-art AI automation for your Instagram inbox!' not null,
  unknown_response text default 'Thank you for your message. An agent will reply to you soon.' not null,
  ai_enabled boolean default true not null,
  greeting_keywords text[] default array['hi', 'hello', 'hey', 'hola']::text[] not null,
  pricing_keywords text[] default array['price', 'pricing', 'cost', 'how much', 'rate']::text[] not null,
  support_keywords text[] default array['help', 'support', 'contact', 'agent', 'human']::text[] not null,
  product_keywords text[] default array['product', 'features', 'what is', 'tool', 'service']::text[] not null,
  reply_delay_seconds integer default 0 not null,
  respond_on_dms boolean default true not null,
  respond_on_comments boolean default true not null,
  custom_intents jsonb default '[]'::jsonb not null,
  created_at timestamptz default now() not null
);

-- Enable RLS on AI Settings
alter table public.ai_settings enable row level security;

create policy "Users can manage AI settings"
  on public.ai_settings for all
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));


-- Triggers to automate Profile and Workspace creation on Signup

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_workspace_id uuid;
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create a default workspace for the user
  insert into public.workspaces (owner_id, name)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)) || '''s Workspace'
  )
  returning id into new_workspace_id;

  -- Create default AI settings for the workspace
  insert into public.ai_settings (workspace_id)
  values (new_workspace_id)
  on conflict (workspace_id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Add helper trigger to automatically initialize AI Settings for manually created workspaces too
create or replace function public.handle_new_workspace()
returns trigger as $$
begin
  insert into public.ai_settings (workspace_id)
  values (new.id)
  on conflict (workspace_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_workspace_created
  after insert on public.workspaces
  for each row execute procedure public.handle_new_workspace();

-- ============================================================
-- Follow-Gate Feature Migration
-- Add follow-gate columns to automations table
-- ============================================================
-- NOTE: Run these ALTER TABLE commands in your Supabase SQL Editor
alter table public.automations
  add column if not exists follow_gate_enabled boolean default false not null,
  add column if not exists follow_gate_message text default 'This link is exclusive for our followers only! Tap the button below to verify your follow and get instant access.' not null;
