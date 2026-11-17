import type { LoadoutSource } from '../engine/types';

/**
 * The levers a run is built from, in picker order. Each run picks exactly one source per kind.
 * Adding a lever (e.g. People) = add a kind here + sources below; no engine change.
 */
export const LOADOUT_KINDS: { id: string; label: string }[] = [
  { id: 'class', label: 'Class' },
  { id: 'patron', label: 'Patron' },
];

// Add new loadout sources here. Card ids live in cards.ts, passive relic ids in relics.ts.
export const LOADOUTS: Record<string, LoadoutSource> = {
  warrior: {
    id: 'warrior', kind: 'class', name: 'Warrior',
    description: 'Strike, Defend, Focus. Straightforward damage and block.',
    starterCards: [
      'strike', 'strike', 'strike', 'strike', 'strike',
      'defend', 'defend', 'defend', 'defend',
      'focus',
    ],
    cardPool: [],
  },
  shaman: {
    id: 'shaman', kind: 'class', name: 'Shaman',
    description: 'Attacks that heal. Outlast the enemy and cleanse what it puts on you.',
    starterCards: [
      'tap', 'tap', 'tap', 'tap', 'tap',
      'ward', 'ward', 'ward', 'ward',
      'commune',
    ],
    cardPool: ['mend', 'lash', 'spiritDrain', 'cleansingSmoke', 'bloodPact'],
  },
  jaguar: {
    id: 'jaguar', kind: 'patron', name: 'Jaguar',
    description: 'Passive: 10% chance to dodge each enemy hit.',
    starterCards: [],
    cardPool: ['huntsFavor', 'pounce'],
    passive: 'jaguarSpirit',
  },
  eagle: {
    id: 'eagle', kind: 'patron', name: 'Eagle',
    description: 'Passive: 10% chance for your hits to crit for +50% damage.',
    starterCards: [],
    cardPool: ['sharpEye', 'dive'],
    passive: 'eagleSpirit',
  },
};

/** First source of each kind, used when no choice is given (tests, quick start). */
export const DEFAULT_LOADOUT: string[] = LOADOUT_KINDS.map(
  (k) => Object.values(LOADOUTS).find((l) => l.kind === k.id)!.id,
);
