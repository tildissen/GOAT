import { getMemoryPhoto } from '@/lib/store';

// Visar bilder när spelet körs lokalt utan Supabase.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const photo = getMemoryPhoto((await params).id);
  if (!photo) return new Response('Hittades inte', { status: 404 });
  return new Response(new Uint8Array(photo.data), { headers: { 'Content-Type': photo.contentType } });
}
