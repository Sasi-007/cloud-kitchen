-- Extend custom_requests to support structured items with per-item notes
alter table custom_requests add column if not exists items    jsonb default '[]';
alter table custom_requests add column if not exists address  text;
alter table custom_requests add column if not exists total    integer default 0;

-- Checkout schedule fields used by customer/admin order screens
alter table orders add column if not exists delivery_date date;
alter table orders add column if not exists delivery_time text;
