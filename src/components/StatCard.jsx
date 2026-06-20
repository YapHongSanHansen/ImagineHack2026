import { cn } from '../lib/format';
import CountUp from './CountUp';

const TONE = {
  cyan: 'text-cyan',
  violet: 'text-violet',
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
  hi: 'text-text-hi',
};

export default function StatCard({ label, value, unit = '', tone = 'cyan', hero = false, icon: Icon, sub, decimals = 0 }) {
  return (
    <div
      className={cn(
        'panel relative overflow-hidden p-5',
        hero && 'border-bad/40 shadow-glowBad animate-pulseRing'
      )}
    >
      {hero && (
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-bad/10 blur-2xl" />
      )}
      <div className="flex items-center justify-between">
        <span className="label-xs">{label}</span>
        {Icon && <Icon size={16} className={cn(TONE[tone], 'opacity-80')} />}
      </div>
      <div className={cn('kpi mt-2 text-4xl', TONE[tone])}>
        <CountUp value={value} decimals={decimals} />
        <span className="ml-0.5 text-2xl opacity-80">{unit}</span>
      </div>
      {sub && <p className="mt-1 text-xs text-text-dim">{sub}</p>}
    </div>
  );
}
