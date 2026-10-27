'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Face from '@/components/Face';
import { Screen } from '@/components/ui';

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
            <Face size={200} />
            <h1 className="display huge">G.O.A.T</h1>
          </div>
        </Screen>
      </div>
    );
  }

  return (
    <Screen bg="cyan" center>
      <div className="stack" style={{ gap: 48 }}>
        <Face size={200} />
        <h1 className="display huge">G.O.A.T</h1>
        <div className="stack" style={{ marginTop: 40, gap: 28 }}>
          <Link href="/skapa" className="btn yellow bold" style={linkBtn}>
            Skapa ett spel
          </Link>
          <Link href="/join" className="btn yellow bold" style={linkBtn}>
            Joina ett spel
          </Link>
        </div>
      </div>
    </Screen>
  );
}

const linkBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  color: 'inherit',
} as const;
