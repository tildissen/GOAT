import { GameError } from '@/lib/engine';
import { uploadPhoto } from '@/lib/game-service';
import { handle, str } from '@/lib/http';

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return handle(async () => {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new GameError('Ingen bild vald');
    const purpose = form.get('purpose') === 'bild' ? 'bild' : 'selfie';
    return uploadPhoto(code, str(form.get('playerId')), str(req.headers.get('x-goat-token')), file, purpose);
  });
}
