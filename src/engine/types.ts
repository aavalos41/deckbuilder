// All game state is plain JSON-serialisable data. No classes, no functions.

/** strengthDown: lose this much Strength at the end of your turn (temporary Strength, e.g. Flex). */
export type StatusId = 'vulnerable' | 'weak' | 'poison' | 'strengthDown';
export type Statuses = Record<StatusId, number>;

/** Percent chances on the player: dodge an enemy hit, or crit (+50%) on your hits. */
export type ChanceStat = 'dodge' | 'crit';

export type Effect =
  /** `lifesteal`: heal for the HP the enemy actually lost (after block). */
  | { type: 'damage'; amount: number; times?: number; lifesteal?: boolean }
  | { type: 'block'; amount: number }
  | { type: 'draw'; amount: number }
  | { type: 'energy'; amount: number }
  | { type: 'heal'; amount: number }
  /** Gain Strength for this combat. `temporary`: lose it again at the end of this turn. */
  | { type: 'gainStrength'; amount: number; temporary?: boolean }
  | { type: 'applyStatus'; status: StatusId; amount: number; target: 'enemy' | 'self' }
  /** Multiply existing stacks (e.g. factor 2 doubles Poison). No effect at 0 stacks. */
  | { type: 'multiplyStatus'; status: StatusId; factor: number; target: 'enemy' | 'self' }
  /** Remove all stacks of a status. */
  | { type: 'removeStatus'; status: StatusId; target: 'enemy' | 'self' }
  /** Add percentage points to a chance stat for the rest of this combat (e.g. patron passives). */
  | { type: 'gainChance'; stat: ChanceStat; amount: number }
  /** The chance stat is at least `chance`% until the start of your next turn. */
  | { type: 'chanceThisTurn'; stat: ChanceStat; chance: number };

export type CardType = 'attack' | 'skill';
export type Rarity = 'starter' | 'common' | 'uncommon' | 'rare';

export interface CardDef {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  rarity: Rarity;
  text: string;
  effects: Effect[];
  /** Exhaust: when played, goes to the exile pile for the rest of this combat instead of discard. */
  exhaust?: boolean;
}

/** A card instance in a deck. `uid` is unique per copy so duplicates can be tracked. */
export interface CardInstance {
  uid: string;
  defId: string;
}

export type Intent =
  | { type: 'attack'; amount: number; times?: number }
  | { type: 'block'; amount: number }
  | { type: 'buff'; strength: number }
  | { type: 'debuff'; status: StatusId; amount: number };

export type RelicHook = 'combatStart' | 'turnStart' | 'cardPlayed' | 'combatEnd';

export interface RelicTrigger {
  on: RelicHook;
  /** cardPlayed only: limit to this card type. */
  cardType?: CardType;
  effects: Effect[];
}

export interface RelicDef {
  id: string;
  name: string;
  text: string;
  triggers: RelicTrigger[];
}

/**
 * One lever of a run's loadout (a Class, a Patron, ...). The run merges one source per required kind
 * (LOADOUT_KINDS in data/loadouts.ts): starter cards are concatenated, card pools unioned with the
 * neutral REWARD_POOL, passive relics granted at the start.
 */
export interface LoadoutSource {
  id: string;
  /** Which lever this fills, e.g. 'class' or 'patron'. Any string listed in LOADOUT_KINDS works. */
  kind: string;
  name: string;
  description: string;
  starterCards: string[];
  /** Reward-eligible card ids only this source unlocks. */
  cardPool: string[];
  /** Relic id granted at run start. Never offered as a relic reward. */
  passive?: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  maxHp: number;
  /** Intents cycle in order. Keep it simple and readable for now. */
  pattern: Intent[];
  boss?: boolean;
}

export interface Combatant {
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  statuses: Statuses;
}

export interface EnemyState extends Combatant {
  defId: string;
  patternIndex: number;
}

export interface CombatState {
  turn: number;
  energy: number;
  maxEnergy: number;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  /** Exhausted cards. Never reshuffled; empty at the start of each combat. */
  exile: CardInstance[];
  /** Player chance stats (percent) for this combat, from passives. */
  chance: Record<ChanceStat, number>;
  /** Player chance floors (percent) until the start of your next turn. */
  turnChance: Record<ChanceStat, number>;
  enemy: EnemyState;
  log: string[];
  result: 'ongoing' | 'won' | 'lost';
}

export type RunPhase = 'combat' | 'relic' | 'reward' | 'victory' | 'defeat';

export interface RunState {
  version: 6;
  seed: number;
  /** Chosen LoadoutSource ids, one per kind. */
  loadout: string[];
  rngState: number;
  floor: number; // 0-based index into the run's encounter list
  encounters: string[]; // enemy def ids
  player: Combatant;
  deck: CardInstance[];
  nextUid: number;
  phase: RunPhase;
  combat: CombatState | null;
  rewardOptions: string[]; // card def ids
  relics: string[]; // relic def ids, in pickup order
  relicOptions: string[]; // relic def ids offered on a relic floor
}
