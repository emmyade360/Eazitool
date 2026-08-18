'use client';

import { useCallback, useState } from 'react';
import { submitReview } from '@/lib/reviews';

/**
 * Wraps the modal-open / documentType / submit triplet that every tool page
 * previously re-implemented. Gating to once-per-day lives in ReviewModal.
 */
export function useReviewPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [documentType, setDocumentType] = useState('');

  const promptReview = useCallback((docType: string) => {
    setDocumentType(docType);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const onSubmit = useCallback(
    async (review: { rating: number; comment: string; documentType: string }) => {
      await submitReview({
        document_type: review.documentType,
        rating: review.rating,
        comment: review.comment || undefined,
      });
      setIsOpen(false);
    },
    [],
  );

  return {
    promptReview,
    reviewModalProps: { isOpen, onClose: close, onSubmit, documentType },
  };
}
