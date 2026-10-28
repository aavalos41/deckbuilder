import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { attackDamage, describeIntent, endTurn, noStatuses, playCard } from './combat';
import { newRun } from './run';
import type { CardDef, Combatant, Intent, RunState } from './types';

// Test-only content, registered at runtime so the real data files stay untouched.
const testCards: Record<string, CardDef> = {
  t_vuln2: { id: 't_vuln2', name: 'T Vuln', cost: 0, type: 'skill', rarity: 'common', text: '',
    effects: [{ type: 'applyStatus', status: 'vulnerable', amount: 2, target: 'enemy' }] },
  t_weak1: { id: 't_weak1', name: 'T Weak', cost: 0, type: 'skill', rarity: 'common', text: '',
    effects: [{ type: 'applyStatus', status: 'weak', amount: 1, target: 'enemy' }] },
  t_poison4: { id: 't_poison4', name: 'T Poison', cost: 0, type: 'skill', rarity: 'common', text: '',
    effects: [{ type: 'applyStatus', status: 'poison', amount: 4, target: 'enemy' }] },
  t_hit10: { id: 't_hit10', name: 'T Hit', cost: 0, type: 'attack', rarity: 'common', text: '',
    effects: [{ type: 'damage', amount: 10 }] },
};
Object.assign(CARDS, testCards);

function dummy(id: string, pattern: Intent[]): string {
  ENEMIES[id] = { id, name: 'Dummy', maxHp: 500, pattern };
  return id;
}

/** A run in combat against a dummy enemy, with a fixed hand of 0-cost test cards. */
function setup(pattern: Intent[], hand: string[] = []): RunState {
  const run = newRun(1);
  const c = run.combat!;
  c.enemy = { defId: dummy(`dummy_${Math.random()}`, pattern), hp: 500, maxHp: 500, block: 0, strength: 0,
    statuses: noStatuses(), patternIndex: 0 };
  run.player.hp = run.player.maxHp = 500;
  c.drawPile = [];
  c.discardPile = [];
  c.hand = hand.map((defId, i) => ({ uid: `h${i}`, defId }));
  return run;
}

function give(run: RunState, defId: string): RunState {
  run.combat!.hand = [{ uid: 'g', defId }];
  return run;
}

/** Plays a 10-damage hit and returns HP the enemy lost. */
function hitEnemy(run: RunState): [RunState, number] {
  const before = run.combat!.enemy.hp;
  run = playCard(give(run, 't_hit10'), 'g');
  return [run, before - run.combat!.enemy.hp];
}

/** Ends the turn and returns HP the player lost. */
function endAndMeasure(run: RunState): [RunState, number] {
  const before = run.player.hp;
  run = endTurn(run);
  return [run, before - run.player.hp];
}

const c0 = (o: Partial<Combatant> = {}): Combatant => ({ hp: 1, maxHp: 1, block: 0, strength: 0, statuses: noStatuses(), ...o });

describe('attackDamage', () => {
  it('applies strength, then weak, then vulnerable, rounding down once', () => {
    expect(attackDamage(10, c0(), c0())).toBe(10);
    expect(attackDamage(10, c0({ statuses: { ...noStatuses(), weak: 1 } }), c0())).toBe(7); // 7.5
    expect(attackDamage(10, c0(), c0({ statuses: { ...noStatuses(), vulnerable: 1 } }))).toBe(15);
    // (10 + 2) * 0.75 * 1.5 = 13.5 → 13
    expect(attackDamage(10, c0({ strength: 2, statuses: { ...noStatuses(), weak: 3 } }),
      c0({ statuses: { ...noStatuses(), vulnerable: 2 } }))).toBe(13);
  });

  it('intent preview shows modified damage', () => {
    const attacker = c0({ statuses: { ...noStatuses(), weak: 1 } });
    expect(describeIntent({ type: 'attack', amount: 8 }, attacker, c0())).toBe('Attack 6');
  });
});

