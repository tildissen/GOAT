# G.O.A.T. 🐐

Dryckesspelet som börjar oskyldigt… och slutar i fullständigt kaos.

Alla spelar på sin egen mobil. En person skapar ett spel, de andra joinar med en spelkod (eller QR-kod/länk). Spelet har 4 delar à 15 kort som blir vildare för varje del.

Byggt med **Next.js** (hostas på **Vercel**) och **Supabase** (databas, realtid och bildlagring).

---

## Kom igång – steg för steg

### 1. Supabase (databasen)

1. Logga in på [supabase.com](https://supabase.com) och klicka **New project**. Välj ett namn (t.ex. `goat`), ett databaslösenord och regionen **Stockholm (eu-north-1)** om den finns, annars Frankfurt.
2. När projektet är klart: gå till **SQL Editor** → **New query**.
3. Öppna filen [`supabase/schema.sql`](supabase/schema.sql), kopiera allt, klistra in och tryck **Run**. Det skapar tabellerna och bildmappen.
4. Gör likadant med [`supabase/seed.sql`](supabase/seed.sql). Det lägger in alla 580 kort.
5. Gå till **Project Settings → API** (heter ibland **API Keys**) och kopiera tre saker:
   - **Project URL**
   - **anon / publishable**-nyckeln
   - **service_role / secret**-nyckeln (hemlig – dela den aldrig!)

### 2. Vercel (hemsidan)

1. Logga in på [vercel.com](https://vercel.com) med ditt GitHub-konto.
2. Klicka **Add New → Project** och välj repot **GOAT**.
3. Öppna **Environment Variables** och lägg till:

   | Namn | Värde |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable-nyckeln |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role / secret-nyckeln |

4. Klicka **Deploy**. Efter någon minut får du en länk, t.ex. `goat-xxxx.vercel.app`. Klart! 🎉

Varje gång något ändras i GitHub-repot publicerar Vercel automatiskt en ny version.

---

## Redigera korten

Efter att `seed.sql` har körts ligger alla kort i Supabase. Ändra dem i **Table Editor → cards**:

| Kolumn | Betydelse |
|---|---|
| `kind` | `vem` (alla röstar), `direkt` (fråga till en person), `trivia`, `utmaning`, `minigame`, `bild` (vems är bilden?) |
| `text` | Själva frågan/utmaningen |
| `category` | `casual` = del 1, `party` = del 2, `cheeky` = del 3, `dirty` = del 4, `framtid` = alla delar |
| `difficulty` | Trivia: 1 lätt, 2 mellan, 3 svår |
| `answer` / `wrong_answers` | Trivia: rätt svar och tre fel svar |
| `players` | Utmaningar: 0 = hela gruppen, 1 = en person (också utmaningskort), 2 = X och Y, 3 = två lag (LAG1/LAG2) |
| `active` | Sätt till `false` för att plocka bort ett kort utan att radera det |

- I utmaningar byts **X** och **Y** ut mot spelarnas namn, och **LAG1**/**LAG2** mot två slumpade lag.
- Siffror före ”klunkar” i utmaningar och minigames ökar automatiskt med 1 för varje del (2 → 3 → 4 → 5).

Korten finns också som textfiler i [`content/`](content/). Ändrar du där kör du `npm run seed` för att skapa en ny `seed.sql`, som du sedan kör i Supabase igen (den ersätter alla kort).

---

## Så funkar spelet

- **Vem i rummet?** – alla röstar på mobilen. Den/de med flest röster väljer: dricka, spara eller dra ett utmaningskort. Efteråt syns vem som röstade på vem.
- **Direkt fråga** – bara den vars tur det är ser frågan. Svara, drick, spara eller dra ett utmaningskort.
- **Trivia** – fyra svarsalternativ, bara den vars tur det är svarar. Fel svar = drick/spara/utmaning.
- **Vems är bilden?** – en hemlig spelare laddar upp en bild, alla andra gissar. Fel gissning = dricka. Gissar alla rätt dricker den som laddade upp.
- **Utmaningar** – till en person, två personer (X och Y), två lag eller hela gruppen.
- **Minigames** – lekar och regler som gäller en stund. Visas hos alla.
- **Klunkar per del:** 1 i del 1, 2 i del 2, 3 i del 3, 4 i del 4.
- **Spara klunkar:** max 5. Har någon fler visas ERROR-skärmen och spelet pausas tills hen har druckit.
- **Turordning:** slumpad, men alla får ungefär lika många kort.
- Den som tappar uppkopplingen kan joina igen med **samma namn** och behåller sina klunkar. Är någon borta hoppas hen över.
- Är värden borta kan vem som helst trycka vidare.
- **Bilderna raderas** när spelet avslutas. Spel äldre än 12 timmar rensas automatiskt.

---

## För utvecklare

```bash
npm install
npm run dev        # http://localhost:3000 – utan .env.local körs allt i minnet (inget Supabase behövs)
npm test           # simulerar 200 hela spel och kontrollerar reglerna
npm run typecheck
npm run seed       # skapar supabase/seed.sql från content/
```

Med Supabase lokalt: kopiera `.env.example` till `.env.local` och fyll i nycklarna.

**Upplägg:** all spellogik ligger i [`src/lib/engine.ts`](src/lib/engine.ts) och körs på servern. Webbläsaren läser och skriver aldrig direkt i databasen – allt går via API-rutterna i `src/app/api/`. När något ändras skickar servern en Supabase Realtime-signal till alla mobiler i spelet, som då hämtar det nya läget.
