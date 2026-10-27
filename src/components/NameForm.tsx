'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api, saveCreds } from '@/lib/client';
import { Screen } from './ui';

/** Formuläret för både "skapa" (bara namn) och "joina" (kod + namn). */
export default function NameForm({ mode, initialCode = '' }: { mode: 'create' | 'join'; initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === 'join' && code.trim().length < 5) return setError('Spelkoden har 5 tecken');
    if (!name.trim()) return setError('Skriv ditt namn');
    setBusy(true);
    try {
      const res = mode === 'create' ? await api.create(name) : await api.join(code, name);
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
        <h1 className="display mid coral" style={{ marginTop: 48, marginBottom: 72 }}>
          {mode === 'create' ? 'SKAPA G.O.A.T.' : 'JOINA G.O.A.T.'}
        </h1>
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
              style={{ marginBottom: 56 }}
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
        <div className="grow" />
        {error && (
          <p className="error-text" style={{ marginBottom: 16 }}>
            {error}
          </p>
        )}
        <button className="btn white" disabled={busy}>
          {busy ? '…' : mode === 'create' ? 'Skapa' : 'Joina'}
        </button>
      </form>
    </Screen>
  );
}
