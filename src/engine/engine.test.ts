import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { endTurn, playCard } from './combat';
import { chooseReward, newRun, resolveCombat } from './run';
import { shuffle } from './rng';

describe('rng', () => {
  it('is deterministic for a given seed', () => {
    expect(shuffle([1, 2, 3, 4, 5], 42)).toEqual(shuffle([1, 2, 3, 4, 5], 42));
  });
});

describe('run', () => {
  it('starts with 5 cards in hand and 3 energy', () => {
    const run = newRun(123);
    expect(run.combat!.hand).toHaveLength(5);
    expect(run.combat!.energy).toBe(3);
    expect(run.encounters).toHaveLength(6);
  });

  it('same seed gives the same run', () => {
    expect(newRun(7)).toEqual(newRun(7));
  });

  it('playing a strike damages the enemy and spends energy', () => {
    let run = newRun(1);
    // force a known hand
    run.combat!.hand = [{ uid: 'x', defId: 'strike' }];
    const hp = run.combat!.enemy.hp;
    run = playCard(run, 'x');
    const strike = CARDS.strike.effects[0];
    if (strike.type !== 'damage') throw new Error('Strike should deal damage');
    expect(run.combat!.enemy.hp).toBe(hp - strike.amount);
    expect(run.combat!.energy).toBe(2);
    expect(run.combat!.discardPile.map((c) => c.uid)).toContain('x');
  });

  it('end turn refills hand and energy', () => {
    let run = newRun(2);
    run = endTurn(run);
    expect(run.combat!.turn).toBe(2);
    expect(run.combat!.energy).toBe(3);
    expect(run.combat!.hand).toHaveLength(5);
  });

  it('winning a fight offers rewards, and picking one adds it to the deck', () => {
    let run = newRun(3);
    run.combat!.enemy.hp = 1;
    run.combat!.hand = [{ uid: 'x', defId: 'strike' }];
    run = resolveCombat(playCard(run, 'x'));
    expect(run.phase).toBe('reward');
    expect(run.rewardOptions).toHaveLength(3);
    const pick = run.rewardOptions[0];
    run = chooseReward(run, pick);
    expect(run.deck.at(-1)!.defId).toBe(pick);
    expect(run.floor).toBe(1);
    expect(run.phase).toBe('combat');
  });
});
