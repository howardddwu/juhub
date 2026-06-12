import { useState } from 'react';
import { useI18n } from '../../shared/i18n';
import { useDialogs } from '../../shared/Dialogs';
import { rememberNames } from '../../shared/namePool';
import { navigate } from '../../router';
import { PlayerInput } from './PlayerInput';
import { dealNumbers, pickKingRound, KING_COMMANDS, type KingRound } from './kingLogic';

/**
 * 国王游戏：传手机给每人发一个秘密号码 → 抽国王 + 一道命令。
 * 号码匿名是乐趣所在，所以发牌用传手机逐个私下查看（复用投票的全屏过场样式）。
 */
export function King() {
  const { t, lang } = useI18n();
  const { toast } = useDialogs();
  const [players, setPlayers] = useState<string[]>([]);
  const [phase, setPhase] = useState<'setup' | 'deal' | 'decree'>('setup');
  const [numbers, setNumbers] = useState<number[]>([]);
  const [dealIdx, setDealIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [round, setRound] = useState<KingRound | null>(null);

  const deal = () => {
    if (players.length < 3) {
      toast(t.kingNeedThree);
      return;
    }
    rememberNames(players);
    setNumbers(dealNumbers(players.length));
    setDealIdx(0);
    setRevealed(false);
    setPhase('deal');
  };

  const nextDealer = () => {
    if (dealIdx + 1 >= players.length) {
      setRound(pickKingRound(players.length, KING_COMMANDS[lang]));
      setPhase('decree');
    } else {
      setDealIdx(dealIdx + 1);
      setRevealed(false);
    }
  };

  // ---- 发牌：传手机逐个私下看号 ----
  if (phase === 'deal') {
    return (
      <div className="vote-pass king-deal">
        <div className="vote-pass-progress">
          {dealIdx + 1} / {players.length}
        </div>
        {revealed ? (
          <>
            <div className="king-number">{t.kingYourNumber(numbers[dealIdx])}</div>
            <div className="king-hide">{t.kingHideHint}</div>
            <button className="btn vote-pass-btn" onClick={nextDealer}>
              {t.kingRemember}
            </button>
          </>
        ) : (
          <>
            <div>{t.votePassTo}</div>
            <div className="vote-pass-name">{players[dealIdx]}</div>
            <button className="btn vote-pass-btn" onClick={() => setRevealed(true)}>
              {t.kingTapReveal}
            </button>
          </>
        )}
      </div>
    );
  }

  // ---- 国王降旨 ----
  if (phase === 'decree' && round) {
    return (
      <div className="page">
        <header className="nav">
          <button className="icon-btn" onClick={() => setPhase('setup')} aria-label="back">
            ‹
          </button>
          <h1>{t.gameKing}</h1>
          <span className="nav-spacer" />
        </header>

        <div className="king-crown">{t.kingCrown(round.king)}</div>
        <div className="card game-card">
          <div className="game-kicker">{t.kingDecree}</div>
          <div className="game-predicate">{round.text}</div>
        </div>

        <div className="bottom-actions">
          <button className="btn primary grow" onClick={() => setRound(pickKingRound(players.length, KING_COMMANDS[lang]))}>
            {t.kingNextCmd}
          </button>
          <button className="btn grow" onClick={deal}>
            {t.kingRedeal}
          </button>
        </div>
      </div>
    );
  }

  // ---- 设置 ----
  return (
    <div className="page">
      <header className="nav">
        <button className="icon-btn" onClick={() => navigate('/drink')} aria-label="back">
          ‹
        </button>
        <h1>{t.gameKing}</h1>
        <span className="nav-spacer" />
      </header>

      <h2 className="section-title">{t.teamsPeople(players.length)}</h2>
      <PlayerInput players={players} setPlayers={setPlayers} />

      <button className="btn primary block" onClick={deal} disabled={players.length < 3}>
        {t.kingDeal}
      </button>
    </div>
  );
}
