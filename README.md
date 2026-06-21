# ADTAE — *Draft a winning team. Waste no one.*

An **AI-driven dynamic team allocation engine** with a **draft screen for your workforce.** Describe a project and DraftBoard AI drafts the optimal team from skills, availability and real collaboration history — then reads the whole org like a Mobile Legends (MLBB) team composition to expose burnout, idle bench and single points of failure.

> **ImagineHack 2026 · Taylor's University · Track 3: DoubleDot — Smarter Resource Management**
> Resource focus: **Manpower** — the most expensive resource, and the only one that *suffers* when wasted.

---

## What it does (all 4 of the track's expected outcomes, in one loop)

| Outcome | Where |
|---|---|
| 🧩 **Smart scheduling / allocation** | **Allocation Engine** — goal + workload → an optimally drafted, cross-functional team |
| 📊 **Dashboard / monitoring** | **Dashboard** — manpower-waste %, idle, burnout, meta balance |
| ⚙️ **Optimization tool** | **Suspect Board** + **Draft Lab** — detect losing comps & re-draft them |
| 🌱 **Data-driven sustainability insights** | **Insights** — idle FTE, burnout, SPOFs, ESG-tagged actions |

## The pages
1. **Allocation Engine** *(primary)* — a 3-panel dynamic team builder (per the functional spec): goal textarea + workload slider → collaboration web graph (the drafted team glows) → department recommendation columns with per-member tasks.
2. **Dashboard** — live monitoring of manpower waste, burnout and team health.
3. **Suspect Board** — Organizational Network Analysis (ONA) graph; auto-flags the **Hub**, the **Silo** and the **Single Point of Failure**.
4. **Draft Lab** — detects a losing comp ("5 Core Executors") and re-drafts it; shows before→after impact.
5. **Insights** — sustainability scorecard with quantified, ESG-tagged recommendations.

## The allocation engine (how the "AI" works)
- **Goal → 4-D target vector** `[Tech, Management, Design, Operations]` from keyword parsing.
- **Skill match** = cosine similarity between each employee's `skill_vector` and the target.
- **Dynamic team size** = `⌈workload / 2⌉ + 1`.
- **Selection** = greedy maximisation of `capability + team synergy (sentiment) + marginal skill-coverage − archetype redundancy`, with an optional **age/experience balancing** toggle.
- **Graph-ML-inspired, fully transparent** — degree / weighted-degree / articulation-point (SPOF) detection over the org graph; every score is explainable.
- **Fair by design** — `age` and `gender` are **deliberately excluded** from scoring to prevent bias.

## The MLBB metaphor
| MLBB role | Corporate archetype |
|---|---|
| Jungler | Core Executor |
| Gold Lane | Sales / Product |
| EXP Lane | Independent Specialist |
| Mid Mage | Cross-Functional Hub |
| Roam | Ops / Scrum Master |

The relationship graph ("FBI suspect board") = **Organizational Network Analysis (ONA)**.

## Run it
```bash
npm install
npm run dev          # http://localhost:5173
npm run build && npm run preview   # production check
node scripts/check.mjs             # 15 engine/dataset assertions
```
**Stack:** React 18 + Vite + Tailwind v3 · Recharts · react-force-graph-2d · framer-motion. 100% client-side, all data is mock JSON, no backend.

## Deploy (Vercel / Netlify)
Import the repo → framework auto-detected as **Vite** → build `npm run build`, output `dist/`. No rewrites needed (state-based nav).

## 60–90 second demo path
1. **Allocation Engine** — pick "Launch a mobile payments app", set workload, hit **Run** → watch the team light up on the graph and fill the department columns. "Describe a project, get the optimal squad — sized to the workload."
2. **Dashboard** — "But the current org is bleeding manpower: 31% idle *and* people in burnout." (red banner flags Project Titan).
3. **Suspect Board** — "This is your real org. Everything routes through Maya at 97% — burnout AND a single point of failure. This Design pod is invisible and idle."
4. **Draft Lab → ⚡ Auto-Draft** — "One re-draft: idle 31→9, three burnout risks defused, balance 54→87 — same people, +18% output." End on the balanced board.

## Architecture
- `src/data/dataset.json` — spec-compliant org: employees (`skill_vector`, age, gender, job_title, experience, knowledge_tags + archetype/utilization/stats) and the `synergy_matrix` (past_collaborations + sentiment_score).
- `src/data/{teams,afterState}.json`, `src/data/scoreboard.js` — teams, the pre-baked re-draft result, and the single canonical scoreboard.
- `src/lib/` — pure logic: `engine` (cosine match, dynamic sizing, allocation), `analysis` (team health, centrality + articulation/SPOF, waste), `allocate` (role-based draft), `ona` (graph build), `archetypes`, `compScore`, `format`.
- `src/components/` · `src/pages/` · `src/context/AppContext.jsx` (single source of truth; edges derived from the synergy matrix; headline numbers come from `scoreboard.js`).
- `scripts/check.mjs` — runnable engine/dataset sanity checks.
