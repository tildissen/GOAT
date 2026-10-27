/**
 * Skapar supabase/seed.sql från textfilerna i content/. Kör: npm run seed
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CONTENT_FILES, parseContent, type ContentFiles } from '../src/lib/content';

const files = Object.fromEntries(
  Object.entries(CONTENT_FILES).map(([key, file]) => [key, readFileSync(path.join('content', file), 'utf8')]),
) as unknown as ContentFiles;
const cards = parseContent(files);

const str = (v: string | null | undefined) => (v == null ? 'null' : `'${v.replace(/'/g, "''")}'`);
const arr = (v: string[] | null | undefined) => (v == null ? 'null' : `array[${v.map(str).join(', ')}]`);

const rows = cards.map(
  (c) =>
    `(${str(c.kind)}, ${str(c.text)}, ${str(c.title)}, ${str(c.category)}, ${c.difficulty ?? 'null'}, ${str(c.answer)}, ${arr(c.wrong_answers)}, ${c.players ?? 1})`,
);

const sql = `-- G.O.A.T. – alla kort. Skapad automatiskt från content/ med "npm run seed".
-- Kör i Supabase: SQL Editor → New query → klistra in → Run.
-- OBS: tar bort alla befintliga kort först, så att filen kan köras flera gånger.

delete from public.cards;

insert into public.cards (kind, text, title, category, difficulty, answer, wrong_answers, players) values
${rows.join(',\n')};
`;

writeFileSync(path.join('supabase', 'seed.sql'), sql);
console.log(`Skrev ${cards.length} kort till supabase/seed.sql`);
