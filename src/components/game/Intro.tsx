'use client';

import { useEffect, useRef, useState } from 'react';
import { compressImage, loadLocal, saveLocal } from '@/lib/client';
import { isFamily, MAX_OWN_CARDS, MIN_OWN_CARDS, MIN_PLAYERS, ownCardCount } from '@/lib/engine';
import type { CustomCard, CustomKind } from '@/lib/types';
import Face from '../Face';
import { Avatar, Screen } from '../ui';
import { nameOf, type GameProps } from './shared';

type Step = 'storej' | 'regler' | 'selfie' | 'egna';

/** Stegen varje spelare går igenom innan spelet: stör ej, regler, selfie och egna kort. */
export default function Intro(props: GameProps) {
  const { code, state, me, act } = props;
  const key = `goat:${code}:${me.id}:step`;
  const [step, setStep] = useState<Step>('storej');
  useEffect(() => setStep(loadLocal<Step>(key, 'storej')), [key]);

  const go = (next: Step) => {
    saveLocal(key, next);
    setStep(next);
    window.scrollTo(0, 0);
  };
  const canAddCards = state.status === 'lobby' || state.status === 'intro';
  const finish = () => act({ type: 'ready' });
  // Startade värden spelet medan man skrev egna kort? Då hoppar man in direkt (korten kan inte läggas till längre).
  const late = step === 'egna' && !canAddCards;
  useEffect(() => {
    if (late) act({ type: 'ready' });
  }, [late, act]);

  if (step === 'storej') return <StorEj onDone={() => go('regler')} />;
  if (step === 'regler') return <Regler state={state} onDone={() => go('selfie')} />;
  if (step === 'selfie') return <Selfie {...props} onDone={() => (canAddCards ? go('egna') : finish())} />;
  if (late) return null;
  return <EgnaKort {...props} onDone={finish} />;
}

/** Sovande telefon i samma lösa streckstil som G.O.A.T.-ikonen: samma mun, slutna ögon och Z i Knewave. */
const SOVER_MUN =
  'M55 174 C52 188 50 202 64 203 C80 204 96 194 108 205 C122 218 140 268 158 268 C178 268 190 230 208 232 C224 234 228 252 242 248 C256 244 254 212 270 210 C286 208 300 206 303 172';

function StorEj({ onDone }: { onDone: () => void }) {
  return (
    <Screen bg="cyan" center>
      <div className="stack storej">
        <svg className="storej-icon" viewBox="0 0 210 220" fill="none" stroke="#111" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M58 30C58 24 64 19 72 20L128 21C137 21 142 26 142 34L141 186C141 195 135 200 127 200L72 199C63 199 58 194 58 186Z" />
          <path d="M88 37L112 36" />
          <path d="M86 187L114 188" />
          <path d="M75 92C80 101 90 101 95 92" />
          <path d="M105 92C110 101 120 101 125 92" />
          <path d={SOVER_MUN} transform="translate(64.6 85.6) scale(0.2)" vectorEffect="non-scaling-stroke" />
          <g fill="#111" stroke="none" fontFamily="var(--font-knewave), sans-serif">
            <text x="156" y="78" fontSize="38">Z</text>
            <text x="177" y="50" fontSize="30">z</text>
            <text x="194" y="26" fontSize="22">z</text>
          </g>
        </svg>
        <h1 className="storej-title">
          Sätt din telefon på <span className="hl">stör ej</span> för att fortsätta
        </h1>
        <button className="btn ink" onClick={onDone}>
          Klar
        </button>
      </div>
    </Screen>
  );
}

