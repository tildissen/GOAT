'use client';

import type { Action, Choice, GameView, Player, PublicState } from '@/lib/types';
import { Avatar } from '../ui';

export interface GameProps {
  view: GameView;
  state: PublicState;
  me: Player;
  isLeader: boolean;
  busy: boolean;
  act: (action: Action) => Promise<boolean>;
  upload: (file: Blob, purpose: 'selfie' | 'bild') => Promise<boolean>;
  code: string;
}

export const PART_WORDS = ['ett', 'två', 'tre', 'fyra'];

export const sipsText = (n: number) => `${n} ${n === 1 ? 'klunk' : 'klunkar'}`;

export function nameOf(state: PublicState, id: string): string {
  return state.players.find((p) => p.id === id)?.name ?? '?';
}

export function possessive(name: string): string {
  return /[sxz]$/i.test(name) ? name : `${name}s`;
}

export const CHOICE_TEXT: Record<Choice, (sips: number) => string> = {
  drink: (n) => `drack ${sipsText(n)}`,
  save: (n) => `sparade ${sipsText(n)}`,
  challenge: () => 'drog ett utmaningskort',
  answered: () => 'svarade',
};

/** De tre knapparna: dricka, spara eller dra ett utmaningskort. */
export function ChoiceButtons({
  sips,
  act,
  busy,
  extra,
  prompt,
}: {
  sips: number;
  act: GameProps['act'];
  busy: boolean;
  extra?: React.ReactNode;
  /** Rubrik ovanför knapparna, t.ex. "Vill du hoppa över?" */
  prompt?: string;
}) {
  return (
    <div className="actions">
      {extra}
      {prompt && <p className="choice-prompt">{prompt}</p>}
      <button className="btn yellow" disabled={busy} onClick={() => act({ type: 'choose', choice: 'drink' })}>
        Jag dricker {sipsText(sips)}
      </button>
      <button className="btn yellow" disabled={busy} onClick={() => act({ type: 'choose', choice: 'save' })}>
        {sips === 1 ? 'Jag vill spara min klunk' : `Jag vill spara ${sips} klunkar`}
      </button>
      <button className="btn yellow" disabled={busy} onClick={() => act({ type: 'choose', choice: 'challenge' })}>
        Dra ett utmaningskort
      </button>
    </div>
  );
}

export function Board({ state, active, meId }: { state: PublicState; active: string[]; meId: string }) {
  const players = [...state.players].filter((p) => p.ready).sort((a, b) => b.saved - a.saved || b.drank - a.drank);
  return (
    <div className="board">
      {players.map((p) => (
        <div key={p.id} className={`board-row${p.id === meId ? ' me' : ''}${active.includes(p.id) ? '' : ' offline'}`}>
          <Avatar player={p} />
          <span className="name">{p.name}</span>
          <span className="stat">
            sparat <strong>{p.saved}</strong>
            <br />
            druckit <strong>{p.drank}</strong>
          </span>
        </div>
      ))}
    </div>
  );
}

export function Stats({ state }: { state: PublicState }) {
  const players = state.players.filter((p) => p.ready);
  if (players.length === 0) return null;
  const top = (key: 'drank' | 'votesReceived' | 'challenges' | 'saved') =>
    [...players].sort((a, b) => b[key] - a[key])[0];
  const rows = [
    { label: 'Drack mest', p: top('drank'), value: (p: Player) => sipsText(p.drank) },
    { label: 'Fick flest röster', p: top('votesReceived'), value: (p: Player) => `${p.votesReceived} röster` },
    { label: 'Flest utmaningar', p: top('challenges'), value: (p: Player) => `${p.challenges} st` },
  ].filter((r) => r.p && r.value(r.p) && !r.value(r.p).startsWith('0 '));
  return (
    <div className="board">
      {rows.map((r) => (
        <div key={r.label} className="board-row">
          <Avatar player={r.p} />
          <span className="name">
            {r.label}: {r.p.name}
          </span>
          <span className="stat">{r.value(r.p)}</span>
        </div>
      ))}
      {[...players]
        .sort((a, b) => b.drank - a.drank)
        .map((p) => (
          <div key={p.id} className="board-row" style={{ fontSize: 16, padding: '4px 14px' }}>
            <span className="name" style={{ fontWeight: 400 }}>
              {p.name}
            </span>
            <span className="stat">{sipsText(p.drank)}</span>
          </div>
        ))}
    </div>
  );
}
