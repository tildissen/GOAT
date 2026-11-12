'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usesPoints, pausedPlayers, savedCap, sipsForPart } from '@/lib/engine';
import Face from '../Face';
import { Screen, type Color } from '../ui';
import { nameOf, PART_WORDS, possessive, sipsText, Stats, type GameProps } from './shared';

const PART_END: { bg: Color; title: 'coral' | 'cyan'; tagline: string; end: 'coral' | 'yellow' }[] = [
  { bg: 'green', title: 'coral', tagline: 'Vågar ni fortsätta?', end: 'coral' },
  { bg: 'cyan', title: 'coral', tagline: 'I nästa del börjar det hetta till…', end: 'coral' },
  { bg: 'coral', title: 'cyan', tagline: 'Nu börjar det lukta kaos!', end: 'yellow' },
];

export function PartEnd({ state, isLeader, busy, act }: GameProps) {
  const look = PART_END[state.part - 1] ?? PART_END[2];
  return (
    <Screen bg={look.bg} center>
      <div className="stack" style={{ gap: 36 }}>
        <h1 className={`display big name-font ${look.title}`}>Del {PART_WORDS[state.part - 1]} är klar!</h1>
        <p className="tagline">{look.tagline}</p>
        {isLeader ? (
          <div className="stack" style={{ marginTop: 60, gap: 28 }}>
            <button className="btn ink" disabled={busy} onClick={() => act({ type: 'continue' })}>
              Fortsätt spela
            </button>
            <button className={`btn ${look.end}`} disabled={busy} onClick={() => confirmEnd() && act({ type: 'end' })}>
              Avsluta
            </button>
          </div>
        ) : (
          <p className="body-text" style={{ marginTop: 60 }}>
            Väntar på att {nameOf(state, state.hostId)} bestämmer…
          </p>
        )}
      </div>
    </Screen>
  );
}

const confirmEnd = () => window.confirm('Avsluta spelet för alla? Alla bilder raderas.');

export function Finished({ state, me, isLeader, busy, act }: GameProps) {
  return (
    <Screen bg="yellow">
      <div className="stack" style={{ marginTop: 48, gap: 20 }}>
        <h1 className="display big name-font coral">Del {PART_WORDS[state.part - 1]} är klar!</h1>
        <p className="tagline">wow, vilka GOATs</p>
      </div>
      <div style={{ width: '100%', margin: '32px 0' }}>
        <Stats state={state} meId={me.id} />
      </div>
      <div className="grow" />
      {isLeader ? (
        <div className="stack" style={{ gap: 24 }}>
          <button className="btn ink" disabled={busy} onClick={() => act({ type: 'restart' })}>
            Börja om!
          </button>
          <button className="btn coral" disabled={busy} onClick={() => confirmEnd() && act({ type: 'end' })}>
            Avsluta
          </button>
        </div>
      ) : (
        <p className="body-text">Väntar på att {nameOf(state, state.hostId)} bestämmer…</p>
      )}
    </Screen>
  );
}

export function Ended({ state, me }: GameProps) {
  return (
    <Screen bg="coral">
      <div className="stack" style={{ marginTop: 56, gap: 40 }}>
        <Face size={220} />
        <h1 className="logo huge">G.O.A.T</h1>
      </div>
      <div style={{ width: '100%', margin: '36px 0 20px' }}>
        <Stats state={state} meId={me.id} />
      </div>
      <p className="body-text">Tack för ikväll! Alla bilder är raderade.</p>
      <div className="grow" style={{ minHeight: 24 }} />
      <Link href="/" className="btn white" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit', textDecoration: 'none' }}>
        Till startsidan
      </Link>
    </Screen>
  );
}

/* ---------- Överlägg ---------- */

/** ERROR: någon har sparat för många klunkar – spelet står still. */
export function PauseOverlay({ state, me, busy, act }: GameProps) {
  const paused = pausedPlayers(state);
  if (paused.length === 0) return null;
  const iAmPaused = paused.some((p) => p.id === me.id);
  const names = paused.map((p) => p.name.toUpperCase()).join(' OCH ');
  return (
    <div className="overlay solid-error" role="alertdialog" aria-label="Spelet är pausat">
      <div className="panel error">
        <h2 className="display huge white">ERROR</h2>
        <p className="shout">
          {names} HAR SPARAT {paused.length === 1 ? `${paused[0].saved} KLUNKAR` : 'FÖR MÅNGA KLUNKAR'} – NU ÄR DET DAGS ATT
          DRICKA!
        </p>
        <p className="shout">DET HÄR ÄR INTE DITT PENSIONSSPARANDE!</p>
        {iAmPaused ? (
          <button className="btn white" disabled={busy} onClick={() => act({ type: 'drink_saved' })}>
            Jag har druckit {sipsText(me.saved)}
          </button>
        ) : (
          <p className="body-text">
            Spelet fortsätter när {paused.map((p) => p.name).join(' och ')} har druckit.
          </p>
        )}
      </div>
    </div>
  );
}

