-- ============================================================
-- Automation Cards and Media Upload Storage Migration
-- ============================================================

-- 1. Add response_cards column to public.automation_rules
alter table public.automation_rules
  add column if not exists response_cards jsonb default '[]'::jsonb not null;

-- 2. Create the automation-media storage bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('automation-media', 'automation-media', true)
on conflict (id) do nothing;
