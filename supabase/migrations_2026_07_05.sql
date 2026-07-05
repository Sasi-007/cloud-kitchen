-- ============================================================
-- MIGRATIONS 2026-07-05
-- Run entirely in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Fix kitchen creation RLS ──────────────────────────────
-- Old policy used a subquery on profiles causing permission issues

drop policy if exists "Superadmin manages kitchens" on kitchens;

create policy "Superadmin manages kitchens"
  on kitchens for all
  using (public.get_my_role() = 'superadmin');

-- ── 2. Allow admins to read their own kitchen (for plan check) ─

drop policy if exists "Admin reads own kitchen" on kitchens;

create policy "Admin reads own kitchen"
  on kitchens for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and kitchen_id = kitchens.id
    )
  );

-- ── 3. Fix leads status constraint (remove 'contacted') ───────

alter table leads drop constraint if exists leads_status_check;

alter table leads add constraint leads_status_check
  check (status in ('new', 'onboarded', 'rejected'));

-- ── 4. Superadmin realtime leads subscription ─────────────────

drop policy if exists "Superadmin realtime leads" on leads;

create policy "Superadmin realtime leads"
  on leads for select
  using (public.get_my_role() = 'superadmin');

-- ── 5. Advance payment columns on orders ─────────────────────

alter table orders add column if not exists advance_paid   boolean default false;
alter table orders add column if not exists advance_amount integer default 0;

-- ── 6. Fix payment_method constraint to only allow cod/gpay ───
-- Remove any rows that have invalid payment_method before altering

update orders set payment_method = 'cod'
  where payment_method not in ('cod', 'gpay');

alter table orders drop constraint if exists orders_payment_method_check;

alter table orders add constraint orders_payment_method_check
  check (payment_method in ('cod', 'gpay'));

-- ── Done ──────────────────────────────────────────────────────