function Regler({ state, onDone }: { state: GameProps['state']; onDone: () => void }) {
  const parts = state.mode === 'custom' ? 'flera delar' : '4 delar';
  return (
    <Screen bg="coral">
      <h1 className="display big" style={{ marginTop: 12, marginBottom: 16 }}>
        SPELREGLER
      </h1>
      <div className="card green" style={{ padding: '24px 18px', gap: 16 }}>
        {isFamily(state) ? (
          <>
            <p className="body-text">
              <strong>Välkommen</strong> till G.O.A.T. – familjeversionen!
            </p>
            <p className="body-text">
              Spelet är uppdelat i {parts}, och för varje del blir utmaningarna lite svårare. Här styr nästa kort allt.
              Det kan vara en fråga, ett spel eller en utmaning – och ingen vet vad som väntar.
            </p>
            <p className="body-text">
              <strong>Vill du inte svara?</strong> Då tar du minuspoäng – eller drar ett utmaningskort. Men då måste du
              också göra utmaningen. Inga ursäkter, inga ”jag gör det sen”.
            </p>
            <p className="body-text">
              Den som har <strong>minst minuspoäng</strong> när spelet är slut vinner.
            </p>
          </>
        ) : (
          <>
            <p className="body-text">
              <strong>Välkommen</strong> till spelet som börjar oskyldigt… och slutar i fullständigt <em>kaos</em>.
            </p>
            <p className="body-text">
              Spelet är uppdelat i {parts}, och för varje del blir frågorna sjukare, minigamesen mer kaotiska och tempot
              så högt att du börjar ifrågasätta dina livsval.
            </p>
            <p className="body-text">
              Här styr nästa kort allt. Det kan vara en fråga, ett spel eller en utmaning – och nej, ingen vet vad som
              väntar.
            </p>
            <p className="body-text">
              <strong>Är du nykter?</strong> Tråkigt. Men lugn, du kan alltid dra ett utmaningskort i stället för att
              dricka. Men då måste du också göra utmaningen. Inga ursäkter, inga kompromisser, inga ”jag gör det sen”.
            </p>
            <p className="body-text">
              Du får <strong>spara</strong> klunkar – men bara upp till 5 stycken. Får du fler än så pausas spelet tills
              du druckit ikapp. Det här är ett dryckesspel, inte en sparbank.
            </p>
          </>
        )}
        <button className="btn ink" onClick={onDone} style={{ marginTop: 8 }}>
          Nästa
        </button>
      </div>
    </Screen>
  );
}

function Selfie({ me, busy, upload, onDone }: GameProps & { onDone: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setWorking(true);
    try {
      await upload(await compressImage(file, 600), 'selfie');
    } finally {
      setWorking(false);
    }
  }

  return (
    <Screen bg="green">
      <div className="stack grow" style={{ justifyContent: 'center', gap: 28 }}>
        {me.selfie && <Avatar player={me} big />}
        <h1 className="heading caps">
          Ladda upp din senaste selfie
          <br />
          <em>Snygging!</em>
        </h1>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <button className="btn cyan" disabled={busy || working} onClick={() => input.current?.click()}>
          {working ? 'Laddar upp…' : me.selfie ? 'Byt bild' : 'Ladda upp här!'}
        </button>
      </div>
      <div className="stack">
        {!me.selfie && (
          <button className="link-btn" onClick={onDone}>
            Hoppa över
          </button>
        )}
        <button className="btn ink" disabled={!me.selfie || working} onClick={onDone}>
          Nästa
        </button>
      </div>
    </Screen>
  );
}

type CardTypeKey = 'vem' | 'direkt' | 'solo' | 'alla' | 'minigame';

/** Korttyperna spelarna kan skriva, med beskrivning och exempel så att de fylls i rätt. */
const CARD_TYPES: {
  key: CardTypeKey;
  kind: CustomKind;
  players?: number;
  label: string;
  desc: string;
  example: string;
  titleExample?: string;
}[] = [
  {
    key: 'vem',
    kind: 'vem',
    label: 'Vem i rummet?',
    desc: 'Ett påstående som alla röstar på. Börja gärna med "Vem …". Den som får flest röster dricker.',
    example: 'Vem skulle överleva längst i en zombieapokalyps?',
  },
  {
    key: 'direkt',
    kind: 'direkt',
    label: 'Direkt fråga',
    desc: 'En fråga till en person – välj vem nedan, eller låt den vars tur det är få den. Bara hen ser frågan och måste svara – eller dricka.',
    example: 'Vad är det pinsammaste du har gjort på fyllan?',
  },
  {
    key: 'solo',
    kind: 'utmaning',
    players: 1,
    label: 'Utmaning till en person',
    desc: 'Något som en person måste göra – välj vem nedan, eller låt den vars tur det är få den. Vägrar hen får hen dricka eller dra ett utmaningskort.',
    example: 'Härma någon i rummet tills någon gissar vem det är.',
  },
  {
    key: 'alla',
    kind: 'utmaning',
    players: 0,
    label: 'Utmaning för alla',
    desc: 'Gäller hela gruppen. Skriv vem som ska dricka och hur många klunkar – antalet ökar automatiskt för varje del.',
    example: 'Alla som har på sig något svart tar 2 klunkar.',
  },
  {
    key: 'minigame',
    kind: 'minigame',
    label: 'Minigame (frivilligt)',
    desc: 'En lek eller regel som alla gör tillsammans. Ge den ett namn och förklara reglerna. Räknas inte till dina kort.',
    example: 'Ingen får prata förrän nästa kort. Den som pratar dricker 2 klunkar.',
    titleExample: 'Tyst minut',
  },
];

