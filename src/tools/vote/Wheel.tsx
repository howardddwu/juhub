import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../shared/i18n';

const SIZE = 240;
const C = SIZE / 2;
const R = 112;
const SPIN_MS = 3000;

/** 顶部 0°、顺时针 θ 度的圆周点 */
function point(theta: number, r: number): [number, number] {
  const rad = (theta * Math.PI) / 180;
  return [C + r * Math.sin(rad), C - r * Math.cos(rad)];
}

/** 快速决策转盘：选项进转盘，动画随机定一个 */
export function Wheel({ options, onPicked }: { options: string[]; onPicked: (index: number | null) => void }) {
  const { t } = useI18n();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const n = options.length;
  const step = 360 / n;

  const spin = () => {
    if (spinning) return;
    setWinner(null);
    onPicked(null);
    const idx = Math.floor(Math.random() * n);
    // 指针固定正上方：把中奖扇区中心转到顶部，留一点扇区内抖动
    const center = idx * step + step / 2;
    const jitter = (Math.random() - 0.5) * step * 0.6;
    const target = Math.floor(rotation / 360) * 360 + 5 * 360 + (360 - center) + jitter;
    setSpinning(true);
    setRotation(target);
    timer.current = setTimeout(() => {
      setSpinning(false);
      setWinner(idx);
      onPicked(idx);
    }, SPIN_MS + 100);
  };

  return (
    <div className="wheel-wrap">
      <div className="wheel-pointer">▼</div>
      <svg
        className="wheel-svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.55, 0.1, 1)` : 'none' }}
      >
        {options.map((opt, i) => {
          const [x1, y1] = point(i * step, R);
          const [x2, y2] = point((i + 1) * step, R);
          const mid = i * step + step / 2;
          const [lx, ly] = point(mid, R * 0.62);
          const hue = (i * 360) / n + 25;
          const label = [...opt].slice(0, 5).join('');
          return (
            <g key={i}>
              <path
                d={`M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${step > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
                fill={`hsl(${hue} 70% ${winner === i ? 62 : 78}%)`}
                stroke="var(--card)"
                strokeWidth="2"
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fill={`hsl(${hue} 45% 25%)`}
                transform={`rotate(${mid} ${lx} ${ly})`}
              >
                {label}
              </text>
            </g>
          );
        })}
        <circle cx={C} cy={C} r="16" fill="var(--card)" />
      </svg>
      <button className="btn primary" onClick={spin} disabled={spinning}>
        {winner === null && !spinning ? t.wheelSpin : spinning ? '…' : t.wheelAgain}
      </button>
    </div>
  );
}
