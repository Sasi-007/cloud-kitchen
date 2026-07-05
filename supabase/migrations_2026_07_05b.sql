-- ============================================================
-- MIGRATIONS 2026-07-05b — Payment Tracking
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

alter table orders add column if not exists payment_status  text default 'pending'
  check (payment_status in ('pending', 'partial', 'confirmed'));

alter table orders add column if not exists amount_received integer default 0;
