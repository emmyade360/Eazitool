-- Run this SQL in your Supabase SQL Editor to create the reviews table

create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  document_type text not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  user_email text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.reviews enable row level security;

-- Allow anonymous inserts (since users might not be authenticated)
create policy "Allow anonymous inserts" on public.reviews
  for insert to anon
  with check (true);

-- Allow reading reviews
create policy "Allow reading reviews" on public.reviews
  for select to anon
  using (true);

-- Index for faster queries
create index if not exists idx_reviews_document_type on public.reviews(document_type);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);
