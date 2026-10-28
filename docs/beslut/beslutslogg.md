# Beslutslogg

Senaste beslutet står sist. Se [README.md](README.md) för hur loggen fungerar.

---

## 2026-10-27 – Grundidé och teknik

### B1. Ett dryckesspel som hemsida
- **Beslut:** Bygga dryckesspelet **G.O.A.T.** som en hemsida, hostad på **Vercel** och kopplad till **Supabase**.
- **Underlag:** Designen i PDF:en *G.O.A.T. game* (23 sidor) och frågorna i *Frågor till spelet* (24 sidor).
- **Var i koden:** hela repot. Hosting- och databasinstruktioner i [README.md](../../README.md).

### B2. Koden sparas på GitHub i `tildissen/GOAT`
- **Beslut:** All kod sparas i repot `tildissen/GOAT` på grenen `main`, som Vercel publicerar från.

### B3. Designen följer PDF:en
- **Delvis ersatt av B37–B41** (typsnitt, ikon och delteman ändrades i designuppdateringen 2026-10-28). Färgerna och formerna gäller fortfarande.
- **Beslut:** Färger, knappar och skärmar ska se ut som i PDF:en: limegrönt, turkos, korall och gult, det snurriga ansiktet och G.O.A.T.-loggan.
- **Var i koden:** [`src/app/globals.css`](../../src/app/globals.css), [`src/components/Face.tsx`](../../src/components/Face.tsx).

---

## 2026-10-27 – Intervju: hur spelet fungerar

### B4. Alla spelar på sin egen mobil
- **Beslut:** När man spelar visas kortet bara **hos den vars tur det är**. De andra ser vems tur det är.
- **Alternativ:** samma kort hos alla samtidigt · bara värdens mobil visar kortet.
- **Var i koden:** [`src/components/game/Playing.tsx`](../../src/components/game/Playing.tsx).

### B5. Den vars tur det är trycker NÄSTA
- **Beslut:** Den vars tur det är går vidare till nästa kort.
- **Alternativ:** bara värden · vem som helst.
- **Tillägg (av Claude):** Om personen har tappat uppkopplingen kan värden, eller någon annan om värden också är borta, trycka vidare så att spelet inte fastnar.
- **Var i koden:** `next` i [`src/lib/engine.ts`](../../src/lib/engine.ts).

### B6. Antal klunkar ökar per del
- **Beslut:** ”Jag dricker X klunkar” där X = delens nummer: 1 i del 1, 2 i del 2, 3 i del 3, 4 i del 4.
- **Alternativ:** fast antal per kort · slumpat · kortets värde plus ökning.
- **Var i koden:** `deal()` i [`src/lib/engine.ts`](../../src/lib/engine.ts).

### B7. Tilda skriver korten, spelarna kan lägga till egna
- **Beslut:** Tilda skriver alla frågor, utmaningar och minigames. Spelarna kan dessutom lägga till egna kort innan spelet startar.
- **Alternativ:** adminsida · Claude skriver förslag.
- **Var i koden:** [`content/`](../../content/), tabellen `cards` i Supabase, skärmen ”Egna kort” i [`src/components/game/Intro.tsx`](../../src/components/game/Intro.tsx).

### B8. ”Spara klunk” är en skuld
- **Beslut:** Sparade klunkar läggs på hög och måste drickas senare. Har man fler än 5 sparade visas ERROR-skärmen och spelet pausas tills man har druckit.
- **Alternativ:** ge bort senare · både och.
- **Var i koden:** `MAX_SAVED` och `drink_saved` i [`src/lib/engine.ts`](../../src/lib/engine.ts), `PauseOverlay` i [`src/components/game/Screens.tsx`](../../src/components/game/Screens.tsx).

### B9. Selfien används som profilbild och på ”Vems är bilden?”-kort
- **Beslut:** Selfien från starten blir profilbild. ”Vems är bilden?” finns som korttyp.
- **Alternativ:** bara för skojs skull.

