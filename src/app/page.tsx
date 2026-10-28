'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Face from '@/components/Face';
import { Screen } from '@/components/ui';
import { MIN_PLAYERS } from '@/lib/engine';

export default function Home() {
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1800);
    return () => clearTimeout(t);
  }, []);

  if (splash) {
    return (
      <div onClick={() => setSplash(false)}>
        <Screen bg="green" center>
          <div className="stack" style={{ gap: 64 }}>
            <p className="serif">LÅT OSS SPELA</p>
            <Face size={220} />
            <h1 className="logo huge">G.O.A.T</h1>
          </div>
        </Screen>
      </div>
    );
  }

  return (
    <Screen bg="cyan" center>
      <div className="stack" style={{ gap: 28 }}>
        <Face size={240} />
        <h1 className="logo huge">G.O.A.T</h1>
        <p className="tagline">
          Börjar oskyldigt…
          <br />
          slutar i fullständigt kaos.
        </p>
        <div className="stack" style={{ marginTop: 28, gap: 14 }}>
          <Link href="/skapa" className="btn ink" style={linkBtn}>
            Skapa ett spel
          </Link>
          <Link href="/join" className="btn yellow" style={linkBtn}>
            Joina ett spel
          </Link>
        </div>
        <div className="chips" style={{ marginTop: 16 }}>
          <span>4 delar</span>
          <span>{MIN_PLAYERS}+ spelare</span>
        </div>
        <Link href="/villkor" className="footer-link">
          Användarvillkor
        </Link>
      </div>
    </Screen>
  );
}

const linkBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
} as const;
