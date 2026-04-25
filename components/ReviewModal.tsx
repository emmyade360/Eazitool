'use client';

import { useEffect, useState } from 'react';
import { hasReviewedToday, markReviewed } from '@/lib/review-gate';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: { rating: number; comment: string; documentType: string }) => void;
  documentType: string;
}

export default function ReviewModal({ isOpen, onClose, onSubmit, documentType }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [blockedForToday, setBlockedForToday] = useState(false);

  // Auto-dismiss if this tool was already reviewed today
  useEffect(() => {
    if (!isOpen) {
      setBlockedForToday(false);
      return;
    }

    const alreadyReviewed = hasReviewedToday(documentType);
    setBlockedForToday(alreadyReviewed);
    if (alreadyReviewed) {
      onClose();
    }
  }, [isOpen, documentType, onClose]);

  // Don't render if not open or already reviewed (second open same day)
  if (!isOpen || blockedForToday) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    try {
      await onSubmit({ rating, comment, documentType });
      markReviewed(documentType);
      setRating(0);
      setHovered(0);
      setComment('');
      onClose();
    } catch {
      // parent swallows errors
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    markReviewed(documentType);
    setRating(0);
    setHovered(0);
    setComment('');
    onClose();
  };

  const ratingLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Great',
    5: 'Excellent',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="rounded-t-2xl bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-5 text-white">
          <div className="mb-1 flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-bold">Help Us Improve</h3>
          </div>
          <p className="text-sm text-orange-100">What can we do to better your experience?</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Star rating */}
          <div className="mb-5">
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              How would you rate this tool?
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} out of 5`}
                >
                  <svg
                    className={`h-9 w-9 transition-colors ${
                      star <= (hovered || rating) ? 'text-orange-400' : 'text-slate-200'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.949.684h4.756c.969 0 1.371 1.24.588 1.81l-3.833 2.785a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.833-2.785a1 1 0 00-1.176 0l-3.833 2.785c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.236 10.1c-.784-.57-.38-1.81.588-1.81h4.756a1 1 0 00.949-.684l1.52-4.679z" />
                  </svg>
                </button>
              ))}
              {(hovered || rating) > 0 && (
                <span className="ml-2 text-sm font-semibold text-orange-500">
                  {ratingLabels[hovered || rating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tell us more{' '}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              placeholder="Any suggestions or feedback to help us improve..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={rating === 0 || submitting}
              className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-100 transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Sending...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
