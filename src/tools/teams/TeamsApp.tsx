import { useState } from 'react';
import { useI18n } from '../../shared/i18n';
import { useDialogs } from '../../shared/Dialogs';
import { Avatar } from '../../shared/Avatar';
import { copyText } from '../../shared/clipboard';
import { rememberNames } from '../../shared/namePool';
import { NameSuggestions } from '../../shared/NameSuggestions';
import { navigate } from '../../router';
import type { ToolProps } from '../registry';
import { makeGroups } from './grouping';

type ConstraintType = 'together' | 'apart';
interface Constraint {
  type: ConstraintType;
  a: string;
  b: string;
}

/** 随机分组：结果用完即弃，不持久化，只回写名字池 */
export default function TeamsApp(_props: ToolProps) {
  const { t, lang } = useI18n();
  const { toast } = useDialogs();
  const [names, setNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [mode, setMode] = useState<'count' | 'size'>('count');
  const [count, setCount] = useState(2);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [pairA, setPairA] = useState('');
  const [pairB, setPairB] = useState('');
  const [pairType, setPairType] = useState<ConstraintType>('together');
  const [groups, setGroups] = useState<string[][] | null>(null);

  const addName = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    if (names.includes(name)) {
      toast(t.sameNameExists);
      return;
    }
    setNames((prev) => [...prev, name]);
  };

  const removeName = (name: string) => {
    setNames((prev) => prev.filter((x) => x !== name));
    setConstraints((prev) => prev.filter((c) => c.a !== name && c.b !== name));
    if (pairA === name) setPairA('');
    if (pairB === name) setPairB('');
  };

  const addConstraint = () => {
    if (!pairA || !pairB) return;
    if (pairA === pairB) {
      toast(t.teamsSamePerson);
      return;
    }
    const dup = constraints.some(
      (c) => c.type === pairType && ((c.a === pairA && c.b === pairB) || (c.a === pairB && c.b === pairA)),
    );
    if (dup) {
      toast(t.constraintExists);
      return;
    }
    setConstraints((prev) => [...prev, { type: pairType, a: pairA, b: pairB }]);
    setPairA('');
    setPairB('');
  };

  const groupCount = mode === 'count' ? count : Math.max(1, Math.ceil(names.length / count));

  const roll = () => {
    if (names.length < 2) {
      toast(t.teamsNeedTwo);
      return;
    }
    rememberNames(names);
    const result = makeGroups({
      names,
      groupCount,
      together: constraints.filter((c) => c.type === 'together'),
      apart: constraints.filter((c) => c.type === 'apart'),
    });
    if (!result) {
      toast(t.teamsConflict);
      return;
    }
    setGroups(result);
  };

  const copyGroups = async () => {
    if (!groups) return;
    const sep = lang === 'zh' ? '、' : ', ';
    const text = groups.map((g, i) => `${t.groupLabel(i + 1)}: ${g.join(sep)}`).join('\n');
    toast((await copyText(text)) ? t.copied : t.copyFailed);
  };

  const maxCount = Math.max(2, names.length);

  return (
    <div className="page">
      <header className="nav">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="back">
          ‹
        </button>
        <h1>{t.toolTeams}</h1>
        <span className="nav-spacer" />
      </header>

      <h2 className="section-title">{t.teamsPeople(names.length)}</h2>
      <div className="card">
        <div className="member-chips">
          {names.map((n) => (
            <span key={n} className="chip">
              <Avatar name={n} size={22} />
              {n}
              <button className="chip-x" aria-label={`remove ${n}`} onClick={() => removeName(n)}>
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="member-add">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addName(nameInput);
                setNameInput('');
              }
            }}
            placeholder={t.teamsNamePh}
            maxLength={12}
          />
          <button
            className="btn"
            onClick={() => {
              addName(nameInput);
              setNameInput('');
            }}
            disabled={!nameInput.trim()}
          >
            {t.add}
          </button>
        </div>
        <NameSuggestions exclude={names} onPick={addName} />
      </div>

      <div className="card">
        <div className="segmented">
          <button className={`segmented-item ${mode === 'count' ? 'on' : ''}`} onClick={() => setMode('count')}>
            {t.teamsByCount}
          </button>
          <button className={`segmented-item ${mode === 'size' ? 'on' : ''}`} onClick={() => setMode('size')}>
            {t.teamsBySize}
          </button>
        </div>
        <div className="stepper">
          <button
            className="icon-btn"
            onClick={() => setCount((c) => Math.max(mode === 'count' ? 2 : 1, c - 1))}
            aria-label="minus"
          >
            −
          </button>
          <span className="stepper-value">{count}</span>
          <button className="icon-btn" onClick={() => setCount((c) => Math.min(maxCount, c + 1))} aria-label="plus">
            ＋
          </button>
        </div>
      </div>

      <h2 className="section-title">{t.teamsConstraints}</h2>
      <div className="card">
        {constraints.length > 0 && (
          <div className="member-chips">
            {constraints.map((c, i) => (
              <span key={i} className={`chip constraint-chip ${c.type}`}>
                {c.a} {c.type === 'together' ? '🔗' : '⚡'} {c.b}
                <button
                  className="chip-x"
                  aria-label="remove constraint"
                  onClick={() => setConstraints((prev) => prev.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="segmented">
          <button
            className={`segmented-item ${pairType === 'together' ? 'on' : ''}`}
            onClick={() => setPairType('together')}
          >
            🔗 {t.mustTogether}
          </button>
          <button className={`segmented-item ${pairType === 'apart' ? 'on' : ''}`} onClick={() => setPairType('apart')}>
            ⚡ {t.mustApart}
          </button>
        </div>
        <div className="constraint-row">
          <select value={pairA} onChange={(e) => setPairA(e.target.value)}>
            <option value="" disabled hidden />
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select value={pairB} onChange={(e) => setPairB(e.target.value)}>
            <option value="" disabled hidden />
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button className="btn" onClick={addConstraint} disabled={!pairA || !pairB}>
            {t.addConstraint}
          </button>
        </div>
      </div>

      <button className="btn primary block" onClick={roll} disabled={names.length < 2}>
        {groups ? t.reshuffle : t.teamsGo}
      </button>

      {groups && (
        <>
          <h2 className="section-title">{t.teamsResult}</h2>
          {groups.map((g, i) => (
            <div key={i} className="card">
              <div className="group-card-title">{t.groupLabel(i + 1)}</div>
              <div className="group-members">
                {g.map((n) => (
                  <span key={n} className="chip">
                    <Avatar name={n} size={22} />
                    {n}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <button className="btn block" onClick={copyGroups}>
            {t.copyResult}
          </button>
        </>
      )}
    </div>
  );
}