describe('status timing', () => {
  it('player-applied Vulnerable 2 boosts exactly two player turns', () => {
    let run = setup([{ type: 'block', amount: 0 }]);
    run = playCard(give(run, 't_vuln2'), 'g');
    let dmg: number;
    [run, dmg] = hitEnemy(run); expect(dmg).toBe(15); // turn 1
    run = endTurn(run);
    [run, dmg] = hitEnemy(run); expect(dmg).toBe(15); // turn 2
    run = endTurn(run);
    [run, dmg] = hitEnemy(run); expect(dmg).toBe(10); // turn 3
    expect(run.combat!.enemy.statuses.vulnerable).toBe(0);
  });

  it('player-applied Weak 1 weakens exactly one enemy attack', () => {
    let run = setup([{ type: 'attack', amount: 8 }]);
    run = playCard(give(run, 't_weak1'), 'g');
    let lost: number;
    [run, lost] = endAndMeasure(run); expect(lost).toBe(6);
    [run, lost] = endAndMeasure(run); expect(lost).toBe(8);
  });

  it('enemy-applied Weak 1 weakens exactly one player turn', () => {
    let run = setup([{ type: 'debuff', status: 'weak', amount: 1 }, { type: 'block', amount: 0 }, { type: 'block', amount: 0 }]);
    run = endTurn(run); // enemy applies Weak 1
    expect(run.player.statuses.weak).toBe(1);
    let dmg: number;
    [run, dmg] = hitEnemy(run); expect(dmg).toBe(7);
    run = endTurn(run);
    [run, dmg] = hitEnemy(run); expect(dmg).toBe(10);
  });

  it('enemy-applied Vulnerable 1 boosts exactly one enemy attack', () => {
    let run = setup([{ type: 'debuff', status: 'vulnerable', amount: 1 }, { type: 'attack', amount: 10 }, { type: 'attack', amount: 10 }]);
    let lost: number;
    [run, lost] = endAndMeasure(run); expect(lost).toBe(0); // applies Vuln 1
    [run, lost] = endAndMeasure(run); expect(lost).toBe(15);
    [run, lost] = endAndMeasure(run); expect(lost).toBe(10);
  });
});

describe('poison', () => {
  it('ticks at the start of the owner turn, ignores block, and decays', () => {
    let run = setup([{ type: 'block', amount: 50 }]);
    run = playCard(give(run, 't_poison4'), 'g');
    const hp = run.combat!.enemy.hp;
    run = endTurn(run); // enemy turn: -4 (block not up yet), then gains 50 block
    expect(run.combat!.enemy.hp).toBe(hp - 4);
    run = endTurn(run); // block expires first anyway, but poison ignores block: -3
    expect(run.combat!.enemy.hp).toBe(hp - 7);
    run = endTurn(run); run = endTurn(run); run = endTurn(run);
    expect(run.combat!.enemy.hp).toBe(hp - 10);
    expect(run.combat!.enemy.statuses.poison).toBe(0);
  });

  it('can kill an enemy before it acts', () => {
    let run = setup([{ type: 'attack', amount: 99 }]);
    run.combat!.enemy.hp = 3;
    run = playCard(give(run, 't_poison4'), 'g');
    run = endTurn(run);
    expect(run.combat!.result).toBe('won');
    expect(run.player.hp).toBe(500);
  });

  it('player poison ticks at the start of the player turn and ignores block', () => {
    let run = setup([{ type: 'debuff', status: 'poison', amount: 3 }, { type: 'block', amount: 0 }]);
    run.player.block = 20;
    run = endTurn(run);
    expect(run.player.hp).toBe(497);
    expect(run.player.statuses.poison).toBe(2);
  });

  it('statuses reset at the start of each combat', () => {
    const run = newRun(5);
    expect(run.player.statuses).toEqual(noStatuses());
    expect(run.combat!.enemy.statuses).toEqual(noStatuses());
  });
});

describe('status cards', () => {
  const withEnergy = (run: RunState) => { run.combat!.energy = 10; return run; };

  it('Catalyst doubles enemy Poison, and does nothing at 0', () => {
    let run = withEnergy(setup([{ type: 'block', amount: 0 }], ['catalyst']));
    run = playCard(run, 'h0');
    expect(run.combat!.enemy.statuses.poison).toBe(0);
    run.combat!.enemy.statuses.poison = 5;
    run = playCard(give(withEnergy(run), 'catalyst'), 'g');
    expect(run.combat!.enemy.statuses.poison).toBe(10);
  });

  it('Brace gives block and removes all your Weak', () => {
    let run = withEnergy(setup([{ type: 'block', amount: 0 }], ['brace']));
    run.player.statuses.weak = 3;
    run = playCard(run, 'h0');
    expect(run.player.block).toBe(6);
    expect(run.player.statuses.weak).toBe(0);
  });

  it('Venom Strike deals damage and applies Poison', () => {
    let run = withEnergy(setup([{ type: 'block', amount: 0 }], ['venomStrike']));
    run = playCard(run, 'h0');
    expect(run.combat!.enemy.hp).toBe(495);
    expect(run.combat!.enemy.statuses.poison).toBe(2);
  });

  it('Cripple applies Weak that reduces the next enemy attack', () => {
    let run = withEnergy(setup([{ type: 'attack', amount: 8 }], ['cripple']));
    run = playCard(run, 'h0');
    run = endTurn(run);
    expect(run.player.hp).toBe(500 - 6); // floor(8 * 0.75)
  });

  it('new enemies use debuff intents', () => {
    expect(ENEMIES.toad.pattern.some((i) => i.type === 'debuff' && i.status === 'weak')).toBe(true);
    expect(ENEMIES.archer.pattern.some((i) => i.type === 'debuff' && i.status === 'vulnerable')).toBe(true);
  });
});
