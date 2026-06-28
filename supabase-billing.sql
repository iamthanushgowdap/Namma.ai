-- AutoEngage Billing Tables Migration
-- Run this after supabase-schema.sql
-- Adds plans, subscriptions tables with full RLS

-- ============================================================
-- 1. Plans Table (read-only reference data, no RLS)
-- ============================================================
create table public.plans (
  id                 text primary key,                  -- 'free', 'starter', 'pro', 'agency'
  name               text not null,
  price_inr          integer not null,                  -- in paise (49900 = ₹499)
  price_usd          integer not null,                  -- in cents  (599 = $5.99)
  automations_limit  integer,                           -- null = unlimited
  replies_limit      integer,                           -- null = unlimited
  accounts_limit     integer not null,
  features           jsonb not null default '[]',
  razorpay_plan_id   text                               -- filled after creating subscription plan in Razorpay dashboard
);

-- Plans are public reference data — allow any authenticated user to read
alter table public.plans enable row level security;

create policy "Plans are publicly readable"
  on public.plans for select
  using (true);

-- ============================================================
-- 2. Subscriptions Table
-- ============================================================
create table public.subscriptions (
  id                         uuid default gen_random_uuid() primary key,
  workspace_id               uuid references public.workspaces(id) on delete cascade unique not null,
  plan_id                    text references public.plans(id) not null default 'free',
  status                     text not null default 'active',  -- active | cancelled | past_due | trialing
  razorpay_subscription_id   text,
  razorpay_customer_id       text,
  current_period_start       timestamptz,
  current_period_end         timestamptz,
  cancel_at_period_end       boolean default false,
  created_at                 timestamptz default now() not null,
  updated_at                 timestamptz default now() not null
);

-- RLS for subscriptions
alter table public.subscriptions enable row level security;

create policy "Users can view their workspace subscription"
  on public.subscriptions for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

create policy "Users can update their workspace subscription"
  on public.subscriptions for update
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

-- Allow backend (service role) to insert/update subscriptions via webhook
create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (true)
  with check (true);

-- ============================================================
-- 3. Auto-update updated_at on subscriptions
-- ============================================================
create or replace function public.handle_subscription_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscription_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_subscription_updated_at();

-- ============================================================
-- 4. Auto-create a free subscription when a workspace is created
-- ============================================================
create or replace function public.handle_new_workspace_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (workspace_id, plan_id, status)
  values (new.id, 'free', 'active')
  on conflict (workspace_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_workspace_created_billing
  after insert on public.workspaces
  for each row execute procedure public.handle_new_workspace_subscription();

-- ============================================================
-- 5. Seed Plans
-- ============================================================
insert into public.plans (id, name, price_inr, price_usd, automations_limit, replies_limit, accounts_limit, features) values
  (
    'free',
    'Free',
    0,
    0,
    3,
    100,
    1,
    '["3 automations", "100 replies/month", "1 Instagram account", "Basic analytics", "Community support"]'
  ),
  (
    'starter',
    'Starter',
    49900,
    599,
    10,
    1000,
    1,
    '["10 automations", "1,000 replies/month", "1 Instagram account", "Advanced analytics", "Email support", "Priority keyword matching"]'
  ),
  (
    'pro',
    'Pro',
    149900,
    1799,
    null,
    10000,
    3,
    '["Unlimited automations", "10,000 replies/month", "3 Instagram accounts", "Priority support", "Custom keywords", "AI fallback engine", "Webhook integrations"]'
  ),
  (
    'agency',
    'Agency',
    399900,
    4999,
    null,
    null,
    10,
    '["Unlimited automations", "Unlimited replies", "10 Instagram accounts", "White-label ready", "Dedicated account manager", "API access", "Custom integrations", "SLA guarantee"]'
  );
