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
- **Delvis ersatt av B50:** på gruppkort trycker värden NÄSTA.

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

### B49. "Vill du hoppa över?" ovanför knapparna på utmaningar och minigames
- **Beslut:** På utmanings- och minigamekort står "Vill du hoppa över?" ovanför knapparna "Jag dricker …", "Jag vill spara …" och "Dra ett utmaningskort", eftersom knapparna där är ett sätt att slippa uppgiften.
- **Tillägg (av Claude):** Rubriken står inte på direkta frågor, trivia eller röstningsresultat, där knapparna är själva konsekvensen och inte ett sätt att hoppa över.
- **Var i koden:** `prompt` i `ChoiceButtons` ([`src/components/game/shared.tsx`](../../src/components/game/shared.tsx)), `Challenge` i [`src/components/game/Playing.tsx`](../../src/components/game/Playing.tsx), `.choice-prompt` i [`src/app/globals.css`](../../src/app/globals.css).

### B50. Värden trycker NÄSTA på gruppkort
- **Beslut:** På kort som gäller hela gruppen trycker **värden** NÄSTA: röstningar, "Vems är bilden?", gruppkort, X och Y, lag och minigames. På kort till en person (direkt fråga, trivia, solo-utmaning) trycker personen själv, som tidigare. Ersätter B5 för gruppkort.
- **Varför:** Det var förvirrande att en osynlig, slumpad spelare fick NÄSTA-knappen på gruppkort.
- **Alternativ:** behåll lottningen men visa vems tur det är · vem som helst får trycka.
- **Tillägg (av Claude):** Även "Visa resultatet nu" vid röstningar är bara för värden. De andra ser "Väntar på att Tilda (värd) trycker nästa…". Är värden borta kan vem som helst trycka, så att spelet inte fastnar. Rättade samtidigt en bugg där "Det gäller dig!" visades på minigames och gruppkort – nu bara på X och Y-kort.
- **Var i koden:** `canPressNext()` i [`src/lib/engine.ts`](../../src/lib/engine.ts), `canAdvance`/`NextButton` i [`src/components/game/Playing.tsx`](../../src/components/game/Playing.tsx).

### B51. Stor text i Glacial Indifference, Playfair tas bort
- **Beslut:** All stor text (rubriker, spelarnamn på resultatkorten och liknande) byter från Playfair Display i kursiv till Glacial Indifference i fet stil. Knewave finns kvar på G.O.A.T och "Låt oss spela".
- **Ersätter:** den del av B39 som lät Playfair vara kvar på skärmrubriker.
- **Var i koden:** `.display` i [`src/app/globals.css`](../../src/app/globals.css), [`src/app/layout.tsx`](../../src/app/layout.tsx).

### B52. Knewave på stora spelarnamn
- **Beslut:** Spelarnamn som står stort skrivs i Knewave: den som röstas fram på resultatkortet, "Elsas tur" när någon annan spelar, namnet på ditt utmaningskort och namnet över din egen fråga eller utmaning.
- **Tillägg (av Claude):** Övriga namn (topplistor, knappar, rösta-knapparna) är kvar i Glacial Indifference.
- **Var i koden:** `.name-font` i [`src/app/globals.css`](../../src/app/globals.css), [`src/components/game/Playing.tsx`](../../src/components/game/Playing.tsx), [`src/components/game/Screens.tsx`](../../src/components/game/Screens.tsx).

---

## 2026-11-05 – Bygg eget spel

*(B51 och B52 hette först B43 och B44, men de numren var redan använda. De döptes om 2026-11-05.)*

