'use client';

import { useEffect, useRef, useState } from 'react';
import { compressImage, loadLocal, saveLocal } from '@/lib/client';
import { MIN_PLAYERS } from '@/lib/engine';
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
  if (step === 'regler') return <Regler onDone={() => go('selfie')} />;
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
          <button className="btn white" onClick={onDone} style={{ boxShadow: 'none' }}>
            Klar
          </button>
        </div>
      </div>
    </Screen>
  );
}

function Regler({ onDone }: { onDone: () => void }) {
  return (
    <Screen bg="coral">
      <h1 className="display big" style={{ marginTop: 12, marginBottom: 16 }}>
        SPELREGLER
      </h1>
      <div className="card green" style={{ padding: '24px 18px', gap: 16 }}>
        <p className="body-text">
          <strong>Välkommen</strong> till spelet som börjar oskyldigt… och slutar i fullständigt <em>kaos</em>.
        </p>
        <p className="body-text">
          Spelet är uppdelat i 4 delar, och för varje del blir frågorna sjukare, minigamesen mer kaotiska och tempot så
          högt att du börjar ifrågasätta dina livsval.
        </p>
        <p className="body-text">
          Här styr nästa kort allt. Det kan vara en fråga, ett spel eller en utmaning – och nej, ingen vet vad som
          väntar.
        </p>
        <p className="body-text">
          <strong>Är du nykter?</strong> Tråkigt. Men lugn, du kan alltid dra ett utmaningskort i stället för att dricka.
          Men då måste du också göra utmaningen. Inga ursäkter, inga kompromisser, inga ”jag gör det sen”.
        </p>
        <p className="body-text">
          Du får <strong>spara</strong> klunkar – men bara upp till 5 stycken. Får du fler än så pausas spelet tills du
          druckit ikapp. Det här är ett dryckesspel, inte en sparbank.
        </p>
        <button className="btn white" onClick={onDone} style={{ marginTop: 8 }}>
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
        <button className="btn white" disabled={!me.selfie || working} onClick={onDone}>
          Nästa
        </button>
      </div>
    </Screen>
  );
}

function EgnaKort({ state, me, busy, act, onDone }: GameProps & { onDone: () => void }) {
  const [kind, setKind] = useState<'vem' | 'utmaning'>('vem');
  const [text, setText] = useState('');
  const mine = state.customCards.filter((c) => c.by === me.id);

  async function add() {
    if (await act({ type: 'add_custom', kind, text })) setText('');
  }

  return (
    <Screen bg="cyan">
      <h1 className="display mid coral" style={{ marginTop: 24 }}>
        EGNA KORT
      </h1>
      <p className="body-text" style={{ margin: '14px 0 22px' }}>
        Hitta på egna frågor eller utmaningar. De blandas in i just det här spelet – ingen vet vem som skrev vad.
      </p>
      <div className="names" style={{ gap: 12 }}>
        {(['vem', 'utmaning'] as const).map((k) => (
          <button
            key={k}
            className={`name-pill yellow${kind === k ? ' selected' : ''}`}
            style={{ fontSize: 17, minHeight: 50 }}
            onClick={() => setKind(k)}
          >
            {k === 'vem' ? 'Vem i rummet?' : 'Utmaning'}
          </button>
        ))}
      </div>
      <textarea
        className="input"
        style={{ marginTop: 16, background: 'var(--white)' }}
        placeholder={kind === 'vem' ? 'Vem i rummet skulle…' : 'Alla som har … tar 2 klunkar.'}
        value={text}
        maxLength={200}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="btn yellow" style={{ marginTop: 12 }} disabled={busy || text.trim().length < 3} onClick={add}>
        Lägg till
      </button>
      {mine.length > 0 && (
        <div className="votes-list" style={{ marginTop: 18 }}>
          {mine.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ flex: 1 }}>{c.text}</span>
              <button className="link-btn" onClick={() => act({ type: 'remove_custom', id: c.id })} aria-label="Ta bort">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="progress" style={{ marginTop: 12 }}>
        {state.customCards.length} egna kort i spelet
      </p>
      <div className="grow" style={{ minHeight: 24 }} />
      <button className="btn white" disabled={busy} onClick={onDone}>
        {mine.length > 0 ? 'Nästa' : 'Hoppa över'}
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
          <button className="btn white" disabled={busy || ready.length < MIN_PLAYERS} onClick={() => act({ type: 'start_game' })}>
            Starta spelet
          </button>
        </div>
      ) : (
        <p className="body-text">Väntar på att {nameOf(state, state.hostId)} startar spelet…</p>
      )}
    </Screen>
  );
}
