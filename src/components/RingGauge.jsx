import { cn } from '../lib/format';

const TONE = { good: '#34E5A1', warn: '#FFC857', bad: '#FF4D6D', cyan: '#2DE2E6', violet: '#8B5CF6' };

export default function RingGauge({ value = 0, size = 132, stroke = 11, tone = 'cyan', label, big }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const offset = c * (1 - v / 100);
  const color = TONE[tone] || TONE.cyan;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1F2A40" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 6px ${color}aa)` }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={cn('kpi font-bold', big ? 'text-3xl' : 'text-2xl')} style={{ color }}>
          {Math.round(v)}
        </div>
        {label && <div className="label-xs mt-0.5">{label}</div>}
      </div>
    </div>
  );
}
