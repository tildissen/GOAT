'use client';

import type { ReactNode } from 'react';
import type { Player } from '@/lib/types';

export type Color = 'green' | 'cyan' | 'coral' | 'yellow';

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
