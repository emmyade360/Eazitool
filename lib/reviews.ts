export type Review = {
  document_type: string;
  rating: number;
  comment?: string;
  user_email?: string;
};

/** Sends a review to Eazitool's persistent JSON feedback store. */
export async function submitReview(review: Review): Promise<void> {
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