### B53. Nytt spelläge: "Bygg eget spel"
- **Beslut:** Startsidan får ett tredje alternativ, **"Bygg eget spel"**. I det läget gör spelarna spelet själva genom att skriva egna kort.
- **Tillägg (av Claude):** Knappen ligger under "Joina ett spel" och är korallfärgad. Flödet är som ett vanligt spel: namn, lobby med spelkod, stör ej, regler, selfie – men skärmen "Egna kort" blir obligatorisk och heter "Skriv dina kort". Lobbyn visar "Bygg eget spel". Spelet sparas inte – det raderas efter 12 timmar som andra spel, så villkoren behövde inte ändras.
- **Var i koden:** `mode` i [`src/lib/types.ts`](../../src/lib/types.ts), knappen i [`src/app/page.tsx`](../../src/app/page.tsx), [`src/app/skapa/page.tsx`](../../src/app/skapa/page.tsx) (`/skapa?eget=1`), [`src/components/NameForm.tsx`](../../src/components/NameForm.tsx).

### B54. Alla spelare måste skriva minst 3 kort
- **Beslut:** I "Bygg eget spel" är det obligatoriskt för alla spelare att skriva minst 3 frågor, påståenden eller utmaningar.
- **Tillägg (av Claude):** Man kan inte gå vidare (och servern godkänner inte "redo") förrän man skrivit 3. Max 10 kort per person. Egna minigames räknas inte till de 3. Den som joinar efter att spelet startat slipper skriva.
- **Var i koden:** `MIN_OWN_CARDS`, `ownCardCount()` och `ready` i [`src/lib/engine.ts`](../../src/lib/engine.ts), `EgnaKort` i [`src/components/game/Intro.tsx`](../../src/components/game/Intro.tsx).

### B55. Trivia förvald, minigames förvalda plus frivilliga egna
- **Beslut:** Triviafrågorna är förvalda (de som finns i dag). Minigames: Tilda var osäker – Claude rekommenderade och byggde att de befintliga minigamesen följer med och att spelarna dessutom *kan* skriva egna, men det är frivilligt.
- **Tillägg (av Claude):** Egna minigames kommer alltid med och går före de förvalda. "Vems är bilden?"-korten är också förvalda och blandas in.

### B56. Beskrivning och exempel för varje korttyp
- **Beslut:** Varje korttyp har en beskrivning så att korten fylls i rätt.
- **Tillägg (av Claude):** Spelarna väljer typ för varje kort: **Vem i rummet?**, **Direkt fråga**, **Utmaning till en person**, **Utmaning för alla** och **Minigame (frivilligt)**, med beskrivning och exempel för den valda typen. Minigames har ett namnfält. Samma typer går nu också att välja under "Egna kort" i vanliga spel (frivilligt där).
- **Var i koden:** `CARD_TYPES` i [`src/components/game/Intro.tsx`](../../src/components/game/Intro.tsx).

### B57. Längden styrs av hur många kort som skrivs
- **Tillägg (av Claude):** Ungefär 12 egna kort per del, 1–4 delar. Varje del får trivia (ungefär en per tre egna kort), en "Vems är bilden?" och ett minigame. Klunkarna ökar per del och trivian blir svårare per del, som i vanliga spel. Utmaningskorten man drar är de förvalda solo-utmaningarna.
- **Var i koden:** `buildCustomDeck()` i [`src/lib/deck.ts`](../../src/lib/deck.ts).

### B58. Värden väljer tillfälle i "Bygg eget spel": AW, Familjespel eller Fest
- **Beslut:** När man bygger ett eget spel väljer värden tillfälle, och korten anpassas efter det. Tillfällena är **AW**, **Familjespel** och **Fest**. Valet finns bara i "Bygg eget spel", inte i vanliga spel.
- **Alternativ:** båda spellägena · bara vanliga spel. Dejt valdes bort (kräver spel för 2 personer).
- **Tillägg (av Claude):** Tillfället väljs på samma skärm som namnet och syns i lobbyn ("Bygg eget spel · AW"). Fest använder de vanliga korten och blir vildare per del. Ändrar delvis B57.
- **Var i koden:** `occasion` i [`src/lib/types.ts`](../../src/lib/types.ts), `OCCASIONS` i [`src/components/NameForm.tsx`](../../src/components/NameForm.tsx).

