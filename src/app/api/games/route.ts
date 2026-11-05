import { createGame } from '@/lib/game-service';
import { handle, readJson, str } from '@/lib/http';

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson(req);
    return createGame(str(body.name), body.mode === 'custom' ? 'custom' : 'classic');
  });
}
