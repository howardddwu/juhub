import { useState } from 'react';
import { useI18n } from '../../shared/i18n';
import { useDialogs } from '../../shared/Dialogs';
import { Avatar } from '../../shared/Avatar';
import { rememberNames } from '../../shared/namePool';
import { NameSuggestions } from '../../shared/NameSuggestions';
import { navigate } from '../../router';
import type { ToolProps } from '../registry';
import { Wheel } from './Wheel';

type Stage = 'setup' | 'pass' | 'ballot' | 'result';

/**
 * 投票决策器：无后端，传手机模型（本地诚实方案）。
 * 全屏过场"请把手机交给 ××" → 本人点选 → 传下一人 → 全员投完唱票。
 * 转盘子模式：不需要计票的"今晚吃什么"，动画随机定一个。
 */
export default function VoteApp(_props: ToolProps) {
  const { t } = useI18n();
  const { toast } = useDialogs();

  const [mode, setMode] = useState<'ballot' | 'wheel'>('ballot');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [voters, setVoters] = useState<string[]>([]);
  const [voterInput, setVoterInput] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const [stage, setStage] = useState<Stage>('setup');
  const [votes, setVotes] = useState<number[]>([]);
  const [voterIdx, setVoterIdx] = useState(0);
  const [tieWinner, setTieWinner] = useState<number | null>(null);
  const [wheelPick, setWheelPick] = useState<number | null>(null);

  const filledOptions = options.map((o) => o.trim()).filter(Boolean);

  const addVoter = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    if (voters.includes(name)) {
      toast(t.sameNameExists);
      return;
    }
    setVoters((prev) => [...prev, name]);
  };

  const start = () => {
    if (filledOptions.length < 2) {
      toast(t.voteNeedOptions);
      return;
    }
    if (voters.length === 0) {
      toast(t.voteNeedVoters);
      return;
    }
    rememberNames(voters);
    setVotes([]);
    setVoterIdx(0);
    setTieWinner(null);
    setStage('pass');
  };

  const castVote = (optionIdx: number) => {
    const next = [...votes, optionIdx];
    setVotes(next);
    if (next.length >= voters.length) {
      setStage('result');
    } else {
      setVoterIdx(voterIdx + 1);
      setStage('pass');
    }
  };

  // ---- 传手机过场 ----
  if (stage === 'pass') {
    return (
      <div className="vote-pass">
        <div className="vote-pass-progress">
          {voterIdx + 1} / {voters.length}
        </div>
        <div>{t.votePassTo}</div>
        <div className="vote-pass-name">{voters[voterIdx]}</div>
        <button className="btn vote-pass-btn" onClick={() => setStage('ballot')}>
          {t.voteIGotIt}
        </button>
      </div>
    );
  }

  // ---- 本人点选 ----
  if (stage === 'ballot') {
    return (
      <div className="page">
        <header className="nav">
          <span className="nav-spacer" />
          <h1>{question.trim() || t.voteResultTitle}</h1>
          <span className="nav-spacer" />
        </header>
        <p className="ballot-hint">{anonymous ? t.voteAnonPick : t.voteFor(voters[voterIdx])}</p>
        {filledOptions.map((opt, i) => (
          <button key={i} className="card vote-option" onClick={() => castVote(i)}>
            {opt}
          </button>
        ))}
      </div>
    );
  }

  // ---- 唱票 ----
  if (stage === 'result') {
    const counts = filledOptions.map((_, i) => votes.filter((v) => v === i).length);
    const max = Math.max(...counts);
    const leaders = counts.flatMap((c, i) => (c === max ? [i] : []));
    const winner = leaders.length === 1 ? leaders[0] : tieWinner;
    const isTie = leaders.length > 1;

    return (
      <div className="page">
        <header className="nav">
          <button className="icon-btn" onClick={() => setStage('setup')} aria-label="back">
            ‹
          </button>
          <h1>{question.trim() || t.voteResultTitle}</h1>
          <span className="nav-spacer" />
        </header>

        {filledOptions.map((opt, i) => (
          <div key={i} className={`card vote-result-row ${winner === i ? 'winner' : ''}`}>
            <div className="vote-result-head">
              <span className="vote-result-name">
                {winner === i && '🏆 '}
                {opt}
              </span>
              <span className="vote-result-count">{t.votesN(counts[i])}</span>
            </div>
            <div className="vote-bar-track">
              <div className="vote-bar" style={{ width: `${(counts[i] / votes.length) * 100}%` }} />
            </div>
            {!anonymous && counts[i] > 0 && (
              <div className="vote-result-voters">
                {voters.filter((_, vi) => votes[vi] === i).map((name) => (
                  <span key={name} className="chip">
                    <Avatar name={name} size={20} />
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTie && winner === null && (
          <button className="btn primary block" onClick={() => setTieWinner(leaders[Math.floor(Math.random() * leaders.length)])}>
            {t.voteTie} {t.voteTieBreak}
          </button>
        )}
        {winner !== null && <div className="card vote-winner-banner">{t.voteWinnerIs(filledOptions[winner])}</div>}

        <button className="btn block" onClick={() => setStage('setup')}>
          {t.voteRestart}
        </button>
      </div>
    );
  }

  // ---- 设置页 ----
  return (
    <div className="page">
      <header className="nav">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="back">
          ‹
        </button>
        <h1>{t.toolVote}</h1>
        <span className="nav-spacer" />
      </header>

      <div className="segmented vote-mode">
        <button className={`segmented-item ${mode === 'ballot' ? 'on' : ''}`} onClick={() => setMode('ballot')}>
          {t.voteModeBallot}
        </button>
        <button className={`segmented-item ${mode === 'wheel' ? 'on' : ''}`} onClick={() => setMode('wheel')}>
          {t.voteModeWheel}
        </button>
      </div>

      <div className="card">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t.voteQuestionPh}
          maxLength={30}
        />
        <div className="option-rows">
          {options.map((opt, i) => (
            <div key={i} className="option-row">
              <input
                value={opt}
                onChange={(e) => setOptions((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={t.voteOptionPh(i + 1)}
                maxLength={20}
              />
              {options.length > 2 && (
                <button
                  className="icon-btn"
                  aria-label="remove option"
                  onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 8 && (
          <button className="text-btn" onClick={() => setOptions((prev) => [...prev, ''])}>
            {t.voteAddOption}
          </button>
        )}
      </div>

      {mode === 'wheel' ? (
        <>
          <div className="card empty">{t.wheelHint}</div>
          {filledOptions.length >= 2 && (
            <div className="card">
              <Wheel key={filledOptions.join('\n')} options={filledOptions} onPicked={setWheelPick} />
              {wheelPick !== null && <div className="vote-winner-banner">{t.voteWinnerIs(filledOptions[wheelPick])}</div>}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="section-title">{t.voteVoters(voters.length)}</h2>
          <div className="card">
            <div className="member-chips">
              {voters.map((n) => (
                <span key={n} className="chip">
                  <Avatar name={n} size={22} />
                  {n}
                  <button
                    className="chip-x"
                    aria-label={`remove ${n}`}
                    onClick={() => setVoters((prev) => prev.filter((x) => x !== n))}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="member-add">
              <input
                value={voterInput}
                onChange={(e) => setVoterInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addVoter(voterInput);
                    setVoterInput('');
                  }
                }}
                placeholder={t.teamsNamePh}
                maxLength={12}
              />
              <button
                className="btn"
                onClick={() => {
                  addVoter(voterInput);
                  setVoterInput('');
                }}
                disabled={!voterInput.trim()}
              >
                {t.add}
              </button>
            </div>
            <NameSuggestions exclude={voters} onPick={addVoter} />
            <label className="anon-row">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              {t.voteAnon}
            </label>
          </div>

          <button className="btn primary block" onClick={start} disabled={filledOptions.length < 2 || voters.length === 0}>
            {t.voteStart}
          </button>
        </>
      )}
    </div>
  );
}
