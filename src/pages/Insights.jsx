import { Leaf, Coins, Flame, GitFork, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import StatCard from '../components/StatCard';

const TAG_COLOR = {
  Efficiency: '#2DD4BF',
  Wellbeing: '#34E5A1',
  ESG: '#5EEAD4',
  Resilience: '#FFC857',
};

function Tag({ t }) {
  const c = TAG_COLOR[t] || '#93A4C8';
  return <span className="chip text-[10px]" style={{ color: c, borderColor: `${c}55`, background: `${c}12` }}>{t}</span>;
}

const RECS = [
  { title: 'Break up Project Titan’s executor pile-up', impact: '+33 meta balance · 3 burnout risks defused', tags: ['Efficiency', 'Wellbeing'] },
  { title: 'Activate the Design silo (Wesley Goh)', impact: '+1 specialist into delivery · −1 idle FTE', tags: ['Efficiency', 'ESG'] },
  { title: 'Cap Maya Lim below 90% utilization', impact: 'Protect the org’s #1 connector from burnout', tags: ['Wellbeing'] },
  { title: 'De-risk the Sales↔Engineering bridge', impact: '−2 single points of failure', tags: ['Resilience'] },
];

export default function Insights() {
  const { scoreboard, projected, goTo } = useApp();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-text-hi">Sustainability Insights</h1>
        <p className="text-sm text-text-dim">Manpower is the most expensive resource — and the only one that suffers when wasted.</p>
      </header>

      <div className="panel flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-good/10 to-cyan/10 p-6">
        <div className="flex items-center gap-3">
          <Leaf size={26} className="text-good" />
          <div>
            <p className="text-lg font-semibold text-text-hi">Reclaim {projected.idleFteReclaimed} idle FTE and defuse 3 burnout risks — with zero new hires.</p>
            <p className="text-xs text-text-dim">A healthier team and more output from the same headcount.</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <div className="kpi text-2xl font-bold text-good">+{projected.outputGain}%</div>
            <div className="label-xs">output <span className="text-text-dim/70">(illustrative)</span></div>
          </div>
          <div>
            <div className="kpi text-2xl font-bold text-cyan">{projected.costAvoided}</div>
            <div className="label-xs">cost avoided <span className="text-text-dim/70">(illustrative)</span></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Idle Capacity" value={scoreboard.idle.before} unit="%" tone="warn" icon={Coins} sub={`→ ${scoreboard.idle.after}% after re-draft`} />
        <StatCard label="Burnout Flags" value={scoreboard.burnout.before} tone="bad" icon={Flame} sub={`→ ${scoreboard.burnout.after} after re-draft`} />
        <StatCard label="Single Points of Failure" value={scoreboard.spof.before} tone="violet" icon={GitFork} sub={`→ ${scoreboard.spof.after} after re-draft`} />
        <StatCard label="Manpower Waste" value={scoreboard.waste.before} unit="%" tone="bad" icon={TrendingUp} sub={`→ ${scoreboard.waste.after}% after re-draft`} />
      </div>

      <Card title="Recommended Actions" subtitle="Prioritized, quantified, sustainability-tagged">
        <div className="grid gap-3 sm:grid-cols-2">
          {RECS.map((r) => (
            <div key={r.title} className="panel-2 p-4">
              <div className="flex items-start gap-2">
                <Sparkles size={15} className="mt-0.5 shrink-0 text-cyan" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-hi">{r.title}</p>
                  <p className="mt-0.5 text-xs text-good">{r.impact}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{r.tags.map((t) => <Tag key={t} t={t} />)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => goTo('draft', { project: 't01' })} className="btn-primary mt-4 text-sm">
          Run the re-draft <ArrowRight size={15} />
        </button>
      </Card>

      <p className="text-center text-xs text-text-dim">SDG 8 · Decent Work & Economic Growth — DraftBoard AI turns Organizational Network Analysis into a playable draft.</p>
    </div>
  );
}
