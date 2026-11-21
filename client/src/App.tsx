import { useGSAP } from '@gsap/react';
import { useCallback, useEffect, useState } from 'react';
import { api, type Stats } from './api';
import { AdminPanel } from './components/AdminPanel';
import { IssueDialog } from './components/IssueDialog';
import { ReportForm } from './components/ReportForm';
import { TrackBoard } from './components/TrackBoard';
import { ConsoleLayout } from './console/ConsoleLayout';
import { Overview } from './console/Overview';
import { Landing } from './landing/Landing';
import { gsap, initSmoothScroll, prefersReducedMotion } from './motion';
import { useRoute } from './router';

/** Root component: hash-routed landing page and officials/citizen console. */
export function App() {
  const route = useRoute();
  const [stats, setStats] = useState<Stats>();
  const [aiMode, setAiMode] = useState<'gemini' | 'rules'>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [openId, setOpenId] = useState<string>();

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    api.stats().then(setStats, () => {});
  }, []);

  useEffect(() => {
    api.stats().then(setStats, () => {});
    api.health().then(
      (h) => setAiMode(h.ai),
      () => {},
    );
    return initSmoothScroll();
  }, []);

  useGSAP(
    () => {
      if (route === 'home' || prefersReducedMotion()) return;
      gsap.from('.console-page', { y: 24, opacity: 0, duration: 0.5, ease: 'power2.out' });
    },
    { dependencies: [route], revertOnUpdate: true },
  );

  if (route === 'home') return <Landing stats={stats} aiMode={aiMode} />;

  return (
    <>
      <ConsoleLayout route={route} aiMode={aiMode}>
        <div className="console-page" key={route}>
          {route === 'overview' && <Overview stats={stats} refreshKey={refreshKey} />}
          {route === 'report' && <ReportForm onCreated={refresh} />}
          {route === 'track' && <TrackBoard refreshKey={refreshKey} onOpen={setOpenId} />}
          {route === 'admin' && <AdminPanel stats={stats} onChanged={refresh} onOpen={setOpenId} />}
        </div>
      </ConsoleLayout>
      <IssueDialog id={openId} onClose={() => setOpenId(undefined)} />
    </>
  );
}
