export interface Pair {
  a: string;
  b: string;
}

export interface GroupingInput {
  names: string[];
  groupCount: number;
  together: Pair[];
  apart: Pair[];
}

/**
 * 随机分组：
 * 1. "必须同组"用并查集合并成块
 * 2. Fisher-Yates 洗牌后按块大小降序，贪心放入当前人数最少的组
 * 3. 校验"必须分开"，违反则整体重摇（上限 maxTries 次）
 * 约束矛盾（重摇超限或同组块内含必须分开的两人）返回 null。
 */
export function makeGroups(input: GroupingInput, maxTries = 500): string[][] | null {
  const { names, groupCount, together, apart } = input;
  if (groupCount < 1 || names.length === 0) return null;

  // 并查集合并"必须同组"
  const parent = new Map<string, string>(names.map((n) => [n, n]));
  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(x, root);
    return root;
  };
  for (const { a, b } of together) {
    if (parent.has(a) && parent.has(b)) parent.set(find(a), find(b));
  }

  // 同一块里出现"必须分开"的两人 → 无解
  for (const { a, b } of apart) {
    if (parent.has(a) && parent.has(b) && find(a) === find(b)) return null;
  }

  const blockMap = new Map<string, string[]>();
  for (const n of names) {
    const root = find(n);
    blockMap.set(root, [...(blockMap.get(root) ?? []), n]);
  }
  const blocks = [...blockMap.values()];

  for (let attempt = 0; attempt < maxTries; attempt++) {
    // 洗牌后稳定按大小降序：同尺寸块之间保持随机次序
    shuffle(blocks);
    blocks.sort((x, y) => y.length - x.length);

    const groups: string[][] = Array.from({ length: groupCount }, () => []);
    for (const block of blocks) {
      let smallest = groups[0];
      for (const g of groups) if (g.length < smallest.length) smallest = g;
      smallest.push(...block);
    }

    const groupOf = new Map<string, number>();
    groups.forEach((g, i) => g.forEach((n) => groupOf.set(n, i)));
    const ok = apart.every(({ a, b }) => groupOf.get(a) === undefined || groupOf.get(a) !== groupOf.get(b));
    if (ok) {
      for (const g of groups) shuffle(g);
      return groups;
    }
  }
  return null;
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
