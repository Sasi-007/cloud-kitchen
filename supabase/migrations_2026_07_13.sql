-- ============================================================
-- MIGRATIONS 2026-07-13
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Coupon system ─────────────────────────────────────────
create table if not exists coupons (
  id          bigint generated always as identity primary key,
  kitchen_id  uuid references kitchens(id) on delete cascade,
  code        text not null,
  type        text not null check (type in ('percent','flat')),
  value       integer not null,        -- % or ₹ amount
  min_order   integer default 0,       -- minimum cart value to apply
  max_uses    integer default 1,       -- how many times this code can be used
  used_count  integer default 0,
  active      boolean default true,
  created_at  timestamptz default now(),
  unique(kitchen_id, code)
);
alter table coupons enable row level security;
create policy "Admin manages own coupons"
  on coupons for all
  using (exists (select 1 from profiles where id = auth.uid() and kitchen_id = coupons.kitchen_id));
create policy "Anyone reads coupons"
  on coupons for select using (true);

-- Track coupon on orders
alter table orders add column if not exists coupon_code     text;
alter table orders add column if not exists discount_amount integer default 0;

-- ── 2. Today's Special (promotions) ──────────────────────────
create table if not exists promotions (
  id          bigint generated always as identity primary key,
  kitchen_id  uuid references kitchens(id) on delete cascade,
  title       text not null,
  description text,
  type        text default 'offer' check (type in ('offer','menu','notice')),
  expires_at  timestamptz,             -- auto set to end of day by app
  created_at  timestamptz default now()
);
alter table promotions enable row level security;
create policy "Admin manages own promotions"
  on promotions for all
  using (exists (select 1 from profiles where id = auth.uid() and kitchen_id = promotions.kitchen_id));
create policy "Anyone reads active promotions"
  on promotions for select using (expires_at is null or expires_at > now());

-- ── 3. Dynamic menu categories ───────────────────────────────
create table if not exists menu_categories (
  id          bigint generated always as identity primary key,
  kitchen_id  uuid references kitchens(id) on delete cascade,
  name        text not null,
  sort_order  integer default 0,
  created_at  timestamptz default now(),
  unique(kitchen_id, name)
);
alter table menu_categories enable row level security;
create policy "Admin manages own categories"
  on menu_categories for all
  using (exists (select 1 from profiles where id = auth.uid() and kitchen_id = menu_categories.kitchen_id));
create policy "Anyone reads categories"
  on menu_categories for select using (true);

-- ── 4. Delivery charge columns (if not added already) ────────
alter table kitchens add column if not exists delivery_fee        integer default 50;
alter table kitchens add column if not exists free_delivery_above integer default 1000;

-- ── Done ──────────────────────────────────────────────────────
