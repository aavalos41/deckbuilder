import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { weightedIndex } from './rng';
import { REWARD_POOL } from '../data/cards';
import { rollRewards } from './run';

describe('weightedIndex', () => {
  it('never picks a zero-weight option', () => {
    let s = 7;
    for (let n = 0; n < 500; n++) {
      let i: number;
      [i, s] = weightedIndex([0, 1, 0], s);
      expect(i).toBe(1);
    }
  });
});

describe('rollRewards', () => {
  it('follows rarity weights roughly 60/30/10 over 1,000 seeded offers', () => {
    const counts = { common: 0, uncommon: 0, rare: 0 } as Record<string, number>;
    let s = 12345;
    for (let n = 0; n < 1000; n++) {
      let offer: string[];
      [offer, s] = rollRewards(s, REWARD_POOL);
      expect(offer).toHaveLength(3);
      expect(new Set(offer).size).toBe(3);
      for (const id of offer) counts[CARDS[id].rarity]++;
    }
    const total = 3000;
    expect(counts.rare / total).toBeGreaterThan(0.07);
    expect(counts.rare / total).toBeLessThan(0.13);
    expect(counts.common / total).toBeGreaterThan(0.5);
    expect(counts.starter ?? 0).toBe(0);
  });

  it('is deterministic for a given seed', () => {
    expect(rollRewards(99, REWARD_POOL)).toEqual(rollRewards(99, REWARD_POOL));
  });

  it('falls back when a rarity runs out', () => {
    // Asking for every reward card at once forces fallbacks; all must appear exactly once.
    const all = [...REWARD_POOL.common, ...REWARD_POOL.uncommon, ...REWARD_POOL.rare];
    const [offer] = rollRewards(5, REWARD_POOL, all.length);
    expect(offer).toHaveLength(all.length);
    expect(new Set(offer)).toEqual(new Set(all));
  });
});
