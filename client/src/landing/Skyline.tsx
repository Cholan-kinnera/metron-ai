/** Deterministic pseudo-random so the skyline renders identically on every load. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

interface Building {
  x: number;
  w: number;
  h: number;
  windows: { x: number; y: number }[];
}

function buildings(seed: number, count: number, minH: number, maxH: number, litRatio: number): Building[] {
  const r = rng(seed);
  const width = 1600 / count;
  return Array.from({ length: count }, (_, i) => {
    const w = width * (0.7 + r() * 0.5);
    const h = minH + r() * (maxH - minH);
    const x = i * width + (width - w) / 2;
    const windows: { x: number; y: number }[] = [];
    for (let wy = 600 - h + 14; wy < 590; wy += 18) {
      for (let wx = x + 8; wx < x + w - 10; wx += 14) if (r() < litRatio) windows.push({ x: wx, y: wy });
    }
    return { x, w, h, windows };
  });
}

const FAR = buildings(7, 26, 120, 300, 0);
const MID = buildings(42, 18, 160, 380, 0.12);
const NEAR = buildings(99, 12, 90, 240, 0.22);

/** Issue pins dropped on rooftops in the hero animation. */
export const PINS = [
  { x: MID[3].x + MID[3].w / 2, y: 600 - MID[3].h, tone: 'critical' },
  { x: MID[8].x + MID[8].w / 2, y: 600 - MID[8].h, tone: 'progress' },
  { x: MID[13].x + MID[13].w / 2, y: 600 - MID[13].h, tone: 'resolved' },
  { x: NEAR[5].x + NEAR[5].w / 2, y: 600 - NEAR[5].h, tone: 'critical' },
  { x: NEAR[9].x + NEAR[9].w / 2, y: 600 - NEAR[9].h, tone: 'resolved' },
] as const;

const PIN_COLOR = { critical: '#ef4444', progress: '#fca311', resolved: '#34d399' } as const;

function Layer({ items, fill, windowFill, className }: { items: Building[]; fill: string; windowFill?: string; className: string }) {
  return (
    <g className={className}>
      {items.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={600 - b.h} width={b.w} height={b.h} rx={3} fill={fill} />
          {windowFill && b.windows.map((w, j) => <rect key={j} x={w.x} y={w.y} width={6} height={8} rx={1} fill={windowFill} />)}
        </g>
      ))}
    </g>
  );
}

/** Layered SVG city skyline with parallax-ready groups and animated issue pins. */
export function Skyline() {
  return (
    <svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" className="h-full w-full" aria-hidden="true" focusable="false">
      <Layer items={FAR} fill="#1d2c4f" className="sky-far" />
      <Layer items={MID} fill="#22345c" windowFill="#fca31166" className="sky-mid" />
      <g className="sky-pins">
        {PINS.map((p, i) => (
          <g key={i} className="sky-pin" transform={`translate(${p.x} ${p.y - 34})`}>
            <circle r={18} fill={PIN_COLOR[p.tone]} opacity={0.25} className="pin-pulse" />
            <path d="M0 22 C -10 8, -12 2, -12 -4 A 12 12 0 1 1 12 -4 C 12 2, 10 8, 0 22 Z" fill={PIN_COLOR[p.tone]} />
            <circle r={4.5} cy={-4} fill="#14213d" />
          </g>
        ))}
      </g>
      <Layer items={NEAR} fill="#0d1730" windowFill="#ffd58a55" className="sky-near" />
      <rect y={596} width={1600} height={4} fill="#0d1730" />
    </svg>
  );
}
