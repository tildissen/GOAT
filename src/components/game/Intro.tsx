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

  if (step === 'storej') return <StorEj onDone={() => go('regler')} />;
  if (step === 'regler') return <Regler state={state} onDone={() => go('selfie')} />;
  if (step === 'selfie') return <Selfie {...props} onDone={() => (canAddCards ? go('egna') : finish())} />;
  return <EgnaKort {...props} onDone={finish} />;
}

function StorEj({ onDone }: { onDone: () => void }) {
  return (
    <Screen bg="green" center>
      <div className="overlay" style={{ position: 'relative', inset: 'auto', background: 'none', padding: 0 }}>
        <div className="panel coral" style={{ gap: 40, padding: '48px 24px 40px' }}>
          <svg width="150" height="132" viewBox="0 0 150 132" aria-hidden="true">
            <path
              d="M64 10 Q75 -4 86 10 L144 112 Q150 126 134 126 L16 126 Q0 126 6 112 Z"
              fill="#ffe600"
              stroke="#000"
              strokeWidth="8"
              strokeLinejoin="round"
            />
            <path d="M75 38 L75 86" stroke="#000" strokeWidth="14" strokeLinecap="round" />
            <circle cx="75" cy="106" r="8" fill="#000" />
          </svg>
          <p className="light">
            Sätt din telefon på <strong>stör ej</strong> för att fortsätta
          </p>
          <button className="btn ink" onClick={onDone} style={{ boxShadow: 'none' }}>
            Klar
          </button>
        </div>
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
