import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import RingGauge from './RingGauge';
import CountUp from './CountUp';
import { cn } from '../lib/format';

function MetricDelta({ m, applied }) {
  const cur = applied ? m.after : m.before;
  const improved = m.betterWhenLow ? m.after < m.before : m.after > m.before;
  const tone = applied ? (improved ? 'text-good' : 'text-bad') : 'text-text-mid';
  return (
    <div className="panel-2 flex items-center justify-between px-4 py-3">
      <span className="label-xs">{m.label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-dim line-through decoration-text-dim/50">
          {m.before}
          {m.unit}
        </span>
        <ArrowRight size={14} className="text-text-dim" />
        <span className={cn('kpi text-lg font-bold', tone)}>
          <CountUp value={cur} />
          {m.unit}
        </span>
      </div>
    </div>
  );
}

export default function BeforeAfter({ scoreboard, titanHealth, applied }) {
  const metrics = [scoreboard.waste, scoreboard.idle, scoreboard.burnout, scoreboard.meta];
  const wasteCut = Math.round(((scoreboard.waste.before - scoreboard.waste.after) / scoreboard.waste.before) * 100);
  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <div className="panel flex flex-col items-center justify-center gap-3 p-5">
        <span className="label-xs">Project Titan — Team Health</span>
        <RingGauge value={applied ? titanHealth.after : titanHealth.before} tone={applied ? 'good' : 'bad'} big size={148} />
        <div className={cn('chip', applied ? 'text-good' : 'text-bad')} style={{ borderColor: applied ? '#34E5A155' : '#FF4D6D55' }}>
          {applied ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {applied ? `+${titanHealth.after - titanHealth.before} health` : 'Broken comp'}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {metrics.map((m) => (
          <MetricDelta key={m.key} m={m} applied={applied} />
        ))}
        <div className="panel sm:col-span-2 flex items-center justify-between bg-gradient-to-br from-cyan/10 to-violet/10 px-5 py-4">
          <span className="text-sm font-medium text-text-mid">Manpower waste reduced</span>
          <span className="kpi text-3xl font-black grad-text">
            {applied ? <>−<CountUp value={wasteCut} />%</> : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
