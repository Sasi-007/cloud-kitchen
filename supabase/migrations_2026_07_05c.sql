-- Add custom_requests table
create table if not exists custom_requests (
  id          bigint generated always as identity primary key,
  kitchen_id  uuid references kitchens(id) on delete cascade,
  name        text not null,
  phone       text not null,
  event_type  text,
  event_date  date,
  people      integer,
  requirements text,
  status      text default 'new' check (status in ('new','reviewing','quoted','confirmed','rejected')),
  created_at  timestamptz default now()
);
alter table custom_requests enable row level security;
create policy "Anyone can submit custom request" on custom_requests for insert with check (true);
create policy "Admin reads own kitchen requests" on custom_requests for select
  using (exists (select 1 from profiles where id = auth.uid() and kitchen_id = custom_requests.kitchen_id));
create policy "Admin updates own kitchen requests" on custom_requests for update
  using (exists (select 1 from profiles where id = auth.uid() and kitchen_id = custom_requests.kitchen_id));
