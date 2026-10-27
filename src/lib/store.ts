import 'server-only';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { CONTENT_FILES, parseContent, type ContentFiles } from './content';
import type { CardRow, GameState } from './types';

export interface GameRecord {
  id: string;
  code: string;
  version: number;
  state: GameState;
  secrets: Record<string, string>;
}

export interface Store {
  createGame(code: string, state: GameState, secrets: Record<string, string>): Promise<GameRecord | null>;
  getGame(code: string): Promise<GameRecord | null>;
  /** Sparar bara om ingen annan hunnit ändra spelet sedan det lästes. */
  saveGame(record: GameRecord, state: GameState, secrets: Record<string, string>): Promise<boolean>;
  touch(gameId: string, playerId: string): Promise<void>;
  activeSince(gameId: string, since: Date): Promise<Set<string>>;
  loadCards(): Promise<CardRow[]>;
  uploadPhoto(gameId: string, data: ArrayBuffer, contentType: string): Promise<string>;
  deletePhotos(gameId: string): Promise<void>;
  /** Rensar gamla spel och deras bilder. */
  cleanup(olderThan: Date): Promise<void>;
  /** Säger till alla mobiler i spelet att hämta nytt läge. */
  notify(code: string, version: number): Promise<void>;
}

const BUCKET = 'photos';

class SupabaseStore implements Store {
  private db: SupabaseClient;

