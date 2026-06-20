import { LayoutDashboard, Network, Wand2, Leaf, RotateCcw, Swords, Cpu } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/format';

const NAV = [
  { id: 'engine', label: 'Allocation Engine', icon: Cpu, hint: 'Build a team' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'Monitor' },
  { id: 'network', label: 'Suspect Board', icon: Network, hint: 'ONA graph' },
  { id: 'draft', label: 'Draft Lab', icon: Wand2, hint: 'Re-draft' },
  { id: 'insights', label: 'Insights', icon: Leaf, hint: 'Sustainability' },
];

export default function AppShell({ children }) {
  const { tab, setTab, orgFixed, setOrgFixed, setSelectedNodeId } = useApp();
  return (
    <div className="relative z-10 flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-[232px] shrink-0 flex-col border-r border-stroke bg-panel/40 backdrop-blur-md">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan to-violet shadow-glow">
            <Swords size={18} className="text-abyss" />
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-wide text-text-hi">DRAFTBOARD<span className="grad-text"> AI</span></div>
            <div className="text-[10px] text-text-dim">Workforce draft engine</div>
          </div>
        </div>

        <nav className="mt-2 flex flex-col gap-1 px-3">
          {NAV.map((n) => {
            const active = tab === n.id;
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition',
                  active ? 'bg-cyan/10 text-text-hi shadow-glow' : 'text-text-mid hover:bg-panel2/60 hover:text-text-hi'
                )}
                style={active ? { borderLeft: '2px solid #2DE2E6' } : { borderLeft: '2px solid transparent' }}
              >
                <Icon size={18} className={active ? 'text-cyan' : 'text-text-dim group-hover:text-text-mid'} />
                <span className="flex-1 font-medium">{n.label}</span>
                <span className="text-[10px] text-text-dim">{n.hint}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-3">
          {orgFixed && (
            <button
              onClick={() => {
                setOrgFixed(false);
                setSelectedNodeId(null);
                setTab('dashboard');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-stroke px-3 py-2 text-xs text-text-mid hover:text-text-hi"
            >
              <RotateCcw size={13} /> Reset demo
            </button>
          )}
          <p className="mt-3 px-2 text-[10px] leading-relaxed text-text-dim">
            ImagineHack 2026 · Track 3<br />Smarter Resource Management
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1180px] px-7 py-7">{children}</div>
      </main>
    </div>
  );
}
