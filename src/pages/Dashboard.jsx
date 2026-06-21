import { AlertTriangle, Flame, Activity, Coins, Scale, ArrowRight, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import RadarComp from '../components/RadarComp';
import RingGauge from '../components/RingGauge';
import { orgMixData } from '../lib/compScore';
import { colorOf, ARCHETYPE_META } from '../lib/archetypes';
import { healthTone, cn } from '../lib/format';

const HEALTH_TEXT = { good: 'text-good', warn: 'text-warn', bad: 'text-bad' };

const TEAM_STATUS = {
  broken: { label: 'Broken', tone: 'text-bad', bg: '#FF4D6D14' },
  strained: { label: 'Strained', tone: 'text-warn', bg: '#FFC85714' },
  healthy: { label: 'Healthy', tone: 'text-good', bg: '#34E5A114' },
  understaffed: { label: 'Understaffed', tone: 'text-text-mid', bg: '#93A4C814' },
  bench: { label: 'Bench', tone: 'text-text-dim', bg: '#56688F14' },
};

function CompDots({ memberIds, peopleById }) {
  return (
    <div className="flex gap-1">
      {memberIds.map((id) => {
        const p = peopleById[id];
        if (!p) return null;
        return <span key={id} className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf(p.archetype) }} title={`${p.name} · ${ARCHETYPE_META[p.archetype].corp}`} />;
      })}
      {memberIds.length === 0 && <span className="text-[11px] text-text-dim">empty</span>}
    </div>
  );
}

export default function Dashboard() {
  const { employees, teams, peopleById, scoreboard, teamHealthById, orgFixed, goTo, titanHealth, afterState } = useApp();
  const sb = scoreboard;
  const v = (m) => (orgFixed ? m.after : m.before);
  const tone = (kind) => (orgFixed ? 'good' : kind);

  // effective utilization reflects the re-draft once the org is optimized
  const effUtil = (e) => (orgFixed && afterState.utilAfter[e.id] != null ? afterState.utilAfter[e.id] : e.utilization);
  const burnout = employees.filter((e) => effUtil(e) > 90).sort((a, b) => effUtil(b) - effUtil(a));
  const mix = orgMixData(employees);
  const nonBenchTeams = teams.filter((t) => t.status !== 'bench');
  const avgHealth = Math.round(nonBenchTeams.reduce((s, t) => s + (teamHealthById[t.id]?.score ?? 0), 0) / (nonBenchTeams.length || 1));
  const orgHealth = orgFixed ? 86 : avgHealth;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-hi">Workforce Command</h1>
          <p className="text-sm text-text-dim">Live manpower allocation across {nonBenchTeams.length} teams · {employees.length} people</p>
        </div>
        <div className={cn('chip', orgFixed ? 'text-good' : 'text-bad')} style={{ borderColor: orgFixed ? '#34E5A155' : '#FF4D6D55' }}>
          <span className={cn('h-2 w-2 rounded-full', orgFixed ? 'bg-good' : 'bg-bad animate-pulse')} />
          {orgFixed ? 'Optimized' : 'Waste detected'}
        </div>
      </header>

      {/* Bad-comp banner */}
      {!orgFixed && (
        <button
          onClick={() => goTo('draft', { project: 't01' })}
          className="group flex w-full items-center gap-3 rounded-2xl border border-bad/40 bg-bad/10 px-5 py-3.5 text-left shadow-glowBad"
        >
          <AlertTriangle size={20} className="shrink-0 text-bad" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-hi">Project Titan is running a losing comp: 5 Core Executors, 0 Facilitator.</p>
            <p className="text-xs text-text-mid">Resource conflict, zero coordination, 3 people in burnout. Click to re-draft →</p>
          </div>
          <ArrowRight size={18} className="text-bad transition group-hover:translate-x-1" />
        </button>
      )}

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={sb.waste.label} value={v(sb.waste)} unit="%" tone={tone('bad')} hero={!orgFixed} icon={Activity} sub="0.4·idle + 0.3·overload + 0.3·redundancy" />
        <StatCard label={sb.idle.label} value={v(sb.idle)} unit="%" tone={tone('warn')} icon={Coins} sub="unused capacity across org" />
        <StatCard label={sb.burnout.label} value={v(sb.burnout)} tone={tone('bad')} icon={Flame} sub="people over 90% utilization" />
        <StatCard label={sb.meta.label} value={v(sb.meta)} tone={tone('violet')} icon={Scale} sub="role-composition balance" />
      </div>

      {/* Mix + health */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Meta Balance" subtitle="Org archetype mix vs ideal (20% each)" className="lg:col-span-2">
          <RadarComp
            data={mix}
            angleKey="role"
            domain={[0, 40]}
            series={[
              { key: 'current', name: 'Current mix %', color: '#10E5A1', fillOpacity: 0.25 },
              { key: 'ideal', name: 'Balanced ideal %', color: '#2DD4BF', dashed: true, fillOpacity: 0.05 },
            ]}
          />
        </Card>
        <Card title="Org Health" subtitle="Weighted across all teams">
          <div className="grid place-items-center py-3">
            <RingGauge value={orgHealth} tone={orgFixed ? 'good' : 'warn'} big size={150} label="health" />
          </div>
        </Card>
      </div>

      {/* Teams + burnout */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Teams" subtitle="Composition & health">
          <div className="space-y-2">
            {nonBenchTeams.map((t) => {
              const st = TEAM_STATUS[t.status] || TEAM_STATUS.bench;
              const h = Math.round(teamHealthById[t.id]?.score ?? 0);
              const heroFixed = orgFixed && t.id === 't01';
              const shown = heroFixed ? titanHealth.after : h;
              return (
                <button
                  key={t.id}
                  onClick={() => goTo('draft', { project: t.id })}
                  className="flex w-full items-center gap-3 rounded-xl border border-stroke bg-panel2/40 px-3.5 py-2.5 text-left transition hover:border-cyan/40"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-hi">{t.name}</span>
                      <span className={cn('chip text-[10px]', st.tone)} style={{ background: st.bg, borderColor: 'transparent' }}>
                        {heroFixed ? 'Healthy' : st.label}
                      </span>
                    </div>
                    <div className="mt-1.5"><CompDots memberIds={heroFixed ? afterState.picks.map((p) => p.person.id) : t.memberIds} peopleById={peopleById} /></div>
                  </div>
                  <div className="text-right">
                    <div className={cn('kpi text-lg font-bold', HEALTH_TEXT[healthTone(shown)])}>{shown}</div>
                    <div className="label-xs">health</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Burnout Watchlist" subtitle="People over 90% utilization" right={<Flame size={16} className="text-bad" />}>
          <div className="space-y-2">
            {burnout.map((e) => (
              <button
                key={e.id}
                onClick={() => goTo('network', { node: e.id })}
                className="flex w-full items-center gap-3 rounded-xl border border-stroke bg-panel2/40 px-3.5 py-2.5 text-left transition hover:border-bad/40"
              >
                <ShieldAlert size={16} className="text-bad" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-hi">{e.name}</div>
                  <div className="text-[11px] text-text-dim">{ARCHETYPE_META[e.archetype].corp} · {e.department}</div>
                </div>
                <div className="kpi text-base font-bold text-bad">{effUtil(e)}%</div>
              </button>
            ))}
            {burnout.length === 0 && <p className="text-sm text-good">All clear — no burnout risks.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
