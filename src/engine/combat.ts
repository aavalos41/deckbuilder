import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { shuffle } from './rng';
import type { CardInstance, Combatant, Effect, EnemyState, Intent, RunState } from './types';

export const HAND_SIZE = 5;
export const MAX_HAND = 10;
export const BASE_ENERGY = 3;

// ---------- helpers ----------

function dealDamage(target: Combatant, raw: number): number {
  const amount = Math.max(0, raw);
  const absorbed = Math.min(target.block, amount);
  target.block -= absorbed;
  const hpLoss = amount - absorbed;
  target.hp = Math.max(0, target.hp - hpLoss);
  return hpLoss;
}

/** Draws n cards, reshuffling the discard pile into the draw pile when needed. Mutates `run`. */
function drawCards(run: RunState, n: number): void {
  const c = run.combat!;
  for (let i = 0; i < n; i++) {
    if (c.hand.length >= MAX_HAND) return;
    if (c.drawPile.length === 0) {
      if (c.discardPile.length === 0) return;
      [c.drawPile, run.rngState] = shuffle(c.discardPile, run.rngState);
      c.discardPile = [];
      c.log.push('Shuffled discard into draw pile.');
    }
    c.hand.push(c.drawPile.shift()!);
  }
}

export function currentIntent(enemy: EnemyState): Intent {
  const def = ENEMIES[enemy.defId];
  return def.pattern[enemy.patternIndex % def.pattern.length];
}

export function describeIntent(intent: Intent, strength = 0): string {
  switch (intent.type) {
    case 'attack': {
      const dmg = intent.amount + strength;
      return intent.times && intent.times > 1 ? `Attack ${dmg}×${intent.times}` : `Attack ${dmg}`;
    }
    case 'block':
      return `Block ${intent.amount}`;
    case 'buff':
      return `Strength +${intent.strength}`;
  }
}

function checkResult(run: RunState): void {
  const c = run.combat!;
  if (c.enemy.hp <= 0) c.result = 'won';
  else if (run.player.hp <= 0) c.result = 'lost';
}

// ---------- effects ----------

function applyEffect(run: RunState, effect: Effect): void {
  const c = run.combat!;
  switch (effect.type) {
    case 'damage': {
      const times = effect.times ?? 1;
      for (let i = 0; i < times && c.enemy.hp > 0; i++) {
        const lost = dealDamage(c.enemy, effect.amount + run.player.strength);
        c.log.push(`You hit for ${lost}.`);
      }
      break;
    }
    case 'block':
      run.player.block += effect.amount;
      break;
    case 'draw':
      drawCards(run, effect.amount);
      break;
    case 'energy':
      c.energy += effect.amount;
      break;
    case 'heal':
      run.player.hp = Math.min(run.player.maxHp, run.player.hp + effect.amount);
      break;
  }
}

// ---------- public API (all pure: return a new RunState) ----------

export function startCombat(prev: RunState, enemyId: string): RunState {
  const run = structuredClone(prev);
  const def = ENEMIES[enemyId];
  const [drawPile, rng] = shuffle(run.deck, run.rngState);
  run.rngState = rng;
  run.player.block = 0;
  run.player.strength = 0;
  run.combat = {
    turn: 1,
    energy: BASE_ENERGY,
    maxEnergy: BASE_ENERGY,
    drawPile,
    hand: [],
    discardPile: [],
    enemy: { defId: enemyId, hp: def.maxHp, maxHp: def.maxHp, block: 0, strength: 0, patternIndex: 0 },
    log: [`A ${def.name} appears!`],
    result: 'ongoing',
  };
  drawCards(run, HAND_SIZE);
  return run;
}

export function canPlay(run: RunState, card: CardInstance): boolean {
  const c = run.combat;
  if (!c || c.result !== 'ongoing') return false;
  return CARDS[card.defId].cost <= c.energy;
}

export function playCard(prev: RunState, uid: string): RunState {
  const run = structuredClone(prev);
  const c = run.combat;
  if (!c || c.result !== 'ongoing') return prev;
  const idx = c.hand.findIndex((h) => h.uid === uid);
  if (idx === -1) return prev;
  const card = c.hand[idx];
  const def = CARDS[card.defId];
  if (def.cost > c.energy) return prev;

  c.energy -= def.cost;
  c.hand.splice(idx, 1);
  c.log.push(`Played ${def.name}.`);
  for (const effect of def.effects) {
    applyEffect(run, effect);
    if (c.enemy.hp <= 0) break;
  }
  c.discardPile.push(card);
  checkResult(run);
  return run;
}

function enemyAct(run: RunState): void {
  const c = run.combat!;
  const e = c.enemy;
  const name = ENEMIES[e.defId].name;
  const intent = currentIntent(e);
  switch (intent.type) {
    case 'attack': {
      const times = intent.times ?? 1;
      for (let i = 0; i < times && run.player.hp > 0; i++) {
        const lost = dealDamage(run.player, intent.amount + e.strength);
        c.log.push(`${name} hits you for ${lost}.`);
      }
      break;
    }
    case 'block':
      e.block += intent.amount;
      c.log.push(`${name} gains ${intent.amount} block.`);
      break;
    case 'buff':
      e.strength += intent.strength;
      c.log.push(`${name} gains ${intent.strength} strength.`);
      break;
  }
  e.patternIndex++;
}

export function endTurn(prev: RunState): RunState {
  const run = structuredClone(prev);
  const c = run.combat;
  if (!c || c.result !== 'ongoing') return prev;

  // Discard hand
  c.discardPile.push(...c.hand);
  c.hand = [];

  // Enemy turn: their block expires, then they act
  c.enemy.block = 0;
  enemyAct(run);
  checkResult(run);
  if (c.result !== 'ongoing') return run;

  // New player turn
  c.turn++;
  run.player.block = 0;
  c.energy = c.maxEnergy;
  drawCards(run, HAND_SIZE);
  return run;
}
