import { useState } from 'react';
import type { Combatant } from '../engine/types';

type ChipId = 'strength' | 'vulnerable' | 'weak' | 'poison';

const CHIPS: { id: ChipId; label: string; kind: 'buff' | 'debuff'; explain: (n: number) => string }[] = [
  { id: 'strength', label: 'Str', kind: 'buff', explain: (n) => `Strength ${n}: attacks deal ${n} more damage.` },
  { id: 'vulnerable', label: 'Vuln', kind: 'debuff', explain: (n) => `Vulnerable ${n}: takes 50% more attack damage for ${n} more turn${n === 1 ? '' : 's'}.` },
  { id: 'weak', label: 'Weak', kind: 'debuff', explain: (n) => `Weak ${n}: deals 25% less attack damage for ${n} more turn${n === 1 ? '' : 's'}.` },
  { id: 'poison', label: 'Poison', kind: 'debuff', explain: (n) => `Poison ${n}: loses ${n} HP at the start of its turn (ignores block), then Poison drops by 1.` },
];

function value(who: Combatant, id: ChipId): number {
  return id === 'strength' ? who.strength : who.statuses[id];
}

/** Status chips under an HP bar. Tap a chip to show/hide a one-line explanation. */
export function Statuses({ who }: { who: Combatant }) {
  const [open, setOpen] = useState<ChipId | null>(null);
  const active = CHIPS.filter((c) => value(who, c.id) > 0);
  if (active.length === 0) return null;
  const openChip = active.find((c) => c.id === open);

  return (
    <div className="statuses">
      <div className="statuses__row">
        {active.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip chip--${c.kind}${open === c.id ? ' chip--open' : ''}`}
            aria-expanded={open === c.id}
            onClick={() => setOpen(open === c.id ? null : c.id)}
          >
            {c.label} {value(who, c.id)}
          </button>
        ))}
      </div>
      {openChip && <div className="statuses__explain small">{openChip.explain(value(who, openChip.id))}</div>}
    </div>
  );
}
