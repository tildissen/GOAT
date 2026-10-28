import { CARDS_PER_PART, PARTS, shuffle, type Rng } from './deck';
import type { Action, Current, DeckCard, GameState, Player, PublicState } from './types';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 15;
/** Fler sparade klunkar än så här pausar spelet. */
export const MAX_SAVED = 5;
export const MAX_NAME_LENGTH = 20;

export class GameError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export interface Ctx {
  /** Spelare som har varit uppkopplade nyligen. */
  active: Set<string>;
  rng: Rng;
  now: number;
  /** Ny kortlek – skickas med vid start och omstart. */
  deck?: { deck: DeckCard[][]; challengePool: DeckCard[] };
}

export function newPlayer(id: string, name: string, now: number): Player {
  return {
    id,
    name,
    selfie: null,
    joinedAt: now,
    ready: false,
    saved: 0,
    drank: 0,
    votesReceived: 0,
    challenges: 0,
    turns: 0,
  };
}

export function newGameState(host: Player): GameState {
  return {
    status: 'lobby',
    hostId: host.id,
    players: [host],
    part: 1,
    cardIndex: 0,
    deck: [],
    challengePool: [],
    current: null,
    overlays: {},
    customCards: [],
    lastTurnId: null,
    seq: 0,
  };
}

export function cleanName(raw: string): string {
  const name = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
  if (!name) throw new GameError('Skriv ditt namn');
  return name;
}

/** Lägger till en spelare, eller hittar den som redan heter så (för att kunna joina igen). */
export function addPlayer(state: GameState, rawName: string, id: string, now: number) {
  const name = cleanName(rawName);
  if (state.status === 'ended') throw new GameError('Spelet är redan slut', 410);
  const existing = state.players.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (existing) return { state, player: existing, rejoined: true };
  if (state.players.length >= MAX_PLAYERS) throw new GameError(`Spelet är fullt (max ${MAX_PLAYERS} spelare)`);
  const s = structuredClone(state);
  const player = newPlayer(id, name, now);
  s.players.push(player);
  return { state: s, player, rejoined: false };
}

/** Byter siffror före "klunk" så att det blir fler klunkar för varje del. */
export function scaleSips(text: string, part: number): string {
  return text.replace(/(\d+)(\s+(?:extra\s+)?)klunk(?:ar)?/g, (_, n: string, space: string) => {
    const sips = Number(n) + part - 1;
    return `${sips}${space}${sips === 1 ? 'klunk' : 'klunkar'}`;
  });
}

export function isSoloCard(card: DeckCard): boolean {
  return card.kind === 'direkt' || card.kind === 'trivia' || (card.kind === 'utmaning' && card.players === 1);
}

export function pausedPlayers(state: GameState | PublicState): Player[] {
  return state.players.filter((p) => p.saved > MAX_SAVED);
}

function pick<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

function readyPlayers(s: GameState, ctx: Ctx): Player[] {
  const ready = s.players.filter((p) => p.ready);
  const active = ready.filter((p) => ctx.active.has(p.id));
  return active.length > 0 ? active : ready;
}

function isLeader(s: GameState, playerId: string, ctx: Ctx): boolean {
  return playerId === s.hostId || !ctx.active.has(s.hostId);
}

function assertNotPaused(s: GameState, ctx: Ctx) {
  const blocking = pausedPlayers(s).filter((p) => ctx.active.has(p.id));
  if (blocking.length > 0) {
    throw new GameError(`${blocking.map((p) => p.name).join(' och ')} måste dricka sina sparade klunkar först!`, 409);
  }
}

/** Slumpar nästa spelare, men så att alla får ungefär lika många kort. */
function pickTurn(s: GameState, ctx: Ctx): Player {
  let candidates = readyPlayers(s, ctx);
  if (candidates.length > 1) candidates = candidates.filter((p) => p.id !== s.lastTurnId);
  const fewest = Math.min(...candidates.map((p) => p.turns));
  return pick(
    candidates.filter((p) => p.turns === fewest),
    ctx.rng,
  );
}

