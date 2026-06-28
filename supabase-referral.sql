-- Refer & Earn Feature Database Schema DDL

-- 1. Update Profiles table with referral columns
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists username text unique,
  add column if not exists kyc_status text default 'unverified' not null, -- 'unverified', 'pending', 'verified'
  add column if not exists kyc_data jsonb default '{}'::jsonb not null,
  add column if not exists email text;

-- 2. Create Referrals table
create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  referred_id uuid references public.profiles(id) on delete cascade unique not null,
  status text default 'joined' not null, -- 'joined', 'converted', 'fraudulent'
  created_at timestamptz default now() not null
);

-- Enable RLS on referrals
alter table public.referrals enable row level security;
create policy "Users can view their referrals" 
  on public.referrals for select 
  using (referrer_id = auth.uid() or referred_id = auth.uid());

-- 3. Create Referral Ledger table
create table if not exists public.referral_ledger (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null, -- in paise/cents (positive for credit, negative for debit)
  transaction_type text not null, -- 'referral_commission', 'withdrawal', 'friend_transfer_sent', 'friend_transfer_received', 'subscription_purchase'
  status text default 'completed' not null, -- 'pending', 'completed', 'failed'
  description text,
  created_at timestamptz default now() not null
);

-- Enable RLS on ledger
alter table public.referral_ledger enable row level security;
create policy "Users can view their ledger entries"
  on public.referral_ledger for select
  using (profile_id = auth.uid());

-- 4. Create User Payment Methods table (for fraud check)
create table if not exists public.user_payment_methods (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  payment_hash text not null unique, -- Hashed payment fingerprint (card or UPI ID)
  created_at timestamptz default now() not null
);

-- Enable RLS on payment methods
alter table public.user_payment_methods enable row level security;
create policy "Users can manage their payment methods"
  on public.user_payment_methods for all
  using (profile_id = auth.uid());

-- 5. Trigger updates to handle unique referral code generation on user creation
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_workspace_id uuid;
  gen_code text;
  code_exists boolean;
  referral_code_entered text;
  referrer_profile_id uuid;
begin
  -- Loop to generate unique referral code (in case of collisions)
  loop
    gen_code := lower(split_part(new.email, '@', 1)) || floor(random() * 9000 + 1000)::text;
    select exists(select 1 from public.profiles where referral_code = gen_code) into code_exists;
    if not code_exists then
      exit;
    end if;
  end loop;

  -- Create profile
  insert into public.profiles (id, name, username, avatar_url, referral_code, kyc_status, kyc_data, email)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || floor(random() * 9000 + 1000)::text),
    new.raw_user_meta_data->>'avatar_url',
    gen_code,
    'unverified',
    '{}'::jsonb,
    new.email
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

  -- Map referral if a code was provided on signup
  referral_code_entered := new.raw_user_meta_data->>'referral_code_input';
  if referral_code_entered is not null and referral_code_entered <> '' then
    select id into referrer_profile_id from public.profiles where lower(referral_code) = lower(referral_code_entered);
    if referrer_profile_id is not null and referrer_profile_id <> new.id then
      insert into public.referrals (referrer_id, referred_id, status)
      values (referrer_profile_id, new.id, 'joined');
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;
