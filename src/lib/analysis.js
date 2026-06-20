// Pure analysis functions: team health, ONA centrality (with a real
// articulation-point / SPOF check), and waste metrics. No React in here.
import { ARCHETYPES, IDEAL_COMP, PARTIAL_MATCH } from './archetypes';
import { clamp, mean, stdev } from './format';

// ---- helpers ----
export const byId = (people) => Object.fromEntries(people.map((p) => [p.id, p]));

export const edgeWeightMap = (edges) => {
  const m = new Map();
  for (const e of edges) {
    m.set(`${e.source}|${e.target}`, e.weight);
    m.set(`${e.target}|${e.source}`, e.weight);
  }
  return m;
};
const wOf = (m, a, b) => m.get(`${a}|${b}`) ?? 0;

const compCounts = (members) => {
  const c = { JUNGLER: 0, GOLD: 0, EXP: 0, MID: 0, ROAM: 0 };
  for (const m of members) if (c[m.archetype] != null) c[m.archetype] += 1;
  return c;
};

// ---- team health (0–100) ----
export function teamHealth(team, peopleById, edges) {
  const members = (team.memberIds || []).map((id) => peopleById[id]).filter(Boolean);
  const empty = { score: 0, breakdown: { compBalance: 0, skillCoverage: 0, synergy: 0, utilBalance: 0 } };
  if (!members.length) return empty;

  const n = members.length;
  const counts = compCounts(members);

  // composition balance vs uniform 20%-each ideal (1-each → 100, 5-of-one → 20)
  const tvd = 0.5 * ARCHETYPES.reduce((s, a) => s + Math.abs(counts[a] / n - 0.2), 0);
  const compBalance = clamp(100 * (1 - tvd));

  // skill/role coverage: for each ideal role, best matching member
  const skillCoverage =
    100 *
    mean(
      ARCHETYPES.map((role) => Math.max(...members.map((m) => PARTIAL_MATCH[m.archetype]?.[role] ?? 0)))
    );

  // internal synergy: mean collaboration weight over member pairs (missing edge → 0)
  const wm = edgeWeightMap(edges);
  const pairs = [];
  for (let i = 0; i < members.length; i++)
    for (let j = i + 1; j < members.length; j++) pairs.push(wOf(wm, members[i].id, members[j].id));
  const synergy = 100 * (pairs.length ? mean(pairs) : 0.5);

  const utilBalance = clamp(100 - stdev(members.map((m) => m.utilization)));

  const score = clamp(0.35 * compBalance + 0.25 * skillCoverage + 0.25 * synergy + 0.15 * utilBalance);
  return {
    score,
    breakdown: {
      compBalance: Math.round(compBalance),
      skillCoverage: Math.round(skillCoverage),
      synergy: Math.round(synergy),
      utilBalance: Math.round(utilBalance),
    },
  };
}

// ---- connectivity / articulation ----
const adjacency = (ids, edges, exclude = null) => {
  const adj = new Map(ids.filter((id) => id !== exclude).map((id) => [id, new Set()]));
  for (const e of edges) {
    if (e.source === exclude || e.target === exclude) continue;
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source).add(e.target);
      adj.get(e.target).add(e.source);
    }
  }
  return adj;
};
const countComponents = (adj) => {
  const seen = new Set();
  let comps = 0;
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    comps += 1;
    const stack = [start];
    while (stack.length) {
      const v = stack.pop();
      if (seen.has(v)) continue;
      seen.add(v);
      for (const nb of adj.get(v)) if (!seen.has(nb)) stack.push(nb);
    }
  }
  return comps;
};

// ---- centrality for every node (degree, weighted degree, articulation, score) ----
export function centralityAll(people, edges) {
  const ids = people.map((p) => p.id);
  const base = countComponents(adjacency(ids, edges));
  const deg = Object.fromEntries(ids.map((id) => [id, 0]));
  const wdeg = Object.fromEntries(ids.map((id) => [id, 0]));
  for (const e of edges) {
    if (deg[e.source] != null) {
      deg[e.source] += 1;
      wdeg[e.source] += e.weight;
    }
    if (deg[e.target] != null) {
      deg[e.target] += 1;
      wdeg[e.target] += e.weight;
    }
  }
  const maxDeg = Math.max(1, ...Object.values(deg));
  const maxW = Math.max(1, ...Object.values(wdeg));

  const out = {};
  for (const id of ids) {
    const isArticulation = countComponents(adjacency(ids, edges, id)) > base;
    const score = 100 * (0.5 * (deg[id] / maxDeg) + 0.3 * (wdeg[id] / maxW) + 0.2 * (isArticulation ? 1 : 0));
    out[id] = { degree: deg[id], weightedDegree: Math.round(wdeg[id] * 10) / 10, isArticulation, score: Math.round(score) };
  }
  return out;
}

// ---- waste metrics ----
export function wasteMetrics(members) {
  if (!members.length)
    return { idlePct: 0, idleCount: 0, overloadCount: 0, redundancy: 0, headline: 0 };
  const n = members.length;
  const idlePct = mean(members.map((m) => Math.max(0, 100 - m.utilization)));
  const idleCount = members.filter((m) => m.utilization < 40).length;
  const overloadCount = members.filter((m) => m.utilization > 90).length;
  const counts = compCounts(members);
  const redundancy = ARCHETYPES.reduce((s, a) => s + Math.max(0, counts[a] - (IDEAL_COMP[a] || 0)), 0);
  const overloadShare = (overloadCount / n) * 100;
  const redundancyShare = (redundancy / n) * 100;
  const headline = clamp(0.4 * idlePct + 0.3 * overloadShare + 0.3 * redundancyShare);
  return {
    idlePct: Math.round(idlePct),
    idleCount,
    overloadCount,
    redundancy,
    headline: Math.round(headline),
  };
}
