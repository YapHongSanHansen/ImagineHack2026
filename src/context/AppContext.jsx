/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';
import dataset from '../data/dataset.json';
import teamsData from '../data/teams.json';
import afterState from '../data/afterState.json';
import { SCOREBOARD, PROJECTED, HERO_TEAM_ID, TITAN_HEALTH } from '../data/scoreboard';
import { byId, teamHealth, centralityAll, wasteMetrics } from '../lib/analysis';
import { buildGraph } from '../lib/ona';
import { clamp } from '../lib/format';

const baseEmployees = dataset.employees;

// Derive collaboration edges from the spec's synergy_matrix.
// Edge weight = collaboration strength (past_collaborations); sentiment kept for the engine.
const baseRelationships = Object.entries(dataset.synergy_matrix).map(([key, v]) => {
  const [source, target] = key.split('_');
  return { source, target, weight: clamp(v.past_collaborations / 12, 0.05, 1), sentiment: v.sentiment_score, type: 'collab' };
});

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
  const [tab, setTab] = useState('command');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(HERO_TEAM_ID);
  const [orgFixed, setOrgFixed] = useState(false); // flips Dashboard to the "after" state

  // Stateful org data so the Workforce Roster can add / edit / delete people live.
  const [employees, setEmployees] = useState(baseEmployees);
  const [teams, setTeams] = useState(teamsData);
  const [relationships, setRelationships] = useState(baseRelationships);

  // Symmetric sentiment lookup for the allocation engine (covers newly-added people too).
  const synergyOf = (a, b) => {
    const rel = relationships.find(
      (r) => (r.source === a && r.target === b) || (r.source === b && r.target === a)
    );
    return rel ? rel.sentiment : 0;
  };

  const peopleById = useMemo(() => byId(employees), [employees]);
  const centrality = useMemo(() => centralityAll(employees, relationships), [employees, relationships]);
  const graph = useMemo(() => buildGraph(employees, relationships), [employees, relationships]);

  const teamHealthById = useMemo(() => {
    const out = {};
    for (const t of teams) out[t.id] = teamHealth(t, peopleById, relationships);
    return out;
  }, [teams, peopleById, relationships]);

  const orgWaste = useMemo(() => wasteMetrics(employees), [employees]);

  // ---- Workforce Roster CRUD ----
  const addEmployee = (emp) => {
    const maxIdNum = Math.max(16, ...employees.map((e) => parseInt(e.id.replace('e', ''), 10) || 0));
    const newId = `e${String(maxIdNum + 1).padStart(2, '0')}`;
    const sv = emp.skill_vector || [0.5, 0.5, 0.5, 0.5];
    const newEmp = {
      ...emp,
      id: newId,
      utilization: emp.utilization ?? 30,
      stats: emp.stats || {
        execution: Math.round(sv[0] * 100),
        support: Math.round(sv[1] * 100),
        independence: Math.round(sv[2] * 100),
        agility: Math.round(sv[3] * 100),
        facilitation: Math.round((sv[1] + sv[3]) * 50),
      },
    };

    // Auto-generate a few collaboration edges with existing colleagues so the new
    // person isn't an isolated node in the ONA graph.
    const contacts = [...employees].sort(() => 0.5 - Math.random()).slice(0, Math.min(3, employees.length));
    const newRels = contacts.map((c) => {
      const collabs = Math.floor(Math.random() * 8) + 1;
      const sentiment = Math.round((Math.random() * 1.0 - 0.2) * 100) / 100;
      return { source: newId, target: c.id, weight: clamp(collabs / 12, 0.05, 1), sentiment, type: 'collab' };
    });

    setEmployees((prev) => [...prev, newEmp]);
    setRelationships((prev) => [...prev, ...newRels]);
  };

  const editEmployee = (id, updatedData) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updatedData } : e)));
  };

  const deleteEmployee = (id) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setTeams((prev) => prev.map((t) => ({ ...t, memberIds: t.memberIds.filter((mid) => mid !== id) })));
    setRelationships((prev) => prev.filter((r) => r.source !== id && r.target !== id));
  };

  const value = {
    employees,
    teams,
    relationships,
    synergyMatrix: dataset.synergy_matrix,
    synergyOf,
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
    // roster CRUD
    addEmployee,
    editEmployee,
    deleteEmployee,
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
