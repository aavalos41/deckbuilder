import { describe, expect, it } from 'vitest';
import { CARDS, REWARD_POOL } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { LOADOUTS } from '../data/loadouts';
import { RELICS } from '../data/relics';
import { endTurn, noStatuses, playCard, startCombat } from './combat';
import { buildRunLoadout, chooseReward, newRun, resolveCombat } from './run';
import { loadRun, saveRun } from './save';
import type { RunState } from './types';

ENEMIES.t_wall = { id: 't_wall', name: 'Wall', maxHp: 100000, pattern: [{ type: 'block', amount: 0 }] };
ENEMIES.t_hitter = { id: 't_hitter', name: 'Hitter', maxHp: 500, pattern: [{ type: 'attack', amount: 1 }] };
// Fixture lever: a third kind, pure data.
LOADOUTS.t_people = {
  id: 't_people', kind: 't_people', name: 'People', description: '',
  starterCards: ['bash'], cardPool: ['t_peopleCard'], passive: 'whetstone',
};
CARDS.t_peopleCard = {
  id: 't_peopleCard', name: 'People Card', cost: 1, type: 'skill', rarity: 'common', text: '', effects: [],
};

const count = (ids: string[], id: string) => ids.filter((x) => x === id).length;
const allPool = (p: ReturnType<typeof buildRunLoadout>['pool']) => [...p.common, ...p.uncommon, ...p.rare];

describe('buildRunLoadout', () => {
  it('starter deck = class cards + patron cards', () => {
    const shaman = buildRunLoadout(['shaman', 'eagle']);
    expect(shaman.deck).toHaveLength(10);
    expect(count(shaman.deck, 'tap')).toBe(5);
    expect(count(shaman.deck, 'ward')).toBe(4);
    expect(count(shaman.deck, 'commune')).toBe(1);
    expect(buildRunLoadout(['warrior', 'jaguar']).deck).toEqual(LOADOUTS.warrior.starterCards);
  });

  it('pool = neutral ∪ chosen sources, nothing from unchosen ones', () => {
    const pool = allPool(buildRunLoadout(['shaman', 'jaguar']).pool);
    for (const id of allPool(REWARD_POOL)) expect(pool).toContain(id);
    for (const id of ['mend', 'bloodPact', 'huntsFavor', 'pounce']) expect(pool).toContain(id);
    for (const id of ['sharpEye', 'dive']) expect(pool).not.toContain(id);
    expect(new Set(pool).size).toBe(pool.length);
  });

  it('neutral pool holds no source-only cards', () => {
    for (const id of ['mend', 'lash', 'huntsFavor', 'sharpEye', 'dive', 'pounce']) {
      expect(allPool(REWARD_POOL)).not.toContain(id);
    }
  });

  it('rejects missing or doubled kinds', () => {
    expect(() => buildRunLoadout(['warrior'])).toThrow();
    expect(() => buildRunLoadout(['warrior', 'shaman', 'eagle'])).toThrow();
    expect(() => buildRunLoadout(['warrior', 'nope'])).toThrow();
  });

  it('a third kind works as data only', () => {
    const kinds = ['class', 'patron', 't_people'];
    const l = buildRunLoadout(['warrior', 'eagle', 't_people'], kinds);
    expect(l.deck).toHaveLength(11);
    expect(l.deck).toContain('bash');
    expect(allPool(l.pool)).toContain('t_peopleCard');
    expect(l.relics).toEqual(['eagleSpirit', 'whetstone']);
    expect(() => buildRunLoadout(['warrior', 'eagle'], kinds)).toThrow();
  });
});

describe('runs with a loadout', () => {
  it('starts with the passive relic and stores the chosen sources', () => {
    const run = newRun(1, ['shaman', 'jaguar']);
    expect(run.relics).toEqual(['jaguarSpirit']);
    expect(run.loadout).toEqual(['shaman', 'jaguar']);
    expect(run.deck.map((c) => c.defId).sort()).toEqual([...LOADOUTS.shaman.starterCards].sort());
    expect(run.combat!.chance.dodge).toBe(10);
  });

  it('card rewards stay inside the merged pool', () => {
    const pool = allPool(buildRunLoadout(['shaman', 'eagle']).pool);
    for (let seed = 0; seed < 100; seed++) {
      const run = newRun(seed, ['shaman', 'eagle']);
      run.combat!.enemy.hp = 1;
      run.combat!.hand = [{ uid: 'w', defId: 'strike' }];
      const after = resolveCombat(playCard(run, 'w'));
      expect(after.phase).toBe('reward');
      for (const id of after.rewardOptions) expect(pool).toContain(id);
      expect(chooseReward(after, after.rewardOptions[0]).deck).toHaveLength(11);
    }
  });

  it('save/load keeps the chosen sources', () => {
    const store: Record<string, string> = {};
    globalThis.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    } as Storage;
    const run = newRun(4, ['shaman', 'eagle']);
    saveRun(run);
    expect(loadRun()?.loadout).toEqual(['shaman', 'eagle']);
    expect(loadRun()?.relics).toEqual(['eagleSpirit']);
  });
});

function fight(sources: string[], enemy: string): RunState {
  const run = startCombat(newRun(1, sources), enemy);
  run.combat!.energy = 99;
  return run;
}