### B10. 15 kort per del
- **Beslut:** Varje del har ett fast antal kort, **15**.
- **Alternativ:** antal varv · värden väljer · tid.
- **Var i koden:** `CARDS_PER_PART` i [`src/lib/deck.ts`](../../src/lib/deck.ts).

### B11. ”Alla röstar”: flest röster dricker
- **Beslut:** Den som får flest röster väljer dricka/spara/utmaningskort. Vid **lika** dricker alla som delar förstaplatsen. Efteråt **visas vem som röstade på vem**.
- **Alternativ:** klunkar per röst.
- **Var i koden:** `resolveVotes()` i [`src/lib/engine.ts`](../../src/lib/engine.ts).
- **Delvis ersatt av B48:** att visa vem som röstade på vem.

### B12. Trivia: flerval, bara en svarar
- **Beslut:** Fyra svarsalternativ. Bara den vars tur det är svarar. Fel svar = dricka/spara/utmaningskort.
- **Alternativ:** alla svarar · snabbast vinner · fritt svar.

### B13. Minigames: klassiska lekar och tillfälliga regler
- **Beslut:** Minigames är kort som förklarar lekar man gör på riktigt, plus regler som gäller en stund (t.ex. ”ingen får säga nej de kommande 5 korten”).
- **Alternativ:** interaktiva spel i appen.
- **Var i koden:** [`content/minigames.txt`](../../content/minigames.txt).

### B14. ”Vems är bilden?” använder nya bilder
- **Beslut:** Kortet ber en hemlig spelare ladda upp en bild (t.ex. ”din 10:e senaste bild”), sedan gissar alla andra.
- **Alternativ:** bara selfies från starten · båda.
- **Tillägg (av Claude):** Fel gissning = dricka. Gissar alla rätt dricker den som laddade upp. Vill hen inte ladda upp dricker hen.
- **Var i koden:** [`content/vems-ar-bilden.txt`](../../content/vems-ar-bilden.txt), `PhotoUpload` i [`src/components/game/Playing.tsx`](../../src/components/game/Playing.tsx).

### B15. Turordning: slumpad men rättvis
- **Beslut:** Nästa person slumpas, men alla får ungefär lika många kort. Ingen får två i rad.
- **Alternativ:** i tur och ordning · helt slumpat.
- **Var i koden:** `pickTurn()` i [`src/lib/engine.ts`](../../src/lib/engine.ts).

### B16. Alla kort har tre knappar, även utmaningar och minigames
- **Beslut:** Utmanings- och minigamekorten får också knappen ”Jag dricker X klunkar”, så alla kort har samma tre knappar: dricka, spara, dra utmaningskort.
- **Alternativ:** bara spara/utmaningskort som i PDF:en · bara NÄSTA.

### B17. Spelarnas egna kort gäller bara i det spelet
- **Beslut:** Egna kort blandas in i just den spelomgången och försvinner sedan.
- **Alternativ:** sparas för alltid · Tilda godkänner först.

### B18. 3–15 spelare
- **Beslut:** Ett spel kräver minst 3 och klarar max 15 spelare.
- **Alternativ:** 2–10 · 3–20+.
- **Var i koden:** `MIN_PLAYERS`, `MAX_PLAYERS` i [`src/lib/engine.ts`](../../src/lib/engine.ts).

### B19. Extrafunktioner: QR/länk, statistik, ljud/vibration
- **Beslut:** Spelkoden kan delas som QR-kod eller länk. Det visas statistik i slutet (drack mest, flest röster, flest utmaningar). Mobilen vibrerar och plingar när det är din tur.
- **Valdes bort:** 18-årskontroll.

### B20. De som väntar ser en topplista
- **Beslut:** När det inte är din tur ser du vems tur det är och en topplista med allas sparade och druckna klunkar.
- **Alternativ:** kortet utan knappar · bara ”Bertils tur”.

### B21. Gruppkort visas hos alla
- **Beslut:** Kort som gäller flera personer (röstningar, X och Y, lag, gruppen, minigames) visas på allas mobiler samtidigt.

### B22. Den som tappar uppkopplingen kan joina igen
- **Beslut:** Man joinar igen med samma namn och behåller sina klunkar.
- **Tillägg (av Claude):** Medan personen är borta hoppas hen över.

