import { Crown } from 'lucide-react';
import ArchetypeBadge from './ArchetypeBadge';
import { ARCHETYPE_META, colorOf } from '../lib/archetypes';
import { cn } from '../lib/format';

const BARS = [
  { key: 'fit', label: 'Role fit', color: '#2DE2E6' },
  { key: 'availability', label: 'Availability', color: '#34E5A1' },
  { key: 'synergy', label: 'Synergy', color: '#8B5CF6' },
];

const Avatar = ({ name, archetype }) => {
  const color = colorOf(archetype);
  const initials = (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
  return (
    <div
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold"
      style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {initials}
    </div>
  );
};

export default function CandidateCard({ pick, best = false }) {
  const { person, slot, status, score, breakdown } = pick;
  const slotColor = colorOf(slot);
  if (!person) {
    return (
      <div className="panel-2 flex items-center gap-3 border-dashed p-3 opacity-70">
        <div className="h-10 w-10 rounded-xl border border-dashed border-stroke" />
        <div className="text-sm text-text-dim">No candidate for {ARCHETYPE_META[slot]?.corp}</div>
      </div>
    );
  }
  return (
    <div
      className={cn('panel-2 p-3 transition', best && 'shadow-glow')}
      style={best ? { borderColor: '#FFD23F88' } : undefined}
    >
      <div className="flex items-center gap-3">
        <Avatar name={person.name} archetype={person.archetype} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-text-hi">{person.name}</span>
            {best && (
              <span className="chip gap-1 border-warn/50 text-warn" style={{ background: '#FFD23F14' }}>
                <Crown size={12} /> Best pick
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <ArchetypeBadge archetype={person.archetype} />
            <span className="text-[11px] text-text-dim">→ {ARCHETYPE_META[slot]?.corp} slot</span>
          </div>
        </div>
        <div className="text-right">
          <div className="kpi text-lg font-bold" style={{ color: slotColor }}>
            {Math.round(score * 100)}
          </div>
          <div className="label-xs">{status}</div>
        </div>
      </div>

      {breakdown && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {BARS.map((b) => (
            <div key={b.key}>
              <div className="mb-1 flex justify-between text-[10px] text-text-dim">
                <span>{b.label}</span>
                <span>{Math.round((breakdown[b.key] ?? 0) * 100)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-stroke">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, (breakdown[b.key] ?? 0) * 100))}%`, background: b.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {breakdown?.antiBurnout < 0 && (
        <p className="mt-2 text-[10px] text-bad">⚠ burnout penalty applied — currently over 90% utilization</p>
      )}
    </div>
  );
}
