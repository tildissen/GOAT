'use client';

import { useRef, useState } from 'react';
import { compressImage } from '@/lib/client';
import { isSoloCard } from '@/lib/engine';
import type { Current } from '@/lib/types';
import { Avatar, Screen, Spinner, type Color } from '../ui';
import { Board, CHOICE_TEXT, ChoiceButtons, nameOf, possessive, sipsText, type GameProps } from './shared';

/** Visar kortet som spelas just nu – olika beroende på korttyp och vems tur det är. */
export default function Playing(props: GameProps) {
  const cur = props.state.current;
  if (!cur) return null;
  const { card } = cur;

  if (card.kind === 'vem') return cur.phase === 'voting' ? <VoteCard {...props} cur={cur} /> : <ResultCard {...props} cur={cur} />;
  if (card.kind === 'bild') {
    if (cur.phase === 'upload') return <PhotoUpload {...props} cur={cur} />;
    return cur.phase === 'voting' ? <VoteCard {...props} cur={cur} /> : <ResultCard {...props} cur={cur} />;
  }
  if (isSoloCard(card) && cur.turnId !== props.me.id) return <Waiting {...props} cur={cur} />;
  if (card.kind === 'trivia') return <Trivia {...props} cur={cur} />;
  if (card.kind === 'direkt') return <Direct {...props} cur={cur} />;
  return <Challenge {...props} cur={cur} />;
}

type CardProps = GameProps & { cur: Current };

function CardScreen({
  bg,
  card,
  me,
  progress,
  children,
  below,
}: {
  bg: Color;
  card: Color;
  me: GameProps['me'];
  progress: string;
  children: React.ReactNode;
  below?: React.ReactNode;
}) {
  return (
    <Screen bg={bg}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <SavedLabel saved={me.saved} />
        <span className="progress">{progress}</span>
      </div>
      <div className={`card ${card}`}>{children}</div>
      {below && <div className="stack" style={{ marginTop: 18 }}>{below}</div>}
    </Screen>
  );
}

export function SavedLabel({ saved }: { saved: number }) {
  return (
    <button
      className="saved-label"
      onClick={() => window.dispatchEvent(new Event('goat:saved'))}
      aria-label={`Sparade klunkar: ${saved}. Tryck för att dricka dem.`}
    >
      Sparade klunkar: <strong>{saved}</strong>
    </button>
  );
}

const progressOf = (p: GameProps) => `Del ${p.state.part} · ${p.state.cardIndex + 1}/${p.state.cardsInPart}`;

function canAdvance(p: CardProps) {
  return p.cur.turnId === p.me.id || p.isLeader || (p.cur.turnId !== '' && !p.view.active.includes(p.cur.turnId));
}

function NextButton(p: CardProps & { label?: string; color?: 'white' | 'cyan' }) {
  if (!canAdvance(p)) {
    return <p className="body-text">Väntar på att {nameOf(p.state, p.cur.turnId)} trycker nästa…</p>;
  }
  return (
    <button className={`btn ${p.color ?? 'white'}`} disabled={p.busy} onClick={() => p.act({ type: 'next' })}>
      {p.label ?? 'Nästa'}
    </button>
  );
}

function Chosen({ cur, meId }: { cur: Current; meId: string }) {
  const choice = cur.choices[meId];
  return choice ? <p className="body-text">Du {CHOICE_TEXT[choice](cur.sips)} ✓</p> : null;
}

/* ---------- Direkt fråga ---------- */
function Direct(p: CardProps) {
  return (
    <CardScreen bg="green" card="cyan" me={p.me} progress={progressOf(p)}>
      <h2 className="display mid">{p.me.name}</h2>
      <div className="card-body">
        <p className="card-text">{p.cur.text}</p>
      </div>
      <ChoiceButtons
        sips={p.cur.sips}
        act={p.act}
        busy={p.busy}
        extra={
          <button className="btn white" disabled={p.busy} onClick={() => p.act({ type: 'choose', choice: 'answered' })}>
            Jag svarar!
          </button>
        }
      />
    </CardScreen>
  );
}

