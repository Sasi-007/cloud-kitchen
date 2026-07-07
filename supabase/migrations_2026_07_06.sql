-- Prep time timer, feedback visibility/manual, disputes
alter table orders add column if not exists estimated_minutes integer;
alter table orders add column if not exists timer_started_at  timestamptz;

alter table feedback add column if not exists visible_to_customer boolean default false;
alter table feedback add column if not exists is_manual          boolean default false;
alter table feedback add column if not exists manual_note        text;  -- admin note on manual feedback

create table if not exists disputes (
  id             bigint generated always as identity primary key,
  order_id       text references orders(id),
  kitchen_id     uuid references kitchens(id) on delete cascade,
  customer_name  text,
  customer_phone text,
  type           text check (type in ('payment','delivery','quality','other')),
  description    text,
  status         text default 'open' check (status in ('open','reviewing','resolved','closed')),
  created_at     timestamptz default now()
);
alter table disputes enable row level security;
create policy "Anyone can raise dispute"   on disputes for insert with check (true);
create policy "Anyone can read own dispute" on disputes for select using (true);
create policy "Admin manages own disputes"  on disputes for update
  using (exists (select 1 from profiles where id = auth.uid() and kitchen_id = disputes.kitchen_id));
