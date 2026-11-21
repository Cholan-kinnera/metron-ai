import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import type { Stats } from '../api';
import { gsap, prefersReducedMotion, scrollToSection } from '../motion';

const HEADLINE = 'Report it. We route it. Watch it get fixed.';

export function Hero({ stats, aiMode }: { stats?: Stats; aiMode?: 'gemini' | 'rules' }) {
  const root = useRef<HTMLElement>(null);
  const resolved = stats?.byStatus.Resolved ?? 0;
  const tiles = [
    { label: 'Issues reported', value: stats?.total ?? 0 },
    { label: 'In progress', value: stats?.byStatus['In Progress'] ?? 0 },
    { label: 'Resolved', value: resolved },
  ];

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-word', { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.06 })
        .from('.hero-fade', { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 }, '-=0.5')
        .from('.hero-orb', { scale: 0.6, opacity: 0, duration: 1.4, ease: 'expo.out' }, 0);
      gsap.to('.hero-orb', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', scrub: true } });
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (!stats) return;
      root.current?.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        if (prefersReducedMotion()) return void (el.textContent = String(target));
        const counter = { v: 0 };
        gsap.to(counter, { v: target, duration: 1.6, ease: 'power2.out', onUpdate: () => void (el.textContent = String(Math.round(counter.v))) });
      });
    },
    { scope: root, dependencies: [stats] },
  );

  return (
    <section ref={root} className="grain relative overflow-hidden bg-ink pb-20 pt-32 text-white" aria-labelledby="hero-title">
      <div aria-hidden="true" className="hero-orb pointer-events-none absolute -right-32 -top-24 size-[28rem] rounded-full bg-signal/30 blur-3xl" />
      <div aria-hidden="true" className="hero-orb pointer-events-none absolute -bottom-40 left-10 size-80 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <p className="hero-fade mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold tracking-wide">
          <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-signal" />
          {aiMode === 'gemini' ? 'Live triage by Google Gemini' : 'AI triage ready'}
        </p>
        <h1 id="hero-title" className="max-w-4xl font-display text-5xl font-bold leading-[1.02] sm:text-6xl md:text-7xl">
          {HEADLINE.split(' ').map((word, i) => (
            <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
              <span className={`hero-word inline-block ${word.startsWith('fixed') ? 'text-signal' : ''}`}>{word}&nbsp;</span>
            </span>
          ))}
        </h1>
        <p className="hero-fade mt-6 max-w-xl text-lg text-white/75">
          CivicResolve turns a pothole photo or a two-line complaint into a categorised, prioritised ticket — routed to the right
          department in seconds, and tracked in the open until it's resolved.
        </p>
        <div className="hero-fade mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn-signal text-base" onClick={() => scrollToSection('report')}>
            Report an issue
          </button>
          <button type="button" className="btn border border-white/30 text-base text-white hover:bg-white/10" onClick={() => scrollToSection('track')}>
            Track complaints
          </button>
        </div>
        <dl className="hero-fade mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/15 pt-6">
          {tiles.map((tile) => (
            <div key={tile.label}>
              <dt className="text-xs uppercase tracking-widest text-white/60">{tile.label}</dt>
              <dd className="font-display text-4xl font-bold" data-count={tile.value} aria-live="polite">
                {tile.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
