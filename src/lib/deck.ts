import type { CardRow, Category, CustomCard, DeckCard } from './types';

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

/**
 * Bygger 4 delar à 15 kort: 4 "vem i rummet", 1 "vems är bilden",
 * 3 direkta frågor, 3 trivia, 3 utmaningar och 1 minigame per del.
 */
export function buildDeck(cards: CardRow[], customs: CustomCard[], rng: Rng) {
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
    deck[partIndex][idx] = {
      id: custom.id,
      kind: custom.kind,
      text: custom.text,
      players: 0,
      level: 1,
      custom: true,
    };
  });

  const challengePool = utmaning.filter((c) => (c.players ?? 1) === 1).map((c) => toDeckCard(c, rng));
  return { deck, challengePool };
}
