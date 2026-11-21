import { useGSAP } from '@gsap/react';
import { useCallback, useEffect, useState } from 'react';
import { api, type Stats } from './api';
import { AdminPanel } from './components/AdminPanel';
import { Hero } from './components/Hero';
import { IssueDialog } from './components/IssueDialog';
import { ReportForm } from './components/ReportForm';
import { TrackBoard } from './components/TrackBoard';
import { gsap, initSmoothScroll, prefersReducedMotion, scrollToSection } from './motion';

const NAV = [
  ['report', 'Report'],
  ['track', 'Track'],
  ['admin', 'Admin'],
] as const;

export function App() {
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
    api.health().then((h) => setAiMode(h.ai), () => {});
    return initSmoothScroll();
  }, []);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
      gsap.from(el, { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  });

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-ink/85 text-white backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Primary">
          <a href="#main" className="flex items-center gap-2 font-display text-xl font-bold">
            <img src="/favicon.svg" alt="" className="size-7" />
            CivicResolve
          </a>
          <ul className="flex gap-1">
            {NAV.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(id);
                    history.replaceState(null, '', `#${id}`);
                  }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <Hero stats={stats} aiMode={aiMode} />
        <ReportForm onCreated={refresh} />
        <TrackBoard refreshKey={refreshKey} onOpen={setOpenId} />
        <AdminPanel stats={stats} onChanged={refresh} onOpen={setOpenId} />
      </main>
      <footer className="bg-ink py-10 text-center text-sm text-white/70">
        <p>CivicResolve · AI triage powered by Google Gemini · Built for PromptWars × GDG on Campus PSG iTech</p>
      </footer>
      <IssueDialog id={openId} onClose={() => setOpenId(undefined)} />
    </>
  );
}
