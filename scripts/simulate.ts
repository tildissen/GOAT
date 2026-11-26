/**
 * Spelar igenom många hela spel med slumpade val och kontrollerar att
 * spelmotorn aldrig fastnar eller bryter mot reglerna. Kör: npm test
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { CONTENT_FILES, parseContent, type ContentFiles } from '../src/lib/content';
import { buildCustomDeck, buildDeck, CARDS_PER_PART, PARTS } from '../src/lib/deck';
import {
  addPlayer,
  applyAction,
  housekeeping,
  familyText,
  pointsText,
  usesPoints,
  sipsForPart,
  isTakeCard,
  isLeaderCard,
  isLastingRule,
  GameError,
  isSoloCard,
  MAX_SAVED,
  MIN_OWN_CARDS,
  newGameState,
  newPlayer,
  pausedPlayers,
  scaleSips,
  toPublic,
  type Ctx,
} from '../src/lib/engine';
import type { Action, CardRow, GameMode, GameState, Occasion, Scoring } from '../src/lib/types';

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
assert.equal(scaleSips('Den som blinkar först tar 2 klunkar.', 3), 'Den som blinkar först tar 5 klunkar.');
assert.equal(scaleSips('Den som blinkar först tar 2 klunkar.', 4), 'Den som blinkar först tar 7 klunkar.');
assert.equal(scaleSips('tar 1 extra klunk.', 2), 'tar 2 extra klunkar.');
// AW stegrar lugnare: som mest +2.
assert.equal(scaleSips('Den som blinkar först tar 2 klunkar.', 4, 'aw'), 'Den som blinkar först tar 4 klunkar.');
// AW: max 4 klunkar på ett kort, även egna kort med stora siffror.
assert.equal(scaleSips('Hen delar ut 3 klunkar.', 4, 'aw'), 'Hen delar ut 4 klunkar.');
assert.equal(scaleSips('Alla tar 10 klunkar.', 1, 'aw'), 'Alla tar 4 klunkar.');
assert.equal(sipsForPart(4, 'aw'), 3);
assert.equal(sipsForPart(4, 'fest'), 6);
assert.equal(scaleSips('ett nummer mellan 1–5 samtidigt', 3), 'ett nummer mellan 1–5 samtidigt');

console.log(`Kort: ${cards.length} st`);
for (const kind of ['vem', 'direkt', 'trivia', 'utmaning', 'minigame', 'bild']) {
  console.log(`  ${kind}: ${cards.filter((c) => c.kind === kind).length}`);
}

let rulesChecked = 0;
let errorsLogged = 0;

function play(seed: number, playerCount: number, mode: GameMode = 'classic', occasion: Occasion = 'fest', scoring: Scoring = 'klunkar') {
  const rng = makeRng(seed);
  let now = 1000;
  const ids = Array.from({ length: playerCount }, (_, i) => `p${i}`);
  let s: GameState = newGameState(newPlayer(ids[0], 'Värd', now), mode, occasion, scoring);
  const family = occasion === 'familj' && mode === 'custom';
  // Poäng (Familjespel, eller AW/Fest där värden valt poäng): inga klunkar och ingen spara-knapp.
  const points = usesPoints(s);
  // Med pluspoäng: poäng (flest vinner). Annars: klunkar.
  const score = (id: string) => {
    const p = s.players.find((pl) => pl.id === id)!;
    return points ? (p.points ?? 0) : p.drank;
  };
  if (mode === 'custom' && occasion !== 'familj') assert.equal(points, scoring === 'poang');
  for (const id of ids.slice(1)) s = addPlayer(s, `Spelare ${id}`, id, now).state;
  const active = new Set(ids);
  const ctx = (deck = false): Ctx => ({
    active,
    rng,
    now: now++,
    deck: deck ? (mode === 'custom' ? buildCustomDeck(cards, s.customCards, rng, occasion) : buildDeck(cards, s.customCards, rng)) : undefined,
  });
  const act = (pid: string, action: Action, withDeck = false) => {
    s = applyAction(s, pid, action, ctx(withDeck));
  };

  act(ids[0], { type: 'start_intro' });
  let ownCards = 0;
  if (mode === 'custom') {
    // Alla måste skriva minst 3 kort, av vilken typ som helst.
    const kinds: Action[] = [
      { type: 'add_custom', kind: 'vem', text: 'Vem skulle överleva längst i en zombieapokalyps?' },
      { type: 'add_custom', kind: 'direkt', text: 'Vad är det pinsammaste du gjort på fyllan?' },
      { type: 'add_custom', kind: 'utmaning', players: 1, text: 'Härma någon i rummet tills någon gissar vem.' },
      { type: 'add_custom', kind: 'utmaning', players: 0, text: 'Alla som har på sig svart tar 2 klunkar.' },
    ];
    assert.throws(() => act(ids[0], { type: 'add_custom', kind: 'minigame', text: 'Utan namn' }), GameError, 'minigame utan namn');
    for (const id of ids) {
      const extra = Math.floor(rng() * 4);
      for (let i = 0; i < MIN_OWN_CARDS + extra; i++) {
        if (i === 2) assert.throws(() => act(id, { type: 'ready' }), GameError, 'redo med för få kort');
        act(id, kinds[Math.floor(rng() * kinds.length)]);
        ownCards++;
      }
    }
    // Riktade kort: till en viss spelare, aldrig till sig själv.
    assert.throws(() => act(ids[1], { type: 'add_custom', kind: 'direkt', text: 'Till mig själv?', targetId: ids[1] }), GameError);
    act(ids[1], { type: 'add_custom', kind: 'direkt', text: 'Vad tycker du om sälj?', targetId: ids[2] });
    act(ids[2], { type: 'add_custom', kind: 'utmaning', players: 1, text: 'Härma mig!', targetId: ids[0] });
    ownCards += 2;
    // Ett eget minigame räknas också mot kravet.
    act(ids[0], { type: 'add_custom', kind: 'minigame', title: 'Tyst minut', text: 'Ingen får prata. Den som pratar tar 2 klunkar.' });
  } else {
    act(ids[1], { type: 'add_custom', kind: 'vem', text: 'Vem är egentligen värst på det här spelet?' });
    act(ids[2], { type: 'add_custom', kind: 'utmaning', text: 'Alla som har på sig något rött tar 2 klunkar.' });
  }
  assert.throws(() => act(ids[0], { type: 'start_game' }, true), GameError);
  for (const id of ids) act(id, { type: 'ready' });
  assert.throws(() => act(ids[1], { type: 'start_game' }, true), GameError, 'bara värden får starta');
  act(ids[0], { type: 'start_game' }, true);

  const all = s.deck.flat();
  assert.equal(new Set(all.map((c) => c.id)).size, all.length, 'dubbletter i kortleken');
  if (mode === 'custom') {
    // Alla egna kort och det egna minigamet är med, alltid 4 delar, trivia blandas in.
    assert.equal(s.deck.length, PARTS, 'eget spel ska ha 4 delar');
    // 10 kort per del, om inte spelarna skrivit så många kort att de inte får plats.
    if (ownCards <= PARTS * 7) s.deck.forEach((part) => assert.ok(part.filter((c) => c.kind !== 'regelkoll').length <= CARDS_PER_PART, `för lång del: ${part.length}`));
    assert.equal(all.filter((c) => c.custom).length, ownCards + 1, 'egna kort saknas');
    if (ownCards <= PARTS * 7) assert.ok(all.some((c) => c.kind === 'trivia'), 'trivia saknas');
    assert.ok(all.some((c) => c.custom && c.kind === 'minigame' && c.title === 'Tyst minut'));
  } else {
    // Kortleken: 4 delar à 15 kort, egna kort med.
    assert.equal(s.deck.length, PARTS);
    s.deck.forEach((part) => assert.equal(part.filter((c) => c.kind !== 'regelkoll').length, CARDS_PER_PART));
    assert.equal(all.filter((c) => c.custom).length, 2, 'egna kort saknas');
    // Vildare för varje del: kaoskort bara i del 3–4, ingen trivia i del 3–4.
    const count = (i: number, kind: string) => s.deck[i].filter((c) => c.kind === kind && !c.custom).length;
    assert.deepEqual([0, 1, 2, 3].map((i) => count(i, 'kaos')), [0, 0, 1, 2], 'kaoskort i fel del');
    assert.equal(count(2, 'trivia') + count(3, 'trivia'), 0, 'trivia i del 3–4');
  }
  s.deck.forEach((part, i) => {
    for (const c of part) assert.ok(mode === 'custom' || c.level <= i + 1, `för grovt kort i del ${i + 1}: ${c.text}`);
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
      // ERROR loggas som händelse, så att alla ser den även om personen dricker direkt.
      if ((s.events ?? []).some((e) => e.kind === 'error' && paused.some((p) => p.id === e.actorId))) errorsLogged++;
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
    if (mode === 'custom' && occasion === 'aw') {
      assert.ok(c.sips <= 4, `för många klunkar i AW: ${c.sips}`);
      for (const m of c.text.matchAll(/(\d+)\s+(?:extra\s+)?(?:klunk|minuspoäng)/g)) assert.ok(Number(m[1]) <= 4, `för många klunkar i AW: ${c.text}`);
    }
    if (c.card.targetId) assert.equal(c.turnId, c.card.targetId, `riktat kort hamnade fel: ${c.text}`);
    if (family) {
      // Familjespel: aldrig något om att dricka, och man kan inte spara.
      // Spelarnas egna kort kan handla om vad som helst, men klunkar och drickande skrivs om.
      const words = c.card.custom ? /klunk|drick/i : /klunk|drick|druck|alkohol|\bfyll(?:a|an|o)\b/i;
      assert.ok(!words.test(c.text), `dryckesord i familjespel: ${c.text}`);
    } else if (points && ['utmaning', 'minigame', 'kaos'].includes(c.card.kind)) {
      assert.ok(!/\d+\s+(?:extra\s+)?klunk/i.test(c.text), `klunkar i poängspel: ${c.text}`);
      assert.ok(!/minuspoäng/i.test(c.text), `minuspoäng i pluspoängspel: ${c.text}`);
    }
    assert.ok(!/\bX\b|\bY\b|LAG1|LAG2/.test(c.text), `oersatt namn: ${c.text}`);
    assert.ok(s.players.find((p) => p.id === c.turnId), 'turen saknar spelare');
    const choices = points ? (['drink', 'challenge'] as const) : (['drink', 'save', 'challenge'] as const);
    const chooseAny = () => choices[Math.floor(rng() * choices.length)];

    if (c.card.kind === 'regelkoll') {
      // Regelkoll mitt i spelet (B106): spelledaren för regeln delar ut, sedan slutar regeln gälla.
      const rule = (s.rules ?? []).find((r) => r.id === c.card.id)!;
      assert.ok(rule, 'regelkoll utan regel');
      const before = score(ids[1]);
      act(rule.byId, { type: 'rule_take', ruleId: rule.id, targetId: ids[1] });
      assert.equal(score(ids[1]), before + (points ? -rule.sips : rule.sips), 'regelkollen räknades fel');
      const outsider = ids.find((id) => id !== ids[0] && id !== rule.byId);
      if (outsider) assert.throws(() => act(outsider, { type: 'rule_take', ruleId: rule.id, targetId: ids[1] }), GameError, 'vem som helst kunde dela ut i regelkollen');
      act(rule.byId, { type: 'next', seq: c.seq });
      assert.ok(!(s.rules ?? []).some((r) => r.id === rule.id), 'regeln gäller fortfarande efter regelkollen');
      rulesChecked++;
      continue;
    }
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
        if (points) {
          // Pluspoäng: inga val efter röstningen – poängen delades ut när rösterna räknades.
          assert.throws(() => act(id, { type: 'choose', choice: 'drink' }), GameError, 'val efter röstning med pluspoäng');
          continue;
        }
        if (!s.current?.choices[id] && pausedPlayers(s).length === 0 && rng() < 0.8) act(id, { type: 'choose', choice: chooseAny() });
      }
      if (s.current?.seq === c.seq && pausedPlayers(s).length === 0) {
        // Gruppkort: bara värden går vidare.
        assert.throws(() => act(ids[1], { type: 'next' }), GameError, 'icke-värd fick trycka nästa på gruppkort');
        // Förlorare som inte valt något får klunkarna/minuspoängen ändå när kortet går vidare.
        const skipped = s.current!.losers.filter((id) => !s.current!.choices[id]);
        const before = new Map(skipped.map((id) => [id, s.players.find((pl) => pl.id === id)!.drank]));
        const sips = s.current!.sips;
        act(ids[0], { type: 'next' });
        if (!points) for (const id of skipped) assert.equal(s.players.find((pl) => pl.id === id)!.drank, before.get(id)! + sips, 'förlorare slapp dricka');
      }
    } else if (c.card.kind === 'trivia') {
      const before = score(c.turnId);
      act(c.turnId, { type: 'trivia_answer', index: Math.floor(rng() * 4) });
      const right = s.current!.triviaPick === c.card.answerIndex;
      if (points) assert.equal(score(c.turnId), before + (right ? c.sips : 0), 'trivia gav fel poäng');
      if (right) act(c.turnId, { type: 'next' });
      else act(c.turnId, { type: 'choose', choice: chooseAny() });
    } else if (isSoloCard(c.card)) {
      const other = ids.find((id) => id !== c.turnId)!;
      assert.throws(() => act(other, { type: 'choose', choice: 'drink' }), GameError, 'fel spelare fick välja');
      const before = score(c.turnId);
      const r = rng();
      if (c.card.kind === 'direkt' && r < 0.5) {
        act(c.turnId, { type: 'choose', choice: 'answered' });
        if (points) assert.equal(score(c.turnId), before + c.sips, 'svar gav inte poäng');
      } else if (r < 0.65) {
        act(c.turnId, { type: 'next' });
        // Pluspoäng: "Klar!" på en utmaning ger poäng.
        if (points) assert.equal(score(c.turnId), before + (c.card.kind === 'utmaning' ? c.sips : 0), 'Klar! gav fel poäng');
      } else {
        const choice = chooseAny();
        act(c.turnId, { type: 'choose', choice });
        // Pluspoäng: hoppa över ger 0.
        if (points && choice === 'drink') assert.equal(score(c.turnId), before, 'hoppa över gav poäng');
      }
    } else {
      if (c.card.kind === 'minigame') {
        // Minigames har inga val – bara Nästa/Hoppa över.
        if (pausedPlayers(s).length === 0) assert.throws(() => act(ids[0], { type: 'choose', choice: 'drink' }), GameError, 'val på minigame');
      }
      // Gruppkort, minigames och kaoskort: spelledaren (den som drog kortet) och värden delar ut – ingen annan.
      if (isTakeCard(c) && pausedPlayers(s).length === 0 && rng() < 0.7) {
        const target = ids[1];
        const before = score(target);
        act(ids[0], { type: 'take', targetId: target });
        act(c.turnId, { type: 'take', targetId: target });
        act(c.turnId, { type: 'untake', targetId: target });
        assert.equal(score(target), before + (points ? -c.sips : c.sips), 'poängen räknades fel');
        assert.equal(s.current!.taken![target], 1);
        const outsider = ids.find((id) => id !== ids[0] && id !== c.turnId);
        if (outsider) assert.throws(() => act(outsider, { type: 'take', targetId: target }), GameError, 'vem som helst kunde dela ut');
        assert.throws(() => act(ids[0], { type: 'untake', targetId: ids.find((id) => id !== target)! }), GameError, 'tog bort poäng som inte fanns');
      }
      // Regler som gäller en stund: inga poäng direkt, men regeln sparas till regelkollen.
      if (isLeaderCard(c.card) && isLastingRule(c.card, c.text)) {
        assert.ok(!isTakeCard(c), 'regel delades ut direkt');
        assert.ok((s.rules ?? []).some((r) => r.text === c.text && r.byId === c.turnId), 'regeln sparades inte');
        assert.ok(/tills regelkollen dyker upp/.test(c.text) && !/resten av|de kommande \d+ korten/.test(c.text), `regeln säger fortfarande hur länge: ${c.text}`);
      }
      if (c.card.kind === 'minigame') {
        // (inga val)
      } else {
        for (const id of ids) {
          if (s.current?.choices[id] || pausedPlayers(s).length > 0) continue;
          // X och Y: bara de två kan välja. Gruppkort och lagkort: ingen.
          if (c.card.players !== 2 || !c.targetIds.includes(id)) {
            assert.throws(() => act(id, { type: 'choose', choice: 'drink' }), GameError, 'fel spelare valde på gruppkort');
          } else if (rng() < 0.3) {
            act(id, { type: 'choose', choice: chooseAny() });
          }
        }
      }
      if (s.current?.seq === c.seq && pausedPlayers(s).length === 0) {
        // Gruppkort: värden går vidare – på minigames, kaoskort och gruppkort även spelledaren, men ingen annan.
        const other = ids.find((id) => id !== ids[0] && !(isLeaderCard(c.card) && id === c.turnId));
        if (other) assert.throws(() => act(other, { type: 'next' }), GameError, 'fel spelare fick trycka nästa på gruppkort');
        // Trycker man Nästa på ett kort som redan bytts säger servern det (B103).
        assert.throws(() => act(ids[0], { type: 'next', seq: c.seq - 1 }), /redan bytts/, 'gammalt kort gick vidare');
        act(isLeaderCard(c.card) && rng() < 0.5 ? c.turnId : ids[0], { type: 'next' });
      }
    }
    for (const p of s.players) assert.ok(p.saved <= MAX_SAVED + 12, 'för många sparade klunkar');
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
assert.deepEqual([...kinds].filter((k) => k !== 'regelkoll').sort(), ['bild', 'direkt', 'kaos', 'minigame', 'trivia', 'utmaning', 'vem']);
console.log('200 simulerade spel med 3–15 spelare: OK');

// Samma namn: upptaget om den spelaren är med, annars får man tillbaka sin plats.
{
  let s = newGameState(newPlayer('a', 'Kalle', 1));
  assert.throws(() => addPlayer(s, 'kalle', 'b', 2, new Set(['a'])), GameError, 'samma namn tog över en aktiv spelare');
  const back = addPlayer(s, 'kalle', 'b', 2, new Set());
  assert.equal(back.player.id, 'a');
  assert.equal(back.rejoined, true);
}
// Röstningen avgörs av sig själv när den som inte röstat har försvunnit.
{
  const rng = makeRng(7);
  const ids = ['a', 'b', 'c', 'd'];
  let s: GameState = newGameState(newPlayer('a', 'A', 1));
  for (const id of ids.slice(1)) s = addPlayer(s, id.toUpperCase(), id, 1).state;
  const all = new Set(ids);
  const ctx = (active: Set<string>, deck = false): Ctx => ({ active, rng, now: 1, deck: deck ? buildDeck(cards, [], rng) : undefined });
  s = applyAction(s, 'a', { type: 'start_intro' }, ctx(all));
  for (const id of ids) s = applyAction(s, id, { type: 'ready' }, ctx(all));
  s = applyAction(s, 'a', { type: 'start_game' }, ctx(all, true));
  for (let i = 0; i < 40 && s.current?.phase !== 'voting'; i++) s = applyAction(s, 'a', { type: 'next' }, ctx(all));
  assert.equal(s.current?.phase, 'voting');
  for (const id of ['a', 'b', 'c']) s = applyAction(s, id, { type: 'vote', targetId: 'b' }, ctx(all));
  assert.equal(housekeeping(s, ctx(all)), null, 'avgjordes fast alla inte röstat');
  const after = housekeeping(s, ctx(new Set(['a', 'b', 'c'])));
  assert.equal(after?.current?.phase, 'result', 'röstningen avgjordes inte när d försvann');
}
// ERROR så fort man har 5 sparade (5/5, 6/5, 8/5 …), inte först vid 6.
{
  const s = newGameState(newPlayer('a', 'A', 1));
  for (const [saved, paused] of [[4, false], [5, true], [6, true], [8, true]] as const) {
    s.players[0].saved = saved;
    assert.equal(pausedPlayers(s).length === 1, paused, `fel paus vid ${saved} sparade`);
  }
}
// Taket för sparade klunkar sjunker per del: 5, 4, 3, 2.
{
  const s = newGameState(newPlayer('a', 'A', 1));
  s.players[0].saved = 3;
  for (const [part, paused] of [[1, false], [2, false], [3, true], [4, true]] as const) {
    s.part = part;
    assert.equal(pausedPlayers(s).length === 1, paused, `fel tak i del ${part}`);
  }
}
console.log('Samma namn och försvunna spelare: OK');

for (const occasion of ['fest', 'aw', 'familj'] as const) {
  for (let seed = 1; seed <= 60; seed++) play(seed, 3 + (seed % 13), 'custom', occasion);
}
// AW och Fest med poäng i stället för klunkar.
for (const occasion of ['fest', 'aw'] as const) {
  for (let seed = 1; seed <= 30; seed++) play(seed, 3 + (seed % 13), 'custom', occasion, 'poang');
}
assert.equal(newGameState(newPlayer('a', 'A', 0), 'custom', 'familj', 'klunkar').scoring, 'poang', 'familjespel har alltid poäng');
assert.equal(newGameState(newPlayer('a', 'A', 0), 'custom', 'aw').scoring, 'klunkar', 'klunkar är förvalt');
assert.ok(!usesPoints(newGameState(newPlayer('a', 'A', 0), 'classic', undefined, 'poang')), 'vanligt spel har alltid klunkar');
// Utmaningskort i familjespel är också alkoholfria.
for (const c of cards.filter((c) => c.occasion === 'familj')) {
  assert.ok(!/klunk|drick|druck|alkohol|\bfyll(?:a|an|o)\b/i.test(`${c.title ?? ''} ${c.text}`), `dryckesord i familj.txt: ${c.text}`);
}
assert.ok(!buildDeck(cards, [], makeRng(1)).deck.flat().some((c) => c.text.includes('minuspoäng')), 'familjekort i vanligt spel');
assert.equal(familyText('Den som pratar dricker 2 klunkar.'), 'Den som pratar får 2 minuspoäng.');
assert.equal(familyText('Nämn en stad, annars drick 3 klunkar.'), 'Nämn en stad, annars ta 3 minuspoäng.');
assert.equal(familyText('Den yngsta dricker.'), 'Den yngsta får minuspoäng.');
// Pluspoäng (B102): straff blir poäng man förlorar.
assert.equal(pointsText('Den som pratar dricker 2 klunkar.'), 'Den som pratar förlorar 2 poäng.');
assert.equal(pointsText('Den som rör sig först får 2 minuspoäng.'), 'Den som rör sig först förlorar 2 poäng.');
assert.equal(pointsText('Den som senast åt glass delar ut 2 minuspoäng.'), 'Den som senast åt glass väljer någon som förlorar 2 poäng.');
assert.equal(pointsText('Nämn fem frukter, annars får du 2 minuspoäng.'), 'Nämn fem frukter, annars förlorar du 2 poäng.');
assert.equal(pointsText('Den som dricker med höger tar 1 extra klunk.', false), 'Den som dricker med höger förlorar 1 poäng.');
assert.equal(pointsText('Säger någon fel namn tar hen 2 klunkar.', false), 'Säger någon fel namn förlorar hen 2 poäng.');
console.log('180 simulerade "Bygg eget spel" (Fest, AW, Familjespel) med 3–15 spelare: OK');
assert.ok(rulesChecked > 0, 'regelkollen testades aldrig');
console.log(`Regelkoll testad: ${rulesChecked} regler`);
assert.ok(errorsLogged > 0, 'ERROR loggades aldrig som händelse');
console.log(`ERROR-händelser: ${errorsLogged}`);
// Pluspoäng: inga kort får säga att man "dricker/tar/får N poäng" – straff ska alltid vara "förlorar" (B103).
for (const c of cards) {
  if (!/klunk|minuspoäng/.test(c.text)) continue;
  const t = pointsText(c.text, c.occasion === 'familj');
  assert.ok(!/\b(?:dricker|dricka|tar|får)\s+(?:\w+\s+)?\d+\s+poäng(?! från andra)/i.test(t), `konstig poängtext: ${t}`);
}
console.log('Poängtexter i alla kort: OK');
// Positiva Vem i rummet?-frågor (B105): ger poäng till den med flest röster när man spelar om poäng.
assert.equal(cards.filter((c) => c.positive).length, 28, 'antal positiva frågor');
assert.ok(cards.filter((c) => c.positive).every((c) => c.kind === 'vem'), 'positiv fråga som inte är Vem i rummet?');
console.log('Positiva frågor: OK');
