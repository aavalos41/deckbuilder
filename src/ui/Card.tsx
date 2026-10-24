import type { CardDef } from '../engine/types';

interface Props {
  def: CardDef;
  playable?: boolean;
  onClick?: () => void;
}

export function Card({ def, playable = true, onClick }: Props) {
  return (
    <button
      className={`card card--${def.type} ${playable ? '' : 'card--disabled'}`}
      onClick={onClick}
      disabled={!playable}
      aria-label={`${def.name}, costs ${def.cost}. ${def.text}`}
    >
      <span className="card__cost">{def.cost}</span>
      <span className="card__name">{def.name}</span>
      <span className="card__type">{def.type}</span>
      <span className="card__text">{def.text}</span>
    </button>
  );
}
