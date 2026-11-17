import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { endTurn, noStatuses, playCard, startCombat } from './combat';
import { newRun } from './run';
import type { RunState } from './types';

ENEMIES.t_idle = { id: 't_idle', name: 'Idle', maxHp: 500, pattern: [{ type: 'block', amount: 0 }] };
CARDS.t_exhaust = {
  id: 't_exhaust', name: 'Test Exhaust', cost: 0, type: 'skill', rarity: 'common',
  text: 'Gain 1 block.', effects: [{ type: 'block', amount: 1 }], exhaust: true,
};

/** A 6-card combat: one exhaust card + five Strikes, all in hand, empty piles. */
function setup(): RunState {
  const run = newRun(1);
  const c = run.combat!;
  c.enemy = { defId: 't_idle', hp: 500, maxHp: 500, block: 0, strength: 0, statuses: noStatuses(), patternIndex: 0 };
  c.drawPile = [];
  c.discardPile = [];
  c.exile = [];
  c.energy = 10;
  c.hand = [{ uid: 'x', defId: 't_exhaust' }, ...[1, 2, 3, 4, 5].map((i) => ({ uid: `s${i}`, defId: 'strike' }))];
  return run;
}

const allUids = (r: RunState) => {
  const c = r.combat!;
  return [...c.drawPile, ...c.hand, ...c.discardPile].map((h) => h.uid);
};

describe('Exhaust', () => {
  it('sends a played exhaust card to exile, not discard', () => {
    const run = playCard(setup(), 'x');
    const c = run.combat!;
    expect(c.exile.map((h) => h.uid)).toEqual(['x']);
    expect(c.discardPile).toHaveLength(0);
    expect(c.hand.some((h) => h.uid === 'x')).toBe(false);
  });

  it('never comes back for the rest of the combat, across reshuffles', () => {
    let run = playCard(setup(), 'x');
    for (let t = 0; t < 4; t++) {
      run = endTurn(run); // discards hand, reshuffles discard into draw, draws 5
      expect(allUids(run)).not.toContain('x');
      expect(run.combat!.exile.map((h) => h.uid)).toEqual(['x']);
    }
  });

  it('non-exhaust cards still cycle through discard and reshuffle', () => {
    let run = playCard(setup(), 's1');
    expect(run.combat!.discardPile.map((h) => h.uid)).toEqual(['s1']);
    expect(run.combat!.exile).toHaveLength(0);
    run = endTurn(run);
    // 6 cards total, 5 drawn after reshuffle: every card is in hand or draw pile again.
    expect(allUids(run).sort()).toEqual(['s1', 's2', 's3', 's4', 's5', 'x']);
    expect(run.combat!.hand).toHaveLength(5);
  });

  it('exile is empty at the start of the next combat and the card is back in the deck', () => {
    let run = playCard(setup(), 'x');
    run.deck = [{ uid: 'x', defId: 't_exhaust' }, { uid: 's1', defId: 'strike' }];
    run = startCombat(run, 't_idle');
    expect(run.combat!.exile).toHaveLength(0);
    expect(allUids(run).sort()).toEqual(['s1', 'x']);
  });
});
