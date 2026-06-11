const HUES = [12, 36, 90, 160, 200, 230, 270, 320];

function hueOf(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return HUES[h % HUES.length];
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const hue = hueOf(name);
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: `hsl(${hue} 65% 88%)`,
        color: `hsl(${hue} 55% 32%)`,
      }}
    >
      {[...name][0]}
    </span>
  );
}
