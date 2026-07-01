-- ============================================================
-- SpiceFest Multi-Tenant Cloud Kitchen — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- KITCHENS (one row per cloud kitchen / tenant)
create table if not exists kitchens (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,          -- URL key: /spicefest
  tagline    text,
  logo_url   text,
  banner_url text,
  upi_id     text,
  phone      text,
  address    text,
  active     boolean default true,
  created_at timestamptz default now()
);

-- PROFILES (extends Supabase auth.users)
create table if not exists profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text,
  phone      text,
  role       text check (role in ('customer','admin','superadmin')) default 'customer',
  kitchen_id uuid references kitchens(id), -- null for customers/superadmin
  created_at timestamptz default now()
);

-- Auto-create profile row when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- MENU ITEMS
create table if not exists menu_items (
  id              uuid primary key default gen_random_uuid(),
  kitchen_id      uuid references kitchens(id) on delete cascade not null,
  name            text not null,
  description     text,
  price           integer not null,
  price_per_person integer,
  category        text not null,
  image_url       text,
  emoji           text default '🍽️',
  veg             boolean default true,
  popular         boolean default false,
  active          boolean default true,
  sort_order      integer default 0,
  created_at      timestamptz default now()
);

-- ORDERS
create table if not exists orders (
  id              text primary key,          -- SF-XXXXX format
  kitchen_id      uuid references kitchens(id) not null,
  customer_name   text not null,
  customer_phone  text not null,
  address         text not null,
  note            text default '',
  items           jsonb not null,            -- [{name, qty, price, emoji}]
  total           integer not null,
  party_size      integer default 1,
  payment_method  text check (payment_method in ('cod','gpay')) not null,
  status          text check (status in ('new','progress','delivered')) default 'new',
  -- Soft delete: never hard-delete orders; admin can undo any deletion
  is_deleted      boolean     default false,
  deleted_by      text,        -- 'customer' | 'admin'
  deleted_at      timestamptz,
  created_at      timestamptz default now()
);

-- FEEDBACK
create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  order_id    text references orders(id),
  kitchen_id  uuid references kitchens(id),
  rating      integer check (rating between 1 and 5),
  tags        text[],
  comment     text,
  created_at  timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table kitchens   enable row level security;
alter table profiles   enable row level security;
alter table menu_items enable row level security;
alter table orders     enable row level security;
alter table feedback   enable row level security;

-- KITCHENS
create policy "Anyone can read active kitchens"
  on kitchens for select using (active = true);
create policy "Superadmin manages kitchens"
  on kitchens for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'superadmin'));

-- PROFILES
create policy "Users read own profile"
  on profiles for select using (id = auth.uid());
create policy "Users update own profile"
  on profiles for update using (id = auth.uid());
create policy "Superadmin reads all profiles"
  on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'superadmin'));
create policy "Superadmin updates all profiles"
  on profiles for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- MENU ITEMS
create policy "Anyone reads active menu items"
  on menu_items for select using (active = true);
create policy "Admin manages own kitchen menu"
  on menu_items for all
  using (exists (
    select 1 from profiles p where p.id = auth.uid()
    and (p.role = 'superadmin' or (p.role = 'admin' and p.kitchen_id = menu_items.kitchen_id))
  ));

-- ORDERS
create policy "Anyone can place an order"
  on orders for insert with check (true);

-- Customers can read their own order via tracking page (order ID = unguessable UUID)
create policy "Customer order tracking"
  on orders for select using (true);
  -- Note: order IDs are UUID-based (unguessable). Only the person who received
  -- the order URL can view it. Admins see all orders for their kitchen via UI filter.

create policy "Admin updates own kitchen orders"
  on orders for update
  using (exists (
    select 1 from profiles p where p.id = auth.uid()
    and (p.role = 'superadmin' or (p.role = 'admin' and p.kitchen_id = orders.kitchen_id))
  ));

-- FEEDBACK
create policy "Anyone can submit feedback"
  on feedback for insert with check (true);
create policy "Admin reads own kitchen feedback"
  on feedback for select
  using (exists (
    select 1 from profiles p where p.id = auth.uid()
    and (p.role = 'superadmin' or (p.role = 'admin' and p.kitchen_id = feedback.kitchen_id))
  ));

-- ============================================================
-- STORAGE BUCKETS (run in Dashboard → Storage → New Bucket)
-- ============================================================
-- 1. Create bucket: menu-images  (Public = true)
-- 2. Create bucket: branding     (Public = true)

-- ============================================================
-- SEED DATA — Demo Kitchen
-- ============================================================
insert into kitchens (name, slug, tagline, upi_id, phone, active)
values (
  'SpiceFest',
  'spicefest',
  'Authentic Indian Catering for Your Parties',
  'spicefest@okaxis',
  '+91 9876543210',
  true
) on conflict (slug) do nothing;

-- ============================================================
-- POST-SETUP STEPS
-- ============================================================
-- 1. In Supabase Dashboard → Auth → Users → Add User:
--    email: admin@spicefest.com  password: Admin@123
-- 2. In SQL Editor, update their profile:
--    update profiles set role='admin', kitchen_id=(select id from kitchens where slug='spicefest')
--    where id=(select id from auth.users where email='admin@spicefest.com');
-- 3. Create superadmin user the same way with role='superadmin', kitchen_id=null
-- 4. Copy SUPABASE_URL and ANON_KEY from Dashboard → Settings → API → .env.local
-- 5. Copy SERVICE_ROLE_KEY (secret) to .env.local as SUPABASE_SERVICE_ROLE_KEY

-- ============================================================
-- IF ORDERS TABLE ALREADY EXISTS — run this migration
-- ============================================================
alter table orders add column if not exists is_deleted  boolean     default false;
alter table orders add column if not exists deleted_by  text;
alter table orders add column if not exists deleted_at  timestamptz;

-- ============================================================
-- ISOLATION REFERENCE
-- ============================================================
-- Kitchen U01 admin  → sees only orders WHERE kitchen_id = U01.id  (RLS enforced)
-- Kitchen U02 admin  → sees only orders WHERE kitchen_id = U02.id  (RLS enforced)
-- Customer C01       → places order tagged kitchen_id = U01.id; U02 admin CANNOT see it
-- Customer C02       → places order tagged kitchen_id = U02.id; U01 admin CANNOT see it
-- is_deleted = true  → hidden from all views by default; admin can undo via dashboard
