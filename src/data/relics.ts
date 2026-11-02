import type { RelicDef } from '../engine/types';

// Add new relics here. Triggers reuse card Effects, fired by fireRelics in engine/combat.ts.
export const RELICS: Record<string, RelicDef> = {
  whetstone: {
    id: 'whetstone', name: 'Whetstone', text: 'Start of combat: gain 1 Strength.',
    triggers: [{ on: 'combatStart', effects: [{ type: 'gainStrength', amount: 1 }] }],
  },
  ironRing: {
    id: 'ironRing', name: 'Iron Ring', text: 'Start of combat: gain 8 block.',
    triggers: [{ on: 'combatStart', effects: [{ type: 'block', amount: 8 }] }],
  },
  lantern: {
    id: 'lantern', name: 'Lantern', text: 'Start of combat: gain 1 energy.',
    triggers: [{ on: 'combatStart', effects: [{ type: 'energy', amount: 1 }] }],
  },
  emberHeart: {
    id: 'emberHeart', name: 'Ember Heart', text: 'After winning a combat: heal 6.',
    triggers: [{ on: 'combatEnd', effects: [{ type: 'heal', amount: 6 }] }],
  },
  // A real hit, so Strength/Weak/Vulnerable apply. Watch it with Inflame.
  spikedGlove: {
    id: 'spikedGlove', name: 'Spiked Glove', text: 'When you play an attack, deal 1 damage.',
    triggers: [{ on: 'cardPlayed', cardType: 'attack', effects: [{ type: 'damage', amount: 1 }] }],
  },
};

/** Floors (0-based) after which you pick 1 of RELIC_CHOICES relics. Temporary until the map exists. */
export const RELIC_FLOORS: number[] = [1, 3];
export const RELIC_CHOICES = 2;
