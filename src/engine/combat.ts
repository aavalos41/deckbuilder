import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { shuffle } from './rng';
import type { CardInstance, Combatant, Effect, EnemyState, Intent, RunState, StatusId, Statuses } from './types';

export const HAND_SIZE = 5;
export const MAX_HAND = 10;
export const BASE_ENERGY = 3;

export const VULNERABLE_MULT = 1.5;
export const WEAK_MULT = 0.75;

export function noStatuses(): Statuses {
  return { vulnerable: 0, weak: 0, poison: 0 };
}

// ---------- helpers ----------

/**
 * Attack damage after modifiers: strength → weak → vulnerable, rounded down once at the end.
 * Used for both player and enemy attacks, and for intent previews.
 */
export function attackDamage(base: number, attacker: Combatant, defender: Combatant): number {
  let dmg = base + attacker.strength;
  if (attacker.statuses.weak > 0) dmg *= WEAK_MULT;
  if (defender.statuses.vulnerable > 0) dmg *= VULNERABLE_MULT;
  return Math.max(0, Math.floor(dmg));
}

function dealDamage(target: Combatant, raw: number): number {
  const amount = Math.max(0, raw);
  const absorbed = Math.min(target.block, amount);
  target.block -= absorbed;
  const hpLoss = amount - absorbed;
  target.hp = Math.max(0, target.hp - hpLoss);
  return hpLoss;
}

/** Poison: lose HP equal to stacks (ignores block), then stacks drop by 1. Returns HP lost. */
function tickPoison(target: Combatant): number {
  const p = target.statuses.poison;
  if (p <= 0) return 0;
  const lost = Math.min(target.hp, p);
  target.hp -= lost;
  target.statuses.poison = p - 1;
  return lost;
}

function decrement(s: Statuses, id: StatusId): void {
  if (s[id] > 0) s[id]--;
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

export const STATUS_LABELS: Record<StatusId, string> = {
  vulnerable: 'Vulnerable',
  weak: 'Weak',
  poison: 'Poison',
};

/** Describes an intent. Pass attacker/defender to preview real attack damage (strength, weak, vulnerable). */
export function describeIntent(intent: Intent, attacker?: Combatant, defender?: Combatant): string {
  switch (intent.type) {
    case 'attack': {
      const dmg = attacker && defender ? attackDamage(intent.amount, attacker, defender) : intent.amount;
      return intent.times && intent.times > 1 ? `Attack ${dmg}×${intent.times}` : `Attack ${dmg}`;
    }
    case 'block':
      return `Block ${intent.amount}`;
    case 'buff':
      return `Strength +${intent.strength}`;
    case 'debuff':
      return `Apply ${STATUS_LABELS[intent.status]} ${intent.amount}`;
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
        const lost = dealDamage(c.enemy, attackDamage(effect.amount, run.player, c.enemy));
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
    case 'applyStatus': {
      const target = effect.target === 'enemy' ? c.enemy : run.player;
      target.statuses[effect.status] += effect.amount;
      const who = effect.target === 'enemy' ? ENEMIES[c.enemy.defId].name : 'You';
      c.log.push(`${who}: ${STATUS_LABELS[effect.status]} +${effect.amount}.`);
      break;
    }
    case 'multiplyStatus': {
      const target = effect.target === 'enemy' ? c.enemy : run.player;
      const before = target.statuses[effect.status];
      target.statuses[effect.status] = before * effect.factor;
      const who = effect.target === 'enemy' ? ENEMIES[c.enemy.defId].name : 'You';
      c.log.push(`${who}: ${STATUS_LABELS[effect.status]} ${before} → ${target.statuses[effect.status]}.`);
      break;
    }
    case 'removeStatus': {
      const target = effect.target === 'enemy' ? c.enemy : run.player;
      if (target.statuses[effect.status] > 0) {
        target.statuses[effect.status] = 0;
        const who = effect.target === 'enemy' ? ENEMIES[c.enemy.defId].name : 'You';
        c.log.push(`${who}: ${STATUS_LABELS[effect.status]} removed.`);
      }
      break;
    }
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
  run.player.statuses = noStatuses();
  run.combat = {
    turn: 1,
    energy: BASE_ENERGY,
    maxEnergy: BASE_ENERGY,
    drawPile,
    hand: [],
    discardPile: [],
    enemy: {
      defId: enemyId, hp: def.maxHp, maxHp: def.maxHp, block: 0, strength: 0,
      statuses: noStatuses(), patternIndex: 0,
    },
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
        const lost = dealDamage(run.player, attackDamage(intent.amount, e, run.player));
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
    case 'debuff':
      run.player.statuses[intent.status] += intent.amount;
      c.log.push(`${name} applies ${STATUS_LABELS[intent.status]} ${intent.amount}.`);
      break;
  }
  e.patternIndex++;
}

/**
 * Turn order:
 *   enemy turn: block expires → poison ticks → acts
 *   end of round: Vulnerable/Weak lose 1 stack on both sides, except stacks the enemy
 *     applied to the player this round (they skip their first tick, so "1" always lasts
 *     one turn where it matters)
 *   player turn: block expires → poison ticks → energy + draw
 */
export function endTurn(prev: RunState): RunState {
  const run = structuredClone(prev);
  const c = run.combat;
  if (!c || c.result !== 'ongoing') return prev;
  const p = run.player;
  const e = c.enemy;
  const name = ENEMIES[e.defId].name;

  // Discard hand
  c.discardPile.push(...c.hand);
  c.hand = [];

  // Enemy turn
  e.block = 0;
  const enemyPoison = tickPoison(e);
  if (enemyPoison > 0) c.log.push(`${name} loses ${enemyPoison} to poison.`);
  checkResult(run);
  if (c.result !== 'ongoing') return run;

  const hadVuln = p.statuses.vulnerable > 0;
  const hadWeak = p.statuses.weak > 0;
  enemyAct(run);
  checkResult(run);
  if (c.result !== 'ongoing') return run;

  // End of round
  decrement(e.statuses, 'vulnerable');
  decrement(e.statuses, 'weak');
  if (hadVuln) decrement(p.statuses, 'vulnerable');
  if (hadWeak) decrement(p.statuses, 'weak');

  // New player turn
  c.turn++;
  p.block = 0;
  const playerPoison = tickPoison(p);
  if (playerPoison > 0) c.log.push(`You lose ${playerPoison} to poison.`);
  checkResult(run);
  if (c.result !== 'ongoing') return run;

  c.energy = c.maxEnergy;
  drawCards(run, HAND_SIZE);
  return run;
}
