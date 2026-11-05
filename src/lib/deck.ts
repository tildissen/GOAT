import type { CardRow, Category, CustomCard, DeckCard, Occasion } from './types';

export const PARTS = 4;
export const CARDS_PER_PART = 15;

const PART_CATEGORY: Category[] = ['casual', 'party', 'cheeky', 'dirty'];
const LEVEL: Record<Category, number> = { casual: 1, party: 2, cheeky: 3, dirty: 4, framtid: 1 };
const TRIVIA_DIFFICULTY: number[][] = [[1], [1, 2], [2, 3], [3]];

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function levelOf(card: CardRow): number {
  return card.category ? LEVEL[card.category] : 1;
}

function toDeckCard(card: CardRow, rng: Rng): DeckCard {
  const base: DeckCard = {
    id: String(card.id),
    kind: card.kind,
    text: card.text,
    players: card.players ?? 1,
    level: levelOf(card),
  };
  if (card.title) base.title = card.title;
  if (card.kind === 'trivia' && card.answer) {
    const options = shuffle([card.answer, ...(card.wrong_answers ?? [])], rng);
    base.options = options;
    base.answerIndex = options.indexOf(card.answer);
  }
  return base;
}

function customToDeckCard(custom: CustomCard): DeckCard {
  const card: DeckCard = {
    id: custom.id,
    kind: custom.kind,
    text: custom.text,
    players: custom.kind === 'direkt' ? 1 : (custom.players ?? 0),
    level: 1,
    custom: true,
  };
  if (custom.title) card.title = custom.title;
  return card;
}

/** Ungefär så många frågor och utmaningar (egna plus påfyllda) per del i "Bygg eget spel". */
export const OWN_CARDS_PER_PART = 12;

/**
 * "Bygg eget spel": spelarnas egna kort är stommen. Har de skrivit för få fylls
 * varje del upp till 12 frågor och utmaningar med förvalda kort för tillfället
 * (AW och Familjespel har egna kort, Fest använder de vanliga och blir vildare
 * per del). Per del blandas också in trivia (ungefär ett per tre kort), en
 * "Vems är bilden?" och ett minigame – spelarnas egna minigames först.
 * 2–4 delar beroende på hur många kort som skrivits.
 */
export function buildCustomDeck(cards: CardRow[], customs: CustomCard[], rng: Rng, occasion: Occasion = 'fest') {
  const classic = cards.filter((c) => !c.occasion);
  const preset = occasion === 'fest' ? classic : cards.filter((c) => c.occasion === occasion);
  const of = (pool: CardRow[], kind: CardRow['kind']) => pool.filter((c) => c.kind === kind);

  const own = shuffle(
    customs.filter((c) => c.kind !== 'minigame'),
    rng,
  );
  const ownMinigames = shuffle(
    customs.filter((c) => c.kind === 'minigame'),
    rng,
  ).map(customToDeckCard);
  const parts = Math.min(PARTS, Math.max(2, Math.ceil(own.length / OWN_CARDS_PER_PART)));

  const used = new Set<string>();
  const takeOne = (pool: CardRow[]): CardRow | undefined => {
    const card = shuffle(
      pool.filter((c) => !used.has(String(c.id))),
      rng,
    )[0];
    if (card) used.add(String(card.id));
    return card;
  };

  // AW får alla vanliga minigames också (AW-versionen vinner om namnet finns i båda).
  let minigames = of(preset, 'minigame');
  if (occasion === 'aw') {
    const titles = new Set(minigames.map((c) => c.title));
    minigames = [...minigames, ...of(classic, 'minigame').filter((c) => !titles.has(c.title))];
  }
  const trivia = of(classic, 'trivia');
  const fillKinds: CardRow['kind'][] = ['vem', 'direkt', 'utmaning'];

  const deck: DeckCard[][] = Array.from({ length: parts }, () => []);
  own.forEach((c, i) => deck[i % parts].push(customToDeckCard(c)));
  ownMinigames.forEach((c, i) => deck[i % parts].push(c));

  deck.forEach((part, i) => {
    // Hur långt in i spelet delen ligger, 0–3, styr trivians svårighet och hur vilda Fest-korten blir.
    const tier = parts === 1 ? 1 : Math.round((i * 3) / (parts - 1));
    const allowed = (c: CardRow) => levelOf(c) <= tier + 1;
    const extra: (CardRow | undefined)[] = [];

    for (let k = part.filter((c) => c.kind !== 'minigame').length; k < OWN_CARDS_PER_PART; k++) {
      const kind = fillKinds[k % fillKinds.length];
      extra.push(takeOne(of(preset, kind).filter(allowed)) ?? takeOne(of(preset, kind)));
    }
    const core = part.filter((c) => c.kind !== 'minigame').length + extra.length;
    for (let t = 0; t < Math.max(1, Math.round(core / 3)); t++) {
      extra.push(takeOne(trivia.filter((c) => TRIVIA_DIFFICULTY[tier].includes(c.difficulty ?? 1))) ?? takeOne(trivia));
    }
    extra.push(takeOne(of(preset, 'bild').filter(allowed)) ?? takeOne(of(preset, 'bild')));
    if (!part.some((c) => c.kind === 'minigame')) extra.push(takeOne(minigames));
    for (const c of extra) if (c) part.push(toDeckCard(c, rng));
    deck[i] = shuffle(part, rng);
  });

  const challengePool = of(preset, 'utmaning')
    .filter((c) => (c.players ?? 1) === 1)
    .map((c) => toDeckCard(c, rng));
  return { deck, challengePool };
}

