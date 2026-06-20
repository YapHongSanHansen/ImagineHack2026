# DraftBoard AI — *Draft a winning team. Waste no one.*

A **draft screen for your workforce.** DraftBoard AI reads your org like a Mobile Legends (MLBB) team composition, exposes the burnout and the idle bench through Organizational Network Analysis, and **re-drafts your people for more output with zero new hires.**

> **ImagineHack 2026 · Taylor's University · Track 3: DoubleDot — Smarter Resource Management**
> Resource focus: **Manpower** — the most expensive resource, and the only one that *suffers* when wasted.

## Why it fits the track (all 4 expected outcomes in one loop)
| Outcome | Where |
|---|---|
| 📊 Dashboard / monitoring | **Dashboard** — manpower-waste %, idle, burnout, meta balance |
| ⚙️ Optimization tool | **Draft Lab** — detects losing comps (e.g. "5 Core Executors") |
| 🧩 Smart allocation | **Draft Lab Auto-Draft** — re-drafts the team + live allocation engine |
| 🌱 Sustainability insights | **Insights** — idle FTE, burnout, SPOFs, ESG-tagged actions |

## The metaphor
| MLBB role | Corporate archetype |
|---|---|
| Jungler | Core Executor |
| Gold Lane | Sales / Product |
| EXP Lane | Independent Specialist |
| Mid Mage | Cross-Functional Hub |
| Roam | Ops / Scrum Master |

The relationship graph ("FBI suspect board") = **Organizational Network Analysis (ONA)**, scored with transparent, **graph-ML-inspired** heuristics. Age & gender are **deliberately excluded** from scoring to prevent bias.

## Run it
```bash
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview   # production check
```
React 18 + Vite + Tailwind v3 · Recharts · react-force-graph-2d · framer-motion. 100% client-side, all data is mock JSON in `src/data/`. No backend.

## Deploy (Vercel / Netlify)
Import the repo → framework auto-detected as **Vite** → build `npm run build`, output `dist/`. No rewrites needed (state-based nav).

## 60-second demo path
1. **Dashboard** — "This org is bleeding manpower: 31% idle *and* people in burnout." (red banner flags Project Titan).
2. **Suspect Board** — "This is your real org. Everything routes through Maya at 97% — burnout AND a single point of failure. This Design pod is invisible and idle."
3. **Draft Lab → ⚡ Auto-Draft** — "One re-draft: idle 31→9, three burnout risks defused, balance 54→87 — same people, +18% output." End on the balanced board.

## Architecture
- `src/data/` — mock org (16 people), teams, ONA edges, pre-baked Auto-Draft result.
- `src/lib/` — pure logic: `archetypes` (model), `analysis` (team health, centrality + articulation/SPOF check, waste), `allocate` (scoring + greedy draft), `ona` (graph build), `compScore` (radar data).
- `src/components/` · `src/pages/` · `src/context/AppContext.jsx` (single source of truth; headline numbers come from `data/scoreboard.js`).
