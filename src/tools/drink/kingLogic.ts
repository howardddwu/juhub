import type { Lang } from '../../shared/i18n';

export interface KingCommand {
  /** 指令引用几个号码 */
  slots: 1 | 2;
  render: (a: number, b: number) => string;
}

export const KING_COMMANDS: Record<Lang, KingCommand[]> = {
  zh: [
    { slots: 1, render: (a) => `${a} 号 自罚一杯` },
    { slots: 2, render: (a, b) => `${a} 号 给 ${b} 号 敬一杯` },
    { slots: 2, render: (a, b) => `${a} 号 和 ${b} 号 喝交杯酒` },
    { slots: 2, render: (a, b) => `${a} 号 真心话，由 ${b} 号 提问` },
    { slots: 2, render: (a, b) => `${a} 号 大冒险，${b} 号 出题，不做喝两杯` },
    { slots: 1, render: (a) => `除了 ${a} 号，其他人都喝一口` },
    { slots: 1, render: (a) => `${a} 号 学一声动物叫，不做罚一杯` },
    { slots: 1, render: (a) => `${a} 号 点一个人陪自己喝` },
    { slots: 2, render: (a, b) => `${a} 号 和 ${b} 号 划拳，输的喝` },
    { slots: 1, render: (a) => `${a} 号 唱一句歌，不唱喝一杯` },
    { slots: 2, render: (a, b) => `${a} 号 夸 ${b} 号 三个优点，卡壳就喝` },
    { slots: 1, render: (a) => `从 ${a} 号 开始，顺时针每人喝一口` },
  ],
  en: [
    { slots: 1, render: (a) => `Number ${a}, drink one` },
    { slots: 2, render: (a, b) => `Number ${a} toasts number ${b}` },
    { slots: 2, render: (a, b) => `Numbers ${a} and ${b} drink arm-in-arm` },
    { slots: 2, render: (a, b) => `Number ${a} answers a truth from number ${b}` },
    { slots: 2, render: (a, b) => `Number ${a} does a dare set by number ${b}, or drink twice` },
    { slots: 1, render: (a) => `Everyone except number ${a} drinks` },
    { slots: 1, render: (a) => `Number ${a} makes an animal sound, or drink` },
    { slots: 1, render: (a) => `Number ${a} picks someone to drink along` },
    { slots: 2, render: (a, b) => `Numbers ${a} and ${b} play rock-paper-scissors, loser drinks` },
    { slots: 1, render: (a) => `Number ${a} sings a line, or drink` },
    { slots: 2, render: (a, b) => `Number ${a} names 3 good things about number ${b}, or drink` },
    { slots: 1, render: (a) => `Starting from number ${a}, everyone drinks clockwise` },
  ],
};

export interface KingRound {
  king: number;
  text: string;
}

/** 给 n 个人发不重复的号码 1..n（洗牌后 numbers[i] 是第 i 人的号） */
export function dealNumbers(n: number, rng: () => number = Math.random): number[] {
  const nums = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

/** 从 1..n 取 k 个不重复号码 */
export function sampleDistinct(n: number, k: number, rng: () => number = Math.random): number[] {
  return dealNumbers(n, rng).slice(0, k);
}

/** 抽一位国王 + 一条本轮指令（指令引用的号码互不相同，落在 1..n 内） */
export function pickKingRound(n: number, commands: KingCommand[], rng: () => number = Math.random): KingRound {
  const king = 1 + Math.floor(rng() * n);
  const usable = commands.filter((c) => c.slots <= n);
  const cmd = usable[Math.floor(rng() * usable.length)];
  const nums = sampleDistinct(n, cmd.slots, rng);
  return { king, text: cmd.render(nums[0], nums[1] ?? nums[0]) };
}