/**
 * Bygger 4 delar à 15 kort: 4 "vem i rummet", 1 "vems är bilden",
 * 3 direkta frågor, 3 trivia, 3 utmaningar och 1 minigame per del.
 */
export function buildDeck(allCards: CardRow[], customs: CustomCard[], rng: Rng) {
  // Korten för AW och Familjespel används bara i "Bygg eget spel".
  const cards = allCards.filter((c) => !c.occasion);
  const used = new Set<string>();

  const take = (pool: CardRow[], count: number): CardRow[] => {
    const picked = shuffle(
      pool.filter((c) => !used.has(String(c.id))),
      rng,
    ).slice(0, count);
    picked.forEach((c) => used.add(String(c.id)));
    return picked;
  };
  // Tar i första hand ur de tidigare poolerna, fyller på ur nästa om det tar slut.
  const takeFrom = (pools: CardRow[][], count: number): CardRow[] => {
    const result: CardRow[] = [];
    for (const pool of pools) {
      if (result.length >= count) break;
      result.push(...take(pool, count - result.length));
    }
    return result;
  };

  const of = (kind: CardRow['kind']) => cards.filter((c) => c.kind === kind);
  const vem = of('vem');
  const direkt = of('direkt');
  const trivia = of('trivia');
  const utmaning = of('utmaning');
  const minigame = of('minigame');
  const bild = of('bild');

  const deck: DeckCard[][] = [];
  for (let p = 1; p <= PARTS; p++) {
    const cat = PART_CATEGORY[p - 1];
    const ofCat = (pool: CardRow[]) => pool.filter((c) => c.category === cat);
    const framtid = (pool: CardRow[]) => pool.filter((c) => c.category === 'framtid');
    const upTo = (pool: CardRow[]) => pool.filter((c) => levelOf(c) <= p);
    const exact = (pool: CardRow[]) => pool.filter((c) => levelOf(c) === p);

    const part: CardRow[] = [
      ...takeFrom([ofCat(vem)], 3),
      ...takeFrom([framtid(vem), ofCat(vem), upTo(vem)], 1),
      ...takeFrom([exact(bild), upTo(bild)], 1),
      ...takeFrom([ofCat(direkt)], 2),
      ...takeFrom([framtid(direkt), ofCat(direkt), upTo(direkt)], 1),
      ...takeFrom([trivia.filter((c) => TRIVIA_DIFFICULTY[p - 1].includes(c.difficulty ?? 1)), trivia], 3),
      ...takeFrom([exact(utmaning)], p > 1 ? 1 : 0),
      ...takeFrom([upTo(utmaning)], p > 1 ? 2 : 3),
      ...takeFrom([minigame], 1),
    ];
    // Om någon kategori tog slut fylls delen på med vad som finns kvar.
    if (part.length < CARDS_PER_PART) {
      part.push(...takeFrom([upTo(vem), upTo(utmaning), trivia], CARDS_PER_PART - part.length));
    }
    deck.push(shuffle(part.map((c) => toDeckCard(c, rng)), rng));
  }

  // Spelarnas egna kort ersätter vanliga kort av samma typ, utspritt över delarna.
  shuffle(customs, rng).forEach((custom, i) => {
    const partIndex = i % PARTS;
    const slots = deck[partIndex]
      .map((c, idx) => ({ c, idx }))
      .filter(({ c }) => c.kind === custom.kind && !c.custom);
    if (slots.length === 0) return;
    const { idx } = slots[Math.floor(rng() * slots.length)];
    deck[partIndex][idx] = customToDeckCard(custom);
  });

  const challengePool = utmaning.filter((c) => (c.players ?? 1) === 1).map((c) => toDeckCard(c, rng));
  return { deck, challengePool };
}
