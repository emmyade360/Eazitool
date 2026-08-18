export type Review = {
  id?: string;
  document_type: string;
  rating: number;
  comment?: string;
  user_email?: string;
  created_at?: string;
};

/** Submits a review via the server-side API route (avoids client-side auth issues). */
export async function submitReview(review: Omit<Review, 'id' | 'created_at'>): Promise<void> {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: unknown };
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Could not save feedback.');
  }
}
