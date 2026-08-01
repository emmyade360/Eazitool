'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface DownloadItem {
  url: string;
  name: string;
  sizeBytes?: number;
}

/**
 * Owns object-URL lifecycle for a tool's output. Every previous URL is revoked
 * when replaced and on unmount, which the per-tool implementations kept getting
 * subtly wrong.
 */
export function useDownloadResult() {
  const [result, setResultState] = useState<DownloadItem | null>(null);
  const currentUrl = useRef<string | null>(null);

  const revoke = useCallback(() => {
    if (currentUrl.current) {
      URL.revokeObjectURL(currentUrl.current);
      currentUrl.current = null;
    }
  }, []);

  const setResult = useCallback(
    (item: DownloadItem | null) => {
      revoke();
      currentUrl.current = item?.url ?? null;
      setResultState(item);
    },
    [revoke],
  );

  const setResultFromBlob = useCallback(
    (blob: Blob, name: string) => {
      setResult({ url: URL.createObjectURL(blob), name, sizeBytes: blob.size });
    },
    [setResult],
  );

  const clear = useCallback(() => setResult(null), [setResult]);

  useEffect(() => revoke, [revoke]);

  return { result, setResult, setResultFromBlob, clear };
}
