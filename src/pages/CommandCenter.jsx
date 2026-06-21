import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Scale,
  Users,
  Briefcase,
  Upload,
  Settings,
  SlidersHorizontal,
  Flame,
  GitFork,
  ShieldAlert,
  Activity,
  Coins,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import NetworkGraph from '../components/NetworkGraph';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import { runAllocation, teamSizeFor, parseGoalToVector, estimateWorkload, SKILL_DIMS } from '../lib/engine';
import { colorOf, ARCHETYPE_META } from '../lib/archetypes';
import { cn } from '../lib/format';
import { analyzeBriefWithGemini } from '../lib/ai';

// Helper to load external scripts dynamically (PDF.js / Mammoth from CDN).
const loadScript = (id, src) => {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
};

// PDF Text Extractor using Mozilla PDF.js from CDN
const extractTextFromPdf = async (arrayBuffer) => {
  await loadScript('pdfjs-lib', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js');
  const pdfjsLib = window.pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
};

// Word DOCX Text Extractor using Mammoth.js from CDN
const extractTextFromDocx = async (arrayBuffer) => {
  await loadScript('mammoth-lib', 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.11.0/mammoth.browser.min.js');
  const mammoth = window.mammoth;
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const PRESETS = [
  'Launch a mobile payments app on a tight timeline',
  'Redesign the onboarding UX with user research',
  'Scale the data platform reliability and deployment',
  'Run a go-to-market sales launch for Q3',
];

const DIM_COLOR = ['#10E5A1', '#FFD23F', '#2DD4BF', '#5EEAD4'];
const DEPT_ORDER = ['Engineering', 'Product', 'Design', 'Sales', 'Operations'];

export default function CommandCenter() {
  const {
    employees,
    synergyOf,
    graph,
    peopleById,
    scoreboard,
    orgFixed,
    goTo,
    teams,
  } = useApp();

  const [goal, setGoal] = useState(PRESETS[0]);
  const [workload, setWorkload] = useState(6);
  const [balance, setBalance] = useState(false);
  const [excludeStaffed, setExcludeStaffed] = useState(true);
  const [result, setResult] = useState(null);

  // ONA Graph Filter states
  const [minWeight, setMinWeight] = useState(0.0);
  const [sizeMode, setSizeMode] = useState('centrality');
  const [excludedDepts, setExcludedDepts] = useState(new Set());
  const [fileError, setFileError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [tempKey, setTempKey] = useState(apiKey);

  const preview = useMemo(() => parseGoalToVector(goal).normalized, [goal]);
  const size = teamSizeFor(workload);

  const allDepts = useMemo(() => [...new Set(graph.nodes.map((n) => n.department))], [graph]);

  const staffedIds = useMemo(() => {
    const otherActiveTeams = teams.filter((t) => t.id !== 't06' && t.id !== 't01');
    const ids = new Set();
    for (const t of otherActiveTeams) {
      for (const mid of t.memberIds) ids.add(mid);
    }
    return ids;
  }, [teams]);

  const getEligiblePool = () => {
    return excludeStaffed ? employees.filter((e) => !staffedIds.has(e.id)) : employees;
  };

  // Run initial allocation on mount (intentionally once).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(runAllocation({ goal, workload, employees: getEligiblePool(), synergyOf, balance }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const run = () => {
    setFileError(null);
    setResult(runAllocation({ goal, workload, employees: getEligiblePool(), synergyOf, balance }));
  };

  const handleDeptToggle = (dept) => {
    const next = new Set(excludedDepts);
    if (next.has(dept)) next.delete(dept);
    else next.add(dept);
    setExcludedDepts(next);
  };

  const fileInputRef = React.useRef(null);

  const runLocalNlp = (text) => {
    const extractedGoal = text.slice(0, 400);
    setGoal(extractedGoal);

    // 1. Dynamic Workload Estimation
    const estimated = estimateWorkload(text);
    setWorkload(estimated);

    // 2. Run allocation instantly with new values
    const newResult = runAllocation({
      goal: extractedGoal,
      workload: estimated,
      employees: getEligiblePool(),
      synergyOf,
      balance,
    });
    setResult(newResult);
  };

  const processFile = async (file) => {
    setFileError(null);
    setUploadSuccess(false);
    setParsingFile(true);

    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      let text = '';

      if (ext === 'pdf') {
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(file);
        });
        text = await extractTextFromPdf(arrayBuffer);
      } else if (ext === 'docx') {
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(file);
        });
        text = await extractTextFromDocx(arrayBuffer);
      } else if (ext === 'doc') {
        throw new Error('Legacy Word (.doc) format is not supported. Please save as modern .docx or PDF for direct client-side parsing.');
      } else {
        // Plain text, markdown, json
        const fileText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        });
        text = fileText;
      }

      text = text.replace(/\s+/g, ' ').trim();
      if (!text) {
        throw new Error('No readable text content could be extracted from this file.');
      }

      if (apiKey.trim()) {
        try {
          const aiResult = await analyzeBriefWithGemini(text, apiKey.trim());
          const extractedGoal = text.slice(0, 400);
          setGoal(extractedGoal);
          setWorkload(aiResult.workload);

          const newResult = runAllocation({
            goal: extractedGoal,
            workload: aiResult.workload,
            employees: getEligiblePool(),
            synergyOf,
            balance,
          });

          // Inject Gemini custom task descriptions into the result members
          newResult.members = newResult.members.map((m) => {
            const skillVector = m.employee.skill_vector;
            let best = 0;
            for (let i = 1; i < 4; i++) if (skillVector[i] > skillVector[best]) best = i;
            const tasks = [
              aiResult.taskDescriptions.tech,
              aiResult.taskDescriptions.management,
              aiResult.taskDescriptions.design,
              aiResult.taskDescriptions.operations,
            ];
            return { ...m, task: tasks[best] ?? m.task };
          });

          setResult(newResult);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        } catch (aiErr) {
          console.warn('Gemini analysis failed, falling back to local NLP:', aiErr);
          runLocalNlp(text);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        }
      } else {
        runLocalNlp(text);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err) {
      console.error('File parsing failed:', err);
      setFileError(err.message || 'Failed to read or parse file.');
    } finally {
      setParsingFile(false);
    }
  };

  const onDropBrief = (e) => {
    e.preventDefault();
    if (parsingFile) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSaveApiKey = () => {
    setApiKey(tempKey);
    if (tempKey.trim()) {
      localStorage.setItem('gemini_api_key', tempKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setShowApiModal(false);
  };

  const filteredGraph = useMemo(() => {
    const nodes = graph.nodes
      .map((n) => {
        let score = n.centrality || 0;
        if (sizeMode === 'degree') {
          score = Math.min(100, ((n.degree || 0) / 10) * 100);
        } else if (sizeMode === 'spof') {
          score = n.isArticulation ? 100 : 20;
        }
        return { ...n, val: 3 + (score / 100) * 9 };
      })
      .filter((n) => !excludedDepts.has(n.department));

    const visibleNodeIds = new Set(nodes.map((n) => n.id));

    const links = graph.links.filter((l) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId) && l.weight >= minWeight;
    });

    return { nodes, links, insights: graph.insights };
  }, [graph, excludedDepts, minWeight, sizeMode]);

  const memberByDept = (dept) => (result?.members || []).filter((m) => m.employee.department === dept);

  // Active Burnouts from global state
  const burnoutList = useMemo(() => {
    return employees.filter((e) => e.utilization > 90).sort((a, b) => b.utilization - a.utilization);
  }, [employees]);

  // Active SPOFs from global ONA insights
  const spofList = useMemo(() => {
    const articulationIds = graph.insights.articulationIds || [];
    return articulationIds.map((id) => peopleById[id]).filter(Boolean);
  }, [graph, peopleById]);

  const v = (m) => (m.value !== undefined ? m.value : (orgFixed ? m.after : m.before));
  const tone = (kind) => (orgFixed ? 'good' : kind);

  return (
    <div className="space-y-6">
      {/* Title */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-hi">Command Center</h1>
          <p className="text-sm text-text-dim">Unified workspace: allocate crew, monitor ONA graphs, and view real-time KPIs in one view.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowApiModal(true)}
            className="chip flex items-center gap-1 px-2.5 py-1 text-[11px] text-text-mid transition hover:border-cyan/40 hover:text-text-hi"
          >
            <Settings size={12} />
            AI Settings
          </button>
          <div className={cn('chip', orgFixed ? 'text-good' : 'text-bad')} style={{ borderColor: orgFixed ? '#34E5A155' : '#FF4D6D55' }}>
            <span className={cn('h-2 w-2 rounded-full', orgFixed ? 'bg-good' : 'bg-bad animate-pulse')} />
            {orgFixed ? 'System Optimized' : 'Waste Detected'}
          </div>
        </div>
      </header>

      {/* 1. Scoreboard row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label={scoreboard.waste.label} value={v(scoreboard.waste)} unit="%" tone={tone('bad')} hero={!orgFixed} icon={Activity} sub="Resource waste coefficient" />
        <StatCard label={scoreboard.idle.label} value={v(scoreboard.idle)} unit="%" tone={tone('warn')} icon={Coins} sub="Unused bench capacity" />
        <StatCard label={scoreboard.burnout.label} value={v(scoreboard.burnout)} tone={tone('bad')} icon={Flame} sub="Overloaded (util > 90%)" />
        <StatCard label={scoreboard.meta.label} value={v(scoreboard.meta)} tone={tone('violet')} icon={Scale} sub="Role balance quotient" />
        <StatCard label={scoreboard.spof.label} value={v(scoreboard.spof)} tone={tone('bad')} icon={GitFork} sub="Network articulation nodes" />
      </div>

      {/* Core Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr_300px]">

        {/* Left Column: Controls & Uploader */}
        <div className="space-y-4 lg:col-start-1 lg:row-start-1 xl:col-start-1 xl:row-start-1">
          <Card title="Project Definition" subtitle="Type a description or upload a text brief" right={null}>
            <div className="space-y-3">
              <div>
                <label className="label-xs text-text-mid">Goal statement</label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDropBrief}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-stroke bg-panel2/60 px-3 py-2 text-xs text-text-hi outline-none focus:border-cyan/50"
                  placeholder="Describe your project goal..."
                />
              </div>

              {/* Uploader Drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDropBrief}
                onClick={parsingFile ? undefined : triggerFileSelect}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-stroke bg-panel2/20 p-4 text-center transition hover:border-cyan/40',
                  uploadSuccess && 'border-good bg-good/5',
                  fileError && 'border-bad bg-bad/5',
                  parsingFile && 'cursor-wait border-cyan bg-cyan/5'
                )}
              >
                <input
                  type="file"
                  accept=".txt,.md,.json,.pdf,.docx"
                  onChange={onFileSelect}
                  ref={fileInputRef}
                  className="hidden"
                  disabled={parsingFile}
                />
                {parsingFile ? (
                  <>
                    <Activity size={18} className="mb-1.5 animate-pulse text-cyan" />
                    <span className="animate-pulse text-[10px] font-medium text-cyan">Extracting requirements...</span>
                    <span className="mt-0.5 text-[9px] text-text-dim">Running AI OCR / Text extractor</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} className={cn('mb-1.5 text-text-dim', uploadSuccess && 'animate-bounce text-good', fileError && 'text-bad')} />
                    <span className="text-[10px] font-medium text-text-mid">Drop brief or click to browse</span>
                    <span className="mt-0.5 text-[9px] text-text-dim">Supports .pdf / .docx / .txt / .md / .json</span>
                  </>
                )}
              </div>

              {/* Upload Status alerts */}
              <AnimatePresence>
                {uploadSuccess && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="chip justify-center border-good/50 bg-good/10 py-1 text-[10px] text-good">
                    <Check size={12} /> brief parsed! Workload estimated at: {workload}
                  </motion.div>
                )}
                {fileError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-1.5 rounded-lg border border-bad/30 bg-bad/10 p-2.5 text-[10px] leading-relaxed text-bad">
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    <span>{fileError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preset pills */}
              <div className="flex flex-wrap gap-1">
                {PRESETS.map((p) => (
                  <button key={p} onClick={() => setGoal(p)} className={cn('chip px-2 py-0.5 text-[9px] transition', goal === p ? 'border-cyan/50 bg-cyan/5 text-cyan' : 'text-text-dim hover:text-text-mid')}>
                    {p.split(' ').slice(0, 3).join(' ')}…
                  </button>
                ))}
              </div>

              {/* Workload range */}
              <div className="border-t border-stroke pt-3">
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="label-xs text-text-mid">Workload Scale</span>
                  <span className="font-bold text-cyan">Rating: {workload} / 10</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="range" min="1" max="10" value={workload} onChange={(e) => setWorkload(+e.target.value)} className="w-full accent-cyan" />
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-text-dim">
                  <span>Simple</span>
                  <span>Suggested crew size: <span className="font-semibold text-text-hi">{size}</span></span>
                  <span>Massive</span>
                </div>
              </div>

              {/* Age Balancing + Exclude Staffed */}
              <div className="flex gap-2">
                <button onClick={() => setBalance((b) => !b)} className={cn('flex flex-1 items-center justify-between rounded-xl border border-stroke px-3 py-2 text-[10px] transition', balance ? 'border-good/50 bg-good/5 text-good' : 'bg-panel2/20 text-text-mid')}>
                  <span className="flex items-center gap-1"><Scale size={11} /> Demographics</span>
                  <span className={cn('h-3.5 w-6 rounded-full p-0.5 transition', balance ? 'bg-good/40' : 'bg-stroke')}>
                    <span className={cn('block h-2.5 w-2.5 rounded-full bg-text-hi transition', balance && 'translate-x-2')} />
                  </span>
                </button>

                <button onClick={() => setExcludeStaffed((b) => !b)} className={cn('flex flex-1 items-center justify-between rounded-xl border border-stroke px-3 py-2 text-[10px] transition', excludeStaffed ? 'border-cyan/50 bg-cyan/5 text-cyan' : 'bg-panel2/20 text-text-mid')}>
                  <span className="flex items-center gap-1"><Users size={11} /> Exclude Staffed</span>
                  <span className={cn('h-3.5 w-6 rounded-full p-0.5 transition', excludeStaffed ? 'bg-cyan/40' : 'bg-stroke')}>
                    <span className={cn('block h-2.5 w-2.5 rounded-full bg-text-hi transition', excludeStaffed && 'translate-x-2')} />
                  </span>
                </button>
              </div>

              <button onClick={run} className="btn-primary w-full py-2 text-xs">
                <Play size={14} /> Calculate Allocation
              </button>
            </div>
          </Card>

          {/* Skill Vector target panel */}
          <Card title="Required Skill vector" subtitle="Derived from NLP brief matching" right={null}>
            <div className="space-y-2">
              {SKILL_DIMS.map((d, i) => (
                <div key={d}>
                  <div className="mb-0.5 flex justify-between text-[10px]"><span className="text-text-mid">{d}</span><span className="font-bold text-text-dim">{Math.round(preview[i] * 100)}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-stroke">
                    <motion.div className="h-full rounded-full" style={{ background: DIM_COLOR[i] }} animate={{ width: `${preview[i] * 100}%` }} transition={{ duration: 0.4 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Middle Column: Interactive ONA Web Graph */}
        <div className="space-y-4 lg:col-start-2 lg:row-start-1 lg:row-span-2 xl:col-start-2 xl:row-start-1 xl:row-span-1">
          <Card
            title="The Giraffe Web Graph"
            subtitle={result ? 'Drafted team highlighted — links glow within the cluster' : 'Network analysis of collaborative channels'}
            right={<span className="text-[10px] text-text-dim">● size = centrality</span>}
          >
            {/* Embedded Graph Controls bar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stroke bg-panel2/20 p-2.5 text-[10px]">
              {/* node size mode */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 font-medium text-text-dim"><Settings size={11} /> Size nodes:</span>
                <div className="flex overflow-hidden rounded-lg border border-stroke bg-panel p-0.5">
                  {['centrality', 'degree', 'spof'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSizeMode(mode)}
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition',
                        sizeMode === mode ? 'bg-cyan/20 text-cyan' : 'text-text-dim hover:text-text-mid'
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* link slicer */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 font-medium text-text-dim"><SlidersHorizontal size={11} /> Threshold:</span>
                <input type="range" min="0" max="1" step="0.05" value={minWeight} onChange={(e) => setMinWeight(Number(e.target.value))} className="w-20 accent-cyan" />
                <span className="font-bold text-cyan">{(minWeight * 12).toFixed(0)} tasks</span>
              </div>
            </div>

            <div className="relative h-[410px] overflow-hidden rounded-xl border border-stroke bg-panel/30">
              <NetworkGraph graph={filteredGraph} highlightIds={result?.ids || null} selectedId={null} onSelect={(id) => { if (id) goTo('network', { node: id }); }} />
            </div>

            {/* Department filters inside graph card */}
            <div className="mt-3">
              <span className="mb-1.5 block text-[10px] font-medium text-text-dim">Filter graph departments:</span>
              <div className="flex flex-wrap gap-1">
                {allDepts.map((d) => {
                  const checked = !excludedDepts.has(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDeptToggle(d)}
                      className={cn('chip px-2 py-0.5 text-[9px] font-semibold transition', checked ? 'border-cyan/50 bg-cyan/5 text-cyan' : 'text-text-dim hover:text-text-mid')}
                    >
                      {checked ? '✓ ' : ''}{d}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Watchlists & SPOFs */}
        <div className="space-y-4 lg:col-start-1 lg:row-start-2 xl:col-start-3 xl:row-start-1">
          {/* Burnout Risk */}
          <Card title="Burnout Watchlist" subtitle="utilization threshold > 90%" right={<Flame size={14} className="text-bad" />}>
            <div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
              {burnoutList.map((e) => (
                <button
                  key={e.id}
                  onClick={() => goTo('network', { node: e.id })}
                  className="flex w-full items-center gap-2 rounded-xl border border-stroke bg-panel2/30 p-2 text-left transition hover:border-bad/40"
                >
                  <ShieldAlert size={14} className="shrink-0 text-bad" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-text-hi">{e.name}</div>
                    <div className="truncate text-[9px] text-text-dim">{ARCHETYPE_META[e.archetype]?.corp}</div>
                  </div>
                  <div className="kpi text-xs font-bold text-bad">{e.utilization}%</div>
                </button>
              ))}
              {burnoutList.length === 0 && <p className="py-2 text-center text-xs text-good">No active burnout risks.</p>}
            </div>
          </Card>

          {/* SPOF alert list */}
          <Card title="Single Points of Failure" subtitle="Critical ONA bridges" right={<GitFork size={14} className="text-warn" />}>
            <div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
              {spofList.map((e) => (
                <button
                  key={e.id}
                  onClick={() => goTo('network', { node: e.id })}
                  className="flex w-full items-center gap-2 rounded-xl border border-stroke bg-panel2/30 p-2 text-left transition hover:border-cyan/40"
                >
                  <GitFork size={14} className="shrink-0 text-warn" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-text-hi">{e.name}</div>
                    <div className="truncate text-[9px] text-text-dim">{e.department} · {e.job_title}</div>
                  </div>
                  <div className="chip border-warn/30 bg-warn/5 px-1 py-0 text-[9px] text-warn">SPOF</div>
                </button>
              ))}
              {spofList.length === 0 && <p className="py-2 text-center text-xs text-good">No ONA bottlenecks found.</p>}
            </div>
          </Card>
        </div>

      </div>

      {/* 3. Recommended columns */}
      {result && (
        <div className="border-t border-stroke pt-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-cyan" />
              <h3 className="text-sm font-semibold text-text-hi">Recommended Team Draft — {result.size} members</h3>
            </div>
            <div className="flex gap-4 text-[11px]">
              <span>Avg Fit: <span className="font-bold text-cyan">{Math.round(result.avgCapability * 100)}%</span></span>
              <span>Team Synergy: <span className="font-bold text-good">{result.teamSentiment.toFixed(2)}</span></span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {DEPT_ORDER.map((dept) => {
              const members = memberByDept(dept);
              return (
                <div key={dept} className="panel bg-panel/30 p-3">
                  <div className="label-xs mb-2 border-b border-stroke pb-1.5 font-semibold text-text-mid">{dept}</div>
                  <div className="space-y-2">
                    {members.length === 0 && <p className="py-4 text-center text-[10px] text-text-dim">—</p>}
                    {members.map((m, i) => (
                      <motion.div
                        key={m.employee.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        onClick={() => goTo('roster', { node: m.employee.id })}
                        className="panel-2 cursor-pointer p-2.5 transition hover:border-cyan/40"
                        style={{ borderColor: `${colorOf(m.employee.archetype)}44` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-text-hi">{m.employee.name}</span>
                          <span className="kpi text-xs font-bold" style={{ color: colorOf(m.employee.archetype) }}>{Math.round(m.capability * 100)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[9px] text-text-dim"><Briefcase size={9} /> {m.employee.job_title}</div>
                        <div className="mt-2 rounded-lg bg-cyan/10 px-2 py-1 text-[9px] leading-snug text-cyan">{m.task}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* API Settings Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/80 backdrop-blur-sm">
          <div className="w-[420px] rounded-2xl border border-stroke bg-panel/90 p-6 shadow-glow">
            <h3 className="text-base font-bold text-text-hi">API Settings</h3>
            <p className="mt-1 text-xs text-text-dim">Configure your Google Gemini API key to enable semantic PRD matching & task breakdown.</p>

            <div className="mt-4">
              <label className="label-xs mb-1 block text-text-mid">Gemini API Key</label>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-stroke bg-panel2/60 px-3 py-2 text-xs text-text-hi outline-none focus:border-cyan/50"
              />
              <span className="mt-1.5 block text-[9px] leading-relaxed text-text-dim">
                Your key is stored locally in your browser (localStorage) and sent directly to Google's endpoints. Leave blank to use offline keyword-matching NLP.
              </span>
            </div>

            <div className="mt-6 flex justify-end gap-2 text-xs">
              <button type="button" onClick={() => { setShowApiModal(false); setTempKey(apiKey); }} className="chip text-text-dim hover:text-text-mid">
                Cancel
              </button>
              <button type="button" onClick={handleSaveApiKey} className="btn-primary px-4 py-1.5">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
