// Single source of truth for the MLBB-meta archetype model.
// archetype keys are UPPERCASE on employees; team.requiredComposition uses lowercase.

export const ARCHETYPES = ['JUNGLER', 'GOLD', 'EXP', 'MID', 'ROAM'];

// Canonical HEX palette — used identically by force-graph nodes, Recharts fills, and badges.
export const ARCHETYPE_COLOR = {
  JUNGLER: '#FF6B3D',
  GOLD: '#FFD23F',
  EXP: '#5BE584',
  MID: '#10E5A1',
  ROAM: '#2DD4BF',
};

// radar / stat axes (one dominant axis per archetype)
export const STAT_AXES = ['execution', 'support', 'independence', 'agility', 'facilitation'];

export const ARCHETYPE_META = {
  JUNGLER: { key: 'JUNGLER', mlbb: 'Jungler', corp: 'Core Executor', axis: 'execution', icon: 'Swords', blurb: 'Drives main KPIs, objective-focused, high resource consumer.' },
  GOLD: { key: 'GOLD', mlbb: 'Gold Lane', corp: 'Sales / Product', axis: 'support', icon: 'Coins', blurb: 'Needs early support, delivers massive ROI late stage.' },
  EXP: { key: 'EXP', mlbb: 'EXP Lane', corp: 'Independent Specialist', axis: 'independence', icon: 'Shield', blurb: 'Self-sufficient, low maintenance, holds their ground.' },
  MID: { key: 'MID', mlbb: 'Mid Mage', corp: 'Cross-Functional Hub', axis: 'agility', icon: 'Zap', blurb: 'Agile, pivots quickly to clear blockers, connects teams.' },
  ROAM: { key: 'ROAM', mlbb: 'Roam', corp: 'Ops / Scrum Master', axis: 'facilitation', icon: 'Radar', blurb: 'Facilitator, provides team vision, removes workflow obstacles.' },
};

// Ideal "meta" composition: one of each role.
export const IDEAL_COMP = { JUNGLER: 1, GOLD: 1, EXP: 1, MID: 1, ROAM: 1 };
export const TOTAL_IDEAL = 5;

// Symmetric role-fit matrix: exact = 1, adjacent ≈ 0.5, distant ≈ 0.2.
export const PARTIAL_MATCH = {
  JUNGLER: { JUNGLER: 1, GOLD: 0.5, MID: 0.5, EXP: 0.2, ROAM: 0.2 },
  GOLD: { GOLD: 1, JUNGLER: 0.5, MID: 0.5, EXP: 0.2, ROAM: 0.2 },
  MID: { MID: 1, JUNGLER: 0.5, GOLD: 0.5, ROAM: 0.5, EXP: 0.2 }, // hub = most flexible
  ROAM: { ROAM: 1, MID: 0.5, EXP: 0.5, JUNGLER: 0.2, GOLD: 0.2 },
  EXP: { EXP: 1, ROAM: 0.5, JUNGLER: 0.2, GOLD: 0.2, MID: 0.2 }, // specialist = most isolated
};

export const fit = (fromArch, toArch) => PARTIAL_MATCH[fromArch]?.[toArch] ?? 0.2;
export const colorOf = (arch) => ARCHETYPE_COLOR[arch] ?? '#93A4C8';
export const corpName = (arch) => ARCHETYPE_META[arch]?.corp ?? arch;
export const mlbbName = (arch) => ARCHETYPE_META[arch]?.mlbb ?? arch;

// normalize team.requiredComposition (lowercase) -> { JUNGLER: n, ... }
export const normalizeComp = (comp = {}) => {
  const out = { JUNGLER: 0, GOLD: 0, EXP: 0, MID: 0, ROAM: 0 };
  for (const a of ARCHETYPES) out[a] = comp[a.toLowerCase()] ?? 0;
  return out;
};
