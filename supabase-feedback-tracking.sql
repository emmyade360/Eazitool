-- Run this once in Supabase Dashboard → SQL Editor.
-- It creates private, persistent feedback and visitor-tracking storage.

create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  document_type text not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  user_email text,
  created_at timestamptz default now()
);

create table if not exists public.visitors (
  id uuid primary key,
  ip_hash text not null,
  user_agent text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  visit_count integer not null default 0 check (visit_count >= 0),
  last_path text
);

create table if not exists public.visits (
  id uuid default gen_random_uuid() primary key,
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  path text not null,
  visited_at timestamptz not null default now()
);

alter table public.reviews add column if not exists visitor_id uuid references public.visitors(id) on delete set null;

-- Reviews are inserted and read only by Eazitool's server using the service-role key.
-- Remove the old public read/insert policies if an earlier review setup was used.
alter table public.reviews enable row level security;
alter table public.visitors enable row level security;
alter table public.visits enable row level security;
drop policy if exists "Allow anonymous inserts" on public.reviews;
drop policy if exists "Allow reading reviews" on public.reviews;

create index if not exists idx_reviews_created_at on public.reviews(created_at desc);
create index if not exists idx_reviews_document_type on public.reviews(document_type);
create index if not exists idx_reviews_visitor_id on public.reviews(visitor_id);
create index if not exists idx_visitors_last_seen_at on public.visitors(last_seen_at desc);
create index if not exists idx_visits_visitor_id_visited_at on public.visits(visitor_id, visited_at desc);

create or replace function public.record_visitor_visit(
  p_visitor_id uuid,
  p_ip_hash text,
  p_path text,
  p_user_agent text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.visitors (id, ip_hash, user_agent, visit_count, last_path)
  values (p_visitor_id, p_ip_hash, p_user_agent, 1, p_path)
  on conflict (id) do update
    set ip_hash = excluded.ip_hash,
        user_agent = excluded.user_agent,
        last_seen_at = now(),
        visit_count = public.visitors.visit_count + 1,
        last_path = excluded.last_path;

  insert into public.visits (visitor_id, path) values (p_visitor_id, p_path);
end;
$$;

revoke all on function public.record_visitor_visit(uuid, text, text, text) from public;
revoke all on function public.record_visitor_visit(uuid, text, text, text) from anon;
revoke all on function public.record_visitor_visit(uuid, text, text, text) from authenticated;
grant execute on function public.record_visitor_visit(uuid, text, text, text) to service_role;
