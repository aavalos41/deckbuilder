import { useState } from 'react';
import { RELICS } from '../data/relics';

/** Owned relics as chips. Tap a chip to show/hide what it does. */
export function Relics({ ids }: { ids: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (ids.length === 0) return null;
  const openRelic = open ? RELICS[open] : undefined;

  return (
    <div className="statuses">
      <div className="statuses__row">
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            className={`chip chip--relic${open === id ? ' chip--open' : ''}`}
            aria-expanded={open === id}
            onClick={() => setOpen(open === id ? null : id)}
          >
            ✦ {RELICS[id].name}
          </button>
        ))}
      </div>
      {openRelic && <div className="statuses__explain small">{openRelic.text}</div>}
    </div>
  );
}
