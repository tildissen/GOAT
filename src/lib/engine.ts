import { CARDS_PER_PART, PARTS, shuffle, type Rng } from './deck';
import type { Action, Current, CustomCard, CustomKind, DeckCard, GameMode, GameState, Occasion, Player, PublicState } from './types';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 15;
/** Når man så här många sparade klunkar (eller fler) pausas spelet tills man druckit. */
export const MAX_SAVED = 5;
export const MAX_NAME_LENGTH = 20;
/** I "Bygg eget spel" måste alla skriva minst så här många kort (minigames räknas inte). */
export const MIN_OWN_CARDS = 3;
export const MAX_OWN_CARDS = 10;

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

export function newGameState(host: Player, mode: GameMode = 'classic', occasion?: Occasion): GameState {
  return {
    mode,
    ...(mode === 'custom' ? { occasion: occasion ?? 'fest' } : {}),
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

/** Antal kort spelaren skrivit som räknas mot kravet i "Bygg eget spel". */
export function ownCardCount(state: GameState | PublicState, playerId: string): number {
  return state.customCards.filter((c) => c.by === playerId && c.kind !== 'minigame').length;
}

export function cleanName(raw: string): string {
  const name = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
  if (!name) throw new GameError('Skriv ditt namn');
  return name;
}

/** Lägger till en spelare, eller hittar den som redan heter så (för att kunna joina igen). */
/**
 * Lägger till en spelare. Finns namnet redan och den spelaren är borta får man tillbaka sin
 * plats (för den som tappat uppkopplingen). Är spelaren med just nu är namnet upptaget.
 */
export function addPlayer(state: GameState, rawName: string, id: string, now: number, active: Set<string> = new Set()) {
  const name = cleanName(rawName);
  if (state.status === 'ended') throw new GameError('Spelet är redan slut', 410);
  const existing = state.players.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (existing && active.has(existing.id)) {
    throw new GameError(
      `${existing.name} är redan med i spelet. Lägg till en bokstav, t.ex. "${existing.name} B". Är det du som tappat uppkopplingen? Vänta en halv minut och försök igen.`,
      409,
    );
  }
  if (existing) return { state, player: existing, rejoined: true };
  if (state.players.length >= MAX_PLAYERS) throw new GameError(`Spelet är fullt (max ${MAX_PLAYERS} spelare)`);
  const s = structuredClone(state);
  const player = newPlayer(id, name, now);
  s.players.push(player);
  return { state: s, player, rejoined: false };
}

/** Byter siffror före "klunk" så att det blir fler klunkar för varje del. */
export function scaleSips(text: string, part: number): string {
  return text.replace(/(\d+)(\s+(?:extra\s+)?)(klunk(?:ar)?|minuspoäng)/g, (_, n: string, space: string, unit: string) => {
    const sips = Number(n) + part - 1;
    if (unit === 'minuspoäng') return `${sips}${space}minuspoäng`;
    return `${sips}${space}${sips === 1 ? 'klunk' : 'klunkar'}`;
  });
}

/** Familjespel: alkoholfritt – man får minuspoäng i stället för att dricka. */
export function isFamily(state: Pick<GameState, 'mode' | 'occasion'>): boolean {
  return state.mode === 'custom' && state.occasion === 'familj';
}

/** Skriver om dryckesord till minuspoäng, för kort som spelarna skrivit i ett familjespel. */
export function familyText(text: string): string {
  return text
    .replace(/\b(dricker|tar)\s+(\d+)\s+(?:extra\s+)?klunk(?:ar)?/gi, 'får $2 minuspoäng')
    .replace(/\bdrick\s+(\d+)\s+(?:extra\s+)?klunk(?:ar)?/gi, 'ta $1 minuspoäng')
    .replace(/(\d+)\s+(?:extra\s+)?klunk(?:ar)?/gi, '$1 minuspoäng')
    .replace(/\bdricker\b/gi, 'får minuspoäng');
}

const MAX_EVENTS = 8;

/** Sparar vad någon valde så att alla andra kan se det. */
function logEvent(s: GameState, actorId: string, text: string) {
  const events = s.events ?? [];
  const id = (events[events.length - 1]?.id ?? 0) + 1;
  s.events = [...events, { id, actorId, text }].slice(-MAX_EVENTS);
}

function sipsWord(n: number, family: boolean): string {
  return family ? `${n} minuspoäng` : `${n} ${n === 1 ? 'klunk' : 'klunkar'}`;
}

export function isSoloCard(card: DeckCard): boolean {
  return card.kind === 'direkt' || card.kind === 'trivia' || (card.kind === 'utmaning' && card.players === 1);
}

export function pausedPlayers(state: GameState | PublicState): Player[] {
  return state.players.filter((p) => p.saved >= MAX_SAVED);
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

/**
 * Kort till en person: personen själv (eller värden, eller vem som helst om personen är borta).
 * Gruppkort – röstningar, gruppen, X och Y, lag och minigames: bara värden (vem som helst om värden är borta).
 */
export function canPressNext(s: GameState | PublicState, cur: Current, playerId: string, ctx: Pick<Ctx, 'active'>): boolean {
  const leader = playerId === s.hostId || !ctx.active.has(s.hostId);
  if (!isSoloCard(cur.card)) return leader;
  return leader || playerId === cur.turnId || !ctx.active.has(cur.turnId);
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
  // Eget kort till en viss spelare går till den personen, om hen är med och uppkopplad.
  const target = card.targetId ? s.players.find((p) => p.id === card.targetId && p.ready && ctx.active.has(p.id)) : undefined;
  const turn = target ?? pickTurn(s, ctx);
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
  if (isFamily(s)) text = familyText(text);
  const sipsOnCard =
    card.kind === 'utmaning' || card.kind === 'minigame' ? text.match(/(\d+)\s+(?:extra\s+)?(?:klunk|minuspoäng)/) : null;

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
    s.status = s.part >= s.deck.length ? 'finished' : 'partEnd';
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
  // Minigames har inga val – värden trycker bara Nästa eller Hoppa över.
  if (cur.card.kind === 'minigame') return false;
  // X och Y: bara de två som utmaningen gäller kan välja att hoppa över.
  if (cur.card.players === 2) return player.ready && cur.targetIds.includes(player.id);
  // Gruppkort och lagkort ("Den som har flest syskon delar ut …") är instruktioner till alla – inga val.
  return false;
}

function drawChallenge(s: GameState, ctx: Ctx): string {
  const pool = s.challengePool.filter((c) => c.level <= s.part);
  const card = pick(pool.length > 0 ? pool : s.challengePool, ctx.rng);
  const text = card ? scaleSips(card.text, s.part) : 'Gör en segerpose i 10 sekunder.';
  return isFamily(s) ? familyText(text) : text;
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
    if (s.status !== 'playing' || !cur) throw new GameError('Kortet har redan bytts – kolla skärmen', 409);
    return cur;
  };

  switch (action.type) {
    case 'start_intro': {
      requireLeader();
      if (s.status === 'lobby') s.status = 'intro';
      break;
    }
    case 'ready': {
      const writing = s.mode === 'custom' && (s.status === 'lobby' || s.status === 'intro');
      if (writing && ownCardCount(s, playerId) < MIN_OWN_CARDS) {
        throw new GameError(`Skriv minst ${MIN_OWN_CARDS} kort först`);
      }
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
      if (s.customCards.filter((c) => c.by === playerId).length >= MAX_OWN_CARDS) {
        throw new GameError(`Max ${MAX_OWN_CARDS} egna kort per person`);
      }
      const kind: CustomKind = (['vem', 'direkt', 'utmaning', 'minigame'] as const).includes(action.kind) ? action.kind : 'vem';
      const card: CustomCard = { id: `custom-${ctx.now}-${Math.floor(ctx.rng() * 1e6)}`, kind, text, by: playerId };
      if (kind === 'utmaning') card.players = action.players === 1 ? 1 : 0;
      const personal = kind === 'direkt' || (kind === 'utmaning' && card.players === 1);
      if (personal && action.targetId) {
        if (action.targetId === playerId) throw new GameError('Välj någon annan än dig själv');
        if (!s.players.some((p) => p.id === action.targetId)) throw new GameError('Spelaren finns inte i spelet');
        card.targetId = action.targetId;
      }
      if (kind === 'minigame') {
        const title = (action.title ?? '').replace(/\s+/g, ' ').trim();
        if (title.length < 2) throw new GameError('Ge minigamet ett namn');
        if (title.length > 40) throw new GameError('Namnet får vara max 40 tecken');
        card.title = title;
      }
      s.customCards.push(card);
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
      if (c.phase !== 'voting') throw new GameError('Röstningen är redan klar – kolla skärmen', 409);
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
      if (!isLeader(s, playerId, ctx)) throw new GameError('Bara värden kan visa resultatet', 403);
      if (Object.keys(c.votes).length === 0) throw new GameError('Ingen har röstat än');
      resolveVotes(s, c);
      break;
    }
    case 'choose': {
      const c = requireCurrent();
      assertNotPaused(s, ctx);
      if (!canChoose(s, c, me)) throw new GameError('Det här kortet är redan klart – kolla skärmen', 409);
      const solo = isSoloCard(c.card) && c.phase === 'play';
      const family = isFamily(s);
      if (action.choice === 'answered') {
        if (c.card.kind !== 'direkt') throw new GameError('Ogiltigt val');
        logEvent(s, playerId, 'svarade på frågan');
      } else if (action.choice === 'drink') {
        me.drank += c.sips;
        logEvent(s, playerId, family ? `tog ${sipsWord(c.sips, true)}` : `drack ${sipsWord(c.sips, false)}`);
      } else if (action.choice === 'save') {
        if (family) throw new GameError('Man kan inte spara i familjespel');
        me.saved += c.sips;
        logEvent(s, playerId, `sparade ${sipsWord(c.sips, false)} (har ${me.saved} sparade)`);
      } else if (action.choice === 'challenge') {
        const text = drawChallenge(s, ctx);
        s.overlays[playerId] = { text, advancesCard: solo };
        logEvent(s, playerId, `drog ett utmaningskort: ”${text}”`);
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
      logEvent(s, playerId, action.index === c.card.answerIndex ? 'svarade rätt på trivian! 🧠' : 'svarade fel på trivian');
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
        logEvent(s, playerId, 'vägrade ladda upp en bild');
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
      if (me.saved > 0) logEvent(s, playerId, isFamily(s) ? `tog sina ${me.saved} sparade` : `drack sina ${me.saved} sparade klunkar`);
      me.drank += me.saved;
      me.saved = 0;
      break;
    }
    case 'next': {
      const c = requireCurrent();
      if (!canPressNext(s, c, playerId, ctx)) {
        throw new GameError(isSoloCard(c.card) ? 'Det är inte din tur' : 'Bara värden kan gå vidare på gruppkort', 403);
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

/**
 * Städar upp när någon försvunnit så att spelet inte står still: avgör röstningen när alla
 * som är uppkopplade har röstat, och hoppar över "Vems är bilden?" om den hemliga
 * uppladdaren har försvunnit. Returnerar null om inget behöver ändras.
 */
export function housekeeping(input: GameState, ctx: Ctx): GameState | null {
  const cur = input.current;
  if (input.status !== 'playing' || !cur) return null;
  if (cur.phase === 'voting') {
    const s = structuredClone(input);
    const c = s.current!;
    const everyoneVoted = Object.keys(c.votes).length > 0 && voters(s, c, ctx).every((p) => c.votes[p.id]);
    if (!everyoneVoted) return null;
    resolveVotes(s, c);
    return s;
  }
  if (cur.phase === 'upload' && !ctx.active.has(cur.turnId) && pausedPlayers(input).length === 0) {
    const s = structuredClone(input);
    advance(s, ctx);
    return s;
  }
  return null;
}

/** Tar bort sådant som inte ska synas för just den här spelaren. */
export function toPublic(s: GameState, viewerId: string | null): PublicState {
  const { deck, challengePool, ...rest } = s;
  void challengePool;
  const pub: PublicState = structuredClone({
    ...rest,
    cardsInPart: deck[s.part - 1]?.length ?? CARDS_PER_PART,
    parts: deck.length || PARTS,
  });
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
