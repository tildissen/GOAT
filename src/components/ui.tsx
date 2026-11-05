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

/** Ikoner i samma lösa, handritade streckstil som G.O.A.T.-ikonen: runda ändar, inga fyllningar och lite sneda linjer. */
const ICONS = {
  vem:
    '<path d="M17 9C23 8 26 14 24 19C22 24 14 24 12 19C10 14 12 10 17 9Z"/><path d="M5 41C5 31 12 27 18 27C24 27 29 31 29 41"/><path d="M35 14C39 13 42 17 40 21C38 25 32 24 31 20C30 17 32 14 35 14Z"/><path d="M31 35C33 31 38 30 43 32C44 35 44 38 44 40"/>',
  direkt:
    '<path d="M8 9C17 7 31 7 40 9C44 10 45 13 45 17L44 28C44 32 41 34 37 34L24 35L15 43C14 44 13 43 13 41L13 35C9 34 5 33 5 29L5 16C5 12 6 10 8 9Z"/><circle cx="16" cy="22" r="1.9" fill="currentColor"/><circle cx="25" cy="22.5" r="1.9" fill="currentColor"/><circle cx="34" cy="22" r="1.9" fill="currentColor"/>',
  trivia:
    '<path d="M24 5C35 4 44 13 43 25C42 36 33 44 23 43C12 42 5 34 5 24C5 14 13 6 24 5Z"/><path d="M17 19C17 11 31 11 31 19C31 25 24 25 24 31"/><circle cx="24" cy="37.5" r="1.9" fill="currentColor"/>',
  utmaning:
    '<path d="M28 4C24 12 18 21 11 28C17 28 21 27 22 27C21 33 19 40 17 44C24 38 31 30 38 20C32 21 29 21 26 21C28 15 29 9 28 4Z"/>',
  minigame:
    '<path d="M10 6C19 5 30 5 39 6C43 7 43 11 43 16C44 24 44 32 43 38C42 43 38 43 33 43C25 44 18 44 11 43C6 42 5 38 5 33C4 25 4 17 5 11C6 7 8 6 10 6Z"/><circle cx="16" cy="16" r="2.2" fill="currentColor"/><circle cx="32" cy="16" r="2.2" fill="currentColor"/><circle cx="24" cy="24" r="2.2" fill="currentColor"/><circle cx="16" cy="32" r="2.2" fill="currentColor"/><circle cx="32" cy="32" r="2.2" fill="currentColor"/>',
  bild:
    '<path d="M6 16C6 13 8 12 11 12L16 12L19 7C22 6 27 6 30 7L33 12L38 12C41 12 43 13 43 16L43 36C43 39 41 40 38 40L11 40C8 40 6 39 6 36Z"/><path d="M25 19C31 19 34 24 33 29C31 34 25 35 21 33C16 30 17 22 25 19Z"/>',
  aw:
    '<path d="M6 17C6 15 8 14 10 14L38 14C41 14 43 15 43 17L43 37C43 40 41 41 38 41L10 41C7 41 6 40 6 37Z"/><path d="M18 14L18 9C18 7 20 6 22 6L27 6C29 6 31 7 31 9L31 14"/><path d="M6 25C17 28 31 28 43 25"/><path d="M22 25L22 30L27 30L27 25"/>',
  familj:
    '<path d="M15 8C19 8 21 12 20 15C18 19 12 18 11 14C11 10 13 8 15 8Z"/><path d="M5 41C5 31 9 26 15 26C21 26 25 31 25 41"/><path d="M34 25C37 25 39 28 38 30C36 34 30 33 30 29C30 27 32 25 34 25Z"/><path d="M27 41C27 37 30 35 34 35C38 35 41 37 41 41"/>',
  fest:
    '<path d="M5 43L14 17C15 15 17 15 18 16L31 29C32 30 32 32 30 32Z"/><path d="M10 29L20 36"/><path d="M24 9C26 5 28 11 30 7"/><path d="M35 18C38 15 40 21 43 17"/><path d="M25 22C28 20 33 16 35 11"/><circle cx="37" cy="6" r="1.8" fill="currentColor"/><circle cx="43" cy="26" r="1.8" fill="currentColor"/>',
  trofe:
    '<path d="M14 6L34 6C34 20 32 28 24 29C16 28 14 20 14 6Z"/><path d="M14 9C6 9 6 18 15 20"/><path d="M34 9C42 9 42 18 33 20"/><path d="M24 29L24 37"/><path d="M15 43C20 41 28 41 33 43"/><path d="M17 37L31 37"/>',
} as const;

export type IconName = keyof typeof ICONS;
export type Kind = 'vem' | 'direkt' | 'trivia' | 'utmaning' | 'minigame' | 'bild';

export function Icon({ name, size = 24, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}

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
      <Icon name={kind} size={22} />
      {KIND_LABEL[kind]}
    </span>
  );
}
