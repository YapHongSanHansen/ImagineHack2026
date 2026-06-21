import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import AppShell from './components/AppShell';
import CommandCenter from './pages/CommandCenter';
import Engine from './pages/Engine';
import Dashboard from './pages/Dashboard';
import SuspectBoard from './pages/SuspectBoard';
import DraftLab from './pages/DraftLab';
import Insights from './pages/Insights';
import Roster from './pages/Roster';

const PAGES = {
  command: CommandCenter,
  engine: Engine,
  dashboard: Dashboard,
  network: SuspectBoard,
  draft: DraftLab,
  insights: Insights,
  roster: Roster,
};

function Shell() {
  const { tab } = useApp();
  const Page = PAGES[tab] || Dashboard;
  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Page />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
