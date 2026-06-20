import { createContext, useContext, useMemo, useState } from 'react';
import dataset from '../data/dataset.json';
import teams from '../data/teams.json';
import afterState from '../data/afterState.json';
import { SCOREBOARD, PROJECTED, HERO_TEAM_ID, TITAN_HEALTH } from '../data/scoreboard';
import { byId, teamHealth, centralityAll, wasteMetrics } from '../lib/analysis';
import { buildGraph } from '../lib/ona';
import { clamp } from '../lib/format';

const employees = dataset.employees;

// Derive collaboration edges from the spec's synergy_matrix.
// Edge weight = collaboration strength (past_collaborations); sentiment kept for the engine.
const relationships = Object.entries(dataset.synergy_matrix).map(([key, v]) => {
  const [source, target] = key.split('_');
  return { source, target, weight: clamp(v.past_collaborations / 12, 0.05, 1), sentiment: v.sentiment_score, type: 'collab' };
});

// Symmetric sentiment lookup for the allocation engine.
const sentimentOf = (a, b) =>
  dataset.synergy_matrix[`${a}_${b}`]?.sentiment_score ?? dataset.synergy_matrix[`${b}_${a}`]?.sentiment_score ?? 0;

/*
 * CANONICAL DATA CONTRACT
 *  Employee.archetype ∈ JUNGLER|GOLD|EXP|MID|ROAM   (UPPERCASE)
 *  Team.requiredComposition uses lowercase keys      (jungler|gold|...)
 *  Edge.weight ∈ 0..1 ; Edge.type ∈ collab|mentor|reports
 *  utilization is the CANONICAL field name (0..100)
 *  Headline numbers ALWAYS come from SCOREBOARD — never recomputed for tiles.
 */

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [tab, setTab] = useState('engine');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(HERO_TEAM_ID);
  const [orgFixed, setOrgFixed] = useState(false); // flips Dashboard to the "after" state

  const peopleById = useMemo(() => byId(employees), []);

  const centrality = useMemo(() => centralityAll(employees, relationships), []);
  const graph = useMemo(() => buildGraph(employees, relationships), []);

  const teamHealthById = useMemo(() => {
    const out = {};
    for (const t of teams) out[t.id] = teamHealth(t, peopleById, relationships);
    return out;
  }, [peopleById]);

  const orgWaste = useMemo(() => wasteMetrics(employees), []);

  const value = {
    employees,
    teams,
    relationships,
    synergyMatrix: dataset.synergy_matrix,
    synergyOf: sentimentOf,
    peopleById,
    centrality,
    graph,
    teamHealthById,
    orgWaste,
    afterState,
    scoreboard: SCOREBOARD,
    projected: PROJECTED,
    heroTeamId: HERO_TEAM_ID,
    titanHealth: TITAN_HEALTH,
    // navigation + selection
    tab,
    setTab,
    selectedNodeId,
    setSelectedNodeId,
    selectedProjectId,
    setSelectedProjectId,
    orgFixed,
    setOrgFixed,
    goTo: (t, opts = {}) => {
      if (opts.node !== undefined) setSelectedNodeId(opts.node);
      if (opts.project !== undefined) setSelectedProjectId(opts.project);
      setTab(t);
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
