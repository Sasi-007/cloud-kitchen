-- ============================================================
-- TODAY'S DB CHANGES ONLY (2026-07-04)
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Advance payment columns on orders
alter table orders add column if not exists advance_paid   boolean default false;
alter table orders add column if not exists advance_amount integer default 0;

-- 2. Fix kitchen creation RLS (was blocking superadmin inserts)
drop policy if exists "Superadmin manages kitchens" on kitchens;
create policy "Superadmin manages kitchens"
  on kitchens for all
  using (public.get_my_role() = 'superadmin');

-- 3. Leads table (Get Started form submissions → visible in /superadmin/leads)
create table if not exists leads (
  id          bigint generated always as identity primary key,
  name        text,
  kitchen     text,
  phone       text,
  email       text,
  plan        text default 'growth',
  message     text,
  status      text default 'new'
              check (status in ('new','contacted','onboarded','rejected')),
  created_at  timestamptz default now()
);
alter table leads enable row level security;

create policy "Superadmin manages leads"
  on leads for all
  using (public.get_my_role() = 'superadmin');

create policy "Anyone can insert lead"
  on leads for insert
  with check (true);
