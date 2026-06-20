import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, ShieldCheck, Info, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BeforeAfter from '../components/BeforeAfter';
import CandidateCard from '../components/CandidateCard';
import Card from '../components/Card';
import { recommendAllocation } from '../lib/allocate';
import { teamSizeFor } from '../lib/engine';
import { ARCHETYPES, ARCHETYPE_META, colorOf } from '../lib/archetypes';
import { cn } from '../lib/format';

const METHOD = 'Score = 0.40·role-fit + 0.30·availability + 0.20·network-synergy − 0.15·burnout-risk';

function EmptySlot({ role, need }) {
  const meta = ARCHETYPE_META[role];
  const color = colorOf(role);
  return (
    <div className="panel-2 flex items-center gap-3 border-dashed p-3" style={{ borderColor: `${color}44` }}>
      <div className="h-10 w-10 rounded-xl border border-dashed" style={{ borderColor: `${color}66` }} />
      <div>
        <div className="text-sm font-medium" style={{ color }}>{meta.corp}</div>
        <div className="text-[11px] text-text-dim animate-pulse">needs {role.toLowerCase()} ×{need}</div>
      </div>
    </div>
  );
}

export default function DraftLab() {
  const { teams, employees, relationships, afterState, scoreboard, titanHealth, selectedProjectId, setSelectedProjectId, setOrgFixed, orgFixed } = useApp();
  const [applied, setApplied] = useState(orgFixed);
  const [workload, setWorkload] = useState(6);

  const project = teams.find((t) => t.id === selectedProjectId) || teams[0];
  const isHero = project.id === 't01';

  const heroBySlot = useMemo(() => Object.fromEntries(afterState.picks.map((p) => [p.slot, p])), [afterState]);
  const bestSlot = useMemo(() => afterState.picks.reduce((a, b) => (b.score > a.score ? b : a)).slot, [afterState]);

  // live engine for understaffed projects (workload-driven dynamic team size)
  const teamSize = teamSizeFor(workload);
  const live = useMemo(() => {
    if (isHero) return null;
    const pool = employees.filter((e) => e.utilization < 80);
    return recommendAllocation(project, pool, relationships, teamSize);
  }, [isHero, project, employees, relationships, teamSize]);
  // ranked-by-score order for display (engine returns slot/scarcity order)
  const rankedPicks = useMemo(() => [...(live?.picks || [])].sort((a, b) => b.score - a.score), [live]);

  const selectProject = (id) => {
    setSelectedProjectId(id);
    setApplied(id === 't01' ? orgFixed : false);
  };

  const runHero = () => {
    setApplied(true);
    setOrgFixed(true);
  };
  const reset = () => {
    setApplied(false);
    setOrgFixed(false);
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-text-hi">Draft Lab</h1>
        <p className="text-sm text-text-dim">Optimize a team comp the way you'd draft a winning MOBA squad.</p>
      </header>

      {/* project selector */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {teams.filter((t) => t.status !== 'bench').map((t) => {
          const active = t.id === project.id;
          return (
            <button
              key={t.id}
              onClick={() => selectProject(t.id)}
              className={cn('panel p-4 text-left transition', active ? 'border-cyan/50 shadow-glow' : 'hover:border-stroke')}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-hi">{t.name}</span>
                <span className={cn('chip text-[10px]', t.status === 'broken' ? 'text-bad' : 'text-text-mid')} style={{ borderColor: t.status === 'broken' ? '#FF4D6D55' : undefined }}>
                  {t.status}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-text-dim">{t.id === 't01' ? '5 executors, 0 coordination' : `${t.memberIds.length} staffed · needs a comp`}</p>
            </button>
          );
        })}
      </div>

      {isHero ? (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-text-hi">{applied ? 'Optimized comp — 1 of each role' : 'Current comp — 5 Core Executors'}</h3>
                <p className="text-xs text-text-dim">{applied ? 'Surplus executors redeployed to Pulse Platform.' : 'A losing meta: resource conflict, no coordination, burnout.'}</p>
              </div>
              {!applied ? (
                <button onClick={runHero} className="btn-primary text-base">
                  <Zap size={18} /> Auto-Draft Team
                </button>
              ) : (
                <button onClick={reset} className="chip text-text-mid hover:text-text-hi"><RotateCcw size={14} /> Replay</button>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {ARCHETYPES.map((role) => {
                const pick = heroBySlot[role];
                return (
                  <div key={role}>
                    <AnimatePresence mode="wait">
                      {applied && pick ? (
                        <motion.div key="filled" layout initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35 }}>
                          <CandidateCard pick={pick} best={role === bestSlot} />
                        </motion.div>
                      ) : (
                        <motion.div key="empty" exit={{ opacity: 0 }}>
                          <EmptySlot role={role} need={1} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Card>

          <BeforeAfter scoreboard={scoreboard} titanHealth={titanHealth} applied={applied} />

          <div className="flex items-start gap-2 rounded-xl border border-stroke bg-panel2/40 px-4 py-3 text-xs text-text-dim">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-good" />
            <p>
              <span className="text-text-mid">Transparent & fair by design.</span> {METHOD}. Demographic attributes (age, gender) are <span className="text-good">deliberately excluded</span> from scoring to prevent bias — only skills, availability and collaboration history count.
            </p>
          </div>
        </>
      ) : (
        // LIVE ENGINE for understaffed projects
        <>
          <Card title="Allocation Engine" subtitle="Dynamic team sizing from project workload">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <label className="label-xs">Project workload</label>
                <div className="mt-2 flex items-center gap-4">
                  <input type="range" min="1" max="10" value={workload} onChange={(e) => setWorkload(+e.target.value)} className="w-full accent-cyan" />
                  <span className="kpi w-10 text-xl text-cyan">{workload}</span>
                </div>
                <p className="mt-2 text-xs text-text-dim">Recommended team size: <span className="text-text-hi">{teamSize}</span> &nbsp;·&nbsp; ⌈workload / 2⌉ + 1</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-dim">
                <Sparkles size={14} className="text-violet" /> Live greedy allocation
              </div>
            </div>
          </Card>

          <Card title={`Recommended draft — ${project.name}`} subtitle="Ranked by composite score">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rankedPicks.map((pick, i) => (
                <CandidateCard key={pick.slot + i} pick={pick} best={i === 0} />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-stroke bg-panel2/40 px-4 py-3">
              <span className="text-sm text-text-mid">Projected team health</span>
              <span className="kpi text-lg font-bold text-good">{live?.before} → {live?.after} <span className="text-sm text-text-dim">(+{live?.healthDelta})</span></span>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-text-dim">
              <Info size={14} className="mt-0.5 shrink-0 text-cyan" />
              <p>{METHOD}. Age & gender excluded by design.</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
