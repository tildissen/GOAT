import { joinGame } from '@/lib/game-service';
import { handle, readJson, str } from '@/lib/http';

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return handle(async () => joinGame(code, str((await readJson(req)).name)));
}