### B59. Familjespel är alkoholfritt och för alla åldrar
- **Beslut:** Barn ska kunna vara med i Familjespel, så det är alkoholfritt.
- **Tillägg (av Claude):** "Klunkar" blir **minuspoäng**, och den med minst minuspoäng vinner. Knappen "spara" och ERROR-skärmen finns inte i familjespel. Spelreglerna har en egen familjeversion. Om spelarna själva skriver "dricker 2 klunkar" skrivs det om till "får 2 minuspoäng". Användarvillkoren har ett undantag från 18-årsgränsen för Familjespel (tillsammans med en vuxen; barn under 13 behöver förälderns tillåtelse för att ladda upp bilder).
- **Var i koden:** `isFamily()`, `familyText()` i [`src/lib/engine.ts`](../../src/lib/engine.ts), [`src/components/game/shared.tsx`](../../src/components/game/shared.tsx), `Regler` i [`src/components/game/Intro.tsx`](../../src/components/game/Intro.tsx), avsnitt 2 i [`src/app/villkor/page.tsx`](../../src/app/villkor/page.tsx).

### B60. Claude skriver förvalda kort för AW och Familjespel
- **Beslut:** Det fanns för få lugna kort, så Claude skrev egna kort. Tilda godkände tonen utifrån exempel. AW-minigamesen ska vara enkla kategorilekar (bilmärken o.d.) i stället för kontorsord.
- **Tillägg (av Claude):** Per tillfälle: 25 "Vem i rummet?", 25 direkta frågor, 20 solo-utmaningar (används också som utmaningskort), 20 utmaningar för alla och 8 bilduppmaningar. Totalt 220 nya kort. Tilda kan ändra dem i Supabase eller i filerna.
- **Var i koden:** [`content/aw.txt`](../../content/aw.txt), [`content/familj.txt`](../../content/familj.txt), kolumnen `occasion` i tabellen `cards`.

### B61. Kategorilekar och passande vanliga minigames i alla tillfällen
- **Beslut:** Kategorileken (bilmärken, länder osv.) ska finnas i alla minigames. Vanliga minigames som passar, t.ex. Viskleken och Tumregeln, ska också finnas i AW och Familjespel.
- **Tillägg (av Claude):** AW får alla vanliga minigames plus 10 egna (AW-versionen vinner om namnet finns i båda). Familjespel har 14 alkoholfria minigames, bland andra Kategorier, Viskleken, Tumregeln, Nej-förbud, Frågemästaren och Jag har aldrig med minuspoäng. Minigames som går ut på att dricka (Vattenfall, Thunder, Vänsterhanden) är inte med i Familjespel.

### B62. Förvalda kort fyller på när spelarna skrivit få
- **Tillägg (av Claude):** Varje del fylls upp till 12 frågor och utmaningar med förvalda kort för tillfället, så att spelet blir lagom långt även om alla bara skriver 3 kort. Spelet har minst 2 och högst 4 delar. Ersätter delvis B57 (som bara använde spelarnas egna kort).
- **Var i koden:** `buildCustomDeck()` i [`src/lib/deck.ts`](../../src/lib/deck.ts).

### B63. Supabase behöver uppdateras
- **Tillägg (av Claude):** Tabellen `cards` har fått kolumnen `occasion`. `supabase/schema.sql` och `supabase/seed.sql` (nu 800 kort) måste köras igen i Supabase. Tills dess fungerar spelet som vanligt, men AW och Familjespel får inga förvalda kort.

### B64. Supabase uppdaterad via Supabase-connectorn
- **Beslut:** Tilda kopplade Supabase-connectorn i Claude och bad Claude uppdatera databasen med den, i stället för att klistra in SQL själv.
- **Tillägg (av Claude):** Kolumnen `occasion` lades till som migreringen `add_cards_occasion`. Bara de 220 nya korten för AW och Familjespel lades in – de 580 befintliga korten rördes inte, så eventuella ändringar i dem finns kvar. Databasen har nu 800 kort. B63 är därmed klart. Supabases säkerhetsråd visar bara att tabellerna har RLS utan regler, vilket är avsiktligt: bara spelets server får läsa och skriva.

