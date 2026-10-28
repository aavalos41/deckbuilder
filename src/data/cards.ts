import type { CardDef } from '../engine/types';

// Add new cards here. Effects are data, interpreted by engine/effects.ts.
export const CARDS: Record<string, CardDef> = {
  strike: {
    id: 'strike', name: 'Strike', cost: 1, type: 'attack', rarity: 'starter',
    text: 'Deal 6 damage.', effects: [{ type: 'damage', amount: 6 }],
  },
  defend: {
    id: 'defend', name: 'Defend', cost: 1, type: 'skill', rarity: 'starter',
    text: 'Gain 5 block.', effects: [{ type: 'block', amount: 5 }],
  },
  focus: {
    id: 'focus', name: 'Focus', cost: 0, type: 'skill', rarity: 'starter',
    text: 'Draw 2 cards.', effects: [{ type: 'draw', amount: 2 }],
  },
  bash: {
    id: 'bash', name: 'Bash', cost: 2, type: 'attack', rarity: 'common',
    text: 'Deal 12 damage.', effects: [{ type: 'damage', amount: 12 }],
  },
  twinStrike: {
    id: 'twinStrike', name: 'Twin Strike', cost: 1, type: 'attack', rarity: 'common',
    text: 'Deal 4 damage twice.', effects: [{ type: 'damage', amount: 4, times: 2 }],
  },
  guard: {
    id: 'guard', name: 'Guard', cost: 2, type: 'skill', rarity: 'common',
    text: 'Gain 11 block.', effects: [{ type: 'block', amount: 11 }],
  },
  quickSlash: {
    id: 'quickSlash', name: 'Quick Slash', cost: 1, type: 'attack', rarity: 'common',
    text: 'Deal 7 damage. Draw 1.', effects: [{ type: 'damage', amount: 7 }, { type: 'draw', amount: 1 }],
  },
  shrug: {
    id: 'shrug', name: 'Shrug', cost: 1, type: 'skill', rarity: 'common',
    text: 'Gain 7 block. Draw 1.', effects: [{ type: 'block', amount: 7 }, { type: 'draw', amount: 1 }],
  },
  flurry: {
    id: 'flurry', name: 'Flurry', cost: 2, type: 'attack', rarity: 'uncommon',
    text: 'Deal 3 damage 5 times.', effects: [{ type: 'damage', amount: 3, times: 5 }],
  },
  secondWind: {
    id: 'secondWind', name: 'Second Wind', cost: 1, type: 'skill', rarity: 'uncommon',
    text: 'Heal 4. Gain 4 block.', effects: [{ type: 'heal', amount: 4 }, { type: 'block', amount: 4 }],
  },
  surge: {
    id: 'surge', name: 'Surge', cost: 0, type: 'skill', rarity: 'uncommon',
    text: 'Gain 2 energy.', effects: [{ type: 'energy', amount: 2 }],
  },
  expose: {
    id: 'expose', name: 'Expose', cost: 1, type: 'skill', rarity: 'common',
    text: 'Apply 2 Vulnerable.',
    effects: [{ type: 'applyStatus', status: 'vulnerable', amount: 2, target: 'enemy' }],
  },
  cripple: {
    id: 'cripple', name: 'Cripple', cost: 1, type: 'attack', rarity: 'common',
    text: 'Deal 4 damage. Apply 1 Weak.',
    effects: [{ type: 'damage', amount: 4 }, { type: 'applyStatus', status: 'weak', amount: 1, target: 'enemy' }],
  },
  toxin: {
    id: 'toxin', name: 'Toxin', cost: 1, type: 'skill', rarity: 'common',
    text: 'Apply 4 Poison.',
    effects: [{ type: 'applyStatus', status: 'poison', amount: 4, target: 'enemy' }],
  },
  venomStrike: {
    id: 'venomStrike', name: 'Venom Strike', cost: 1, type: 'attack', rarity: 'uncommon',
    text: 'Deal 5 damage. Apply 2 Poison.',
    effects: [{ type: 'damage', amount: 5 }, { type: 'applyStatus', status: 'poison', amount: 2, target: 'enemy' }],
  },
  brace: {
    id: 'brace', name: 'Brace', cost: 1, type: 'skill', rarity: 'common',
    text: 'Gain 6 block. Remove your Weak.',
    effects: [{ type: 'block', amount: 6 }, { type: 'removeStatus', status: 'weak', target: 'self' }],
  },
  // Cost 2 / rare because there's no Exhaust yet, so it can be replayed every deck cycle.
  catalyst: {
    id: 'catalyst', name: 'Catalyst', cost: 2, type: 'skill', rarity: 'rare',
    text: "Double the enemy's Poison.",
    effects: [{ type: 'multiplyStatus', status: 'poison', factor: 2, target: 'enemy' }],
  },
  cleave: {
    id: 'cleave', name: 'Cleave', cost: 3, type: 'attack', rarity: 'rare',
    text: 'Deal 26 damage.', effects: [{ type: 'damage', amount: 26 }],
  },
};

export const STARTER_DECK: string[] = [
  'strike', 'strike', 'strike', 'strike', 'strike',
  'defend', 'defend', 'defend', 'defend',
  'focus',
];

export const REWARD_POOL: string[] = Object.values(CARDS)
  .filter((c) => c.rarity !== 'starter')
  .map((c) => c.id);