/* ---------- Trivia ---------- */
function Trivia(p: CardProps) {
  const { cur } = p;
  const options = cur.card.options ?? [];
  const picked = cur.triviaPick;
  const answered = picked != null;
  const right = answered && picked === cur.card.answerIndex;

  return (
    <CardScreen bg="green" card="cyan" me={p.me} progress={progressOf(p)} below={right ? <NextButton {...p} /> : undefined}>
      <h2 className="display mid">Trivia ?</h2>
      <div className="card-body">
        <p className="card-text">{cur.text}</p>
        <div className="options">
          {options.map((opt, i) => {
            const cls = answered ? (i === cur.card.answerIndex ? ' right' : i === picked ? ' wrong' : '') : '';
            return (
              <button
                key={i}
                className={`option${cls}`}
                disabled={answered || p.busy}
                onClick={() => p.act({ type: 'trivia_answer', index: i })}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {answered && <p className="heading">{right ? 'RÄTT! 🐐' : 'FEL!'}</p>}
      </div>
      {answered && !right && <ChoiceButtons sips={cur.sips} act={p.act} busy={p.busy} />}
    </CardScreen>
  );
}

/* ---------- Utmaningar och minigames ---------- */
function Challenge(p: CardProps) {
  const { cur, me } = p;
  const minigame = cur.card.kind === 'minigame';
  const solo = isSoloCard(cur.card);
  const mine = solo || !cur.choices[me.id];
  const involved = cur.targetIds.includes(me.id);
  return (
    <CardScreen
      bg={minigame ? 'cyan' : 'coral'}
      card={minigame ? 'coral' : 'green'}
      me={me}
      progress={progressOf(p)}
      below={<NextButton {...p} label={solo ? 'Klar!' : 'Nästa'} />}
    >
      <h2 className="display mid">{minigame ? 'MINIGAME:' : 'UTMANING:'}</h2>
      {minigame && cur.card.title && <p className="heading">{cur.card.title}</p>}
      {solo && <p className="heading">{me.name}</p>}
      <div className="card-body">
        <p className="card-text">{cur.text}</p>
        {cur.teams && (
          <div className="votes-list">
            {cur.teams.map((team, i) => (
              <div key={i}>
                <strong>Lag {i + 1}:</strong> {team.map((id) => nameOf(p.state, id)).join(', ')}
              </div>
            ))}
          </div>
        )}
        {!solo && involved && cur.targetIds.length <= 2 && <p className="body-text">Det gäller dig!</p>}
      </div>
      {mine ? <ChoiceButtons sips={cur.sips} act={p.act} busy={p.busy} /> : <Chosen cur={cur} meId={me.id} />}
    </CardScreen>
  );
}

/* ---------- Röstning (vem i rummet & vems är bilden) ---------- */
function VoteCard(p: CardProps) {
  const { cur, me, state } = p;
  const photo = cur.card.kind === 'bild';
  const isOwner = photo && cur.turnId === me.id;
  const [selected, setSelected] = useState<string | null>(null);
  const myVote = cur.votes[me.id];
  const voters = state.players.filter((pl) => pl.ready && p.view.active.includes(pl.id) && !(photo && pl.id === cur.turnId));
  const voted = Object.keys(cur.votes).length;

  return (
    <CardScreen bg="green" card="cyan" me={me} progress={progressOf(p)}>
      <h2 className="display mid">{photo ? 'VEMS ÄR BILDEN?' : 'ALLA RÖSTAR!'}</h2>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        cur.photoUrl && <img className="photo" src={cur.photoUrl} alt="Den hemliga bilden" />
      ) : (
        <p className="card-text">{cur.text}</p>
      )}
      {isOwner ? (
        <p className="body-text">Alla gissar på din bild 🤫 Håll pokerfejset!</p>
      ) : myVote ? (
        <div className="card-body">
          <p className="body-text">
            Du röstade på <strong>{nameOf(state, myVote)}</strong>
          </p>
        </div>
      ) : (
        <>
          <div className="names" style={{ gap: 14 }}>
            {state.players
              .filter((pl) => pl.ready)
              .map((pl) => (
                <button
                  key={pl.id}
                  className={`name-pill yellow${selected === pl.id ? ' selected' : ''}`}
                  style={{ minHeight: 54, fontSize: 19 }}
                  onClick={() => setSelected(pl.id)}
                >
                  <span>{pl.name}</span>
                </button>
              ))}
          </div>
          <div className="grow" />
          <div className="actions">
            <button
              className="btn yellow"
              disabled={!selected || p.busy}
              onClick={() => selected && p.act({ type: 'vote', targetId: selected })}
            >
              Skicka in
            </button>
          </div>
        </>
      )}
      <p className="progress">
        {voted} av {voters.length} har röstat
      </p>
      {voted > 0 && (cur.turnId === me.id || p.isLeader) && (
        <button className="link-btn" disabled={p.busy} onClick={() => p.act({ type: 'close_vote' })}>
          Visa resultatet nu
        </button>
      )}
    </CardScreen>
  );
}

function ResultCard(p: CardProps) {
  const { cur, me, state } = p;
  const photo = cur.card.kind === 'bild';
  const owner = nameOf(state, cur.turnId);
  const iLost = cur.losers.includes(me.id);
  const pending = cur.losers.filter((id) => !cur.choices[id] && p.view.active.includes(id));
  const loserNames = cur.losers.map((id) => nameOf(state, id));

  let headline: React.ReactNode;
  if (photo && cur.photoSkipped) {
    headline = <p className="card-text">{owner} vägrade ladda upp en bild – och får dricka!</p>;
  } else if (photo) {
    const allRight = cur.losers.length === 1 && cur.losers[0] === cur.turnId;
    headline = (
      <>
        <div className="code-box" style={{ background: 'var(--green)', fontSize: 'clamp(26px, 9vw, 40px)', cursor: 'default' }}>
          <span className="display small">{owner.toUpperCase()}</span>
        </div>
        <p className="heading">{allRight ? `ägde bilden – alla gissade rätt, så ${owner} dricker!` : 'ägde bilden! Alla som gissade fel dricker.'}</p>
      </>
    );
  } else {
    headline = (
      <>
        <div className="code-box" style={{ background: 'var(--green)', cursor: 'default' }}>
          <span className="display big">{loserNames.join(' & ').toUpperCase()}</span>
        </div>
        <p className="heading">{cur.losers.length > 1 ? 'fick lika många röster' : 'fick flest röstningar'}</p>
      </>
    );
  }

  return (
    <CardScreen
      bg="green"
      card="cyan"
      me={me}
      progress={progressOf(p)}
      below={pending.length === 0 || p.isLeader ? <NextButton {...p} /> : <p className="body-text">Väntar på {pending.map((id) => nameOf(state, id)).join(', ')}…</p>}
    >
      {photo && cur.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="photo" style={{ maxHeight: '24dvh' }} src={cur.photoUrl} alt="" />
      )}
      <div className="card-body">{headline}</div>
      {Object.keys(cur.votes).length > 0 && (
        <div className="votes-list">
          {Object.entries(cur.votes).map(([voter, target]) => (
            <div key={voter}>
              {nameOf(state, voter)} → <strong>{nameOf(state, target)}</strong>
            </div>
          ))}
        </div>
      )}
      {iLost && !cur.choices[me.id] ? (
        <ChoiceButtons sips={cur.sips} act={p.act} busy={p.busy} />
      ) : (
        <div className="votes-list">
          {cur.losers
            .filter((id) => cur.choices[id])
            .map((id) => (
              <div key={id}>
                {nameOf(state, id)} {CHOICE_TEXT[cur.choices[id]](cur.sips)}
              </div>
            ))}
        </div>
      )}
    </CardScreen>
  );
}

/* ---------- Vems är bilden: uppladdning ---------- */
function PhotoUpload(p: CardProps) {
  const { cur, me } = p;
  const input = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);

  if (cur.turnId !== me.id) {
    return (
      <CardScreen bg="green" card="cyan" me={me} progress={progressOf(p)}>
        <h2 className="display mid">VEMS ÄR BILDEN?</h2>
        <div className="card-body">
          <p className="card-text">Någon laddar upp en hemlig bild…</p>
          <Spinner />
          <p className="body-text muted">Snart får ni gissa vems den är.</p>
        </div>
      </CardScreen>
    );
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    setWorking(true);
    try {
      await p.upload(await compressImage(file), 'bild');
    } finally {
      setWorking(false);
    }
  }

  return (
    <CardScreen bg="green" card="cyan" me={me} progress={progressOf(p)}>
      <h2 className="display mid">VEMS ÄR BILDEN?</h2>
      <div className="card-body">
        <p className="body-text">
          <strong>Psst, {me.name}!</strong> Du är vald i hemlighet. Ingen annan vet att det är du.
        </p>
        <p className="card-text">{cur.text}</p>
      </div>
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
      <div className="actions">
        <button className="btn yellow" disabled={working || p.busy} onClick={() => input.current?.click()}>
          {working ? 'Laddar upp…' : 'Ladda upp här!'}
        </button>
        <button className="link-btn" disabled={working || p.busy} onClick={() => p.act({ type: 'skip_photo' })}>
          Jag vägrar (och dricker {sipsText(cur.sips)})
        </button>
      </div>
    </CardScreen>
  );
}

/* ---------- Någon annans tur ---------- */
const DOING: Record<string, string> = {
  direkt: 'svarar på en fråga',
  trivia: 'kör trivia',
  utmaning: 'gör en utmaning',
};

function Waiting(p: CardProps) {
  const { cur, state } = p;
  const player = state.players.find((pl) => pl.id === cur.turnId);
  return (
    <CardScreen bg="green" card="cyan" me={p.me} progress={progressOf(p)}>
      {player && <Avatar player={player} big />}
      <h2 className="display mid">{possessive(nameOf(state, cur.turnId))} tur</h2>
      <p className="body-text">{nameOf(state, cur.turnId)} {DOING[cur.card.kind] ?? 'spelar'}…</p>
      <Board state={state} active={p.view.active} meId={p.me.id} />
      {!p.view.active.includes(cur.turnId) && <NextButton {...p} label="Hoppa över" />}
    </CardScreen>
  );
}
