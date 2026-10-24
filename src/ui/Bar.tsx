export function HpBar({ hp, maxHp, block }: { hp: number; maxHp: number; block: number }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  return (
    <div className="hp">
      <div className="hp__track">
        <div className="hp__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="hp__label">
        {hp}/{maxHp}
        {block > 0 && <span className="hp__block"> · 🛡 {block}</span>}
      </div>
    </div>
  );
}
