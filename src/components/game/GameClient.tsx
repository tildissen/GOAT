'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { loadCreds, notifyTurn, type Creds } from '@/lib/client';
import { isSoloCard } from '@/lib/engine';
import { useGame } from '@/lib/useGame';
import { Screen, Spinner, Toast } from '../ui';
import Intro, { ReadyWait } from './Intro';
import Lobby from './Lobby';
import Playing from './Playing';
import { ChallengeOverlay, Ended, Finished, PartEnd, PauseOverlay, SavedSheet } from './Screens';
import type { GameProps } from './shared';

export default function GameClient({ code }: { code: string }) {
  const router = useRouter();
  const [creds, setCreds] = useState<Creds | null | undefined>(undefined);

  useEffect(() => {
    const found = loadCreds(code);
    if (!found) router.replace(`/join?code=${code}`);
    setCreds(found);
  }, [code, router]);

  if (!creds) return <Loading />;
  return <Game code={code} creds={creds} />;
}

function Loading() {
  return (
    <Screen bg="cyan" center>
      <Spinner />
    </Screen>
  );
}

function Game({ code, creds }: { code: string; creds: Creds }) {
  const router = useRouter();
  const { view, loadError, act, upload, busy, toast } = useGame(code, creds);
  const state = view?.state;
  const me = state?.players.find((p) => p.id === creds.playerId);

  // Signal när det blir din tur.
  const cur = state?.current;
  const myTurnKey =
    cur && me
      ? (isSoloCard(cur.card) && cur.turnId === me.id) ||
        (cur.card.kind === 'bild' && cur.phase === 'upload' && cur.turnId === me.id) ||
        (cur.phase === 'result' && cur.losers.includes(me.id))
        ? `${cur.seq}-${cur.phase}`
        : null
      : null;
  useEffect(() => {
    if (myTurnKey) notifyTurn();
  }, [myTurnKey]);

  useEffect(() => {
    // Sparad inloggning som inte längre finns i spelet – joina på nytt.
    if (view && !me) router.replace(`/join?code=${code}`);
  }, [view, me, code, router]);

  if (loadError && !view) {
    return (
      <Screen bg="coral" center>
        <div className="stack" style={{ gap: 24 }}>
          <h1 className="display mid">Hoppsan!</h1>
          <p className="body-text">{loadError.message}</p>
          <Link href="/" className="btn white" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit', textDecoration: 'none' }}>
            Till startsidan
          </Link>
        </div>
      </Screen>
    );
  }
  if (!view || !state || !me) return <Loading />;

  const props: GameProps = {
    view,
    state,
    me,
    isLeader: me.id === state.hostId || !view.active.includes(state.hostId),
    busy,
    act,
    upload,
    code: view.code,
  };

  let screen: React.ReactNode;
  if (state.status === 'ended') screen = <Ended {...props} />;
  else if (state.status === 'finished') screen = <Finished {...props} />;
  else if (state.status === 'lobby') screen = <Lobby {...props} />;
  else if (!me.ready) screen = <Intro {...props} />;
  else if (state.status === 'intro') screen = <ReadyWait {...props} />;
  else if (state.status === 'partEnd') screen = <PartEnd {...props} />;
  else screen = <Playing key={state.current?.seq} {...props} />;

  const inGame = me.ready && (state.status === 'playing' || state.status === 'partEnd');
  return (
    <>
      {screen}
      {inGame && <PauseOverlay {...props} />}
      {inGame && <ChallengeOverlay {...props} />}
      {inGame && <SavedSheet {...props} />}
      <Toast message={toast} />
    </>
  );
}
