-- ============================================================
-- MIGRATIONS 2026-07-10
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Dynamic delivery settings on kitchens ─────────────────
alter table kitchens add column if not exists delivery_fee         integer default 50;
alter table kitchens add column if not exists free_delivery_above  integer default 1000;

-- ── 2. Order status: add 'cancelled' and 'out' ───────────────
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('new','progress','out','delivered','cancelled'));

-- ── 3. Refund tracking on cancelled orders ───────────────────
alter table orders add column if not exists refund_status text
  check (refund_status in ('pending','completed'));

-- ── 4. Feedback: visibility + manual entry columns ───────────
alter table feedback add column if not exists visible_to_customer boolean default false;
alter table feedback add column if not exists is_manual           boolean default false;
alter table feedback add column if not exists manual_note         text;

-- ── 5. Prep timer columns on orders ──────────────────────────
alter table orders add column if not exists estimated_minutes integer;
alter table orders add column if not exists timer_started_at  timestamptz;

-- ── 6. Feedback: max reviews shown on customer page ───────────
alter table kitchens add column if not exists max_reviews_shown integer default 6;

-- ── 7. Allow admin to update their own kitchen (branding save) ─
drop policy if exists "Admin updates own kitchen" on kitchens;
create policy "Admin updates own kitchen"
  on kitchens for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and kitchen_id = kitchens.id
    )
  );

-- ── Done ──────────────────────────────────────────────────────
