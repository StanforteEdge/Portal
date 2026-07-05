import { useState, useEffect, useCallback, useRef } from 'react';
import { mailApi } from '@/shared/lib/core';
import type { MailHeader } from '@stanforte/shared';

const PAGE_SIZE = 50;

export function useMailHeaders(accountId: string | null, folder: string) {
  const [headers, setHeaders] = useState<MailHeader[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);

  const loadPage = useCallback(async (p: number, reset: boolean) => {
    if (!accountId) return;
    setLoading(true);
    try {
      const result = await mailApi.listHeaders(accountId, folder, p, PAGE_SIZE);
      const data = (result as any)?.data ?? result ?? [];
      if (reset) setHeaders(data);
      else setHeaders(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      pageRef.current = p;
    } finally {
      setLoading(false);
    }
  }, [accountId, folder]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    void loadPage(1, true);
  }, [accountId, folder]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    const next = pageRef.current + 1;
    setPage(next);
    void loadPage(next, false);
  }, [loadPage]);

  const refresh = useCallback(() => {
    setPage(1);
    void loadPage(1, true);
  }, [loadPage]);

  return { headers, loading, loadMore, hasMore, refresh };
}