function deal(s: GameState, ctx: Ctx) {
  const card = s.deck[s.part - 1][s.cardIndex];
  const turn = pickTurn(s, ctx);
  const others = shuffle(
    readyPlayers(s, ctx).filter((p) => p.id !== turn.id),
    ctx.rng,
  );
  const nameOf = (id: string) => s.players.find((p) => p.id === id)?.name ?? '?';

  let targetIds = [turn.id];
  let teams: [string[], string[]] | undefined;
  if (card.players === 2 && others.length > 0) targetIds = [turn.id, others[0].id];
  if (card.players === 3) {
    const everyone = shuffle([turn, ...others], ctx.rng).map((p) => p.id);
    const half = Math.ceil(everyone.length / 2);
    teams = [everyone.slice(0, half), everyone.slice(half)];
    targetIds = everyone;
  }

  let text = card.kind === 'utmaning' || card.kind === 'minigame' ? scaleSips(card.text, s.part) : card.text;
  text = text.replace(/\bX\b/g, nameOf(targetIds[0])).replace(/\bY\b/g, nameOf(targetIds[1] ?? targetIds[0]));
  if (teams) {
    text = text
      .replace(/LAG1/g, teams[0].map(nameOf).join(', '))
      .replace(/LAG2/g, teams[1].map(nameOf).join(', '));
  }

  // På utmaningar och minigames gäller antalet klunkar som står på kortet.
  const sipsOnCard = card.kind === 'utmaning' || card.kind === 'minigame' ? text.match(/(\d+)\s+(?:extra\s+)?klunk/) : null;

  s.seq += 1;
  s.current = {
    seq: s.seq,
    card,
    text,
    turnId: turn.id,
    targetIds,
    teams,
    sips: sipsOnCard ? Number(sipsOnCard[1]) : s.part,
    phase: card.kind === 'vem' ? 'voting' : card.kind === 'bild' ? 'upload' : 'play',
    votes: {},
    losers: [],
    choices: {},
    photoUrl: null,
    triviaPick: null,
  };
  turn.turns += 1;
  s.lastTurnId = turn.id;
}

function advance(s: GameState, ctx: Ctx) {
  s.cardIndex += 1;
  if (s.cardIndex >= s.deck[s.part - 1].length) {
    s.current = null;
    s.status = s.part >= PARTS ? 'finished' : 'partEnd';
    return;
  }
  deal(s, ctx);
}

function startPlaying(s: GameState, ctx: Ctx) {
  if (!ctx.deck) throw new GameError('Kortleken saknas', 500);
  s.deck = ctx.deck.deck;
  s.challengePool = ctx.deck.challengePool;
  s.part = 1;
  s.cardIndex = 0;
  s.overlays = {};
  s.lastTurnId = null;
  s.status = 'playing';
  deal(s, ctx);
}

function voters(s: GameState, cur: Current, ctx: Ctx): Player[] {
  return readyPlayers(s, ctx).filter((p) => !(cur.card.kind === 'bild' && p.id === cur.turnId));
}

function resolveVotes(s: GameState, cur: Current) {
  if (cur.card.kind === 'bild') {
    const wrong = Object.entries(cur.votes)
      .filter(([, target]) => target !== cur.turnId)
      .map(([voter]) => voter);
    cur.losers = wrong.length > 0 ? wrong : [cur.turnId];
  } else {
    const counts = new Map<string, number>();
    for (const target of Object.values(cur.votes)) counts.set(target, (counts.get(target) ?? 0) + 1);
    const max = Math.max(...counts.values());
    cur.losers = [...counts].filter(([, n]) => n === max).map(([id]) => id);
    for (const [id, n] of counts) {
      const p = s.players.find((pl) => pl.id === id);
      if (p) p.votesReceived += n;
    }
  }
  cur.phase = 'result';
}

function canChoose(s: GameState, cur: Current, player: Player): boolean {
  if (cur.choices[player.id]) return false;
  if (cur.phase === 'result') return cur.losers.includes(player.id);
  if (cur.phase !== 'play') return false;
  if (isSoloCard(cur.card)) {
    if (player.id !== cur.turnId) return false;
    if (cur.card.kind === 'trivia') return cur.triviaPick != null && cur.triviaPick !== cur.card.answerIndex;
    return true;
  }
  return player.ready;
}

function drawChallenge(s: GameState, ctx: Ctx): string {
  const pool = s.challengePool.filter((c) => c.level <= s.part);
  const card = pick(pool.length > 0 ? pool : s.challengePool, ctx.rng);
  return card ? scaleSips(card.text, s.part) : 'Gör en segerpose i 10 sekunder.';
}

