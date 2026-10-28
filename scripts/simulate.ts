/**
 * Spelar igenom många hela spel med slumpade val och kontrollerar att
 * spelmotorn aldrig fastnar eller bryter mot reglerna. Kör: npm test
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { CONTENT_FILES, parseContent, type ContentFiles } from '../src/lib/content';
import { buildDeck, CARDS_PER_PART, PARTS } from '../src/lib/deck';
import {
  addPlayer,
  applyAction,
  GameError,
  isSoloCard,
  MAX_SAVED,
  newGameState,
  newPlayer,
  pausedPlayers,
  scaleSips,
  toPublic,
  type Ctx,
} from '../src/lib/engine';
import type { Action, CardRow, GameState } from '../src/lib/types';

const files = Object.fromEntries(
  Object.entries(CONTENT_FILES).map(([key, file]) => [key, readFileSync(path.join('content', file), 'utf8')]),
) as unknown as ContentFiles;
const cards: CardRow[] = parseContent(files).map((c, i) => ({ ...c, id: i + 1 }));

// Enkel seedad slump så att fel går att återskapa.
function makeRng(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

assert.equal(scaleSips('Den som blinkar först tar 2 klunkar.', 1), 'Den som blinkar först tar 2 klunkar.');
assert.equal(scaleSips('Den som blinkar först tar 2 klunkar.', 4), 'Den som blinkar först tar 5 klunkar.');
assert.equal(scaleSips('tar 1 extra klunk.', 2), 'tar 2 extra klunkar.');
assert.equal(scaleSips('ett nummer mellan 1–5 samtidigt', 3), 'ett nummer mellan 1–5 samtidigt');

console.log(`Kort: ${cards.length} st`);
for (const kind of ['vem', 'direkt', 'trivia', 'utmaning', 'minigame', 'bild']) {
  console.log(`  ${kind}: ${cards.filter((c) => c.kind === kind).length}`);
}

function play(seed: number, playerCount: number) {
  const rng = makeRng(seed);
  let now = 1000;
  const ids = Array.from({ length: playerCount }, (_, i) => `p${i}`);
  let s: GameState = newGameState(newPlayer(ids[0], 'Värd', now));
  for (const id of ids.slice(1)) s = addPlayer(s, `Spelare ${id}`, id, now).state;
  const active = new Set(ids);
  const ctx = (deck = false): Ctx => ({
    active,
    rng,
    now: now++,
    deck: deck ? buildDeck(cards, s.customCards, rng) : undefined,
  });
  const act = (pid: string, action: Action, withDeck = false) => {
    s = applyAction(s, pid, action, ctx(withDeck));
  };

  act(ids[0], { type: 'start_intro' });
  act(ids[1], { type: 'add_custom', kind: 'vem', text: 'Vem är egentligen värst på det här spelet?' });
  act(ids[2], { type: 'add_custom', kind: 'utmaning', text: 'Alla som har på sig något rött tar 2 klunkar.' });
  assert.throws(() => act(ids[0], { type: 'start_game' }, true), GameError);
  for (const id of ids) act(id, { type: 'ready' });
  assert.throws(() => act(ids[1], { type: 'start_game' }, true), GameError, 'bara värden får starta');
  act(ids[0], { type: 'start_game' }, true);

  // Kortleken: 4 delar à 15 kort, inga dubbletter, egna kort med.
  assert.equal(s.deck.length, PARTS);
  const all = s.deck.flat();
  s.deck.forEach((part) => assert.equal(part.length, CARDS_PER_PART));
  assert.equal(new Set(all.map((c) => c.id)).size, all.length, 'dubbletter i kortleken');
  assert.equal(all.filter((c) => c.custom).length, 2, 'egna kort saknas');
  s.deck.forEach((part, i) => {
    for (const c of part) assert.ok(c.level <= i + 1, `för grovt kort i del ${i + 1}: ${c.text}`);
    for (const c of part.filter((c) => c.kind === 'trivia')) {
      assert.equal(c.options?.length, 4);
      assert.ok(c.answerIndex != null && c.answerIndex >= 0);
    }
  });

  let steps = 0;
  const seen = new Set<string>();
  while (s.status !== 'finished') {
    assert.ok(steps++ < 5000, 'spelet fastnade');
    // Den som har för många sparade klunkar måste dricka först.
    const paused = pausedPlayers(s);
    if (paused.length > 0) {
      assert.throws(() => act(paused[0].id, { type: s.status === 'partEnd' ? 'continue' : 'next' }), GameError);
      act(paused[0].id, { type: 'drink_saved' });
      continue;
    }
    if (s.status === 'partEnd') {
      act(ids[0], { type: 'continue' });
      continue;
    }
    const overlayOwner = Object.keys(s.overlays)[0];
    if (overlayOwner) {
      act(overlayOwner, { type: 'dismiss_overlay' });
      continue;
    }
    const c = s.current!;
    seen.add(c.card.kind);
    assert.ok(!/\bX\b|\bY\b|LAG1|LAG2/.test(c.text), `oersatt namn: ${c.text}`);
    assert.ok(s.players.find((p) => p.id === c.turnId), 'turen saknar spelare');
    const chooseAny = () => (['drink', 'save', 'challenge'] as const)[Math.floor(rng() * 3)];

    if (c.phase === 'upload') {
      if (rng() < 0.2) act(c.turnId, { type: 'skip_photo' });
      else act(c.turnId, { type: 'upload_photo', url: 'https://example.com/a.jpg' });
    } else if (c.phase === 'voting') {
      const voters = ids.filter((id) => !(c.card.kind === 'bild' && id === c.turnId));
      // Publikt läge visar inte vem som är hemlig uppladdare eller hur andra röstat.
      if (c.card.kind === 'bild') assert.equal(toPublic(s, voters[0]).current?.turnId, '');
      for (const id of voters) {
        if (s.current?.phase !== 'voting') break;
        act(id, { type: 'vote', targetId: ids[Math.floor(rng() * ids.length)] });
      }
      assert.equal(s.current?.phase, 'result');
      assert.ok(s.current!.losers.length > 0);
      // Resultatet visar bara antal röster, aldrig vem som röstade på vem.
      const pubResult = toPublic(s, ids[0]).current!;
      assert.ok(Object.keys(pubResult.votes).every((voter) => voter === ids[0]), 'röster läcker ut');
      assert.equal(
        Object.values(pubResult.tally ?? {}).reduce((a, b) => a + b, 0),
        Object.keys(s.current!.votes).length,
      );
    } else if (c.phase === 'result') {
      for (const id of c.losers) {
        if (!s.current?.choices[id] && pausedPlayers(s).length === 0 && rng() < 0.8) act(id, { type: 'choose', choice: chooseAny() });
      }
      if (s.current?.seq === c.seq && pausedPlayers(s).length === 0) {
        // Gruppkort: bara värden går vidare.
        assert.throws(() => act(ids[1], { type: 'next' }), GameError, 'icke-värd fick trycka nästa på gruppkort');
        act(ids[0], { type: 'next' });
      }
    } else if (c.card.kind === 'trivia') {
      act(c.turnId, { type: 'trivia_answer', index: Math.floor(rng() * 4) });
      if (s.current!.triviaPick === c.card.answerIndex) act(c.turnId, { type: 'next' });
      else act(c.turnId, { type: 'choose', choice: chooseAny() });
    } else if (isSoloCard(c.card)) {
      const other = ids.find((id) => id !== c.turnId)!;
      assert.throws(() => act(other, { type: 'choose', choice: 'drink' }), GameError, 'fel spelare fick välja');
      if (c.card.kind === 'direkt' && rng() < 0.5) act(c.turnId, { type: 'choose', choice: 'answered' });
      else if (rng() < 0.3) act(c.turnId, { type: 'next' });
      else act(c.turnId, { type: 'choose', choice: chooseAny() });
    } else {
      for (const id of ids) {
        if (!s.current?.choices[id] && pausedPlayers(s).length === 0 && rng() < 0.3) act(id, { type: 'choose', choice: chooseAny() });
      }
      if (s.current?.seq === c.seq && pausedPlayers(s).length === 0) {
        // Gruppkort: bara värden går vidare.
        assert.throws(() => act(ids[1], { type: 'next' }), GameError, 'icke-värd fick trycka nästa på gruppkort');
        act(ids[0], { type: 'next' });
      }
    }
    for (const p of s.players) assert.ok(p.saved <= MAX_SAVED + 6, 'för många sparade klunkar');
  }

  // Turerna ska vara jämnt fördelade.
  const turns = s.players.map((p) => p.turns);
  assert.ok(Math.max(...turns) - Math.min(...turns) <= 2, `ojämna turer: ${turns}`);
  assert.equal(toPublic(s, ids[0]).players.length, playerCount);
  assert.ok(!('deck' in toPublic(s, ids[0])), 'kortleken läcker ut');

  act(ids[0], { type: 'restart' }, true);
  assert.equal(s.status, 'playing');
  assert.ok(s.players.every((p) => p.drank === 0));
  act(ids[0], { type: 'end' });
  assert.equal(s.status, 'ended');
  return seen;
}

const kinds = new Set<string>();
for (let seed = 1; seed <= 200; seed++) {
  for (const k of play(seed, 3 + (seed % 13))) kinds.add(k);
}
assert.deepEqual([...kinds].sort(), ['bild', 'direkt', 'minigame', 'trivia', 'utmaning', 'vem']);
console.log('200 simulerade spel med 3–15 spelare: OK');
