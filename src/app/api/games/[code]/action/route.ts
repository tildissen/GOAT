import { performAction } from '@/lib/game-service';
import { handle, readJson, str } from '@/lib/http';
import type { Action } from '@/lib/types';

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return handle(async () => {
    const body = await readJson(req);
    return performAction(code, str(body.playerId), str(req.headers.get('x-goat-token')), body.action as Action);
  });
}
