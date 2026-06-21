// AI-Driven Dynamic Team Allocation Engine (per functional spec).
// skill_vector dimensions: [Tech, Management, Design, Operations].

export const SKILL_DIMS = ['Tech', 'Management', 'Design', 'Operations'];

const KEYWORDS = [
  // Tech
  { dim: 0, words: ['api', 'backend', 'ml', 'ai', 'data', 'platform', 'code', 'infra', 'engineer', 'technical', 'algorithm', 'integration', 'pipeline', 'mobile', 'app', 'payments', 'security', 'cloud'] },
  // Management
  { dim: 1, words: ['lead', 'manage', 'coordinate', 'plan', 'stakeholder', 'timeline', 'strategy', 'roadmap', 'client', 'sales', 'growth', 'launch', 'market', 'gtm', 'revenue', 'partnership'] },
  // Design
  { dim: 2, words: ['design', 'ux', 'ui', 'brand', 'visual', 'prototype', 'research', 'user', 'creative', 'onboarding', 'experience', 'figma'] },
  // Operations
  { dim: 3, words: ['ops', 'operations', 'deploy', 'scale', 'process', 'support', 'reliability', 'logistics', 'rollout', 'delivery', 'compliance', 'sla'] },
];

// Parse a free-text project goal into a 4-dim target vector.
export function parseGoalToVector(goal = '') {
  const text = goal.toLowerCase();
  // tokenize on non-alphanumerics so short keywords ('ai', 'app', 'ml') match whole
  // words only — substring includes() would match 'ai' inside 'available'/'campaign'.
  const tokens = new Set(text.split(/[^a-z0-9]+/).filter(Boolean));
  const v = [0, 0, 0, 0];
  for (const { dim, words } of KEYWORDS) {
    for (const w of words) if (tokens.has(w)) v[dim] += 1;
  }
  if (v.every((x) => x === 0)) return { vector: [1, 1, 1, 1], normalized: [0.5, 0.5, 0.5, 0.5] };
  const max = Math.max(...v);
  return { vector: v, normalized: v.map((x) => x / max) };
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export const teamSizeFor = (workload) => Math.ceil(workload / 2) + 1;

const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

const TASK_BY_DIM = [
  'Own the core technical build',
  'Lead delivery & stakeholders',
  'Drive UX & design direction',
  'Run rollout, ops & reliability',
];

function taskFor(employee, goalVector) {
  // weight the member's strengths by what the project needs
  const weighted = employee.skill_vector.map((s, i) => s * (goalVector[i] || 0));
  let best = 0;
  for (let i = 1; i < weighted.length; i++) if (weighted[i] > weighted[best]) best = i;
  return TASK_BY_DIM[best];
}

// Greedy team selection that maximizes capability + average team sentiment.
export function runAllocation({ goal, workload, employees, synergyOf, balance = false, skillVector = null }) {
  let vector, normalized;
  if (skillVector && skillVector.length === 4 && skillVector.some((x) => x > 0)) {
    // Caller-supplied target vector (e.g. Gemini-derived skill weights) overrides
    // keyword parsing. Cosine is scale-invariant; coverage uses the normalized form.
    vector = skillVector;
    const max = Math.max(...skillVector) || 1;
    normalized = skillVector.map((x) => x / max);
  } else {
    ({ vector, normalized } = parseGoalToVector(goal));
  }
  const size = Math.min(teamSizeFor(workload), employees.length);

  const capability = new Map(employees.map((e) => [e.id, cosineSimilarity(e.skill_vector, vector)]));

  // selection = individual fit + team synergy + marginal skill-coverage − archetype redundancy.
  const gSum = normalized.reduce((a, b) => a + b, 0) || 1;
  const teamCov = [0, 0, 0, 0];
  const team = [];
  const scratch = new Map(); // per-run cap/syn, kept OFF the shared employee objects
  const remaining = [...employees];

  while (team.length < size && remaining.length) {
    let best = null;
    for (const cand of remaining) {
      const cap = capability.get(cand.id);
      const syn = team.length ? mean(team.map((m) => synergyOf(cand.id, m.id))) : 0;
      const synNorm = (syn + 1) / 2;
      // how much NEW coverage this person adds on the dimensions the goal needs
      let coverageGain = 0;
      for (let i = 0; i < 4; i++) coverageGain += normalized[i] * Math.max(0, cand.skill_vector[i] - teamCov[i]);
      coverageGain /= gSum;
      const sameArch = team.filter((m) => m.archetype === cand.archetype).length;
      // balance toggle: reward experience diversity vs current team
      let balBonus = 0;
      if (balance && team.length) {
        const avgExp = mean(team.map((m) => m.years_of_experience));
        balBonus = 0.1 * Math.min(1, Math.abs(cand.years_of_experience - avgExp) / 8);
      }
      const combined = 0.5 * cap + 0.3 * synNorm + 0.2 * coverageGain - 0.18 * sameArch + balBonus;
      if (!best || combined > best.combined) best = { cand, cap, syn, combined };
    }
    team.push(best.cand);
    scratch.set(best.cand.id, { cap: best.cap, syn: best.syn });
    for (let i = 0; i < 4; i++) teamCov[i] = Math.max(teamCov[i], best.cand.skill_vector[i]);
    remaining.splice(remaining.indexOf(best.cand), 1);
  }

  const members = team.map((e) => ({
    employee: e,
    capability: capability.get(e.id),
    synergy: scratch.get(e.id)?.syn ?? 0,
    task: taskFor(e, vector),
  }));

  const ids = team.map((e) => e.id);
  const pairSent = [];
  for (let i = 0; i < team.length; i++)
    for (let j = i + 1; j < team.length; j++) pairSent.push(synergyOf(team[i].id, team[j].id));

  return {
    members,
    ids,
    size,
    targetVector: vector,
    targetNormalized: normalized,
    avgCapability: mean(members.map((m) => m.capability)),
    teamSentiment: pairSent.length ? mean(pairSent) : 0,
  };
}

// Heuristic project-workload estimator (1..10) used by the Command Center when a
// brief is uploaded without a Gemini key. Scores by length + scope/integration keywords.
export function estimateWorkload(text) {
  const clean = (text || '').toLowerCase().trim();
  if (!clean) return 3; // default baseline

  let score = 2; // base score

  // 1. Length complexity
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 120) score += 3;
  else if (words.length > 60) score += 2;
  else if (words.length > 20) score += 1;

  // Match keywords against word boundaries, not raw substrings, so 'auth' doesn't
  // fire on "author" and 'api' doesn't fire on "capital"/"rapid". Short abbreviations
  // match whole-word only; longer keywords match as a word-start prefix (so 'payment'
  // still catches "payments", 'deploy' catches "deployment"); phrases use includes.
  const tokens = new Set(clean.split(/[^a-z0-9]+/).filter(Boolean));
  const has = (kw) => {
    if (/[^a-z0-9]/.test(kw)) return clean.includes(kw); // 'ci/cd', 'multi-tenant'
    if (kw.length <= 4) return tokens.has(kw); // 'api', 'auth', 'aws'
    return new RegExp(`\\b${kw}`).test(clean); // 'payment(s)', 'deploy(ment)', 'scal(e/able)'
  };

  // 2. High-scope keyword complexity
  const highScope = ['scale', 'database', 'compliance', 'migration', 'payment', 'billing', 'architect', 'reliability', 'deploy', 'security', 'auth', 'multi-tenant'];
  for (const word of highScope) {
    if (has(word)) score += 0.5;
  }

  // 3. Technical integration complexity
  const integrations = ['api', 'pipeline', 'kubernetes', 'aws', 'cloud', 'ci/cd', 'integration'];
  let intCount = 0;
  for (const word of integrations) {
    if (has(word)) intCount++;
  }
  score += Math.min(2, intCount * 0.4);

  return Math.max(1, Math.min(10, Math.round(score)));
}
