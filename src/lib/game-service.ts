import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { buildDeck } from './deck';
import { addPlayer, applyAction, GameError, newGameState, newPlayer, cleanName, toPublic, type Ctx } from './engine';
import { getStore, type GameRecord } from './store';
import type { Action, GameState, GameView } from './types';

/** Så länge räknas en spelare som uppkopplad efter senaste kontakten. */
const ACTIVE_MS = 45_000;
/** Gamla spel och deras bilder rensas efter så här lång tid. */
const MAX_GAME_AGE_MS = 12 * 60 * 60 * 1000;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newCode(): string {
  const bytes = randomBytes(5);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

const newToken = () => randomBytes(24).toString('hex');

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
}

async function load(code: string): Promise<GameRecord> {
  const record = await getStore().getGame(normalizeCode(code));
  if (!record) throw new GameError('Hittade inget spel med den koden', 404);
  return record;
}

async function activeIds(record: GameRecord) {
  return getStore().activeSince(record.id, new Date(Date.now() - ACTIVE_MS));
}

function view(record: GameRecord, state: GameState, version: number, active: Set<string>, viewerId: string | null): GameView {
  return { code: record.code, version, state: toPublic(state, viewerId), active: [...active] };
}

/** Läser spelet, kör ändringen och sparar – försöker igen om två mobiler krockar. */
async function mutate(
  code: string,
  change: (record: GameRecord, active: Set<string>) => { state: GameState; secrets?: Record<string, string> } | Promise<{ state: GameState; secrets?: Record<string, string> }>,
  viewerId: string | null,
): Promise<GameView> {
  const store = getStore();
  for (let attempt = 0; attempt < 8; attempt++) {
    const record = await load(code);
    const active = await activeIds(record);
    if (viewerId) active.add(viewerId);
    const result = await change(record, active);
    const secrets = result.secrets ?? record.secrets;
    if (await store.saveGame(record, result.state, secrets)) {
      const version = record.version + 1;
      await store.notify(record.code, version);
      if (result.state.status === 'ended' && record.state.status !== 'ended') await store.deletePhotos(record.id);
      return view(record, result.state, version, active, viewerId);
    }
    await new Promise((r) => setTimeout(r, 30 + Math.random() * 120));
  }
  throw new GameError('Många trycker samtidigt – försök igen', 503);
}

function authorize(record: GameRecord, playerId: string, token: string) {
  if (!playerId || !token || record.secrets[playerId] !== token) {
    throw new GameError('Du är inte med i det här spelet', 403);
  }
}

export async function createGame(rawName: string) {
  const store = getStore();
  const name = cleanName(rawName);
  store.cleanup(new Date(Date.now() - MAX_GAME_AGE_MS)).catch((err) => console.error('cleanup', err));
  const host = newPlayer(randomUUID(), name, Date.now());
  const token = newToken();
  for (let attempt = 0; attempt < 10; attempt++) {
    const record = await store.createGame(newCode(), newGameState(host), { [host.id]: token });
    if (record) {
      await store.touch(record.id, host.id);
      return { code: record.code, playerId: host.id, token };
    }
  }
  throw new GameError('Kunde inte skapa en spelkod, försök igen', 503);
}

export async function joinGame(code: string, rawName: string) {
  let joined: { playerId: string; token: string } | null = null;
  await mutate(
    code,
    (record) => {
      const { state, player } = addPlayer(record.state, rawName, randomUUID(), Date.now());
      const token = record.secrets[player.id] ?? newToken();
      joined = { playerId: player.id, token };
      return { state, secrets: { ...record.secrets, [player.id]: token } };
    },
    null,
  );
  const result = joined as { playerId: string; token: string } | null;
  if (!result) throw new GameError('Kunde inte joina', 500);
  await getStore().touch((await load(code)).id, result.playerId);
  return { code: normalizeCode(code), ...result };
}

export async function getView(code: string, playerId: string | null, token: string | null): Promise<GameView> {
  const record = await load(code);
  const isPlayer = Boolean(playerId && token && record.secrets[playerId] === token);
  if (isPlayer) await getStore().touch(record.id, playerId!);
  const active = await activeIds(record);
  return view(record, record.state, record.version, active, isPlayer ? playerId : null);
}

const NEEDS_DECK: Action['type'][] = ['start_game', 'restart'];

export async function performAction(code: string, playerId: string, token: string, action: Action): Promise<GameView> {
  let cards: Awaited<ReturnType<ReturnType<typeof getStore>['loadCards']>> | null = null;
  if (NEEDS_DECK.includes(action.type)) cards = await getStore().loadCards();

  return mutate(
    code,
    (record, active) => {
      authorize(record, playerId, token);
      const ctx: Ctx = {
        active,
        rng: Math.random,
        now: Date.now(),
        deck: cards ? buildDeck(cards, record.state.customCards, Math.random) : undefined,
      };
      return { state: applyAction(record.state, playerId, action, ctx) };
    },
    playerId,
  );
}

export async function uploadPhoto(
  code: string,
  playerId: string,
  token: string,
  file: File,
  purpose: 'selfie' | 'bild',
): Promise<GameView> {
  const record = await load(code);
  authorize(record, playerId, token);
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new GameError('Bara JPG, PNG eller WebP');
  if (file.size > 4 * 1024 * 1024) throw new GameError('Bilden är för stor (max 4 MB)');
  const url = await getStore().uploadPhoto(record.id, await file.arrayBuffer(), file.type);
  const action: Action = purpose === 'selfie' ? { type: 'set_selfie', url } : { type: 'upload_photo', url };
  return performAction(code, playerId, token, action);
}
