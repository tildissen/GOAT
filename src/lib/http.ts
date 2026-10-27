import 'server-only';
import { NextResponse } from 'next/server';
import { GameError } from './engine';

export async function handle<T>(fn: () => Promise<T>) {
  try {
    return NextResponse.json(await fn(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    if (err instanceof GameError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Något gick fel, försök igen' }, { status: 500 });
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    throw new GameError('Ogiltig förfrågan');
  }
}

export const str = (v: unknown) => (typeof v === 'string' ? v : '');