---

## 2026-11-05 – Fler justeringar

### B65. Ingen räknare på "Skriv dina kort"
- **Beslut:** Texten "3 av 3 kort skrivna" tas bort, eftersom man kan skriva fler än 3 kort och räknaren då blev missvisande.
- **Tillägg (av Claude):** Knappen längst ner visar fortfarande hur många kort som saknas ("Skriv 2 kort till") tills man har skrivit 3. I vanliga spel står "N egna kort i spelet" kvar under "Egna kort".
- **Var i koden:** `EgnaKort` i [`src/components/game/Intro.tsx`](../../src/components/game/Intro.tsx).

### B66. Välj mottagare för egna direkta frågor
- **Beslut:** När man skriver en direkt fråga kan man välja vem den ska gå till. Bakgrund: ett kort som "Lucas, vem gillar du minst på sälj?" kunde hamna hos någon annan än Lucas, eftersom kortet gick till den vars tur det var.
- **Alternativ:** den som skrev frågan får den aldrig själv · visa frågan för alla.
- **Tillägg (av Claude):** Samma val finns för "Utmaning till en person". Man väljer "Vem som helst" (som tidigare) eller en av de andra spelarna – inte sig själv. Kortet går till den valda personen när det dyker upp. Är personen inte uppkopplad då går det till den vars tur det är, så att spelet inte fastnar. Listan över ens kort visar mottagaren ("Direkt fråga → Lucas"). Fungerar både i "Bygg eget spel" och under "Egna kort" i vanliga spel.
- **Var i koden:** `targetId` i [`src/lib/types.ts`](../../src/lib/types.ts), `add_custom` och `deal()` i [`src/lib/engine.ts`](../../src/lib/engine.ts), "Till vem?" i `EgnaKort` ([`src/components/game/Intro.tsx`](../../src/components/game/Intro.tsx)).

### B67. 10 kort per del
- **Beslut:** Varje del har 10 kort i stället för 15, eftersom spelet blev för långt och tråkigt. Ersätter B10.
- **Tillägg (av Claude):** Vanliga spel: 3 "Vem i rummet?" (varav 1 Framtid), 1 "Vems är bilden?", 2 direkta frågor (varav 1 Framtid), 1 trivia, 2 utmaningar och 1 minigame per del. "Bygg eget spel": 7 frågor och utmaningar (egna, fyllda med förvalda om det behövs) plus minigame, trivia och bildkort. Har spelarna skrivit fler än 28 kort blir delarna längre, eftersom alla egna kort alltid kommer med. Ersätter delvis B29, B57 och B62.
- **Var i koden:** `CARDS_PER_PART`, `OWN_CARDS_PER_PART`, `buildDeck()` och `buildCustomDeck()` i [`src/lib/deck.ts`](../../src/lib/deck.ts).

### B68. Minigames har bara "Nästa" och "Hoppa över"
- **Beslut:** Knapparna "Jag dricker", "Jag vill spara" och "Dra ett utmaningskort" tas bort från minigames. Där finns bara "Nästa" och "Hoppa över". Ersätter B49 och B16 för minigames.
- **Tillägg (av Claude):** Båda knapparna är värdens (se B50) och går vidare till nästa kort. De andra ser "Väntar på att … (värd) trycker nästa…". Servern godkänner inte heller val på minigames.
- **Var i koden:** `canChoose()` i [`src/lib/engine.ts`](../../src/lib/engine.ts), `Challenge` i [`src/components/game/Playing.tsx`](../../src/components/game/Playing.tsx).

