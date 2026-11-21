import type { ReactNode } from 'react';
import { CONSOLE_ROUTES, hrefFor, type ConsoleRoute } from '../router';

/** Console shell: sidebar navigation on desktop, horizontal tabs on mobile. */
export function ConsoleLayout({ route, aiMode, children }: { route: ConsoleRoute; aiMode?: 'gemini' | 'rules'; children: ReactNode }) {
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 z-30 bg-ink/90 text-white backdrop-blur-xl lg:h-svh">
        <div className="flex items-center justify-between gap-4 px-4 py-4 lg:flex-col lg:items-stretch lg:px-5 lg:py-6">
          <a href={hrefFor('home')} className="flex items-center gap-2 font-display text-xl font-bold">
            <img src="/favicon.svg" alt="" className="size-8" />
            Metron AI
          </a>
          <p className="hidden items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs lg:inline-flex">
            <span aria-hidden="true" className={`size-2 rounded-full ${aiMode === 'gemini' ? 'bg-emerald-400' : 'bg-signal'}`} />
            {aiMode === 'gemini' ? 'Gemini online' : 'Rule engine'}
          </p>
        </div>
        <nav aria-label="Console" className="overflow-x-auto px-2 pb-2 lg:px-3">
          <ul className="flex gap-1 lg:flex-col">
            {CONSOLE_ROUTES.map((r) => (
              <li key={r.id}>
                <a
                  href={hrefFor(r.id)}
                  aria-current={route === r.id ? 'page' : undefined}
                  className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    route === r.id ? 'bg-signal text-ink' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span aria-hidden="true" className="w-4 text-center">{r.icon}</span>
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href={hrefFor('home')} className="m-5 hidden text-sm text-white/60 hover:text-white lg:absolute lg:bottom-0 lg:block">
          ← Back to site
        </a>
      </aside>
      <main id="main" tabIndex={-1} className="min-w-0 px-4 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
