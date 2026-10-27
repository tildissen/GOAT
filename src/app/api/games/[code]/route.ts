import { getView } from '@/lib/game-service';
import { handle } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(req.url);
  return handle(() => getView(code, url.searchParams.get('playerId'), req.headers.get('x-goat-token')));
}
