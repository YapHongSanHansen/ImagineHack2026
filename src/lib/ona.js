// Transform employees + relationships into a force-graph {nodes, links} payload,
// and tag the three narrative nodes (HUB / SILO / SPOF) with pinned positions.
import { centralityAll } from './analysis';
import { colorOf } from './archetypes';

// Pinned coordinates so the force layout never scatters the hero nodes illegibly.
const PIN = {
  HUB: { fx: 0, fy: 0 },
  SPOF: { fx: -190, fy: 40 },
  SILO: { fx: 180, fy: 165 },
};

export function buildGraph(people, edges) {
  const cen = centralityAll(people, edges);

  // hub = highest degree; silo = lowest degree (<=1); spof = articulation point with highest degree
  let hub = people[0]?.id;
  let silo = people[0]?.id;
  for (const p of people) {
    const c = cen[p.id];
    // hub: highest degree, tie-break by weighted degree
    if (c.degree > cen[hub].degree || (c.degree === cen[hub].degree && c.weightedDegree > cen[hub].weightedDegree)) hub = p.id;
    // silo: most isolated — lowest degree, tie-break by lowest weighted degree (so the
    // truly-disconnected node wins over an equally-low-degree but well-bonded one)
    if (c.degree < cen[silo].degree || (c.degree === cen[silo].degree && c.weightedDegree < cen[silo].weightedDegree)) silo = p.id;
  }
  const articulationIds = people.filter((p) => cen[p.id].isArticulation).map((p) => p.id);
  const spof = articulationIds
    .filter((id) => id !== hub && id !== silo)
    .sort((a, b) => cen[b].degree - cen[a].degree)[0];

  const role = {};
  if (hub) role[hub] = 'HUB';
  if (silo) role[silo] = 'SILO';
  if (spof) role[spof] = 'SPOF';

  const nodes = people.map((p) => {
    const c = cen[p.id];
    const tag = role[p.id] || null;
    return {
      id: p.id,
      name: p.name,
      archetype: p.archetype,
      department: p.department,
      utilization: p.utilization,
      color: colorOf(p.archetype),
      degree: c.degree,
      centrality: c.score,
      isArticulation: c.isArticulation,
      // node radius driver (kept in a sane range for canvas)
      val: 3 + (c.score / 100) * 9,
      callout: tag,
      ...(tag ? PIN[tag] : {}),
    };
  });

  const links = edges.map((e) => ({ source: e.source, target: e.target, weight: e.weight, type: e.type }));

  return {
    nodes,
    links,
    insights: {
      hub,
      silo,
      spof,
      spofCount: articulationIds.length,
      articulationIds,
    },
  };
}
