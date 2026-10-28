'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { MIN_PLAYERS } from '@/lib/engine';
import { Avatar, Screen } from '../ui';
import { nameOf, type GameProps } from './shared';

const PILL_COLORS = ['coral', 'yellow', 'green', 'white'] as const;

/** Väntrummet: spelkod och QR i samma kort, vilka som har joinat och värdens NÄSTA. */
export default function Lobby({ state, view, isLeader, busy, act, code }: GameProps) {
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => setLink(`${window.location.origin}/join?code=${code}`), [code]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Webbläsaren nekade – koden syns ändå i kortet.
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'G.O.A.T.', text: `Joina mitt G.O.A.T.-spel! Kod: ${code}`, url: link });
        return;
      } catch {
        // avbrutet – kopiera länken i stället
      }
    }
    copy();
  }

  const enough = state.players.length >= MIN_PLAYERS;
  return (
    <Screen bg="cyan">
      <div className="code-card">
        <span className="label">Spelkod</span>
        <span className="code">{view.code}</span>
        {link && <QRCodeSVG value={link} size={168} />}
        <div className="links">
          <button onClick={copy}>{copied ? 'Kopierad!' : 'Kopiera länk'}</button>
          <button onClick={share}>Dela</button>
        </div>
      </div>

      <div className="sub-label">
        {state.players.length} spelare · minst {MIN_PLAYERS}
      </div>
      <div className="players">
        {state.players.map((p, i) => (
          <div key={p.id} className={`name-pill ${PILL_COLORS[i % PILL_COLORS.length]}`}>
            {p.selfie && <Avatar player={p} />}
            <span>{p.name}</span>
            {p.id === state.hostId && <small className="host-tag">VÄRD</small>}
          </div>
        ))}
      </div>

      <div className="grow" style={{ minHeight: 24 }} />
      {isLeader ? (
        <div className="stack">
          {!enough && <p className="body-text">Minst {MIN_PLAYERS} spelare behövs, dela koden!</p>}
          <button className="btn ink" disabled={busy || !enough} onClick={() => act({ type: 'start_intro' })}>
            Nästa
          </button>
        </div>
      ) : (
        <p className="body-text">Väntar på att {nameOf(state, state.hostId)} går vidare…</p>
      )}
    </Screen>
  );
}
