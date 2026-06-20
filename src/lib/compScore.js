// Recharts radar data builders.
import { ARCHETYPES, ARCHETYPE_META, STAT_AXES, IDEAL_COMP } from './archetypes';

// Composition radar: current role counts vs the ideal "meta" (1 each).
export function compRadarData(members) {
  const counts = { JUNGLER: 0, GOLD: 0, EXP: 0, MID: 0, ROAM: 0 };
  for (const m of members) if (counts[m.archetype] != null) counts[m.archetype] += 1;
  return ARCHETYPES.map((a) => ({
    role: ARCHETYPE_META[a].corp.split(' ')[0], // short label
    roleKey: a,
    current: counts[a],
    ideal: IDEAL_COMP[a] || 0,
  }));
}

// Org-wide archetype mix vs balanced ideal (scaled to the team count of 5 roles).
export function orgMixData(people) {
  const counts = { JUNGLER: 0, GOLD: 0, EXP: 0, MID: 0, ROAM: 0 };
  for (const m of people) if (counts[m.archetype] != null) counts[m.archetype] += 1;
  const total = people.length || 1;
  const idealFrac = 100 / 5;
  return ARCHETYPES.map((a) => ({
    role: ARCHETYPE_META[a].mlbb,
    roleKey: a,
    current: Math.round((counts[a] / total) * 100),
    ideal: Math.round(idealFrac),
  }));
}

// Individual stat fingerprint (0–100 across the 5 axes).
export function statRadarData(person) {
  return STAT_AXES.map((axis) => ({
    axis: axis.charAt(0).toUpperCase() + axis.slice(1),
    value: person.stats?.[axis] ?? 0,
  }));
}
