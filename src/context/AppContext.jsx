import { createContext, useContext, useMemo, useState } from 'react';
import employees from '../data/employees.json';
import teams from '../data/teams.json';
import relationships from '../data/relationships.json';
import afterState from '../data/afterState.json';
import { SCOREBOARD, PROJECTED, HERO_TEAM_ID, TITAN_HEALTH } from '../data/scoreboard';
import { byId, teamHealth, centralityAll, wasteMetrics } from '../lib/analysis';
import { buildGraph } from '../lib/ona';

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
  const [tab, setTab] = useState('dashboard');
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
