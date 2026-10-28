'use client';

import type { ReactNode } from 'react';
import type { Player } from '@/lib/types';

export type Color = 'green' | 'cyan' | 'coral' | 'yellow';

/** Varje del har sin egen färgvärld: bakgrund och kortfärg. Del 1–3 matchar skärmarna mellan delarna. */
const PART_THEME: { bg: Color; card: Color }[] = [
  { bg: 'green', card: 'cyan' },
  { bg: 'cyan', card: 'yellow' },
  { bg: 'coral', card: 'green' },
  { bg: 'yellow', card: 'coral' },
];
export const partTheme = (part: number) => PART_THEME[Math.min(Math.max(part, 1), 4) - 1];

export function Screen({ bg, center, children }: { bg: Color; center?: boolean; children: ReactNode }) {
  return (
    <main className={`screen ${bg}`}>
      <div className={`column${center ? ' center' : ''}`}>{children}</div>
    </main>
  );
}

export function Avatar({ player, big }: { player: Pick<Player, 'name' | 'selfie'>; big?: boolean }) {
  const cls = `avatar${big ? ' big' : ''}`;
  if (player.selfie) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={cls} src={player.selfie} alt="" />;
  }
  return <span className={cls}>{player.name.slice(0, 1).toUpperCase()}</span>;
}

export function Spinner() {
  return <div className="spinner" role="status" aria-label="Laddar" />;
}

export function Toast({ message }: { message: string | null }) {
  return message ? (
    <div className="toast" role="alert">
      {message}
    </div>
  ) : null;
}

const KIND_ICON = {
  vem: '<circle cx="17" cy="17" r="6"/><path d="M6 40c0-9 22-9 22 0"/><circle cx="34" cy="20" r="5"/><path d="M29 40c1-7 14-7 14 0"/>',
  direkt:
    '<path d="M7 9h34a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H22l-9 8v-8H7a3 3 0 0 1-3-3V12a3 3 0 0 1 3-3z"/><circle cx="14" cy="21.5" r="1.9" fill="currentColor"/><circle cx="24" cy="21.5" r="1.9" fill="currentColor"/><circle cx="34" cy="21.5" r="1.9" fill="currentColor"/>',
  trivia: '<circle cx="24" cy="24" r="19"/><path d="M18 19c0-8 13-8 13 0 0 6-7 6-7 12"/><circle cx="24" cy="37" r="1.9" fill="currentColor"/>',
  utmaning: '<path d="M27 3 10 27h12l-3 18 19-26H26z"/>',
  minigame:
    '<rect x="6" y="6" width="36" height="36" rx="8"/><circle cx="16" cy="16" r="2.3" fill="currentColor"/><circle cx="32" cy="16" r="2.3" fill="currentColor"/><circle cx="24" cy="24" r="2.3" fill="currentColor"/><circle cx="16" cy="32" r="2.3" fill="currentColor"/><circle cx="32" cy="32" r="2.3" fill="currentColor"/>',
  bild: '<path d="M5 15a3 3 0 0 1 3-3h7l3-5h12l3 5h7a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/><circle cx="24" cy="26" r="8"/>',
} as const;

export type Kind = keyof typeof KIND_ICON;

const KIND_LABEL: Record<Kind, string> = {
  vem: 'Alla röstar!',
  direkt: 'Direkt fråga',
  trivia: 'Trivia ?',
  utmaning: 'Utmaning',
  minigame: 'Minigame',
  bild: 'Vems är bilden?',
};

/** Svart tagg överst på kortet: ikon och korttyp. */
export function KindTag({ kind }: { kind: Kind }) {
  return (
    <span className="kind">
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: KIND_ICON[kind] }}
      />
      {KIND_LABEL[kind]}
    </span>
  );
}
