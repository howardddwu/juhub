import { useState } from 'react';
import { useI18n } from '../../shared/i18n';
import { useDialogs } from '../../shared/Dialogs';
import { Avatar } from '../../shared/Avatar';
import { NameSuggestions } from '../../shared/NameSuggestions';

/** 三个喝酒游戏共用的玩家录入：名字 chips + 输入 + 名字池联想 */
export function PlayerInput({
  players,
  setPlayers,
  max = 16,
}: {
  players: string[];
  setPlayers: (next: string[]) => void;
  max?: number;
}) {
  const { t } = useI18n();
  const { toast } = useDialogs();
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    if (players.includes(name)) {
      toast(t.sameNameExists);
      return;
    }
    if (players.length >= max) return;
    setPlayers([...players, name]);
  };

  const commit = () => {
    add(input);
    setInput('');
  };

  return (
    <div className="card">
      <div className="member-chips">
        {players.map((n) => (
          <span key={n} className="chip">
            <Avatar name={n} size={22} />
            {n}
            <button className="chip-x" aria-label={`remove ${n}`} onClick={() => setPlayers(players.filter((x) => x !== n))}>
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="member-add">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          placeholder={t.teamsNamePh}
          maxLength={12}
        />
        <button className="btn" onClick={commit} disabled={!input.trim()}>
          {t.add}
        </button>
      </div>
      <NameSuggestions exclude={players} onPick={add} />
    </div>
  );
}
