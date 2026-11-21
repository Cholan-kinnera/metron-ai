import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import { CATEGORIES } from '../../../server/domain';
import type { Stats } from '../api';
import { gsap, prefersReducedMotion } from '../motion';
import { hrefFor } from '../router';
import {
  CallToAction,
  CapabilitiesSection,
  eyebrow,
  GovernmentSection,
  HowItWorksSection,
  ProblemSection,
  Rule,
  SafeguardsSection,
  SiteFooter,
  SiteHeader,
} from './sections';

/** Public landing page with live city statistics and GSAP scroll storytelling. */
export function Landing({ stats, aiMode }: { stats?: Stats; aiMode?: 'gemini' | 'rules' }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();

      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-bg', { scale: 1.15, duration: 2.2, ease: 'power2.out' })
        .from('.hero-line', { yPercent: 110, duration: 1, stagger: 0.08 }, 0.2)
        .from('.hero-fade', { y: 20, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.6);

      gsap.to('.hero-bg', {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero-copy', {
        yPercent: -25,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.marquee-track', { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });

      gsap.utils.toArray<HTMLElement>('.reveal-img').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(18% 12% 18% 12% round 24px)' },
          {
            clipPath: 'inset(0% 0% 0% 0% round 24px)',
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 35%', scrub: true },
          },
        );
        gsap.fromTo(
          el.querySelector('img'),
          { scale: 1.25 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>('.land-reveal').forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      gsap.fromTo(
        '.gov-img',
        { yPercent: -12 },
        {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: { trigger: '.gov', start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );

      mm.add('(min-width: 1024px)', () => {
        const panels = gsap.utils.toArray<HTMLElement>('.story-panel');
        const cards = gsap.utils.toArray<HTMLElement>('.story-card');
        gsap.set([...panels.slice(1), ...cards.slice(1)], { autoAlpha: 0, y: 40 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: '.story', start: 'top top', end: '+=220%', pin: true, scrub: 0.6 },
        });
        tl.to('.story-progress', { scaleY: 1, ease: 'none', duration: 2 }, 0);
        for (let i = 1; i < panels.length; i++) {
          tl.to([panels[i - 1], cards[i - 1]], { autoAlpha: 0, y: -40, duration: 0.4 }, i - 0.6).to(
            [panels[i], cards[i]],
            { autoAlpha: 1, y: 0, duration: 0.4 },
            i - 0.3,
          );
        }
      });

      gsap.from('.receipt-line', {
        opacity: 0,
        x: -12,
        stagger: 0.1,
        duration: 0.4,
        scrollTrigger: { trigger: '.receipt', start: 'top 75%', once: true },
      });
    },
    { scope: root },
  );

  // Count-up runs separately so the scroll setup above is created exactly once.
  useGSAP(
    () => {
      if (!stats || prefersReducedMotion()) return;
      root.current?.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
        const counter = { v: 0 };
        gsap.to(counter, {
          v: Number(el.dataset.count),
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 95%', once: true },
          onUpdate: () => void (el.textContent = `${Math.round(counter.v)}${el.dataset.suffix ?? ''}`),
        });
      });
    },
    { scope: root, dependencies: [stats], revertOnUpdate: true },
  );

  const figures = [
    { label: 'Reports filed', value: stats?.total ?? 0 },
    { label: 'Critical hazards open', value: stats?.criticalOpen ?? 0 },
    { label: 'Being fixed now', value: stats?.byStatus['In Progress'] ?? 0 },
    { label: 'Resolution rate', value: stats?.resolutionRate ?? 0, suffix: '%' },
  ];
  const pipeline = [
    { label: 'Reported', value: stats?.byStatus.Reported ?? 0, bar: 'bg-slate-400' },
    { label: 'In progress', value: stats?.byStatus['In Progress'] ?? 0, bar: 'bg-amber-400' },
    { label: 'Resolved', value: stats?.byStatus.Resolved ?? 0, bar: 'bg-emerald-400' },
  ];

  return (
    <div ref={root} className="overflow-x-clip bg-[#0a0f1c] text-slate-300">
      <SiteHeader />

      <main id="main" tabIndex={-1}>
        <section
          className="hero relative flex min-h-svh items-end overflow-hidden"
          aria-labelledby="hero-title"
        >
          <img
            src="/images/city-night.webp"
            alt=""
            className="hero-bg absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/75 to-[#0a0f1c]/40"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#0a0f1c]/90 to-transparent"
          />
          <div className="hero-copy relative mx-auto w-full max-w-7xl px-5 pb-16 pt-40 sm:px-8">
            <p className={`hero-fade ${eyebrow}`}>
              <Rule />
              Municipal grievance management
            </p>
            <h1
              id="hero-title"
              className="mt-6 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              {['Every civic complaint,', 'triaged in seconds,', 'resolved in the open.'].map((line) => (
                <span key={line} className="block overflow-hidden pb-1">
                  <span className="hero-line block">{line}</span>
                </span>
              ))}
            </h1>
            <p className="hero-fade mt-7 max-w-xl text-lg leading-relaxed text-slate-300">
              Metron AI reads a citizen's photo and description with Google Gemini, decides what it is, how
              urgent it is and which department owns it, then tracks the fix until it is closed.
            </p>
            <div className="hero-fade mt-10 flex flex-wrap gap-4">
              <a
                href={hrefFor('report')}
                className="rounded-md bg-signal px-6 py-3.5 font-semibold text-[#0a0f1c] transition hover:bg-amber-300"
              >
                Report an issue
              </a>
              <a
                href={hrefFor('overview')}
                className="rounded-md border border-white/25 px-6 py-3.5 font-semibold text-white transition hover:border-white/60"
              >
                View city dashboard
              </a>
            </div>
            <dl className="hero-fade mt-20 grid grid-cols-2 border-t border-white/10 md:grid-cols-4">
              {figures.map((f, i) => (
                <div key={f.label} className={`py-6 ${i ? 'md:border-l md:border-white/10 md:pl-8' : ''}`}>
                  <dd
                    className="text-4xl font-bold tracking-tight text-white tabular-nums"
                    data-count={f.value}
                    data-suffix={f.suffix}
                  >
                    {f.value}
                    {f.suffix}
                  </dd>
                  <dt className="mt-1 text-sm text-slate-400">{f.label}</dt>
                </div>
              ))}
            </dl>
            <p className="hero-fade mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${aiMode === 'gemini' ? 'bg-emerald-400' : 'bg-amber-400'}`}
              />
              {aiMode === 'gemini'
                ? 'Live data · Google Gemini connected'
                : 'Live data · offline triage mode'}
            </p>
          </div>
        </section>

        <div className="overflow-hidden border-y border-white/5 py-5" aria-label="Issue categories handled">
          <ul className="marquee-track flex w-max gap-12 whitespace-nowrap text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            {[...CATEGORIES, ...CATEGORIES].map((c, i) => (
              <li key={i} aria-hidden={i >= CATEGORIES.length} className="flex items-center gap-12">
                {c}
                <span aria-hidden="true" className="h-px w-8 bg-white/15" />
              </li>
            ))}
          </ul>
        </div>

        <ProblemSection />

        <CapabilitiesSection />

        <HowItWorksSection />

        <SafeguardsSection />

        <GovernmentSection />

        <section className="mx-auto max-w-7xl px-5 py-32 sm:px-8" aria-labelledby="pipeline-title">
          <div className="land-reveal flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className={eyebrow}>
                <Rule />
                Live pipeline
              </p>
              <h2
                id="pipeline-title"
                className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl"
              >
                Where every complaint stands, now.
              </h2>
            </div>
            <a
              href={hrefFor('track')}
              className="font-semibold text-white underline decoration-signal underline-offset-8 hover:decoration-2"
            >
              Open the live tracker
            </a>
          </div>
          <ol className="mt-16 grid border-t border-white/10 md:grid-cols-3">
            {pipeline.map((p, i) => (
              <li
                key={p.label}
                className={`land-reveal py-10 ${i ? 'md:border-l md:border-white/10 md:pl-10' : ''}`}
              >
                <p className="flex items-center gap-3 text-sm text-slate-400">
                  <span aria-hidden="true" className={`h-4 w-[3px] rounded-full ${p.bar}`} />
                  {p.label}
                </p>
                <p
                  className="mt-4 text-7xl font-bold tracking-tight text-white tabular-nums"
                  data-count={p.value}
                >
                  {p.value}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <CallToAction />
      </main>

      <SiteFooter />
    </div>
  );
}
