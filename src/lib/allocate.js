// Transparent, deterministic allocation engine ("graph-ML-inspired", not a trained net).
// The demo path uses the pre-baked afterState.json; this is the real, explainable
// engine shown in tooltips and available for the live "re-run" path.
import { PARTIAL_MATCH, ARCHETYPES, normalizeComp } from './archetypes';
import { edgeWeightMap, teamHealth, byId } from './analysis';
import { mean, clamp } from './format';

const wOf = (m, a, b) => m.get(`${a}|${b}`) ?? 0;

export function scoreCandidate(person, targetArch, chosen, wm) {
  const fit = PARTIAL_MATCH[person.archetype]?.[targetArch] ?? 0.2;
  const availability = (100 - person.utilization) / 100;
  const synergy = chosen.length === 0 ? 0.5 : mean(chosen.map((c) => wOf(wm, person.id, c.id)));
  const overloadPen = person.utilization > 90 ? 1 : 0;
  const score = 0.4 * fit + 0.3 * availability + 0.2 * synergy - 0.15 * overloadPen;
  return {
    score: clamp(score, 0, 1),
    breakdown: { fit, availability, synergy, antiBurnout: -0.15 * overloadPen },
  };
}

// Greedy, scarcity-ordered, deterministic allocation.
export function recommendAllocation(team, pool, edges) {
  const wm = edgeWeightMap(edges);
  const need = normalizeComp(team.requiredComposition);
  const slots = [];
  for (const a of ARCHETYPES) for (let i = 0; i < need[a]; i++) slots.push(a);

  // scarcity: slots with fewest decent candidates get first pick
  const decentCount = (arch) => pool.filter((p) => (PARTIAL_MATCH[p.archetype]?.[arch] ?? 0) >= 0.5).length;
  slots.sort((a, b) => decentCount(a) - decentCount(b));

  const used = new Set();
  const chosen = [];
  const picks = [];
  for (const slot of slots) {
    let best = null;
    for (const p of pool) {
      if (used.has(p.id)) continue;
      const s = scoreCandidate(p, slot, chosen, wm);
      if (
        !best ||
        s.score > best.score + 1e-9 ||
        (Math.abs(s.score - best.score) < 1e-9 &&
          (p.utilization < best.person.utilization ||
            (p.utilization === best.person.utilization && p.id < best.person.id)))
      ) {
        best = { slot, person: p, ...s };
      }
    }
    if (best) {
      used.add(best.person.id);
      chosen.push(best.person);
      picks.push({ slot, status: best.person.archetype === slot ? 'DRAFTED' : 'FLEX', person: best.person, score: best.score, breakdown: best.breakdown });
    } else {
      picks.push({ slot, status: 'UNFILLED', person: null, score: 0, breakdown: null });
    }
  }

  const peopleById = byId(pool);
  const before = teamHealth(team, peopleById, edges);
  const afterTeam = { ...team, memberIds: chosen.map((c) => c.id) };
  const after = teamHealth(afterTeam, byId(chosen), edges);
  return { picks, before: before.score, after: after.score, healthDelta: Math.round(after.score - before.score) };
}
