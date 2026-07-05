import { useState, useEffect } from 'react';
import { useLocalDB } from '@stanforte/shared';
import { mailApi } from '@/shared/lib/core';

type CachedBody = { uid: string; html: string; cachedAt: number };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1_000;

export function useMailBody(accountId: string | null, uid: string | null, folder: string) {
  const db = useLocalDB();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId || !uid) { setHtml(null); return; }
    const cacheKey = `${accountId}:${folder}:${uid}`;
    let cancelled = false;

    async function fetchBody() {
      setLoading(true);
      try {
        const cached = await db.get<CachedBody>('mailBodies', cacheKey);
        if (cached && Date.now() - cached.cachedAt < THIRTY_DAYS_MS) {
          if (!cancelled) setHtml(cached.html);
          return;
        }
        const result = await mailApi.getMessage(accountId!, uid!, folder);
        const rawHtml = (result as any)?.html ?? (result as any)?.data?.html ?? '';
        if (cancelled) return;
        setHtml(rawHtml);
        await db.put<CachedBody>('mailBodies', { uid: cacheKey, html: rawHtml, cachedAt: Date.now() });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchBody();
    return () => { cancelled = true; };
  }, [accountId, uid, folder, db]);

  return { html, loading };
}