describe('dodge and crit', () => {
  it('Jaguar dodges roughly 10% of enemy hits', () => {
    let run = fight(['warrior', 'jaguar'], 't_hitter');
    run.player.hp = run.player.maxHp = 100000;
    let dodges = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      run.combat!.hand = [];
      const before = run.player.hp;
      run = endTurn(run);
      if (run.player.hp === before) dodges++;
    }
    expect(dodges / N).toBeGreaterThan(0.07);
    expect(dodges / N).toBeLessThan(0.13);
  });

  it('Eagle crits roughly 10% of hits for +50% damage', () => {
    let run = fight(['warrior', 'eagle'], 't_wall');
    const hits: number[] = [];
    for (let i = 0; i < 2000; i++) {
      run.combat!.hand = [{ uid: `s${i}`, defId: 'strike' }];
      run.combat!.energy = 1;
      const before = run.combat!.enemy.hp;
      run = playCard(run, `s${i}`);
      hits.push(before - run.combat!.enemy.hp);
    }
    expect(new Set(hits)).toEqual(new Set([6, 9]));
    const rate = hits.filter((h) => h === 9).length / hits.length;
    expect(rate).toBeGreaterThan(0.07);
    expect(rate).toBeLessThan(0.13);
  });

  it('no passive: no dodges, no crits, no extra randomness', () => {
    const run = fight(['warrior', 'jaguar'], 't_wall');
    run.relics = [];
    const fresh = startCombat(run, 't_wall');
    expect(fresh.combat!.chance).toEqual({ dodge: 0, crit: 0 });
    fresh.combat!.hand = [{ uid: 's', defId: 'strike' }];
    const after = playCard(fresh, 's');
    expect(after.rngState).toBe(fresh.rngState);
    expect(fresh.combat!.enemy.hp - after.combat!.enemy.hp).toBe(6);
  });

  it("Hunt's Favor: 50% dodge through the enemy turn, gone on your next turn, exhausted", () => {
    let run = fight(['warrior', 'jaguar'], 't_hitter');
    run.player.hp = run.player.maxHp = 100000;
    let dodges = 0;
    const N = 1000;
    for (let i = 0; i < N; i++) {
      run.combat!.hand = [{ uid: `h${i}`, defId: 'huntsFavor' }];
      run = playCard(run, `h${i}`);
      expect(run.combat!.turnChance.dodge).toBe(50);
      const before = run.player.hp;
      run.combat!.hand = [];
      run = endTurn(run);
      expect(run.combat!.turnChance.dodge).toBe(0);
      if (run.player.hp === before) dodges++;
    }
    expect(dodges / N).toBeGreaterThan(0.44);
    expect(dodges / N).toBeLessThan(0.56);
    expect(run.combat!.exile).toHaveLength(N);
  });

  it('Sharp Eye: 50% crits this turn', () => {
    let run = fight(['warrior', 'eagle'], 't_wall');
    run.combat!.hand = [{ uid: 'e', defId: 'sharpEye' }];
    run = playCard(run, 'e');
    let crits = 0;
    for (let i = 0; i < 1000; i++) {
      run.combat!.hand = [{ uid: `s${i}`, defId: 'strike' }];
      run.combat!.energy = 1;
      const before = run.combat!.enemy.hp;
      run = playCard(run, `s${i}`);
      if (before - run.combat!.enemy.hp === 9) crits++;
    }
    expect(crits / 1000).toBeGreaterThan(0.44);
    expect(crits / 1000).toBeLessThan(0.56);
  });
});

describe('Shaman cards', () => {
  function shaman(hand: string[]): RunState {
    const run = newRun(1, ['shaman', 'jaguar']);
    run.relics = [];
    const r = startCombat(run, 't_wall');
    r.combat!.enemy = { defId: 't_wall', hp: 500, maxHp: 500, block: 0, strength: 0, statuses: noStatuses(), patternIndex: 0 };
    r.combat!.energy = 10;
    r.player.hp = 30;
    r.combat!.hand = hand.map((defId, i) => ({ uid: `h${i}`, defId }));
    return r;
  }

  it('Blood Pact heals for the HP the enemy actually lost', () => {
    let run = shaman(['bloodPact']);
    run.combat!.enemy.block = 4;
    run = playCard(run, 'h0');
    expect(run.combat!.enemy.hp).toBe(494);
    expect(run.player.hp).toBe(36);
  });

  it('Cleansing Smoke removes Vulnerable, Weak and Poison and heals 2', () => {
    let run = shaman(['cleansingSmoke']);
    run.player.statuses = { ...noStatuses(), vulnerable: 2, weak: 1, poison: 5 };
    run = playCard(run, 'h0');
    expect(run.player.statuses).toEqual(noStatuses());
    expect(run.player.hp).toBe(32);
  });

  it('Tap deals 4 and heals 2', () => {
    const run = playCard(shaman(['tap']), 'h0');
    expect(run.combat!.enemy.hp).toBe(496);
    expect(run.player.hp).toBe(32);
  });
});

// Every card a loadout references must exist, and every passive must be a relic.
describe('loadout data', () => {
  it('references only real cards and relics', () => {
    for (const l of Object.values(LOADOUTS)) {
      for (const id of [...l.starterCards, ...l.cardPool]) expect(CARDS[id], `${l.id}: ${id}`).toBeDefined();
      if (l.passive) expect(RELICS[l.passive], `${l.id}: ${l.passive}`).toBeDefined();
    }
  });
});
