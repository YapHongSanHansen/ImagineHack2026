import { ARCHETYPE_META, colorOf } from '../lib/archetypes';
import { cn } from '../lib/format';

// Colored pill using inline HEX (sidesteps Tailwind purge for dynamic colors).
export default function ArchetypeBadge({ archetype, size = 'sm', showCorp = true, className = '' }) {
  const meta = ARCHETYPE_META[archetype];
  const color = colorOf(archetype);
  if (!meta) return null;
  const big = size === 'lg';
  return (
    <span
      className={cn('chip', big && 'px-3 py-1.5 text-sm', className)}
      style={{ borderColor: `${color}55`, background: `${color}14`, color }}
      title={`${meta.mlbb} → ${meta.corp}`}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {showCorp ? meta.corp : meta.mlbb}
    </span>
  );
}
