# G.O.A.T. – instruktioner för Claude

Ägare: Tilda (GitHub `tildissen`). Svara på svenska.

## Beslutslogg – obligatoriskt
Varje gång Tilda tar ett beslut om spelet (innehåll, regler, design, teknik, hosting eller arbetssätt) ska det skrivas in i [`docs/beslut/beslutslogg.md`](docs/beslut/beslutslogg.md) **i samma commit som ändringen**, eller direkt om beslutet inte kräver någon kodändring.

- Fortsätt numreringen (B36, B37 …) och lägg nya beslut sist under en rubrik med dagens datum.
- Skriv **Beslut**, **Alternativ** (om det fanns val), **Varför** (om det framgår) och **Var i koden**.
- Ändras ett tidigare beslut: skriv ett nytt beslut och markera det gamla med **Ersatt av Bxx**. Stryk aldrig gamla beslut.
- Skilj på vad Tilda bestämde och vad Claude lade till själv (skriv det som **Tillägg (av Claude)**).

## Projektet
- Next.js (App Router) på Vercel, Supabase för databas, realtid och bilder. Se [README.md](README.md).
- All spellogik finns i `src/lib/engine.ts`. Kör `npm test` (simulerar 200 spel) och `npm run typecheck` efter ändringar.
- Korten finns i `content/*.txt`. `npm run seed` skapar `supabase/seed.sql`.