### B69. Vem som får välja dricka/spara/utmaningskort (genomgång)
- **Beslut:** Tilda bad Claude dubbelkolla vem som får knapparna "Jag svarar", "Jag dricker", "Jag vill spara" och "Dra ett utmaningskort".
- **Tillägg (av Claude):** Genomgången visade att alla spelare fick knapparna på X och Y-kort, fast utmaningen bara gäller två personer. Nu får bara X och Y dem. Reglerna är:
  - **Direkt fråga:** bara den som frågan är till – "Jag svarar!" plus dricka/spara/utmaningskort.
  - **Trivia:** bara den som svarar, och bara efter fel svar (inte "Jag svarar").
  - **Utmaning till en person:** bara den personen, plus "Klar!".
  - **X och Y:** bara de två.
  - **Utmaning för alla och lag:** alla.
  - **Alla röstar / Vems är bilden?:** bara de som förlorade röstningen (flest röster, eller gissade fel).
  - **Vems är bilden? (uppladdning):** den hemliga uppladdaren kan välja "Jag vägrar (och dricker)".
  - **Minigames:** ingen (B68).
- **Var i koden:** `canChoose()` i [`src/lib/engine.ts`](../../src/lib/engine.ts).

### B70. Minigames har bara "Nästa"
- **Beslut:** Länken "Hoppa över" tas bort från minigames – det räcker med "Nästa". Ersätter den delen av B68.
- **Var i koden:** `Challenge` i [`src/components/game/Playing.tsx`](../../src/components/game/Playing.tsx).

## 2026-11-05 – Rubriker och fält

### B71. Ingen svart kant på fälten, rubrikerna behåller sitt typsnitt
- **Beslut:** Fälten får inte längre en svart kant runt sig när man skriver. Tilda valde att ta bort den.
- **Alternativ:** Tilda bad först om Knewave på alla rubriker (även i Bygg eget spel) men ändrade sig och ville inte ändra rubrikerna ändå. De är kvar i Glacial Indifference enligt B43.
- **Tillägg (av Claude):** I stället för kanten blir fältet en aning mörkare grönt när man skriver, så det syns vilket fält som är aktivt.
- **Var i koden:** `.input:focus-visible` i [`src/app/globals.css`](../../src/app/globals.css).

## 2026-11-05 – Stör ej och tillgänglig kontrast

### B72. Ny "stör ej"-skärm och kontrast enligt WCAG 2.1 AA
- **Beslut:** Tilda tyckte att "stör ej"-skärmen (gul varningstriangel på en korallröd ruta) inte var snygg och bad Claude göra om den och kontrollera kontrasten i hela spelet enligt WCAG.
- **Beslut:** Raden "Då slipper ni notiser mitt i spelet." ska inte vara med. Tilda ifrågasatte också om månikonen passade G.O.A.T.-temat. Den gjordes om i samma handritade streckstil som smileyn.
- **Tillägg (av Claude):** Ny skärm på cyan bakgrund med en sovande telefon: telefonen är ritad med lösa svarta streck utan fyllning, har slutna ögon, samma vågiga mun som ikonen och Z i Knewave. Rubriken har "stör ej" markerat med gult. Knappen heter fortfarande "Klar". B23 gäller: det är bara en påminnelse.
- **Mätning:** Claude mätte textkontrasten på 46 skärmar i alla delar och lägen (krav 4,5:1 för vanlig text och 3:1 för stor text). Ingen text föll igenom. Fem saker som mätningen inte nådde justerades efter beräkning:
  - Felmeddelandet i formulären var korall text på vitt (3,1:1). Nu svart text med korall kant.
  - Brödtexten på ERROR-skärmen var vit på röd (3,7:1). Nu svart (5,7:1). Själva ordet ERROR är stor text och är kvar vitt.
  - Textfälten (grönt på cyan, 1,3:1) fick en tunn mörk kant (ca 5:1), eftersom ett fälts kant måste synas mot bakgrunden (WCAG 1.4.11). Kanten är inte svart och ändras inte när man skriver. **Ersatt av B74.**
  - Spelare som är offline tonas inte längre ner så mycket (opacitet 0,5 gav under 4,5:1, nu 0,65). `.muted` höjdes från 0,7 till 0,75.
  - Toppytan visar nu också siffran ("Del 1 · 8/15"), så att framsteget inte bara visas med streck.