### B23. Stör ej är bara en påminnelse
- **Beslut:** Skärmen ”Sätt din telefon på stör ej” finns kvar som påminnelse (hederssystem), eftersom en hemsida inte kan kontrollera det.
- **Alternativ:** ta bort den.

### B24. Bilderna raderas efter spelet
- **Beslut:** Selfies och uppladdade bilder raderas när spelet avslutas.
- **Tillägg (av Claude):** Spel som är äldre än 12 timmar rensas automatiskt, med bilder.
- **Var i koden:** `deletePhotos` och `cleanup` i [`src/lib/store.ts`](../../src/lib/store.ts).

---

## 2026-10-27 – Innehållet från *Frågor till spelet*

### B25. Kategorierna följer delarna
- **Beslut:** Del 1 = Casual, del 2 = Party, del 3 = Cheeky, del 4 = Dirty. **Framtid**-frågorna sprids ut över alla delar.
- **Alternativ:** Framtid i del 1 · glidande mix.
- **Var i koden:** `buildDeck()` i [`src/lib/deck.ts`](../../src/lib/deck.ts).

### B26. Claude skriver felaktiga triviasvar
- **Beslut:** Claude skrev 3 rimliga felaktiga alternativ till varje triviafråga. Tilda kan ändra dem.
- **Alternativ:** fritt svar + visa svaret.
- **Var i koden:** [`content/trivia.txt`](../../content/trivia.txt), kolumnen `wrong_answers` i Supabase.

### B27. Svårighetsgrad: 1 = lätt, 3 = svår
- **Beslut:** Lätta triviafrågor kommer tidigt och svåra sent (del 1: nivå 1, del 2: 1–2, del 3: 2–3, del 4: 3).
- **Alternativ:** svårighet styr klunkar · slumpa.
- **Att kolla:** några lätta frågor står som svåra – se [ATT-KOLLA.md](../ATT-KOLLA.md).

### B28. Klunkar i utmaningar ökar per del
- **Beslut:** Siffror i utmaningstexter ökar med 1 per del (”2 klunkar” → 2, 3, 4, 5).
- **Alternativ:** behåll texten som den är.
- **Tillägg (av Claude):** Gäller också minigames. Knappen ”Jag dricker X klunkar” visar samma antal som står på kortet.
- **Var i koden:** `scaleSips()` i [`src/lib/engine.ts`](../../src/lib/engine.ts).

### B29. Kortmix per del
- **Beslut:** Jämn mix i varje del: 4 ”Vem i rummet?”, 1 ”Vems är bilden?”, 3 direkta frågor, 3 trivia, 3 utmaningar och 1 minigame, i slumpad ordning.
- **Alternativ:** helt slumpat · mindre trivia senare.

### B30. Utmaningskortet tas ur solo-utmaningarna
- **Beslut:** Kortet man drar i stället för att dricka är en slumpad utmaning som bara gäller en person (t.ex. ”Visa första bilden i kamerarullen”).
- **Alternativ:** samma lista med X/Y · en egen tuffare lista.

### B31. Grova utmaningar spärras i början
- **Beslut:** Claude gav varje utmaning en kategori. De grova (t.ex. kondomsorter, porrstjärna, senast onanerade) kommer bara i del 3–4.
- **Alternativ:** blanda fritt.
- **Var i koden:** kolumnen `category` i [`content/utmaningar.txt`](../../content/utmaningar.txt).

---

## 2026-10-27 – Hosting och uppsättning

### B32. Supabase-projektet heter GOAT och ligger i Irland
- **Beslut:** Projektet `GOAT` skapades i regionen West EU (Ireland, `eu-west-1`).

### B33. Vercel-projektet `goat` publicerar från `main`
- **Beslut:** Sidan ligger på **https://goat-six-alpha.vercel.app**. Framework Preset ändrades från *Other* till **Next.js**.
- **Miljövariabler:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (typ *Konfiguration*) och `SUPABASE_SERVICE_ROLE_KEY` (typ *Hemlighet*).

