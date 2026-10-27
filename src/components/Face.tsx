/** Det snurriga G.O.A.T.-ansiktet: spiralögon och vågig mun. */

function spiral(cx: number, cy: number, turns: number, growth: number, rotation: number): string {
  const points: string[] = [];
  const steps = Math.round(turns * 36);
  for (let i = 0; i <= steps; i++) {
    const theta = (i / 36) * Math.PI * 2;
    const r = growth * theta;
    points.push(`${(cx + r * Math.cos(theta + rotation)).toFixed(1)},${(cy + r * Math.sin(theta + rotation)).toFixed(1)}`);
  }
  return `M${points.join(' L')}`;
}

const LEFT_EYE = spiral(62, 34, 2.35, 4.1, 2.2);
const RIGHT_EYE = spiral(146, 34, 2.1, 3.7, 2.4);
const MOUTH =
  'M14,88 C6,108 12,118 34,112 C52,107 62,108 70,122 C82,146 90,160 104,160 C118,160 122,138 140,132 C156,127 168,138 176,124 C182,112 178,106 196,104 C210,102 212,92 210,78';

export default function Face({ size = 190, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 0.82}
      viewBox="0 0 224 184"
      fill="none"
      stroke="currentColor"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="G.O.A.T.-ansiktet"
    >
      <path d={LEFT_EYE} />
      <path d={RIGHT_EYE} />
      <path d={MOUTH} />
    </svg>
  );
}
