import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../data/enemies';
import { RELICS } from '../data/relics';
import { endTurn, playCard, startCombat } from './combat';
import { chooseRelic, chooseReward, newRun, resolveCombat } from './run';
import type { RunState } from './types';

ENEMIES.t_idle = { id: 't_idle', name: 'Idle', maxHp: 500, pattern: [{ type: 'block', amount: 0 }] };
RELICS.t_turnBlock = { id: 't_turnBlock', name: 'T Turn', text: '',
  triggers: [{ on: 'turnStart', effects: [{ type: 'block', amount: 3 }] }] };

/** A fresh combat against an idle 500-HP enemy with the given relics. */
function fight(relics: string[]): RunState {
  const run = newRun(1);
  run.relics = relics;
  return startCombat(run, 't_idle');
}

/** Wins the current fight with one Strike and resolves it. */
function win(run: RunState): RunState {
  run.combat!.enemy.hp = 1;
  run.combat!.hand = [{ uid: 'w', defId: 'strike' }];
  return resolveCombat(playCard(run, 'w'));
}

describe('relic hooks', () => {
  it('combatStart: Whetstone, Iron Ring, Lantern', () => {
    const run = fight(['whetstone', 'ironRing', 'lantern']);
    expect(run.player.strength).toBe(1);
    expect(run.player.block).toBe(8);
    expect(run.combat!.energy).toBe(4);
  });

  it('turnStart fires from turn 2, not turn 1', () => {
    let run = fight(['t_turnBlock']);
    expect(run.player.block).toBe(0);
    run = endTurn(run);
    expect(run.player.block).toBe(3);
  });

  it('cardPlayed respects cardType (Spiked Glove only on attacks)', () => {
    let run = fight(['spikedGlove']);
    run.combat!.hand = [{ uid: 'd', defId: 'defend' }, { uid: 's', defId: 'strike' }];
    run = playCard(run, 'd');
    expect(run.combat!.enemy.hp).toBe(500);
    run = playCard(run, 's');
    expect(run.combat!.enemy.hp).toBe(500 - 6 - 1);
  });

  it('combatEnd: Ember Heart heals 6 after a win, capped at max', () => {
    let run = fight(['emberHeart']);
    run.player.hp = 40;
    run = win(run);
    expect(run.player.hp).toBe(46);
    run = fight(['emberHeart']);
    run.player.hp = run.player.maxHp - 2;
    expect(win(run).player.hp).toBe(run.player.maxHp);
  });
});

describe('relic floors', () => {
  it('no relic after floor 0', () => {
    expect(win(newRun(3)).phase).toBe('reward');
  });

  it('floor 1 offers 2 distinct unowned relics, deterministically', () => {
    const atFloor1 = () => { const r = newRun(3); r.floor = 1; r.relics = ['whetstone']; return win(r); };
    const run = atFloor1();
    expect(run.phase).toBe('relic');
    expect(run.relicOptions).toHaveLength(2);
    expect(new Set(run.relicOptions).size).toBe(2);
    expect(run.relicOptions).not.toContain('whetstone');
    expect(atFloor1().relicOptions).toEqual(run.relicOptions);
  });

  it('choosing a relic keeps it and moves on to the card reward', () => {
    let run = newRun(3);
    run.floor = 1;
    run = win(run);
    const pick = run.relicOptions[1];
    run = chooseRelic(run, pick);
    expect(run.relics).toEqual([pick]);
    expect(run.phase).toBe('reward');
    expect(run.rewardOptions).toHaveLength(3);
    run = chooseReward(run, null);
    expect(run.phase).toBe('combat');
    expect(run.relics).toEqual([pick]);
  });

  it('ignores a relic that was not offered', () => {
    let run = newRun(3);
    run.floor = 1;
    run = win(run);
    const notOffered = Object.keys(RELICS).find((id) => !run.relicOptions.includes(id))!;
    expect(chooseRelic(run, notOffered)).toBe(run);
  });

  it('skips the relic phase if fewer than 2 are left', () => {
    const run = newRun(3);
    run.floor = 3;
    run.relics = Object.keys(RELICS).slice(1);
    expect(win(run).phase).toBe('reward');
  });
});