export function applyAction(input: GameState, playerId: string, action: Action, ctx: Ctx): GameState {
  const s = structuredClone(input);
  const me = s.players.find((p) => p.id === playerId);
  if (!me) throw new GameError('Du är inte med i det här spelet', 403);
  const cur = s.current;

  const requireLeader = () => {
    if (!isLeader(s, playerId, ctx)) throw new GameError('Bara den som skapade spelet kan göra det', 403);
  };
  const requireCurrent = (): Current => {
    if (s.status !== 'playing' || !cur) throw new GameError('Inget kort spelas just nu', 409);
    return cur;
  };

  switch (action.type) {
    case 'start_intro': {
      requireLeader();
      if (s.status === 'lobby') s.status = 'intro';
      break;
    }
    case 'ready': {
      me.ready = true;
      break;
    }
    case 'set_selfie': {
      me.selfie = action.url;
      break;
    }
    case 'add_custom': {
      if (s.status !== 'lobby' && s.status !== 'intro') throw new GameError('Spelet har redan börjat');
      const text = action.text.replace(/\s+/g, ' ').trim();
      if (text.length < 3) throw new GameError('Skriv lite mer');
      if (text.length > 200) throw new GameError('Max 200 tecken');
      if (s.customCards.filter((c) => c.by === playerId).length >= 10) throw new GameError('Max 10 egna kort per person');
      s.customCards.push({
        id: `custom-${ctx.now}-${Math.floor(ctx.rng() * 1e6)}`,
        kind: action.kind === 'utmaning' ? 'utmaning' : 'vem',
        text,
        by: playerId,
      });
      break;
    }
    case 'remove_custom': {
      s.customCards = s.customCards.filter((c) => !(c.id === action.id && (c.by === playerId || playerId === s.hostId)));
      break;
    }
    case 'start_game': {
      requireLeader();
      if (s.status !== 'lobby' && s.status !== 'intro') throw new GameError('Spelet har redan startat', 409);
      const ready = s.players.filter((p) => p.ready).length;
      if (ready < MIN_PLAYERS) throw new GameError(`Minst ${MIN_PLAYERS} spelare måste vara redo (${ready} är redo nu)`);
      startPlaying(s, ctx);
      break;
    }
    case 'vote': {
      const c = requireCurrent();
      assertNotPaused(s, ctx);
      if (c.phase !== 'voting') throw new GameError('Röstningen är stängd', 409);
      if (!me.ready) throw new GameError('Du är inte med i spelet än');
      if (c.card.kind === 'bild' && playerId === c.turnId) throw new GameError('Du kan inte rösta på din egen bild');
      if (!s.players.some((p) => p.id === action.targetId && p.ready)) throw new GameError('Okänd spelare');
      c.votes[playerId] = action.targetId;
      if (voters(s, c, ctx).every((p) => c.votes[p.id])) resolveVotes(s, c);
      break;
    }
    case 'close_vote': {
      const c = requireCurrent();
      if (c.phase !== 'voting') throw new GameError('Röstningen är redan stängd', 409);
      if (playerId !== c.turnId && !isLeader(s, playerId, ctx)) throw new GameError('Du kan inte stänga röstningen', 403);
      if (Object.keys(c.votes).length === 0) throw new GameError('Ingen har röstat än');
      resolveVotes(s, c);
      break;
    }
    case 'choose': {
      const c = requireCurrent();
      assertNotPaused(s, ctx);
      if (!canChoose(s, c, me)) throw new GameError('Du kan inte välja just nu', 409);
      const solo = isSoloCard(c.card) && c.phase === 'play';
      if (action.choice === 'answered') {
        if (c.card.kind !== 'direkt') throw new GameError('Ogiltigt val');
      } else if (action.choice === 'drink') {
        me.drank += c.sips;
      } else if (action.choice === 'save') {
        me.saved += c.sips;
      } else if (action.choice === 'challenge') {
        s.overlays[playerId] = { text: drawChallenge(s, ctx), advancesCard: solo };
      } else {
        throw new GameError('Ogiltigt val');
      }
      c.choices[playerId] = action.choice;
      if (solo && action.choice !== 'challenge') advance(s, ctx);
      break;
    }
    case 'trivia_answer': {
      const c = requireCurrent();
      assertNotPaused(s, ctx);
      if (c.card.kind !== 'trivia' || playerId !== c.turnId) throw new GameError('Det är inte din fråga', 403);
      if (c.triviaPick != null) throw new GameError('Du har redan svarat', 409);
      if (!c.card.options || action.index < 0 || action.index >= c.card.options.length) throw new GameError('Ogiltigt svar');
      c.triviaPick = action.index;
      if (action.index === c.card.answerIndex) c.choices[playerId] = 'answered';
      break;
    }
    case 'upload_photo':
    case 'skip_photo': {
      const c = requireCurrent();
      if (c.card.kind !== 'bild' || c.phase !== 'upload' || playerId !== c.turnId) {
        throw new GameError('Det är inte din tur att ladda upp', 403);
      }
      if (action.type === 'upload_photo') {
        c.photoUrl = action.url;
        c.phase = 'voting';
      } else {
        c.photoSkipped = true;
        c.losers = [playerId];
        c.phase = 'result';
      }
      break;
    }
    case 'dismiss_overlay': {
      const overlay = s.overlays[playerId];
      if (!overlay) break;
      delete s.overlays[playerId];
      me.challenges += 1;
      if (overlay.advancesCard && cur && s.status === 'playing' && cur.turnId === playerId && cur.choices[playerId] === 'challenge') {
        assertNotPaused(s, ctx);
        advance(s, ctx);
      }
      break;
    }
    case 'drink_saved': {
      me.drank += me.saved;
      me.saved = 0;
      break;
    }
    case 'next': {
      const c = requireCurrent();
      if (playerId !== c.turnId && !isLeader(s, playerId, ctx) && ctx.active.has(c.turnId)) {
        throw new GameError('Det är inte din tur', 403);
      }
      assertNotPaused(s, ctx);
      advance(s, ctx);
      break;
    }
    case 'continue': {
      requireLeader();
      if (s.status !== 'partEnd') throw new GameError('Delen är inte slut än', 409);
      assertNotPaused(s, ctx);
      s.part += 1;
      s.cardIndex = 0;
      s.status = 'playing';
      deal(s, ctx);
      break;
    }
    case 'end': {
      requireLeader();
      s.status = 'ended';
      s.current = null;
      s.overlays = {};
      break;
    }
    case 'restart': {
      requireLeader();
      if (s.status !== 'finished' && s.status !== 'partEnd') throw new GameError('Spelet pågår fortfarande', 409);
      for (const p of s.players) {
        Object.assign(p, { saved: 0, drank: 0, votesReceived: 0, challenges: 0, turns: 0 });
      }
      startPlaying(s, ctx);
      break;
    }
    default: {
      throw new GameError('Okänd handling');
    }
  }
  return s;
}

