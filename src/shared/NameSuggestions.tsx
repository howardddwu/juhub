import { recentNames } from './namePool';

/** 名字池联想：展示最近用过、且未被当前列表占用的名字，点一下即填入 */
export function NameSuggestions({
  exclude,
  onPick,
  max = 8,
}: {
  exclude: string[];
  onPick: (name: string) => void;
  max?: number;
}) {
  const taken = new Set(exclude);
  const names = recentNames()
    .filter((n) => !taken.has(n))
    .slice(0, max);
  if (names.length === 0) return null;

  return (
    <div className="name-suggest">
      {names.map((n) => (
        <button key={n} className="name-suggest-chip" onClick={() => onPick(n)}>
          ＋ {n}
        </button>
      ))}
    </div>
  );
}
