import type { CardRow, Category } from './types';

const CATEGORIES: Category[] = ['casual', 'party', 'cheeky', 'dirty', 'framtid'];

function lines(source: string): string[][] {
  return source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('|').map((f) => f.trim()));
}

function category(value: string, file: string): Category {
  if (!CATEGORIES.includes(value as Category)) {
    throw new Error(`Okänd kategori "${value}" i ${file}`);
  }
  return value as Category;
}

export interface ContentFiles {
  vem: string;
  direkt: string;
  trivia: string;
  utmaningar: string;
  minigames: string;
  bild: string;
}

export const CONTENT_FILES: Record<keyof ContentFiles, string> = {
  vem: 'vem-i-rummet.txt',
  direkt: 'direkta-fragor.txt',
  trivia: 'trivia.txt',
  utmaningar: 'utmaningar.txt',
  minigames: 'minigames.txt',
  bild: 'vems-ar-bilden.txt',
};

/** Tolkar textfilerna i content/ till kortrader. */
export function parseContent(files: ContentFiles): Omit<CardRow, 'id'>[] {
  const cards: Omit<CardRow, 'id'>[] = [];

  for (const [cat, text] of lines(files.vem)) {
    cards.push({ kind: 'vem', category: category(cat, 'vem'), text, players: 0 });
  }
  for (const [cat, text] of lines(files.direkt)) {
    cards.push({ kind: 'direkt', category: category(cat, 'direkt'), text, players: 1 });
  }
  for (const fields of lines(files.trivia)) {
    if (fields.length !== 6) throw new Error(`Trivia-raden har fel antal fält: ${fields.join('|')}`);
    const [difficulty, text, answer, ...wrong] = fields;
    cards.push({
      kind: 'trivia',
      difficulty: Number(difficulty),
      text,
      answer,
      wrong_answers: wrong,
      players: 1,
    });
  }
  for (const [cat, players, text] of lines(files.utmaningar)) {
    cards.push({ kind: 'utmaning', category: category(cat, 'utmaningar'), players: Number(players), text });
  }
  for (const [title, text] of lines(files.minigames)) {
    cards.push({ kind: 'minigame', title, text, players: 0 });
  }
  for (const [cat, text] of lines(files.bild)) {
    cards.push({ kind: 'bild', category: category(cat, 'bild'), text, players: 1 });
  }
  return cards;
}