/** Ditt utmaningskort – måste göras. */
export function ChallengeOverlay({ state, me, busy, act }: GameProps) {
  const overlay = state.overlays[me.id];
  if (!overlay) return null;
  return (
    <div className="overlay solid-cyan" role="dialog" aria-label="Utmaningskort">
      <div className="panel green" style={{ minHeight: '70dvh' }}>
        <h2 className="display mid">
          <span className="name-font" style={{ fontSize: '1.25em' }}>
            {possessive(me.name)}
          </span>
          <br />
          UTMANINGSKORT
        </h2>
        <div className="grow" style={{ display: 'flex', alignItems: 'center' }}>
          <p className="card-text" style={{ fontFamily: 'var(--font-glacial)', fontWeight: 700, fontSize: 26, textAlign: 'center' }}>
            {overlay.text}
          </p>
        </div>
        <p className="body-text">Inga ursäkter, inga kompromisser.</p>
        <button className="btn cyan wide" style={{ boxShadow: 'none' }} disabled={busy} onClick={() => act({ type: 'dismiss_overlay' })}>
          {overlay.advancesCard ? 'Nästa' : 'Klar!'}
        </button>
      </div>
    </div>
  );
}

/** Tryck på "Sparade klunkar" för att dricka dem när du vill. */
export function SavedSheet({ state, me, busy, act }: GameProps) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('goat:saved', show);
    return () => window.removeEventListener('goat:saved', show);
  }, []);
  if (!open) return null;
  return (
    <div className="overlay" onClick={() => setOpen(false)}>
      <div className="panel white" onClick={(e) => e.stopPropagation()}>
        <h2 className="heading">Du har {sipsText(me.saved)} sparade</h2>
        <p className="body-text">
          I den här delen pausas spelet så fort du har {savedCap(state.part)} sparade, tills du druckit dem.
        </p>
        {me.saved > 0 && (
          <button
            className="btn green"
            disabled={busy}
            onClick={async () => {
              if (await act({ type: 'drink_saved' })) setOpen(false);
            }}
          >
            Jag dricker dem nu
          </button>
        )}
        <button className="link-btn" onClick={() => setOpen(false)}>
          Stäng
        </button>
      </div>
    </div>
  );
}

/**
 * Visar för alla andra vad någon valde – "Moa drack 2 klunkar" – så att ingen kan fuska.
 * Gamla händelser visas inte när man öppnar appen, bara de som sker medan man tittar.
 * Bara en notis i taget (den senaste) i 4 sekunder, så att den inte täcker kortet (B91).
 * Kommer flera samtidigt står det "+1 till" så att man vet att något mer hände.
 */
export function EventBanner({ state, me }: GameProps) {
  const events = state.events ?? [];
  const latest = events[events.length - 1]?.id ?? 0;
  const seen = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shown, setShown] = useState<{ id: number; text: string; more: number } | null>(null);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = latest;
      return;
    }
    const fresh = events.filter((e) => e.id > (seen.current ?? 0) && e.actorId !== me.id);
    seen.current = Math.max(seen.current, latest);
    if (fresh.length === 0) return;
    const last = fresh[fresh.length - 1];
    setShown({ id: last.id, text: `${nameOf(state, last.actorId)} ${last.text}`, more: fresh.length - 1 });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(null), 4000);
  }, [latest]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (!shown) return null;
  return (
    <div className="event-banner" role="status" aria-live="polite">
      <div key={shown.id}>
        {shown.text}
        {shown.more > 0 && <span className="event-more"> +{shown.more} till</span>}
      </div>
    </div>
  );
}

const PART_NAMES = ['Uppvärmning', 'Nu kör vi', 'Kaos', 'Totalt kaos'];

/** Skräll-skärm när en ny del börjar: delens namn, nedräkning 3-2-1 och hur vilt det blir. */
export function PartIntro({ state }: GameProps) {
  const cur = state.current;
  const startOfPart = state.status === 'playing' && state.cardIndex === 0 && cur ? cur.seq : null;
  const shownFor = useRef<number | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (startOfPart === null || shownFor.current === startOfPart) return;
    shownFor.current = startOfPart;
    setCount(3);
    const timers = [1, 2, 3].map((i) => setTimeout(() => setCount(i === 3 ? null : 3 - i), i * 1100));
    return () => timers.forEach(clearTimeout);
  }, [startOfPart]);

  if (count === null) return null;
  const last = state.part >= state.parts;
  const name = last && state.parts < 4 ? PART_NAMES[3] : PART_NAMES[Math.min(state.part, 4) - 1];
  const family = usesPoints(state);
  const sips = sipsForPart(state.part, state.occasion);
  return (
    <div className={`overlay part-intro part-${Math.min(state.part, 4)}`} onClick={() => setCount(null)} role="dialog" aria-label={`Del ${state.part} börjar`}>
      <div className="part-intro-inner">
        <p className="part-intro-label">Del {state.part}</p>
        <h2 className="part-intro-name">{name.toUpperCase()}</h2>
        <p className="part-intro-count" key={count}>
          {count}
        </p>
        <p className="part-intro-info">
          {family
            ? `${sips} minuspoäng per kort`
            : `${sips} ${sips === 1 ? 'klunk' : 'klunkar'} per kort · max ${savedCap(state.part)} sparade`}
        </p>
      </div>
    </div>
  );
}