### B34. Den gamla smiley-sidan får ligga kvar tills vidare
- **Beslut:** `index.html` och `smile.png` (från en annan session) togs inte bort. De används inte av spelet.
- **Status:** öppen fråga – kan tas bort om Tilda vill.

---

## 2026-10-28 – Arbetssätt

### B35. Alla beslut registreras i GitHub
- **Beslut:** Alla beslut Tilda tar skrivs in i den här mappen (`docs/beslut/`) i repot.
- **Var:** [`CLAUDE.md`](../../CLAUDE.md) säger åt framtida Claude-sessioner att fortsätta föra loggen.

### B36. Smileyn finns som SVG-fil
- **Beslut:** Smileyn från `smile.png` ritades om som vektorfil, `smile.svg`, med transparent bakgrund.
- **Tillägg (av Claude):** Filen ligger bredvid `smile.png` i repots rot och används inte av spelet. Ansiktet i spelet ritas redan som SVG i [`src/components/Face.tsx`](../../src/components/Face.tsx).
- **Var i koden:** [`smile.svg`](../../smile.svg).

---

## 2026-10-28 – Designuppdatering (grenen `design-refresh`)

### B37. Ikonen är Tildas `smile.svg`, ingen get med horn och skägg
- **Beslut:** Spelets ikon är exakt den smiley Tilda ritat (två spiralögon och en vågig mun). Ingen variant med horn eller skägg.
- **Alternativ:** ansiktet med horn och skägg (föreslogs av Claude, avvisades).
- **Tillägg (av Claude):** Ikonen beskärs till själva ansiktet och används även som app- och flikikon.
- **Var i koden:** [`src/components/Face.tsx`](../../src/components/Face.tsx), [`src/app/icon.svg`](../../src/app/icon.svg).

### B38. Knewave på G.O.A.T och "Låt oss spela"
- **Beslut:** Typsnittet **Knewave** används på stället där det står G.O.A.T och på texten "LÅT OSS SPELA".
- **Var i koden:** `.logo` och `.serif` i [`src/app/globals.css`](../../src/app/globals.css), [`src/app/layout.tsx`](../../src/app/layout.tsx), [`src/app/page.tsx`](../../src/app/page.tsx).

### B39. Glacial Indifference på knappar, namn och övrig text
- **Beslut:** **Glacial Indifference** används på knappar, namn och liknande. Det ersätter Jost och League Spartan.
- **Tillägg (av Claude):** Fonten finns inte på Google Fonts. Filerna (SIL Open Font License) ligger i [`src/fonts/`](../../src/fonts/). Playfair Display i kursiv behålls på skärmrubriker. Tilda har inte sagt något om den.

### B40. Fet text används sparsamt och betyder något
- **Beslut:** Tilda frågade om det är snyggt med fet text på vissa ställen. Claude rekommenderade och byggde: fet = sådant man trycker på eller någons namn (knappar, spelarnamn, korttaggar, frågan). Förklaringar är vanliga. Versaler bara på knappar och taggar. Namn skrivs som de heter.
- **Var i koden:** `.btn`, `.name-pill`, `.kind` i [`src/app/globals.css`](../../src/app/globals.css).

### B41. Ett färgtema per del, ny toppyta och korttaggar
- **Beslut:** Tilda godkände förslagen i designgenomgången och bad Claude bygga allt.
- **Tillägg (av Claude):** Del 1 grön/cyan, del 2 cyan/gul, del 3 korall/grön, del 4 gul/korall (bakgrund/kort). Utmaningar och minigames behåller sina egna skärmar. Toppyta med fem prickar för sparade klunkar och femton streck för framsteg. Svart korttagg med ikon överst på varje kort. Svarta primärknappar, avstängda knappar som mörk genomskinlig fyllning, svarta rubriker med färgad skugga (korall och cyan på bakgrunden hade kontrast runt 2:1). Ny startsida med tagline, lobby med kod och QR i samma kort och värden märkt, knappen direkt under fältet på formulären.
- **Öppen fråga:** Ska G.O.A.T. ha sista punkten i logotypen? Texten skrivs nu med punkt, logotypen utan.
- **Var i koden:** `partTheme` och `KindTag` i [`src/components/ui.tsx`](../../src/components/ui.tsx), `Hud` och `CardScreen` i [`src/components/game/Playing.tsx`](../../src/components/game/Playing.tsx), [`src/components/game/Lobby.tsx`](../../src/components/game/Lobby.tsx).

