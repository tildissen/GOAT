'use client';

import type { Action, Choice, GameView, Player, PublicState } from '@/lib/types';
import { isFamily } from '@/lib/engine';
import { Avatar, Icon, type IconName } from '../ui';

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

/** "2 klunkar", eller "2 minuspoäng" i familjespel. */
export const sipsText = (n: number, family = false) =>
  family ? `${n} minuspoäng` : `${n} ${n === 1 ? 'klunk' : 'klunkar'}`;

export function nameOf(state: PublicState, id: string): string {
  return state.players.find((p) => p.id === id)?.name ?? '?';
}

export function possessive(name: string): string {
  return /[sxz]$/i.test(name) ? name : `${name}s`;
}

/** Vad någon valde, t.ex. "drack 2 klunkar" eller "fick 2 minuspoäng". */
export function choiceText(choice: Choice, sips: number, family = false): string {
  if (choice === 'drink') return family ? `fick ${sipsText(sips, true)}` : `drack ${sipsText(sips)}`;
  if (choice === 'save') return `sparade ${sipsText(sips)}`;
  return choice === 'challenge' ? 'drog ett utmaningskort' : 'svarade';
}

/** De tre knapparna: dricka, spara eller dra ett utmaningskort. I familjespel: ta minuspoäng eller dra ett utmaningskort. */
export function ChoiceButtons({
  sips,
  act,
  busy,
  extra,
  prompt,
  family = false,
}: {
  sips: number;
  act: GameProps['act'];
  busy: boolean;
  extra?: React.ReactNode;
  /** Rubrik ovanför knapparna, t.ex. "Vill du hoppa över?" */
  prompt?: string;
  family?: boolean;
}) {
  return (
    <div className="actions">
      {extra}
      {prompt && <p className="choice-prompt">{prompt}</p>}
      <button className="btn yellow" disabled={busy} onClick={() => act({ type: 'choose', choice: 'drink' })}>
        {family ? `Jag tar ${sipsText(sips, true)}` : `Jag dricker ${sipsText(sips)}`}
      </button>
      {!family && (
        <button className="btn yellow" disabled={busy} onClick={() => act({ type: 'choose', choice: 'save' })}>
          {sips === 1 ? 'Jag vill spara min klunk' : `Jag vill spara ${sips} klunkar`}
        </button>
      )}
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
          {isFamily(state) ? (
            <span className="stat">
              minuspoäng <strong>{p.drank}</strong>
            </span>
          ) : (
            <span className="stat">
              sparat <strong>{p.saved}</strong>
              <br />
              druckit <strong>{p.drank}</strong>
            </span>
          )}
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
  const family = isFamily(state);
  const fewest = [...players].sort((a, b) => a.drank - b.drank)[0];
  const rows = [
    ...(family
      ? [
          { label: 'Vinnare', icon: 'trofe' as IconName, p: fewest, value: (p: Player) => sipsText(p.drank, true), always: true },
          { label: 'Flest minuspoäng', p: top('drank'), value: (p: Player) => sipsText(p.drank, true) },
        ]
      : [{ label: 'Drack mest', p: top('drank'), value: (p: Player) => sipsText(p.drank) }]),
    { label: 'Fick flest röster', p: top('votesReceived'), value: (p: Player) => `${p.votesReceived} röster` },
    { label: 'Flest utmaningar', p: top('challenges'), value: (p: Player) => `${p.challenges} st` },
  ].filter((r) => r.p && ('always' in r || !r.value(r.p).startsWith('0 ')));
  return (
    <div className="board">
      {rows.map((r) => (
        <div key={r.label} className="board-row">
          <Avatar player={r.p} />
          <span className="name stat-name">
            <small>
              {'icon' in r && r.icon && <Icon name={r.icon} size={18} className="inline-icon" />}
              {r.label}
            </small>
            {r.p.name}
          </span>
          <span className="stat">{r.value(r.p)}</span>
        </div>
      ))}
      {[...players]
        .sort((a, b) => (family ? a.drank - b.drank : b.drank - a.drank))
        .map((p) => (
          <div key={p.id} className="board-row" style={{ fontSize: 16, padding: '4px 14px' }}>
            <span className="name" style={{ fontWeight: 400 }}>
              {p.name}
            </span>
            <span className="stat">{sipsText(p.drank, family)}</span>
          </div>
        ))}
    </div>
  );
}