/** Familjespel: samma korttyper, men med minuspoäng i stället för att dricka. */
const FAMILY_TYPE_TEXT: Partial<Record<CardTypeKey, { desc: string; example: string }>> = {
  vem: {
    desc: 'Ett påstående som alla röstar på. Börja gärna med "Vem …". Den som får flest röster får minuspoäng.',
    example: 'Vem skulle klara sig längst utan mobil?',
  },
  direkt: {
    desc: 'En fråga till en person – välj vem nedan, eller låt den vars tur det är få den. Bara hen ser frågan och måste svara – eller ta minuspoäng.',
    example: 'Vilken superkraft skulle du välja, och varför?',
  },
  solo: {
    desc: 'Något som en person måste göra – välj vem nedan, eller låt den vars tur det är få den. Vägrar hen får hen minuspoäng eller drar ett utmaningskort.',
    example: 'Härma ett djur tills någon gissar vilket.',
  },
  alla: {
    desc: 'Gäller hela gruppen. Skriv vem som får minuspoäng och hur många – antalet ökar automatiskt för varje del.',
    example: 'Alla som har randiga strumpor får 2 minuspoäng.',
  },
  minigame: {
    desc: 'En lek eller regel som alla gör tillsammans. Ge den ett namn och förklara reglerna. Räknas inte till dina kort.',
    example: 'Alla står stilla som statyer i 20 sekunder. Den som rör sig först får 2 minuspoäng.',
  },
};

function typeOf(c: CustomCard) {
  if (c.kind === 'utmaning') return CARD_TYPES.find((t) => t.key === (c.players === 1 ? 'solo' : 'alla'))!;
  return CARD_TYPES.find((t) => t.kind === c.kind)!;
}

