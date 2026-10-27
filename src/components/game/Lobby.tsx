'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { MIN_PLAYERS } from '@/lib/engine';
import { Avatar, Screen } from '../ui';
import { nameOf, type GameProps } from './shared';

/** Väntrummet: spelkoden, vilka som har joinat och värdens NÄSTA. */
export default function Lobby({ state, view, isLeader, busy, act, code }: GameProps) {
  const [showQr, setShowQr] = useState(false);
  const [link, setLink] = useState('');
  useEffect(() => setLink(`${window.location.origin}/join?code=${code}`), [code]);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'G.O.A.T.', text: `Joina mitt G.O.A.T.-spel! Kod: ${code}`, url: link });
        return;
      } catch {
        // avbrutet – visa QR i stället
      }
    }
    setShowQr(true);
  }

  const enough = state.players.length >= MIN_PLAYERS;
  return (
    <Screen bg="cyan">
      <button className="code-box" onClick={() => setShowQr((v) => !v)} aria-label="Visa QR-kod">
        SPELKOD: {view.code}
      </button>
      <div className="stack" style={{ marginTop: 14, gap: 10 }}>
        {showQr && link && (
          <div className="qr">
            <QRCodeSVG value={link} size={200} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="link-btn" onClick={() => setShowQr((v) => !v)}>
            {showQr ? 'Dölj QR-kod' : 'Visa QR-kod'}
          </button>
          <button className="link-btn" onClick={share}>
            Dela länk
          </button>
        </div>
      </div>

      <div className="names" style={{ marginTop: 28 }}>
        {state.players.map((p) => (
          <div key={p.id} className="name-pill">
            {p.selfie && <Avatar player={p} />}
            <span>{p.name}</span>
          </div>
        ))}
      </div>

      <div className="grow" />
      {isLeader ? (
        <div className="stack">
          {!enough && <p className="body-text">Minst {MIN_PLAYERS} spelare behövs – dela koden!</p>}
          <button className="btn white" disabled={busy || !enough} onClick={() => act({ type: 'start_intro' })}>
            Nästa
          </button>
        </div>
      ) : (
        <p className="body-text">Väntar på att {nameOf(state, state.hostId)} går vidare…</p>
      )}
    </Screen>
  );
}
