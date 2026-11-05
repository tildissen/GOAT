'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api, saveCreds } from '@/lib/client';
import type { Occasion } from '@/lib/types';
import { Screen } from './ui';

/** Formuläret för både "skapa" (bara namn) och "joina" (kod + namn). */
export default function NameForm({
  mode,
  initialCode = '',
  custom = false,
}: {
  mode: 'create' | 'join';
  initialCode?: string;
  /** "Bygg eget spel" – alla spelare skriver egna kort. */
  custom?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [occasion, setOccasion] = useState<Occasion | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === 'join' && code.trim().length < 5) return setError('Spelkoden har 5 tecken');
    if (!name.trim()) return setError('Skriv ditt namn');
    if (custom && !occasion) return setError('Välj tillfälle');
    setBusy(true);
    try {
      const res = mode === 'create' ? await api.create(name, custom ? 'custom' : 'classic', occasion ?? undefined) : await api.join(code, name);
      saveCreds(res.code, { playerId: res.playerId, token: res.token });
      router.push(`/spel/${res.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel');
      setBusy(false);
    }
  }

  return (
    <Screen bg="cyan">
      <form onSubmit={submit} className="stack grow" style={{ gap: 0 }}>
        <h1 className="display mid coral" style={{ marginTop: 48, marginBottom: 48 }}>
          {mode === 'join' ? 'JOINA G.O.A.T.' : custom ? 'BYGG EGET SPEL' : 'SKAPA G.O.A.T.'}
        </h1>
        {custom && (
          <p className="body-text" style={{ marginTop: -24, marginBottom: 36 }}>
            Ni gör spelet själva! Alla som är med skriver minst 3 egna frågor eller utmaningar. Trivia, minigames och
            bildkort blandas in automatiskt.
          </p>
        )}
        {custom && (
          <>
            <p className="field-label">Vilket tillfälle?</p>
            <div className="occasions" role="radiogroup" aria-label="Tillfälle">
              {OCCASIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  role="radio"
                  aria-checked={occasion === o.key}
                  className={`occasion${occasion === o.key ? ' selected' : ''}`}
                  onClick={() => setOccasion(o.key)}
                >
                  <strong>
                    {o.icon} {o.label}
                  </strong>
                  <span>{o.desc}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {mode === 'join' && (
          <>
            <label className="field-label" htmlFor="code">
              Ange spelkod:
            </label>
            <input
              id="code"
              className="input code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
              autoComplete="off"
              autoCapitalize="characters"
              inputMode="text"
              style={{ marginBottom: 28 }}
            />
          </>
        )}
        <label className="field-label" htmlFor="name">
          Vad heter du?
        </label>
        <input
          id="name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          autoComplete="given-name"
          autoFocus={mode === 'create' || Boolean(initialCode)}
          enterKeyHint="go"
        />
        {error && (
          <p className="error-text" style={{ marginTop: 20 }}>
            {error}
          </p>
        )}
        <button className="btn ink" style={{ marginTop: 28 }} disabled={busy}>
          {busy ? '…' : mode === 'create' ? 'Skapa' : 'Joina'}
        </button>
      </form>
    </Screen>
  );
}

const OCCASIONS: { key: Occasion; icon: string; label: string; desc: string }[] = [
  { key: 'aw', icon: '💼', label: 'AW', desc: 'Kollegor och vänner. Lugna frågor, inget pinsamt.' },
  { key: 'familj', icon: '👨‍👩‍👧', label: 'Familjespel', desc: 'Alla åldrar och alkoholfritt – minuspoäng i stället för klunkar.' },
  { key: 'fest', icon: '🎉', label: 'Fest', desc: 'Allt är tillåtet. Blir vildare för varje del.' },
];
