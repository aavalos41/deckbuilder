// All game state is plain JSON-serialisable data. No classes, no functions.

export type StatusId = 'vulnerable' | 'weak' | 'poison';
export type Statuses = Record<StatusId, number>;

export type Effect =
  | { type: 'damage'; amount: number; times?: number }
  | { type: 'block'; amount: number }
  | { type: 'draw'; amount: number }
  | { type: 'energy'; amount: number }
  | { type: 'heal'; amount: number }
  | { type: 'applyStatus'; status: StatusId; amount: number; target: 'enemy' | 'self' };

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
  enemy: EnemyState;
  log: string[];
  result: 'ongoing' | 'won' | 'lost';
}

export type RunPhase = 'combat' | 'reward' | 'victory' | 'defeat';

export interface RunState {
  version: 2;
  seed: number;
  rngState: number;
  floor: number; // 0-based index into the run's encounter list
  encounters: string[]; // enemy def ids
  player: Combatant;
  deck: CardInstance[];
  nextUid: number;
  phase: RunPhase;
  combat: CombatState | null;
  rewardOptions: string[]; // card def ids
}
