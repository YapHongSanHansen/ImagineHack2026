import { Radar as RadarIcon, Crown, EyeOff, GitFork, ArrowRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import NetworkGraph from '../components/NetworkGraph';
import RadarComp from '../components/RadarComp';
import ArchetypeBadge from '../components/ArchetypeBadge';
import Card from '../components/Card';
import { statRadarData } from '../lib/compScore';
import { ARCHETYPE_META, colorOf } from '../lib/archetypes';
import { avatarUrl } from '../lib/avatar';
import { utilTone, cn } from '../lib/format';

const UTIL_TEXT = { good: 'text-good', warn: 'text-warn', bad: 'text-bad' };

const CALLOUTS = [
  { tag: 'HUB', icon: Crown, color: '#2DE2E6', title: 'The Hub', desc: 'Holds the org together across every department — and is pinned at 97% utilization. Central + overloaded = burnout risk and a knowledge bottleneck.' },
  { tag: 'SPOF', icon: GitFork, color: '#FF4D6D', title: 'Single Point of Failure', desc: 'The only bridge between Sales and Engineering. Remove this person and the network splits — Sales loses all engineering context overnight.' },
  { tag: 'SILO', icon: EyeOff, color: '#FFC857', title: 'The Silo', desc: 'One weak connection, 28% utilization. The Design pod is invisible to the rest of the org — idle and disconnected.' },
];

export default function SuspectBoard() {
  const { graph, peopleById, centrality, relationships, selectedNodeId, setSelectedNodeId, goTo } = useApp();
  const sel = selectedNodeId ? peopleById[selectedNodeId] : null;
  const ins = graph.insights;

  const connections = sel
    ? relationships
        .filter((e) => e.source === sel.id || e.target === sel.id)
        .map((e) => ({ other: peopleById[e.source === sel.id ? e.target : e.source], weight: e.weight, type: e.type }))
        .sort((a, b) => b.weight - a.weight)
    : [];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-hi">Suspect Board</h1>
          <p className="text-sm text-text-dim">Organizational Network Analysis — who really holds the org together.</p>
        </div>
        <div className="flex gap-2 text-[11px] text-text-dim">
          <span className="chip">● size = centrality</span>
          <span className="chip">— edge = collaboration</span>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="panel relative h-[560px] overflow-hidden lg:col-span-2">
          <NetworkGraph graph={graph} selectedId={selectedNodeId} onSelect={setSelectedNodeId} />
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {CALLOUTS.map((c) => (
              <span key={c.tag} className="chip text-[10px]" style={{ borderColor: `${c.color}55`, color: c.color, background: `${c.color}10` }}>
                <c.icon size={11} /> {c.tag}: {peopleById[ins[c.tag.toLowerCase()]]?.name}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {!sel &&
            CALLOUTS.map((c) => {
              const pid = ins[c.tag.toLowerCase()];
              const p = peopleById[pid];
              if (!p) return null;
              return (
                <button
                  key={c.tag}
                  onClick={() => setSelectedNodeId(pid)}
                  className="panel w-full p-4 text-left transition hover:border-cyan/40"
                  style={{ borderColor: `${c.color}33` }}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <c.icon size={16} style={{ color: c.color }} />
                    <span className="text-sm font-semibold" style={{ color: c.color }}>{c.title}</span>
                    <span className="ml-auto text-xs text-text-mid">{p?.name}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-text-dim">{c.desc}</p>
                </button>
              );
            })}

          {sel && (
            <Card
              title="Person Profile"
              right={
                <button onClick={() => setSelectedNodeId(null)} className="text-text-dim hover:text-text-hi"><X size={16} /></button>
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 shrink-0 rounded-xl bg-cover bg-center"
                  style={{ backgroundColor: `${colorOf(sel.archetype)}22`, border: `1px solid ${colorOf(sel.archetype)}55`, backgroundImage: `url(${avatarUrl(sel.id)})` }}
                  title={sel.name}
                />
                <div>
                  <div className="text-base font-semibold text-text-hi">{sel.name}</div>
                  <div className="text-xs text-text-dim">{sel.department}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ArchetypeBadge archetype={sel.archetype} />
                <span className={cn('chip', UTIL_TEXT[utilTone(sel.utilization)])}>{sel.utilization}% util</span>
                {centrality[sel.id]?.isArticulation && <span className="chip text-bad" style={{ borderColor: '#FF4D6D55' }}><GitFork size={12} /> SPOF</span>}
              </div>

              <div className="mt-2">
                <div className="label-xs mb-1 flex items-center gap-1"><RadarIcon size={12} /> Stat fingerprint</div>
                <RadarComp data={statRadarData(sel)} angleKey="axis" domain={[0, 100]} height={200} series={[{ key: 'value', name: sel.name, color: colorOf(sel.archetype), fillOpacity: 0.3 }]} />
              </div>

              <div className="mt-1">
                <div className="label-xs mb-2">Connections ({connections.length})</div>
                <div className="space-y-1.5">
                  {connections.map((c) => (
                    <div key={c.other?.id} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ background: colorOf(c.other?.archetype) }} />
                      <span className="flex-1 text-text-mid">{c.other?.name}</span>
                      <span className="text-text-dim">{c.type}</span>
                      <span className="kpi text-text-hi">{c.weight.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => goTo('draft', { project: 't01' })} className="btn-primary mt-4 w-full text-sm">
                Re-draft in Draft Lab <ArrowRight size={15} />
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