### B42. Svarta knappar har vit text
- **Beslut:** Tilda påpekade att texten på den svarta knappen "Skapa ett spel" på startsidan inte var vit. Länkknappar (`a.btn`) har nu svart text som standard och `a.btn.ink` vit text.
- **Var i koden:** `a.btn` i [`src/app/globals.css`](../../src/app/globals.css), [`src/app/page.tsx`](../../src/app/page.tsx).

---

## 2026-10-28 – Användarvillkor

### B43. Användarvillkor som länk på startsidan
- **Beslut:** Startsidan får en länk **”Användarvillkor”** under knapparna. Villkoren ska bygga på hur spelet fungerar och var bilder, frågor och annat sparas.
- **Var i koden:** [`src/app/villkor/page.tsx`](../../src/app/villkor/page.tsx) (sidan `/villkor`), länken i [`src/app/page.tsx`](../../src/app/page.tsx), `.legal` i [`src/app/globals.css`](../../src/app/globals.css).

### B44. Kontakt sker via GitHub-ärenden
- **Beslut:** Frågor och begäran om radering görs genom att skapa ett ärende på github.com/tildissen/GOAT/issues.
- **Alternativ:** Tildas e-post · en ny e-postadress · ingen kontakt.
- **Tillägg (av Claude):** Villkoren säger att ärenden är offentliga och att man inte ska skriva personuppgifter i dem. Det fungerar bara så länge repot är publikt.

### B45. Åldersgräns 18 år
- **Beslut:** Villkoren säger att man måste vara minst 18 år. Ingen kontroll i appen (se B19).
- **Alternativ:** 20 år · ingen åldersgräns.

### B46. Innehållet i villkoren
- **Tillägg (av Claude):** Villkoren beskriver bara det koden faktiskt gör: namn, bilder, röster, klunkar och egna kort sparas i Supabase (Irland) och passerar Vercel (USA). Bilderna raderas när någon trycker Avsluta. Resten raderas när spelet är äldre än 12 timmar, vid nästa städning. Inga kakor för spårning, ingen statistik och ingen reklam. Villkoren innehåller också avsnitt om att dricka ansvarsfullt (112, Alkohollinjen 020-84 44 48), samtycke för bilder, förbjudet innehåll, rättigheter (IMY) och ansvarsfrihet.
- **Obs:** Villkoren är inte granskade av en jurist.

### B47. Spelet drivs av Tilda och Tuva
- **Beslut:** Tuva är Tildas kompanjon. Villkoren säger nu att spelet drivs av **Tilda och Tuva** som privatpersoner.
- **Tillägg (av Claude):** Namnet byttes på alla tre ställen där Tilda nämndes i villkoren (avsnitt 1, 7 och 10), så att texten är konsekvent.
- **Var i koden:** [`src/app/villkor/page.tsx`](../../src/app/villkor/page.tsx).

---

## 2026-10-28 – Justeringar i spelet

### B48. Resultatet visar antal röster, inte vem som röstade på vem
- **Beslut:** På resultatkortet efter en röstning visas hur många röster varje person fick (t.ex. "Elsa – 2 röster"), i stället för vem som röstade på vem. Ersätter den delen av B11.
- **Tillägg (av Claude):** Gäller även "Vems är bilden?" (där står det "gissningar"). Listan sorteras med flest röster överst. Servern skickar inte längre ut vem som röstade på vem till mobilerna, bara antalet. Man ser fortfarande sin egen röst.
- **Var i koden:** `toPublic()` i [`src/lib/engine.ts`](../../src/lib/engine.ts), `ResultCard` i [`src/components/game/Playing.tsx`](../../src/components/game/Playing.tsx).
