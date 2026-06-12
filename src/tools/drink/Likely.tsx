import { useState } from 'react';
import { useI18n } from '../../shared/i18n';
import { useDialogs } from '../../shared/Dialogs';
import { Avatar } from '../../shared/Avatar';
import { rememberNames } from '../../shared/namePool';
import { navigate } from '../../router';
import { PlayerInput } from './PlayerInput';
import { LIKELY_DECK } from './likely-deck';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 谁最有可能：翻题卡 → 全场指人 → 点被指最多的人记一杯。结果用完即弃，只回写名字池。 */
export function Likely() {
  const { t, lang } = useI18n();
  const { toast } = useDialogs();
  const [players, setPlayers] = useState<string[]>([]);
  const [deck, setDeck] = useState<string[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [tally, setTally] = useState<Record<string, number>>({});

  const start = () => {
    if (players.length < 2) {
      toast(t.teamsNeedTwo);
      return;
    }
    rememberNames(players);
    setDeck(shuffle(LIKELY_DECK[lang]));
    setIdx(0);
    setTally({});
  };

  const next = () => {
    if (deck) setIdx((i) => (i + 1) % deck.length);
  };

  const drink = (name: string) => {
    setTally((prev) => ({ ...prev, [name]: (prev[name] ?? 0) + 1 }));
    next();
  };

  if (!deck) {
    return (
      <div className="page">
        <header className="nav">
          <button className="icon-btn" onClick={() => navigate('/drink')} aria-label="back">
            ‹
          </button>
          <h1>{t.gameLikely}</h1>
          <span className="nav-spacer" />
        </header>
        <h2 className="section-title">{t.teamsPeople(players.length)}</h2>
        <PlayerInput players={players} setPlayers={setPlayers} />
        <button className="btn primary block" onClick={start} disabled={players.length < 2}>
          {t.startGame}
        </button>
      </div>
    );
  }

  const ranked = players.filter((p) => tally[p]).sort((a, b) => (tally[b] ?? 0) - (tally[a] ?? 0));

  return (
    <div className="page">
      <header className="nav">
        <button className="icon-btn" onClick={() => setDeck(null)} aria-label="back">
          ‹
        </button>
        <h1>{t.gameLikely}</h1>
        <span className="nav-spacer" />
      </header>

      <div className="card game-card">
        <div className="game-kicker">{t.likelyPrefix}</div>
        <div className="game-predicate">{deck[idx]}</div>
      </div>

      <p className="ballot-hint">{t.likelyTapWho}</p>
      <div className="member-select tap-grid">
        {players.map((n) => (
          <button key={n} className="select-chip on" onClick={() => drink(n)}>
            <Avatar name={n} size={22} />
            {n}
          </button>
        ))}
      </div>

      <div className="bottom-actions">
        <button className="btn grow" onClick={next}>
          {t.likelyNext}
        </button>
        <button className="btn grow" onClick={() => setDeck(shuffle(LIKELY_DECK[lang]))}>
          {t.likelyShuffle}
        </button>
      </div>

      {ranked.length > 0 && (
        <>
          <h2 className="section-title">{t.drinkTally}</h2>
          <div className="card">
            {ranked.map((n) => (
              <div key={n} className="tally-row">
                <span className="tally-name">
                  <Avatar name={n} size={20} />
                  {n}
                </span>
                <span className="tally-count">{t.cups(tally[n])}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
