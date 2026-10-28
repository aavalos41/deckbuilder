import type { EnemyDef } from '../engine/types';

export const ENEMIES: Record<string, EnemyDef> = {
  slime: {
    id: 'slime', name: 'Slime', maxHp: 24,
    pattern: [{ type: 'attack', amount: 6 }, { type: 'block', amount: 5 }, { type: 'attack', amount: 8 }],
  },
  rat: {
    id: 'rat', name: 'Sewer Rat', maxHp: 20,
    pattern: [{ type: 'attack', amount: 3, times: 2 }, { type: 'attack', amount: 5 }],
  },
  cultist: {
    id: 'cultist', name: 'Cultist', maxHp: 34,
    pattern: [{ type: 'buff', strength: 2 }, { type: 'attack', amount: 6 }, { type: 'attack', amount: 6 }],
  },
  knight: {
    id: 'knight', name: 'Rusted Knight', maxHp: 42,
    pattern: [{ type: 'block', amount: 10 }, { type: 'attack', amount: 12 }, { type: 'attack', amount: 5, times: 2 }],
  },
  wraith: {
    id: 'wraith', name: 'Wraith', maxHp: 38,
    pattern: [{ type: 'attack', amount: 4, times: 3 }, { type: 'buff', strength: 1 }, { type: 'attack', amount: 10 }],
  },
  toad: {
    id: 'toad', name: 'Spore Toad', maxHp: 26,
    pattern: [{ type: 'attack', amount: 5 }, { type: 'debuff', status: 'weak', amount: 2 }, { type: 'attack', amount: 9 }],
  },
  archer: {
    id: 'archer', name: 'Hex Archer', maxHp: 36,
    pattern: [
      { type: 'debuff', status: 'vulnerable', amount: 2 },
      { type: 'attack', amount: 8 },
      { type: 'attack', amount: 4, times: 2 },
    ],
  },
  boss: {
    id: 'boss', name: 'The Gatekeeper', maxHp: 90, boss: true,
    pattern: [
      { type: 'attack', amount: 10 },
      { type: 'block', amount: 15 },
      { type: 'buff', strength: 3 },
      { type: 'attack', amount: 6, times: 3 },
    ],
  },
};

/** Normal fights are drawn from these tiers in order; the last fight is always the boss. */
export const ENCOUNTER_TIERS: string[][] = [
  ['slime', 'rat', 'toad'],
  ['slime', 'rat', 'toad'],
  ['cultist', 'knight', 'wraith', 'archer'],
  ['cultist', 'knight', 'wraith', 'archer'],
  ['cultist', 'knight', 'wraith', 'archer'],
];
export const BOSS_ID = 'boss';