  constructor(
    private url: string,
    private key: string,
  ) {
    this.db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async createGame(code: string, state: GameState, secrets: Record<string, string>) {
    const { data, error } = await this.db.from('games').insert({ code, state, secrets }).select().single();
    if (error) {
      if (error.code === '23505') return null; // koden finns redan
      throw error;
    }
    return data as GameRecord;
  }

  async getGame(code: string) {
    const { data, error } = await this.db.from('games').select('id, code, version, state, secrets').eq('code', code).maybeSingle();
    if (error) throw error;
    return (data as GameRecord) ?? null;
  }

  async saveGame(record: GameRecord, state: GameState, secrets: Record<string, string>) {
    const { data, error } = await this.db
      .from('games')
      .update({ state, secrets, version: record.version + 1, updated_at: new Date().toISOString() })
      .eq('id', record.id)
      .eq('version', record.version)
      .select('id');
    if (error) throw error;
    return (data ?? []).length === 1;
  }

  async touch(gameId: string, playerId: string) {
    const { error } = await this.db
      .from('presence')
      .upsert({ game_id: gameId, player_id: playerId, last_seen: new Date().toISOString() });
    if (error) console.error('presence', error.message);
  }

  async activeSince(gameId: string, since: Date) {
    const { data, error } = await this.db
      .from('presence')
      .select('player_id')
      .eq('game_id', gameId)
      .gte('last_seen', since.toISOString());
    if (error) throw error;
    return new Set((data ?? []).map((r) => r.player_id as string));
  }

  async loadCards() {
    const { data, error } = await this.db
      .from('cards')
      .select('id, kind, text, title, category, difficulty, answer, wrong_answers, players')
      .eq('active', true)
      .limit(5000);
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Inga kort i databasen – kör supabase/seed.sql');
    return data as CardRow[];
  }

  async uploadPhoto(gameId: string, data: ArrayBuffer, contentType: string) {
    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const filePath = `${gameId}/${randomUUID()}.${ext}`;
    const { error } = await this.db.storage.from(BUCKET).upload(filePath, data, { contentType });
    if (error) throw error;
    return this.db.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;
  }

  async deletePhotos(gameId: string) {
    const { data } = await this.db.storage.from(BUCKET).list(gameId, { limit: 1000 });
    const paths = (data ?? []).map((f) => `${gameId}/${f.name}`);
    if (paths.length > 0) await this.db.storage.from(BUCKET).remove(paths);
  }

  async cleanup(olderThan: Date) {
    const { data } = await this.db.from('games').select('id').lt('created_at', olderThan.toISOString()).limit(20);
    for (const { id } of data ?? []) {
      await this.deletePhotos(id);
      await this.db.from('games').delete().eq('id', id);
    }
  }

  async notify(code: string, version: number) {
    // Realtime Broadcast via REST – mobilerna lyssnar på kanalen game-KOD.
    try {
      await fetch(`${this.url}/realtime/v1/api/broadcast`, {
        method: 'POST',
        headers: {
          apikey: this.key,
          // De nya nycklarna (sb_secret_…) är inga JWT och ska inte skickas som Bearer.
          ...(this.key.startsWith('eyJ') ? { Authorization: `Bearer ${this.key}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [{ topic: `game-${code}`, event: 'update', payload: { version } }] }),
      });
    } catch (err) {
      console.error('broadcast', err);
    }
  }
}

/**
 * Används när Supabase inte är inställt (t.ex. lokalt utan .env.local).
 * Allt sparas i minnet och försvinner när servern startas om.
 */
class MemoryStore implements Store {
  games = new Map<string, GameRecord & { createdAt: number }>();
  presence = new Map<string, number>();
  photos = new Map<string, { data: Buffer; contentType: string; gameId: string }>();

  async createGame(code: string, state: GameState, secrets: Record<string, string>) {
    if (this.games.has(code)) return null;
    const record = { id: randomUUID(), code, version: 0, state, secrets, createdAt: Date.now() };
    this.games.set(code, record);
    return structuredClone(record);
  }

  async getGame(code: string) {
    const record = this.games.get(code);
    return record ? structuredClone(record) : null;
  }

  async saveGame(record: GameRecord, state: GameState, secrets: Record<string, string>) {
    const current = this.games.get(record.code);
    if (!current || current.version !== record.version) return false;
    this.games.set(record.code, { ...current, state, secrets, version: current.version + 1 });
    return true;
  }

  async touch(gameId: string, playerId: string) {
    this.presence.set(`${gameId}:${playerId}`, Date.now());
  }

  async activeSince(gameId: string, since: Date) {
    const active = new Set<string>();
    for (const [key, time] of this.presence) {
      const [g, p] = key.split(':');
      if (g === gameId && time >= since.getTime()) active.add(p);
    }
    return active;
  }

  async loadCards() {
    const dir = path.join(process.cwd(), 'content');
    const entries = await Promise.all(
      Object.entries(CONTENT_FILES).map(async ([key, file]) => [key, await readFile(path.join(dir, file), 'utf8')]),
    );
    return parseContent(Object.fromEntries(entries) as ContentFiles).map((c, i) => ({ ...c, id: i + 1 }));
  }

  async uploadPhoto(gameId: string, data: ArrayBuffer, contentType: string) {
    const id = randomUUID();
    this.photos.set(id, { data: Buffer.from(data), contentType, gameId });
    return `/api/dev-photo/${id}`;
  }

  async deletePhotos(gameId: string) {
    for (const [id, photo] of this.photos) if (photo.gameId === gameId) this.photos.delete(id);
  }

  async cleanup(olderThan: Date) {
    for (const [code, game] of this.games) {
      if (game.createdAt < olderThan.getTime()) {
        await this.deletePhotos(game.id);
        this.games.delete(code);
      }
    }
  }

  async notify() {}
}

const globalStore = globalThis as unknown as { __goatStore?: Store };

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getStore(): Store {
  if (!globalStore.__goatStore) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      globalStore.__goatStore = new SupabaseStore(url.replace(/\/$/, ''), key);
    } else {
      if (process.env.VERCEL) throw new Error('Supabase är inte inställt – lägg in miljövariablerna i Vercel');
      console.warn('Supabase saknas – använder minnet (bara för lokal utveckling)');
      globalStore.__goatStore = new MemoryStore();
    }
  }
  return globalStore.__goatStore;
}

export function getMemoryPhoto(id: string) {
  const store = getStore();
  return store instanceof MemoryStore ? store.photos.get(id) : undefined;
}
