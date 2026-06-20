import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Cpu, Scale, Sparkles, Users, Briefcase } from 'lucide-react';
import { useApp } from '../context/AppContext';
import NetworkGraph from '../components/NetworkGraph';
import Card from '../components/Card';
import ArchetypeBadge from '../components/ArchetypeBadge';
import { runAllocation, teamSizeFor, parseGoalToVector, SKILL_DIMS } from '../lib/engine';
import { colorOf } from '../lib/archetypes';
import { cn } from '../lib/format';

const PRESETS = [
  'Launch a mobile payments app on a tight timeline',
  'Redesign the onboarding UX with user research',
  'Scale the data platform reliability and deployment',
  'Run a go-to-market sales launch for Q3',
];

const DIM_COLOR = ['#2DE2E6', '#FFD23F', '#F637EC', '#34E5A1'];
const DEPT_ORDER = ['Engineering', 'Product', 'Design', 'Sales', 'Operations'];

export default function Engine() {
  const { employees, synergyOf, graph } = useApp();
  const [goal, setGoal] = useState(PRESETS[0]);
  const [workload, setWorkload] = useState(6);
  const [balance, setBalance] = useState(false);
  const [result, setResult] = useState(null);

  const preview = useMemo(() => parseGoalToVector(goal).normalized, [goal]);
  const size = teamSizeFor(workload);

  const departments = useMemo(() => {
    const present = [...new Set(employees.map((e) => e.department))];
    return [...DEPT_ORDER.filter((d) => present.includes(d)), ...present.filter((d) => !DEPT_ORDER.includes(d))];
  }, [employees]);

  const run = () => setResult(runAllocation({ goal, workload, employees, synergyOf, balance }));

  const memberByDept = (dept) => (result?.members || []).filter((m) => m.employee.department === dept);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-text-hi">Allocation Engine</h1>
        <p className="text-sm text-text-dim">Describe the project. The engine drafts the optimal team from skills, availability & collaboration history.</p>
      </header>

      {/* TOP CONTROL PANEL */}
      <Card>
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div>
            <label className="label-xs">Project goal</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              className="mt-2 w-full resize-none rounded-xl border border-stroke bg-panel2/60 px-3 py-2.5 text-sm text-text-hi outline-none focus:border-cyan/50"
              placeholder="e.g. Launch a mobile payments app on a tight timeline"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => setGoal(p)} className={cn('chip text-[11px] transition', goal === p ? 'border-cyan/50 text-cyan' : 'text-text-dim hover:text-text-mid')}>
                  {p.split(' ').slice(0, 3).join(' ')}…
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-xs">Project workload</label>
                <div className="mt-2 flex items-center gap-3">
                  <input type="range" min="1" max="10" value={workload} onChange={(e) => setWorkload(+e.target.value)} className="w-full accent-cyan" />
                  <span className="kpi w-8 text-lg text-cyan">{workload}</span>
                </div>
                <p className="mt-1 text-[11px] text-text-dim">Team size: <span className="text-text-hi">{size}</span> · ⌈workload/2⌉+1</p>
              </div>
              <div className="flex flex-col justify-between">
                <label className="label-xs">Fairness</label>
                <button onClick={() => setBalance((b) => !b)} className={cn('mt-2 flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition', balance ? 'border-good/50 text-good' : 'border-stroke text-text-mid')}>
                  <span className="flex items-center gap-2"><Scale size={15} /> Age/experience balancing</span>
                  <span className={cn('h-4 w-7 rounded-full p-0.5 transition', balance ? 'bg-good/40' : 'bg-stroke')}>
                    <span className={cn('block h-3 w-3 rounded-full bg-text-hi transition', balance && 'translate-x-3')} />
                  </span>
                </button>
              </div>
            </div>

            <button onClick={run} className="btn-primary mt-4 w-full text-base">
              <Play size={18} /> Run AI Allocation Engine
            </button>
          </div>

          {/* target vector + result metrics */}
          <div className="rounded-xl border border-stroke bg-panel2/40 p-4">
            <div className="label-xs flex items-center gap-1.5"><Cpu size={13} /> Target skill vector</div>
            <div className="mt-3 space-y-2.5">
              {SKILL_DIMS.map((d, i) => (
                <div key={d}>
                  <div className="mb-1 flex justify-between text-[11px]"><span className="text-text-mid">{d}</span><span className="text-text-dim">{Math.round(preview[i] * 100)}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-stroke">
                    <motion.div className="h-full rounded-full" style={{ background: DIM_COLOR[i] }} animate={{ width: `${preview[i] * 100}%` }} transition={{ duration: 0.4 }} />
                  </div>
                </div>
              ))}
            </div>
            {result && (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-stroke pt-3">
                <div><div className="kpi text-xl text-cyan">{Math.round(result.avgCapability * 100)}</div><div className="label-xs">avg fit</div></div>
                <div><div className="kpi text-xl text-good">{result.teamSentiment.toFixed(2)}</div><div className="label-xs">team synergy</div></div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* MIDDLE WEB GRAPH */}
      <Card title="Collaboration Web" subtitle={result ? 'Drafted team highlighted — links glow within the chosen cluster' : 'All employees & past collaboration channels'} right={<span className="text-[11px] text-text-dim">● size = centrality</span>}>
        <div className="relative h-[440px] overflow-hidden rounded-xl">
          <NetworkGraph graph={graph} highlightIds={result?.ids || null} selectedId={null} onSelect={() => {}} />
        </div>
      </Card>

      {/* BOTTOM RECOMMENDATION COLUMNS */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Users size={16} className="text-cyan" />
          <h3 className="text-sm font-semibold text-text-hi">{result ? `Recommended squad — ${result.size} members` : 'Recommended squad'}</h3>
          {!result && <span className="text-xs text-text-dim">— run the engine to draft a team</span>}
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {departments.map((dept) => {
            const members = memberByDept(dept);
            return (
              <div key={dept} className="panel p-3">
                <div className="label-xs mb-2 border-b border-stroke pb-2">{dept}</div>
                <div className="space-y-2">
                  {members.length === 0 && <p className="py-3 text-center text-[11px] text-text-dim">—</p>}
                  {members.map((m, i) => (
                    <motion.div
                      key={m.employee.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="panel-2 p-2.5"
                      style={{ borderColor: `${colorOf(m.employee.archetype)}44` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-text-hi">{m.employee.name}</span>
                        <span className="kpi text-sm font-bold" style={{ color: colorOf(m.employee.archetype) }}>{Math.round(m.capability * 100)}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-text-dim"><Briefcase size={10} /> {m.employee.job_title}</div>
                      <div className="mt-2 rounded-lg bg-cyan/10 px-2 py-1 text-[10px] text-cyan">{m.task}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
