import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../data/enemies';
import { endTurn, noStatuses, playCard, startCombat } from './combat';
import { newRun } from './run';
import type { RunState } from './types';

ENEMIES.t_idle = { id: 't_idle', name: 'Idle', maxHp: 500, pattern: [{ type: 'block', amount: 0 }] };

function setup(hand: string[]): RunState {
  const run = newRun(1);
  const c = run.combat!;
  c.enemy = { defId: 't_idle', hp: 500, maxHp: 500, block: 0, strength: 0, statuses: noStatuses(), patternIndex: 0 };
  c.drawPile = [];
  c.discardPile = [];
  c.energy = 10;
  c.hand = hand.map((defId, i) => ({ uid: `h${i}`, defId }));
  return run;
}

const enemyHp = (r: RunState) => r.combat!.enemy.hp;

describe('Inflame', () => {
  it('gives 2 Strength that lasts across turns and adds to attacks', () => {
    let run = playCard(setup(['inflame']), 'h0');
    expect(run.player.strength).toBe(2);
    run = endTurn(run);
    expect(run.player.strength).toBe(2);
    run.combat!.hand = [{ uid: 's', defId: 'strike' }];
    const before = enemyHp(run);
    run = playCard(run, 's');
    expect(before - enemyHp(run)).toBe(8);
  });

  it('stacks and resets at the start of the next combat', () => {
    let run = playCard(playCard(setup(['inflame', 'inflame']), 'h0'), 'h1');
    expect(run.player.strength).toBe(4);
    run = startCombat(run, 't_idle');
    expect(run.player.strength).toBe(0);
  });
});

describe('Flex', () => {
  it('adds 2 to each hit this turn, then wears off', () => {
    let run = playCard(setup(['flex', 'twinStrike']), 'h0');
    expect(run.player.strength).toBe(2);
    expect(run.player.statuses.strengthDown).toBe(2);
    const before = enemyHp(run);
    run = playCard(run, 'h1');
    expect(before - enemyHp(run)).toBe(12); // (4+2)×2
    run = endTurn(run);
    expect(run.player.strength).toBe(0);
    expect(run.player.statuses.strengthDown).toBe(0);
  });

  it('only removes the temporary part when combined with Inflame', () => {
    let run = playCard(playCard(setup(['inflame', 'flex', 'flex']), 'h0'), 'h1');
    run = playCard(run, 'h2');
    expect(run.player.strength).toBe(6);
    run = endTurn(run);
    expect(run.player.strength).toBe(2);
  });

  it('logs the Strength loss at end of turn', () => {
    let run = playCard(setup(['flex']), 'h0');
    run = endTurn(run);
    expect(run.combat!.log).toContain('You lose 2 Strength.');
  });
});
