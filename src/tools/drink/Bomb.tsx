import { useState } from 'react';
import { useI18n } from '../../shared/i18n';
import { useDialogs } from '../../shared/Dialogs';
import { rememberNames } from '../../shared/namePool';
import { navigate } from '../../router';
import { PlayerInput } from './PlayerInput';
import { applyGuess, randomBomb, type Range } from './bombLogic';

const PRESETS = [50, 100, 200];

/** 数字炸弹：随机一个雷，轮流猜数收缩区间，踩中的喝。玩家可选（用于轮转 + 点名谁喝）。 */
export function Bomb() {
  const { t } = useI18n();
  const { toast } = useDialogs();
  const [players, setPlayers] = useState<string[]>([]);
  const [maxNum, setMaxNum] = useState(100);
  const [phase, setPhase] = useState<'setup' | 'play' | 'hit'>('setup');
  const [bomb, setBomb] = useState(0);
  const [range, setRange] = useState<Range>({ low: 1, high: 100 });
  const [turn, setTurn] = useState(0);
  const [guess, setGuess] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  const start = () => {
    rememberNames(players);
    setBomb(randomBomb(1, maxNum));
    setRange({ low: 1, high: maxNum });
    setTurn(0);
    setGuess('');
    setHint(null);
    setPhase('play');
  };

  const submit = () => {
    const g = Number(guess);
    if (!Number.isInteger(g) || g < range.low || g > range.high) {
      toast(t.bombInvalid);
      return;
    }
    const res = applyGuess(range, bomb, g);
    if (res.hit) {
      setPhase('hit');
      return;
    }
    setRange(res.range);
    setHint(res.dir === 'higher' ? t.bombBigger : t.bombSmaller);
    setGuess('');
    if (players.length) setTurn((tn) => (tn + 1) % players.length);
  };

  if (phase === 'hit') {
    return (
      <div className="vote-pass boom">
        <div className="vote-pass-name">{players.length ? t.bombHit(players[turn]) : t.bombHitAnon}</div>
        <div className="boom-sub">{t.bombWasAt(bomb)}</div>
        <button className="btn vote-pass-btn" onClick={start}>
          {t.bombAgain}
        </button>
        <button className="text-btn boom-exit" onClick={() => setPhase('setup')}>
          ‹ {t.gameBomb}
        </button>
      </div>
    );
  }

  if (phase === 'play') {
    return (
      <div className="page">
        <header className="nav">
          <button className="icon-btn" onClick={() => setPhase('setup')} aria-label="back">
            ‹
          </button>
          <h1>{t.gameBomb}</h1>
          <span className="nav-spacer" />
        </header>

        {players.length > 0 && <p className="ballot-hint">{t.bombTurn(players[turn])}</p>}

        <div className="card game-card">
          <div className="bomb-range">
            {range.low} – {range.high}
          </div>
          {hint && <div className="bomb-hint">{hint}</div>}
        </div>

        <div className="bomb-guess-row">
          <input
            className="amount-input"
            inputMode="numeric"
            value={guess}
            onChange={(e) => setGuess(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={t.bombGuessPh}
            autoFocus
          />
          <button className="btn primary" onClick={submit} disabled={!guess}>
            {t.bombGuess}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="nav">
        <button className="icon-btn" onClick={() => navigate('/drink')} aria-label="back">
          ‹
        </button>
        <h1>{t.gameBomb}</h1>
        <span className="nav-spacer" />
      </header>

      <h2 className="section-title">{t.bombMaxLabel}</h2>
      <div className="card">
        <div className="segmented">
          {PRESETS.map((p) => (
            <button key={p} className={`segmented-item ${maxNum === p ? 'on' : ''}`} onClick={() => setMaxNum(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <h2 className="section-title">{t.teamsPeople(players.length)}</h2>
      <PlayerInput players={players} setPlayers={setPlayers} />

      <button className="btn primary block" onClick={start}>
        {t.startGame}
      </button>
    </div>
  );
}