function EgnaKort({ state, me, busy, act, onDone }: GameProps & { onDone: () => void }) {
  const custom = state.mode === 'custom';
  const [typeKey, setTypeKey] = useState<CardTypeKey>('vem');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [added, setAdded] = useState(0);
  const baseType = CARD_TYPES.find((t) => t.key === typeKey)!;
  const type = isFamily(state)
    ? { ...baseType, ...FAMILY_TYPE_TEXT[typeKey], titleExample: baseType.titleExample && 'Frys!' }
    : baseType;
  const mine = state.customCards.filter((c) => c.by === me.id);
  const own = ownCardCount(state, me.id);
  const missing = custom ? Math.max(0, MIN_OWN_CARDS - own) : 0;
  const full = mine.length >= MAX_OWN_CARDS;
  const canAdd = text.trim().length >= 3 && (type.kind !== 'minigame' || title.trim().length >= 2);

  async function add() {
    const personal = type.key === 'direkt' || type.key === 'solo';
    const ok = await act({
      type: 'add_custom',
      kind: type.kind,
      players: type.players,
      title,
      text,
      targetId: personal && targetId ? targetId : undefined,
    });
    if (ok) {
      setText('');
      setTitle('');
      setTargetId(null);
      setAdded(added + 1);
    }
  }

  return (
    <Screen bg="cyan">
      <h1 className="display mid coral" style={{ marginTop: 24 }}>
        {custom ? 'SKRIV DINA KORT' : 'EGNA KORT'}
      </h1>
      <p className="body-text" style={{ margin: '14px 0 20px' }}>
        {custom
          ? `Skriv minst ${MIN_OWN_CARDS} kort. De blandas med trivia, bildkort och minigames – ingen vet vem som skrev vad.`
          : 'Hitta på egna frågor eller utmaningar. De blandas in i just det här spelet – ingen vet vem som skrev vad.'}
      </p>

      <p className="choice-prompt" style={{ marginBottom: 10 }}>
        Välj korttyp
      </p>
      <div className="names" style={{ gap: 10 }}>
        {CARD_TYPES.map((t) => (
          <button
            key={t.key}
            className={`name-pill yellow${typeKey === t.key ? ' selected' : ''}`}
            style={{ fontSize: 15, minHeight: 44, flex: '1 1 auto' }}
            onClick={() => setTypeKey(t.key)}
            aria-pressed={typeKey === t.key}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="type-help">
        <strong>{type.label}</strong>
        <p>{type.desc}</p>
        <p className="example">Exempel: ”{type.titleExample ? `${type.titleExample} – ` : ''}{type.example}”</p>
      </div>

      {(type.key === 'direkt' || type.key === 'solo') && (
        <>
          <p className="choice-prompt" style={{ margin: '14px 0 8px' }}>
            Till vem?
          </p>
          <div className="names" style={{ gap: 8 }}>
            {[{ id: null, name: 'Vem som helst' }, ...state.players.filter((pl) => pl.id !== me.id)].map((pl) => (
              <button
                key={pl.id ?? 'alla'}
                className={`name-pill white${targetId === pl.id ? ' selected' : ''}`}
                style={{ fontSize: 15, minHeight: 40, flex: '0 1 auto' }}
                onClick={() => setTargetId(pl.id)}
                aria-pressed={targetId === pl.id}
              >
                <span>{pl.name}</span>
              </button>
            ))}
          </div>
          <p className="body-text muted" style={{ fontSize: 14, marginTop: 6 }}>
            {targetId
              ? `Kortet går till ${state.players.find((pl) => pl.id === targetId)?.name}.`
              : 'Kortet går till den vars tur det är.'}
          </p>
        </>
      )}
      {type.kind === 'minigame' && (
        <input
          className="input"
          style={{ marginTop: 12, background: 'var(--white)' }}
          placeholder={`Namn, t.ex. ${type.titleExample}`}
          value={title}
          maxLength={40}
          onChange={(e) => setTitle(e.target.value)}
        />
      )}
      <textarea
        className="input"
        style={{ marginTop: 12, background: 'var(--white)' }}
        placeholder={type.example}
        value={text}
        maxLength={200}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="btn yellow" style={{ marginTop: 12 }} disabled={busy || !canAdd || full} onClick={add}>
        {full ? `Max ${MAX_OWN_CARDS} kort` : 'Lägg till'}
      </button>
      <p className="add-feedback" role="status" aria-live="polite">
        {text.trim().length > 0 && text.trim().length < 3
          ? 'Skriv minst 3 tecken'
          : type.kind === 'minigame' && text.trim().length >= 3 && title.trim().length < 2
            ? 'Ge minigamet ett namn också'
            : added > 0 && text === ''
              ? `✓ Kortet är tillagt – du har skrivit ${mine.length} kort`
              : ''}
      </p>

      {mine.length > 0 && (
        <div className="votes-list" style={{ marginTop: 18 }}>
          {mine.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ flex: 1 }}>
                <small className="muted">
                  {typeOf(c).label}
                  {c.targetId && ` → ${state.players.find((pl) => pl.id === c.targetId)?.name ?? '?'}`}
                </small>
                <br />
                {c.title ? `${c.title}: ` : ''}
                {c.text}
              </span>
              <button className="link-btn" onClick={() => act({ type: 'remove_custom', id: c.id })} aria-label="Ta bort">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {/* I "Bygg eget spel" visar knappen längst ner hur många kort som saknas – ingen räknare behövs. */}
      {!custom && (
        <p className="progress" style={{ marginTop: 12 }}>
          {state.customCards.length} egna kort i spelet
        </p>
      )}
      <div className="grow" style={{ minHeight: 24 }} />
      <button className="btn ink" disabled={busy || missing > 0} onClick={onDone}>
        {missing > 0 ? `Skriv ${missing} kort till` : custom || mine.length > 0 ? 'Nästa' : 'Hoppa över'}
      </button>
    </Screen>
  );
}

/** "Är ni redo?" – väntar på att alla gått igenom introt. */
export function ReadyWait({ state, view, isLeader, busy, act }: GameProps) {
  const ready = state.players.filter((p) => p.ready);
  const waiting = state.players.filter((p) => !p.ready && view.active.includes(p.id));
  return (
    <Screen bg="cyan">
      <div className="stack grow" style={{ justifyContent: 'center', gap: 40 }}>
        <h1 className="display big coral">ÄR NI REDO?</h1>
        <Face size={200} />
        <p className="body-text">
          {ready.length} av {state.players.length} är redo
          {waiting.length > 0 && (
            <>
              <br />
              <span className="muted">Väntar på {waiting.map((p) => p.name).join(', ')}</span>
            </>
          )}
        </p>
      </div>
      {isLeader ? (
        <div className="stack">
          {ready.length < MIN_PLAYERS && <p className="body-text">Minst {MIN_PLAYERS} måste vara redo.</p>}
          <button className="btn ink" disabled={busy || ready.length < MIN_PLAYERS} onClick={() => act({ type: 'start_game' })}>
            Starta spelet
          </button>
        </div>
      ) : (
        <p className="body-text">Väntar på att {nameOf(state, state.hostId)} startar spelet…</p>
      )}
    </Screen>
  );
}
