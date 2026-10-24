import { useEffect, useState } from 'react';
import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { canPlay, currentIntent, describeIntent, endTurn, playCard } from '../engine/combat';
import { newSeed } from '../engine/rng';
import { chooseReward, newRun, resolveCombat } from '../engine/run';
import { loadRun, saveRun } from '../engine/save';
import type { RunState } from '../engine/types';
import { HpBar } from './Bar';
import { Card } from './Card';

export default function App() {
  const [run, setRun] = useState<RunState | null>(() => loadRun());

  useEffect(() => saveRun(run), [run]);

  // Move to reward/victory/defeat once a fight ends.
  useEffect(() => {
    if (run?.phase === 'combat' && run.combat && run.combat.result !== 'ongoing') {
      const t = setTimeout(() => setRun((r) => (r ? resolveCombat(r) : r)), 600);
      return () => clearTimeout(t);
    }
  }, [run]);

  if (!run) return <Title onStart={() => setRun(newRun(newSeed()))} />;
  if (run.phase === 'victory' || run.phase === 'defeat') {
    return <End run={run} onRestart={() => setRun(null)} />;
  }
  if (run.phase === 'reward') {
    return <Reward run={run} onPick={(id) => setRun(chooseReward(run, id))} />;
  }
  return <Combat run={run} setRun={setRun} />;
}

function Title({ onStart }: { onStart: () => void }) {
  return (
    <main className="screen screen--center">
      <h1 className="title">Deckbuilder</h1>
      <p className="muted">Five fights. One boss. Build your deck as you go.</p>
      <button className="btn btn--primary" onClick={onStart}>New run</button>
    </main>
  );
}

function Combat({ run, setRun }: { run: RunState; setRun: (r: RunState) => void }) {
  const c = run.combat!;
  const enemyDef = ENEMIES[c.enemy.defId];
  const intent = currentIntent(c.enemy);
  const over = c.result !== 'ongoing';

  return (
    <main className="screen combat">
      <header className="topbar">
        <span>Floor {run.floor + 1}/{run.encounters.length}</span>
        <span>Turn {c.turn}</span>
        <span>Deck {run.deck.length}</span>
      </header>

      <section className="enemy">
        <div className="enemy__name">{enemyDef.name}{enemyDef.boss && ' 👑'}</div>
        <div className="enemy__intent">
          {over ? (c.result === 'won' ? 'Defeated' : '—') : `Intends: ${describeIntent(intent, c.enemy.strength)}`}
        </div>
        <HpBar hp={c.enemy.hp} maxHp={c.enemy.maxHp} block={c.enemy.block} />
        {c.enemy.strength > 0 && <div className="muted small">Strength {c.enemy.strength}</div>}
      </section>

      <section className="log" aria-live="polite">
        {c.log.slice(-4).map((line, i) => (
          <div key={c.log.length - 4 + i}>{line}</div>
        ))}
      </section>

      <section className="player">
        <div className="player__row">
          <span className="energy" aria-label={`${c.energy} energy`}>⚡ {c.energy}/{c.maxEnergy}</span>
          <span className="muted small">Draw {c.drawPile.length} · Discard {c.discardPile.length}</span>
        </div>
        <HpBar hp={run.player.hp} maxHp={run.player.maxHp} block={run.player.block} />
      </section>

      <section className="hand">
        {c.hand.map((card) => (
          <Card
            key={card.uid}
            def={CARDS[card.defId]}
            playable={canPlay(run, card)}
            onClick={() => setRun(playCard(run, card.uid))}
          />
        ))}
      </section>

      <button className="btn btn--primary endturn" onClick={() => setRun(endTurn(run))} disabled={over}>
        End turn
      </button>
    </main>
  );
}

function Reward({ run, onPick }: { run: RunState; onPick: (id: string | null) => void }) {
  return (
    <main className="screen screen--center">
      <h2>Victory!</h2>
      <p className="muted">HP {run.player.hp}/{run.player.maxHp}. Add a card to your deck:</p>
      <div className="reward">
        {run.rewardOptions.map((id) => (
          <Card key={id} def={CARDS[id]} onClick={() => onPick(id)} />
        ))}
      </div>
      <button className="btn" onClick={() => onPick(null)}>Skip</button>
    </main>
  );
}

function End({ run, onRestart }: { run: RunState; onRestart: () => void }) {
  const won = run.phase === 'victory';
  return (
    <main className="screen screen--center">
      <h1 className="title">{won ? 'You win' : 'Defeated'}</h1>
      <p className="muted">
        {won ? 'The Gatekeeper falls.' : `Fell on floor ${run.floor + 1}.`} Seed {run.seed}
      </p>
      <button className="btn btn--primary" onClick={onRestart}>Back to title</button>
    </main>
  );
}
