/**
 * 最近名字池：所有工具录入的名字写入共享池，任何工具输名字时联想补全。
 * 一晚上玩三个工具，名字只打一遍 —— 这是工具箱整合的第一块胶水。
 */

const KEY = 'juhub.names.v1';
const MAX = 50;

export function recentNames(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** 录入名字后回写池子：最近用的排最前，去重，封顶 MAX */
export function rememberNames(names: string[]) {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const raw of [...names, ...recentNames()]) {
    const name = raw.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    next.push(name);
  }
  localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
}
