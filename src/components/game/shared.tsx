'use client';

import type { Action, Choice, GameView, Player, PublicState } from '@/lib/types';
import { usesPoints } from '@/lib/engine';
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
          {usesPoints(state) ? (
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

/**
 * Slutskärmens topp 3: en ruta per person, med det personen vann ("Fick flest röster" osv.) i rutan.
 * Vanligt spel: flest klunkar överst. Familjespel: minst minuspoäng överst (vinnaren).
 */
/** 1:a, 2:a, 3:e, 4:e, 11:e, 12:e, 21:a … */
export const ordinal = (n: number) => `${n}:${(n % 10 === 1 || n % 10 === 2) && n % 100 !== 11 && n % 100 !== 12 ? 'a' : 'e'}`;

export function Stats({ state, meId }: { state: PublicState; meId: string }) {
  const players = state.players.filter((p) => p.ready);
  if (players.length === 0) return null;
  const family = usesPoints(state);
  const leader = (key: 'drank' | 'votesReceived' | 'challenges') => {
    const best = [...players].sort((a, b) => b[key] - a[key])[0];
    return best && best[key] > 0 ? best.id : null;
  };
  const awards: [string | null, string][] = [
    [leader('drank'), family ? 'Flest minuspoäng' : 'Drack mest'],
    [leader('votesReceived'), 'Fick flest röster'],
    [leader('challenges'), 'Flest utmaningar'],
  ];
  const ranked = [...players].sort((a, b) => (family ? a.drank - b.drank : b.drank - a.drank)).slice(0, 3);
  // Plats: lika resultat delar plats, så "5:e" betyder att fyra personer var bättre.
  const better = (a: number, b: number) => (family ? a < b : a > b);
  const me = players.find((p) => p.id === meId);
  const myPlace = me ? 1 + players.filter((q) => better(q.drank, me.drank)).length : 0;
  const myShared = me ? players.some((q) => q.id !== me.id && q.drank === me.drank) : false;
  const meInTop = Boolean(me && ranked.some((p) => p.id === me.id));
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="board podium">
      {ranked.map((p, i) => {
        const won = awards.filter(([id]) => id === p.id).map(([, label]) => label);
        if (family && i === 0) won.unshift('Vinnare');
        return (
          <div key={p.id} className={`board-row podium-row${i === 0 ? ' first' : ''}${p.id === meId ? ' me' : ''}`}>
            <span className="medal" aria-label={`Plats ${i + 1}`}>
              {medals[i]}
            </span>
            <Avatar player={p} />
            <span className="name stat-name">
              <span>
                {p.name}
                {p.id === meId && <em className="you-tag">Du</em>}
              </span>
              {won.length > 0 && <small>{won.join(' · ')}</small>}
            </span>
            <span className="stat">{sipsText(p.drank, family)}</span>
          </div>
        );
      })}
      {me && !meInTop && (
        <div className="board-row podium-row mine">
          <span className="place" aria-hidden="true">
            {ordinal(myPlace)}
          </span>
          <Avatar player={me} />
          <span className="name stat-name">
            Din plats
            <small>
              Du blev {myShared ? 'delad ' : ''}
              {ordinal(myPlace)} av {players.length}
            </small>
          </span>
          <span className="stat">{sipsText(me.drank, family)}</span>
        </div>
      )}
    </div>
  );
}
