-- Run this SQL in your Supabase Dashboard → SQL Editor
-- Then click "Run"

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (users don't need to be logged in)
CREATE POLICY "Allow anonymous inserts" ON public.reviews
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow reading reviews
CREATE POLICY "Allow reading reviews" ON public.reviews
  FOR SELECT TO anon
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_document_type ON public.reviews(document_type);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Done! You should see "Success. No rows returned" message.