- **Var i koden:** `StorEj` i [`src/components/game/Intro.tsx`](../../src/components/game/Intro.tsx), `.input`, `.error-text`, `.storej`, `.board-row.offline` i [`src/app/globals.css`](../../src/app/globals.css), [`src/components/game/Screens.tsx`](../../src/components/game/Screens.tsx), `Hud` i [`src/components/game/Playing.tsx`](../../src/components/game/Playing.tsx).

### B73. Alla ikoner och bilder i G.O.A.T.-stil, plus delningsbild
- **Beslut:** Tilda bad Claude gå igenom alla ikoner och bilder så att de passar temat.
- **Tillägg (av Claude):** Korttaggarnas sex ikoner ritades om i samma lösa, handritade streckstil som smileyn (runda ändar, inga fyllningar, lite sneda linjer) och samlades i en gemensam `Icon`-komponent. Emojis byttes mot ritade ikoner: 💼 → portfölj, 👨‍👩‍👧 → vuxen och barn, 🎉 → partyspruta på tillfälle-valen, 🏆 → pokal på slutskärmen och 🐐 → själva smileyn efter "RÄTT!". Emojin 🤫 i texten för bildkort och tecknen ✓ och ✕ är kvar.
- **Tillägg (av Claude):** Delningsbild (`opengraph-image.png`, 1200 × 630) och ikon för mobilens hemskärm (`apple-icon.png`) med smileyn, så att länken ser ut som G.O.A.T. när den delas.
- **Öppen fråga:** `index.html` och `smile.png` i repots rot (B34) används inte av spelet. De är kvar tills Tilda säger till.
- **Var i koden:** `Icon` och `KindTag` i [`src/components/ui.tsx`](../../src/components/ui.tsx), [`src/components/NameForm.tsx`](../../src/components/NameForm.tsx), [`src/components/game/shared.tsx`](../../src/components/game/shared.tsx), [`src/components/game/Playing.tsx`](../../src/components/game/Playing.tsx), [`src/app/opengraph-image.png`](../../src/app/opengraph-image.png), [`src/app/apple-icon.png`](../../src/app/apple-icon.png).

### B74. Ingen kant runt textfälten
- **Beslut:** Textfälten får ingen kant alls, varken vilande eller när man skriver. Tilda ville ta bort den svarta raden runt rutan. Fältet blir en aning mörkare grönt när man skriver.
- **Ersätter:** kanten som lades till i B72.
- **Obs (av Claude):** Utan kant är grönt fält mot cyan bakgrund bara 1,3:1, vilket inte når 3:1 för ett fälts kant (WCAG 1.4.11). Texten ovanför ("Vad heter du?") visar vad fältet är. Vill Tilda ha det strikt kan en kant eller understrykning läggas tillbaka.
- **Var i koden:** `.input` i [`src/app/globals.css`](../../src/app/globals.css).

### B75. Större namn och Knewave på "Del … är klar!"
- **Beslut:** Tilda ville ha större namn och ett annat typsnitt på "Del ett är klar!", "Del två är klar!" och så vidare. Namnet över en direktfråga eller solo-utmaning går från 28 px till upp till 52 px. "Elsas tur" går från mellan till stor rubrik. Bildägarens namn på resultatkortet och namnet på utmaningskortet blev större.
- **Tillägg (av Claude):** Claude valde Knewave för "Del … är klar!", eftersom det är det typsnitt Tilda redan valt för G.O.A.T och namn. Det gäller även slutskärmen ("Del fyra är klar!").
- **Var i koden:** `.heading.name-big` i [`src/app/globals.css`](../../src/app/globals.css), [`src/components/game/Playing.tsx`](../../src/components/game/Playing.tsx), [`src/components/game/Screens.tsx`](../../src/components/game/Screens.tsx).
