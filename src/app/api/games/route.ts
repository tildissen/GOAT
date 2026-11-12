import { createGame } from '@/lib/game-service';
import { handle, readJson, str } from '@/lib/http';

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson(req);
    const occasion = body.occasion === 'aw' || body.occasion === 'familj' ? body.occasion : 'fest';
    const scoring = body.scoring === 'poang' ? 'poang' : 'klunkar';
    return createGame(str(body.name), body.mode === 'custom' ? 'custom' : 'classic', occasion, scoring);
  });
}
