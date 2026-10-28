import type { Metadata } from 'next';
import Link from 'next/link';
import { Screen } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Användarvillkor – G.O.A.T.',
  description: 'Villkor för G.O.A.T. och hur namn, bilder och frågor sparas.',
};

const ISSUES_URL = 'https://github.com/tildissen/GOAT/issues';
const UPDATED = '28 oktober 2026';

export default function TermsPage() {
  return (
    <Screen bg="cyan">
      <Link href="/" className="link-btn legal-back">
        ← Tillbaka
      </Link>
      <h1 className="display mid" style={{ margin: '8px 0 6px' }}>
        Användarvillkor
      </h1>
      <p className="body-text muted" style={{ marginBottom: 20 }}>
        Senast uppdaterade {UPDATED}
      </p>

      <article className="legal">
        <section>
          <h2>1. Om G.O.A.T.</h2>
          <p>
            G.O.A.T. är ett gratis sällskaps- och dryckesspel som ni spelar tillsammans, var och en på sin egen mobil.
            Spelet drivs av Tilda och Tuva som privatpersoner och är ett hobbyprojekt. Det finns inga konton, ingen reklam och
            ingenting kostar pengar.
          </p>
          <p>Genom att skapa eller joina ett spel godkänner du de här villkoren.</p>
        </section>

        <section>
          <h2>2. Du måste vara 18 år</h2>
          <p>
            Spelet handlar om alkohol och innehåller vuxna frågor. Du måste vara minst 18 år för att spela. Spelet
            kontrollerar inte åldern – det ansvaret ligger på er som spelar.
          </p>
        </section>

        <section>
          <h2>3. Drick ansvarsfullt</h2>
          <ul>
            <li>
              Du bestämmer alltid själv vad och hur mycket du dricker. Alkoholfritt går precis lika bra, och du kan dra
              ett utmaningskort i stället för att dricka.
            </li>
            <li>Ingen ska pressas att dricka, svara på en fråga eller göra en utmaning som känns fel eller farlig.</li>
            <li>Kör aldrig bil eller annat fordon efter att ha druckit.</li>
            <li>Ta hand om varandra. Vid fara för liv eller hälsa: ring 112.</li>
            <li>
              Vill du prata om alkohol, anonymt och gratis? Ring Alkohollinjen på 020-84 44 48 eller gå till
              alkohollinjen.se.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Respekt och samtycke</h2>
          <ul>
            <li>Frågorna kan vara personliga och sexuella. Ingen måste svara – säg pass och drick eller dra ett kort.</li>
            <li>
              Ladda bara upp bilder som du själv har rätt att dela. Ladda inte upp bilder på andra personer utan att de
              har sagt ja.
            </li>
            <li>
              Det är förbjudet att ladda upp nakenbilder, bilder på barn, eller något som är olagligt, kränkande eller
              hatiskt. Samma sak gäller egna kort som du skriver.
            </li>
            <li>Du ansvarar själv för bilder och texter som du laddar upp eller skriver i spelet.</li>
          </ul>
        </section>

        <section>
          <h2>5. Vilka uppgifter sparas?</h2>
          <p>Spelet sparar bara det som behövs för att spelet ska fungera:</p>
          <ul>
            <li>
              <strong>Ditt namn</strong> – det du skriver när du skapar eller joinar.
            </li>
            <li>
              <strong>Bilder</strong> – din selfie och bilder du laddar upp på ”Vems är bilden?”-kort. Bilderna görs
              mindre i din mobil innan de skickas.
            </li>
            <li>
              <strong>Spelets gång</strong> – röster (vem som röstade på vem), sparade och druckna klunkar, antal
              utmaningar, svar på trivia och egna kort som spelarna skrivit.
            </li>
            <li>
              <strong>Teknisk information</strong> – spelkoden, en slumpad spelar-id och när du senast var uppkopplad (så
              att spelet kan hoppa över den som har gått).
            </li>
          </ul>
          <p>
            Spelet frågar aldrig efter e-post, telefonnummer eller lösenord. Det används inga kakor för spårning, ingen
            statistik och ingen reklam.
          </p>
          <p>
            <strong>På din mobil</strong> sparas ditt spelar-id och var du är i introt (i webbläsarens lokala lagring),
            så att du kan komma tillbaka till spelet om du laddar om sidan. Det ligger kvar tills du rensar webbläsarens
            data.
          </p>
        </section>

        <section>
          <h2>6. Var sparas det?</h2>
          <ul>
            <li>
              <strong>Supabase</strong> lagrar spelen och bilderna på servrar i Irland (EU).
            </li>
            <li>
              <strong>Vercel</strong> (ett amerikanskt företag) driver hemsidan och servern som räknar ut spelet. Allt du
              skickar passerar därför Vercel. Vercel kan spara tekniska loggar, till exempel IP-adresser, enligt sina
              egna villkor.
            </li>
          </ul>
          <p>Typsnitten laddas från spelets egen server – inga anrop görs till Google.</p>
        </section>

        <section>
          <h2>7. Vem ser vad?</h2>
          <ul>
            <li>
              Alla i samma spel ser ditt namn, din selfie, dina klunkar, rösterna och bilderna som laddas upp i spelet.
            </li>
            <li>
              Alla som har spelkoden kan joina spelet. Dela den bara med dem ni vill spela med.
            </li>
            <li>
              Bilderna sparas med en lång, svårgissad länk. Den som får tag på länken kan se bilden tills den har
              raderats.
            </li>
            <li>Tilda och Tuva kan som de som driver spelet tekniskt sett se det som sparas, men tittar inte på pågående spel.</li>
          </ul>
        </section>

        <section>
          <h2>8. Hur länge sparas det?</h2>
          <ul>
            <li>
              När spelet avslutas med <strong>Avsluta</strong> raderas alla bilder från spelet direkt.
            </li>
            <li>
              Allt annat – namn, röster, klunkar och egna kort – och bilder från spel som aldrig avslutas, raderas
              automatiskt när spelet är äldre än 12 timmar, nästa gång spelet städar bland gamla spel.
            </li>
            <li>Spelets egna frågor och utmaningar sparas, men de innehåller inga uppgifter om spelarna.</li>
          </ul>
        </section>

        <section>
          <h2>9. Dina rättigheter</h2>
          <p>
            Du har rätt att få veta vilka uppgifter om dig som finns, få dem rättade och få dem raderade. Eftersom allt
            raderas inom ungefär ett dygn är det oftast snabbast att trycka <strong>Avsluta</strong> eller vänta.
          </p>
          <p>
            Vill du att något raderas direkt, eller har du frågor? Skapa ett ärende på{' '}
            <a href={ISSUES_URL} target="_blank" rel="noreferrer">
              github.com/tildissen/GOAT/issues
            </a>{' '}
            och ange spelkoden. Ärenden där är offentliga, så skriv inga personuppgifter i dem.
          </p>
          <p>
            Tycker du att dina uppgifter har hanterats fel kan du vända dig till Integritetsskyddsmyndigheten (IMY).
          </p>
        </section>

        <section>
          <h2>10. Ansvar</h2>
          <p>
            Spelet är gratis och finns i befintligt skick. Det kan innehålla fel eller sluta fungera ibland. Ni som spelar
            ansvarar själva för hur ni spelar, vad ni dricker och vad som händer under kvällen. Tilda och Tuva ansvarar inte för
            skador eller förluster som uppstår när spelet används, eller för bilder och texter som spelarna laddar upp.
          </p>
        </section>

        <section>
          <h2>11. Ändringar</h2>
          <p>
            Villkoren kan uppdateras när spelet ändras. Datumet högst upp visar när de senast ändrades. Spelar du efter en
            ändring gäller de nya villkoren.
          </p>
        </section>
      </article>

      <Link href="/" className="btn ink" style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Tillbaka till spelet
      </Link>
    </Screen>
  );
}
