import { createGame } from '@/lib/game-service';
import { handle, readJson, str } from '@/lib/http';

export async function POST(req: Request) {
  return handle(async () => createGame(str((await readJson(req)).name)));
}
