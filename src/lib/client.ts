'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Action, GameView } from './types';

export interface Creds {
  playerId: string;
  token: string;
}

const credsKey = (code: string) => `goat:${code.toUpperCase()}`;

export function loadCreds(code: string): Creds | null {
  try {
    const raw = localStorage.getItem(credsKey(code));
    return raw ? (JSON.parse(raw) as Creds) : null;
  } catch {
    return null;
  }
}

export function saveCreds(code: string, creds: Creds) {
  try {
    localStorage.setItem(credsKey(code), JSON.stringify(creds));
  } catch {
    // Privat läge – spelet funkar ändå tills sidan laddas om.
  }
}

export function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignoreras
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store', ...init });
  } catch {
    throw new ApiError('Ingen uppkoppling – försök igen', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? 'Något gick fel', res.status);
  return data as T;
}

export const api = {
  create: (name: string) =>
    request<{ code: string } & Creds>('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
  join: (code: string, name: string) =>
    request<{ code: string } & Creds>(`/api/games/${encodeURIComponent(code)}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
  view: (code: string, creds: Creds | null) =>
    request<GameView>(`/api/games/${encodeURIComponent(code)}?playerId=${encodeURIComponent(creds?.playerId ?? '')}`, {
      headers: creds ? { 'x-goat-token': creds.token } : {},
    }),
  action: (code: string, creds: Creds, action: Action) =>
    request<GameView>(`/api/games/${encodeURIComponent(code)}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goat-token': creds.token },
      body: JSON.stringify({ playerId: creds.playerId, action }),
    }),
  upload: (code: string, creds: Creds, file: Blob, purpose: 'selfie' | 'bild') => {
    const form = new FormData();
    form.append('file', file, 'bild.jpg');
    form.append('playerId', creds.playerId);
    form.append('purpose', purpose);
    return request<GameView>(`/api/games/${encodeURIComponent(code)}/upload`, {
      method: 'POST',
      headers: { 'x-goat-token': creds.token },
      body: form,
    });
  },
};

/** Krymper bilden i mobilen innan den laddas upp, så att det går snabbt. */
export async function compressImage(file: File, maxSize = 1000): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Kunde inte läsa bilden'));
      el.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Kunde inte spara bilden'))), 'image/jpeg', 0.82),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

let browserClient: SupabaseClient | null | undefined;

/** Supabase i webbläsaren – används bara för att lyssna på "något har ändrats". */
export function getBrowserSupabase(): SupabaseClient | null {
  if (browserClient === undefined) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    browserClient = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  }
  return browserClient;
}

let audio: AudioContext | null = null;

/** Liten signal + vibration när det blir din tur. */
export function notifyTurn() {
  try {
    navigator.vibrate?.([120, 60, 120]);
  } catch {
    // stöds inte (t.ex. iPhone)
  }
  try {
    audio ??= new AudioContext();
    const now = audio.currentTime;
    [660, 880].forEach((freq, i) => {
      const osc = audio!.createOscillator();
      const gain = audio!.createGain();
      osc.frequency.value = freq;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.0001, now + i * 0.13);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.13 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.13 + 0.12);
      osc.connect(gain).connect(audio!.destination);
      osc.start(now + i * 0.13);
      osc.stop(now + i * 0.13 + 0.14);
    });
  } catch {
    // ljud blockerat
  }
}
