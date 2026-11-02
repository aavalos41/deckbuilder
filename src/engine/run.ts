import { RARITY_WEIGHTS, REWARD_POOL, STARTER_DECK, type RewardRarity } from '../data/cards';
import { BOSS_ID, ENCOUNTER_TIERS } from '../data/enemies';
import { RELIC_CHOICES, RELIC_FLOORS, RELICS } from '../data/relics';
import { fireRelics, noStatuses, startCombat } from './combat';
import { randomInt, shuffle, weightedIndex } from './rng';
import type { RunState } from './types';

export const PLAYER_MAX_HP = 70;
export const REWARD_CHOICES = 3;

export function newRun(seed: number): RunState {
  let rng = seed;
  const encounters: string[] = [];
  for (const tier of ENCOUNTER_TIERS) {
    let i: number;
    [i, rng] = randomInt(rng, tier.length);
    encounters.push(tier[i]);
  }
  encounters.push(BOSS_ID);

  const deck = STARTER_DECK.map((defId, i) => ({ uid: `c${i}`, defId }));
  const run: RunState = {
    version: 4,
    seed,
    rngState: rng,
    floor: 0,
    encounters,
    player: { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP, block: 0, strength: 0, statuses: noStatuses() },
    deck,
    nextUid: deck.length,
    phase: 'combat',
    combat: null,
    rewardOptions: [],
    relics: [],
    relicOptions: [],
  };
  return startCombat(run, encounters[0]);
}

/**
 * Rolls `count` distinct reward cards. Each slot rolls a rarity by RARITY_WEIGHTS, then a random card
 * of that rarity not already offered. If that rarity is used up, falls back to the most common one left.
 */
export function rollRewards(seed: number, count = REWARD_CHOICES): [string[], number] {
  let rng = seed;
  const rarities = (Object.keys(RARITY_WEIGHTS) as RewardRarity[])
    .sort((a, b) => RARITY_WEIGHTS[b] - RARITY_WEIGHTS[a]);
  const left: Record<RewardRarity, string[]> = {
    common: [...REWARD_POOL.common], uncommon: [...REWARD_POOL.uncommon], rare: [...REWARD_POOL.rare],
  };
  const picks: string[] = [];
  while (picks.length < count) {
    let r: number;
    [r, rng] = weightedIndex(rarities.map((k) => RARITY_WEIGHTS[k]), rng);
    const rarity = [rarities[r], ...rarities.filter((_, i) => i !== r)].find((k) => left[k].length > 0);
    if (!rarity) break; // pool exhausted
    let i: number;
    [i, rng] = randomInt(rng, left[rarity].length);
    picks.push(left[rarity].splice(i, 1)[0]);
  }
  return [picks, rng];
}

/** Call after combat.result changes. Moves the run to reward / victory / defeat. */
export function resolveCombat(prev: RunState): RunState {
  const c = prev.combat;
  if (!c || c.result === 'ongoing') return prev;
  const run = structuredClone(prev);

  if (c.result === 'lost') {
    run.phase = 'defeat';
    return run;
  }
  fireRelics(run, 'combatEnd');
  if (run.floor >= run.encounters.length - 1) {
    run.phase = 'victory';
    return run;
  }
  [run.rewardOptions, run.rngState] = rollRewards(run.rngState);
  run.phase = 'reward';
  if (RELIC_FLOORS.includes(run.floor)) {
    const unowned = Object.keys(RELICS).filter((id) => !run.relics.includes(id));
    if (unowned.length >= RELIC_CHOICES) {
      const [shuffled, rng] = shuffle(unowned, run.rngState);
      run.rngState = rng;
      run.relicOptions = shuffled.slice(0, RELIC_CHOICES);
      run.phase = 'relic';
    }
  }
  return run;
}

/** Take one of the offered relics, then go on to the card reward. */
export function chooseRelic(prev: RunState, relicId: string): RunState {
  if (prev.phase !== 'relic' || !prev.relicOptions.includes(relicId)) return prev;
  const run = structuredClone(prev);
  run.relics.push(relicId);
  run.relicOptions = [];
  run.phase = 'reward';
  return run;
}

/** Pick a reward card (or null to skip) and start the next fight. */
export function chooseReward(prev: RunState, defId: string | null): RunState {
  if (prev.phase !== 'reward') return prev;
  const run = structuredClone(prev);
  if (defId && run.rewardOptions.includes(defId)) {
    run.deck.push({ uid: `c${run.nextUid++}`, defId });
  }
  run.rewardOptions = [];
  run.floor++;
  run.phase = 'combat';
  return startCombat(run, run.encounters[run.floor]);
}
