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

/** "2 klunkar", eller "2 poäng" när man spelar om pluspoäng (B102). */
export const sipsText = (n: number, family = false) =>
  family ? `${n} poäng` : `${n} ${n === 1 ? 'klunk' : 'klunkar'}`;

/** Spelarens pluspoäng (flest vinner). */
export const scoreOf = (p: { points?: number }) => p.points ?? 0;

export function nameOf(state: PublicState, id: string): string {
  return state.players.find((p) => p.id === id)?.name ?? '?';
}

export function possessive(name: string): string {
  return /[sxz]$/i.test(name) ? name : `${name}s`;
}

/** Vad någon valde, t.ex. "drack 2 klunkar" eller, med pluspoäng, "fick 2 poäng". */
export function choiceText(choice: Choice, sips: number, family = false): string {
  if (choice === 'drink') return family ? 'hoppade över (0 poäng)' : `drack ${sipsText(sips)}`;
  if (choice === 'save') return `sparade ${sipsText(sips)}`;
  if (choice === 'challenge') return 'drog ett utmaningskort';
  return family ? `klarade det och fick ${sipsText(sips, true)}` : 'svarade';
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
        {family ? 'Hoppa över (0 poäng)' : `Jag dricker ${sipsText(sips)}`}
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

export function Board({ state, active, meId, mini = false }: { state: PublicState; active: string[]; meId: string; mini?: boolean }) {
  // Med pluspoäng leder den som har flest – hen står överst (B99, B102).
  const points = usesPoints(state);
  const players = [...state.players]
    .filter((p) => p.ready)
    .sort((a, b) => (points ? scoreOf(b) - scoreOf(a) : b.saved - a.saved || b.drank - a.drank));
  // Kort ställning på en rad när man väntar på någon annan (B107), så att kortet får plats.
  if (mini) {
    return (
      <div className="board-mini" aria-label="Ställning">
        {players.map((p) => (
          <span key={p.id} className={`board-chip${p.id === meId ? ' me' : ''}${active.includes(p.id) ? '' : ' offline'}`}>
            {p.name} <strong>{points ? scoreOf(p) : p.drank}</strong>
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className={`board${players.length > 5 ? ' compact' : ''}`}>
      {players.map((p) => (
        <div key={p.id} className={`board-row${p.id === meId ? ' me' : ''}${active.includes(p.id) ? '' : ' offline'}`}>
          <Avatar player={p} />
          <span className="name">{p.name}</span>
          {usesPoints(state) ? (
            <span className="stat">
              poäng <strong>{scoreOf(p)}</strong>
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
 * Vanligt spel: flest klunkar överst. Med pluspoäng: flest poäng överst (vinnaren).
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
    ...(family ? [] : [[leader('drank'), 'Drack mest'] as [string | null, string]]),
    [leader('votesReceived'), 'Fick flest röster'],
    [leader('challenges'), 'Flest utmaningar'],
  ];
  // Med pluspoäng räknas poängen, annars klunkarna – flest överst i båda fallen.
  const value = (p: (typeof players)[number]) => (family ? scoreOf(p) : p.drank);
  const ranked = [...players].sort((a, b) => value(b) - value(a)).slice(0, 3);
  // Plats: lika resultat delar plats, så "5:e" betyder att fyra personer var bättre.
  const me = players.find((p) => p.id === meId);
  const myPlace = me ? 1 + players.filter((q) => value(q) > value(me)).length : 0;
  const myShared = me ? players.some((q) => q.id !== me.id && value(q) === value(me)) : false;
  const meInTop = Boolean(me && ranked.some((p) => p.id === me.id));
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="board podium">
      {ranked.map((p, i) => {
        const won = awards.filter(([id]) => id === p.id).map(([, label]) => label);
        // Lika många poäng som ettan = också vinnare.
        if (family && value(p) === value(ranked[0])) won.unshift(i === 0 ? 'Vinnare' : 'Delad vinnare');
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
            <span className="stat">{sipsText(value(p), family)}</span>
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
          <span className="stat">{sipsText(value(me), family)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Lista där spelledaren och värden ger klunkar/poäng till spelare (gruppkort och regelkollen).
 * Alla andra ser bara vem som har fått något (B95).
 */
export function GiveList({
  state,
  players,
  taken,
  sips,
  byId,
  mayGive,
  meId,
  busy,
  onGive,
  onUndo,
  prompt,
}: {
  state: PublicState;
  players: { id: string; name: string }[];
  taken: Record<string, number>;
  sips: number;
  byId: string;
  mayGive: boolean;
  meId: string;
  busy: boolean;
  onGive: (id: string) => void;
  onUndo: (id: string) => void;
  prompt?: string;
}) {
  const family = usesPoints(state);
  const what = sipsText(sips, family);
  const leader = byId === meId ? 'Du' : nameOf(state, byId);
  if (!mayGive) {
    const got = players.filter((pl) => (taken[pl.id] ?? 0) > 0);
    return (
      <div className="actions">
        <p className="hint">
          {leader} (spelledare) och värden delar ut {family ? 'poäng' : 'klunkar'}.
        </p>
        {got.length > 0 && (
          <p className="give-summary">
            {got.map((pl) => `${pl.name} ${family ? '−' : '+'}${(taken[pl.id] ?? 0) * sips}`).join(' · ')}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="actions">
      <p className="choice-prompt">{prompt ?? (family ? `Vem förlorade ${what}?` : `Vem fick dricka ${what}?`)}</p>
      <div className="take-list">
        {players.map((pl) => {
          const n = taken[pl.id] ?? 0;
          return (
            <div key={pl.id} className={`take-row${n > 0 ? ' on' : ''}`}>
              <button className="take-name" disabled={busy} onClick={() => onGive(pl.id)} aria-label={`Ge ${pl.name} ${what}`}>
                <span>{pl.name}</span>
                <strong>{n > 0 ? `${family ? '−' : '+'}${n * sips}` : family ? '−' : '+'}</strong>
              </button>
              {n > 0 && (
                <button className="take-undo" disabled={busy} onClick={() => onUndo(pl.id)} aria-label={`Ta bort ${what} från ${pl.name}`}>
                  {family ? '↺' : '−'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