/** Tar bort sådant som inte ska synas för just den här spelaren. */
export function toPublic(s: GameState, viewerId: string | null): PublicState {
  const { deck, challengePool, ...rest } = s;
  void challengePool;
  const pub: PublicState = structuredClone({ ...rest, cardsInPart: deck[s.part - 1]?.length ?? CARDS_PER_PART });
  const cur = pub.current;
  if (cur) {
    if (cur.card.kind === 'trivia' && cur.triviaPick == null) delete cur.card.answerIndex;
    if (cur.phase === 'voting') {
      cur.votes = Object.fromEntries(Object.entries(cur.votes).map(([voter, target]) => [voter, voter === viewerId ? target : '']));
    }
    if (cur.phase === 'result') {
      // Efter röstningen syns bara hur många röster var och en fick – inte vem som röstade på vem.
      const tally: Record<string, number> = {};
      for (const target of Object.values(cur.votes)) tally[target] = (tally[target] ?? 0) + 1;
      cur.tally = tally;
      cur.votes = viewerId && cur.votes[viewerId] ? { [viewerId]: cur.votes[viewerId] } : {};
    }
    const secret = cur.card.kind === 'bild' && (cur.phase === 'upload' || cur.phase === 'voting');
    if (secret && viewerId !== cur.turnId) cur.turnId = '';
  }
  pub.overlays = viewerId && s.overlays[viewerId] ? { [viewerId]: s.overlays[viewerId] } : {};
  return pub;
}
