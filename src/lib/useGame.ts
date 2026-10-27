'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, getBrowserSupabase, type Creds } from './client';
import type { Action, GameView } from './types';

export function useGame(code: string, creds: Creds | null) {
  const [view, setView] = useState<GameView | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const versionRef = useRef(-1);

  const accept = useCallback((next: GameView) => {
    if (next.version < versionRef.current) return;
    versionRef.current = next.version;
    setView(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      accept(await api.view(code, creds));
      setLoadError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0) setLoadError(err);
    }
  }, [accept, code, creds]);

  const act = useCallback(
    async (action: Action) => {
      if (!creds) return false;
      setBusy(true);
      try {
        accept(await api.action(code, creds, action));
        return true;
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Något gick fel');
        refresh();
        return false;
      } finally {
        setBusy(false);
      }
    },
    [accept, code, creds, refresh],
  );

  const upload = useCallback(
    async (file: Blob, purpose: 'selfie' | 'bild') => {
      if (!creds) return false;
      setBusy(true);
      try {
        accept(await api.upload(code, creds, file, purpose));
        return true;
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Uppladdningen misslyckades');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [accept, code, creds],
  );

  // Realtime: servern skickar en signal när något ändras.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel(`game-${code}`)
      .on('broadcast', { event: 'update' }, ({ payload }) => {
        if (typeof payload?.version !== 'number' || payload.version > versionRef.current) refresh();
      })
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, refresh]);

  // Hämtar regelbundet ändå – håller dig "uppkopplad" och fångar missade signaler.
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, live ? 8000 : 2000);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh, live]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  return { view, loadError, act, upload, busy, toast, setToast };
}
