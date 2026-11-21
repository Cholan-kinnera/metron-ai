import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import { CATEGORIES, DEPARTMENTS } from '../../../server/domain';
import type { Stats } from '../api';
import { gsap, prefersReducedMotion, scrollToSection } from '../motion';
import { hrefFor } from '../router';
import { Skyline } from './Skyline';

const FEATURES = [
  { icon: '✎', title: 'Citizen reporting', body: 'Title, description, GPS location, optional category and photo — submitted in under a minute from any phone.' },
  { icon: '✦', title: 'Gemini classification', body: 'Google Gemini reads the text and the photo together and assigns one of eight civic categories.' },
  { icon: '▲', title: 'Priority detection', body: 'Urgency is judged by public risk — Critical, High, Medium or Low — with a hazard safety floor.' },
  { icon: '⇢', title: 'Department routing', body: 'Every ticket lands with the department that owns the fix, from Public Works to the Electricity Board.' },
  { icon: '◔', title: 'Live tracking', body: 'Reported → In Progress → Resolved, with a public timeline, SLA countdown and Google Maps pin.' },
  { icon: '⚑', title: 'Admin console', body: 'Review AI triage, override priority, reassign departments and close tickets with audit notes.' },
];

const STORY = [
  { kicker: 'Step 01 · Citizen', title: 'Report it in under a minute.', body: 'A title, the place, a few words and an optional photo. GPS pins the spot; the photo is compressed in your browser.', card: { label: 'New report', title: 'Live wire hanging near school gate', meta: 'Race Course Rd · photo attached', chips: ['Awaiting triage'] } },
  { kicker: 'Step 02 · Google Gemini', title: 'Gemini triages it in seconds.', body: 'Category, urgency and the responsible department — decided from the words and the photo together.', card: { label: 'AI triage', title: 'Streetlights & Electricity', meta: 'Routed to Electricity Board · 95% confidence', chips: ['Critical', 'SLA 24h'] } },
  { kicker: 'Step 03 · Department', title: 'Watch it move to resolved.', body: 'Crews update the ticket at every step. Citizens follow the same timeline the officials see.', card: { label: 'Resolved', title: 'Wire secured, pole repaired', meta: 'Closed in 6h · within SLA', chips: ['Resolved', 'Verified'] } },
] as const;

const GUARDRAILS = [
  'Structured output — replies must match a JSON schema generated from the same Zod schema that validates them.',
  'Safety floor — Gemini can raise urgency but never downgrade an exposed wire, open manhole or collapse.',
  'Injection-aware — citizen text is passed as data, never as instructions.',
  'Never stalls — on timeout or invalid output, a deterministic rule engine triages instead.',
];

const RECEIPT = `{
  "category": "Drainage & Sewage",
  "priority": "Critical",
  "department": "Water Supply & Sewerage Board",
  "summary": "Uncovered manhole on a school route.",
  "reasoning": "Fall hazard to children; immediate risk.",
  "confidence": 0.94
}`;

const kicker = 'font-display text-lg italic text-signal-deep';

export function Landing({ stats, aiMode }: { stats?: Stats; aiMode?: 'gemini' | 'rules' }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();

      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-word', { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.05 })
        .from('.hero-fade', { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 }, '-=0.5')
        .from('.hero-tile', { y: 60, opacity: 0, scale: 0.94, duration: 1, stagger: 0.12 }, 0.2)
        .from('.sky-pin', { y: -80, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'bounce.out' }, 0.9);

      const heroScroll = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.tile-a', { yPercent: -18, ease: 'none', scrollTrigger: heroScroll });
      gsap.to('.tile-b', { yPercent: -40, ease: 'none', scrollTrigger: heroScroll });
      gsap.to('.tile-c', { yPercent: -28, ease: 'none', scrollTrigger: heroScroll });
      gsap.to('.blob', { yPercent: 40, ease: 'none', scrollTrigger: heroScroll });

      gsap.to('.marquee-track', { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });

      gsap.utils.toArray<HTMLElement>('.land-reveal').forEach((el) => {
        gsap.from(el, { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });
      gsap.utils.toArray<HTMLElement>('.feature').forEach((el, i) => {
        gsap.from(el, { y: 60, opacity: 0, rotateX: -12, duration: 0.8, delay: (i % 3) * 0.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
      });

      mm.add('(min-width: 1024px)', () => {
        const panels = gsap.utils.toArray<HTMLElement>('.story-panel');
        const cards = gsap.utils.toArray<HTMLElement>('.story-card');
        gsap.set([...panels.slice(1), ...cards.slice(1)], { autoAlpha: 0, y: 40 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: '.story', start: 'top top', end: '+=220%', pin: true, scrub: 0.6 } });
        tl.to('.story-progress', { scaleY: 1, ease: 'none', duration: 2 }, 0);
        for (let i = 1; i < panels.length; i++) {
          tl.to([panels[i - 1], cards[i - 1]], { autoAlpha: 0, y: -40, duration: 0.4 }, i - 0.6).to([panels[i], cards[i]], { autoAlpha: 1, y: 0, duration: 0.4 }, i - 0.3);
        }
      });

      gsap.from('.receipt-line', { opacity: 0, x: -12, stagger: 0.1, duration: 0.4, scrollTrigger: { trigger: '.receipt', start: 'top 75%', once: true } });
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
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          onUpdate: () => void (el.textContent = `${Math.round(counter.v)}${el.dataset.suffix ?? ''}`),
        });
      });

    },
    { scope: root, dependencies: [stats], revertOnUpdate: true },
  );

  const pipeline = [
    { label: 'Reported', value: stats?.byStatus.Reported ?? 0, dot: 'bg-slate-400' },
    { label: 'In progress', value: stats?.byStatus['In Progress'] ?? 0, dot: 'bg-signal' },
    { label: 'Resolved', value: stats?.byStatus.Resolved ?? 0, dot: 'bg-emerald-500' },
  ];

  return (
    <div ref={root} className="overflow-x-clip">
      <div className="bg-ink py-2 text-center text-xs font-medium text-white/80">
        Smart civic grievance platform · AI triage powered by Google Gemini
      </div>
      <header className="sticky top-3 z-40 px-4">
        <nav className="glass mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full px-4 sm:px-6" aria-label="Site">
          <a href={hrefFor('home')} className="flex items-center gap-2 font-display text-xl font-bold">
            <img src="/favicon.svg" alt="" className="size-8" />
            Metron AI
          </a>
          <ul className="hidden gap-7 text-sm font-semibold text-ink-soft md:flex">
            {[
              ['features', 'Features'],
              ['how', 'How it works'],
              ['gemini', 'Gemini'],
              ['pipeline', 'Live pipeline'],
            ].map(([id, label]) => (
              <li key={id}>
                <button type="button" onClick={() => scrollToSection(id)} className="hover:text-ink">{label}</button>
              </li>
            ))}
          </ul>
          <a href={hrefFor('overview')} className="btn-primary py-2 text-sm">Open console</a>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero relative" aria-labelledby="hero-title">
          <div aria-hidden="true" className="blob pointer-events-none absolute -left-32 top-10 size-[30rem] rounded-full bg-blush/50 blur-3xl" />
          <div aria-hidden="true" className="blob pointer-events-none absolute -right-20 top-40 size-[26rem] rounded-full bg-sky/40 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-28 pt-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-28">
            <div>
              <p className={`hero-fade ${kicker}`}>Connecting citizens to a responsive city</p>
              <h1 id="hero-title" className="mt-3 font-display text-5xl font-bold uppercase leading-[0.98] tracking-tight sm:text-6xl xl:text-7xl">
                {'Civic issues, resolved with intelligence.'.split(' ').map((word, i) => (
                  <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                    <span className={`hero-word inline-block ${word.startsWith('intelligence') ? 'bg-gradient-to-r from-signal-deep to-signal bg-clip-text text-transparent' : ''}`}>{word}&nbsp;</span>
                  </span>
                ))}
              </h1>
              <p className="hero-fade mt-6 max-w-xl text-lg leading-relaxed text-muted">
                Metron AI turns a pothole photo or a two-line complaint into a categorised, prioritised ticket — routed to the right department in seconds by
                Google Gemini, and tracked in the open until it is resolved.
              </p>
              <div className="hero-fade mt-9 flex flex-wrap gap-3">
                <a href={hrefFor('report')} className="btn-signal px-7 py-3.5 text-base">Report an issue →</a>
                <a href={hrefFor('track')} className="btn-ghost glass px-7 py-3.5 text-base">Track complaints</a>
              </div>
              <p className="hero-fade mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
                <span aria-hidden="true" className={`size-2.5 animate-pulse rounded-full ${aiMode === 'gemini' ? 'bg-emerald-500' : 'bg-signal'}`} />
                {aiMode === 'gemini' ? 'Gemini is live and triaging' : 'AI triage ready'}
              </p>
            </div>

            <div aria-hidden="true" className="relative grid h-[30rem] grid-cols-2 grid-rows-2 gap-4">
              <div className="hero-tile tile-a row-span-2 overflow-hidden rounded-[2rem] bg-ink shadow-2xl shadow-ink/30">
                <div className="h-full"><Skyline /></div>
              </div>
              <div className="hero-tile tile-b glass flex flex-col justify-between rounded-[2rem] p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted">Gemini triage</p>
                <p className="font-display text-xl font-bold leading-tight">Open manhole near bus stop</p>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">Critical</span>
                  <span className="rounded-full bg-ink px-2 py-0.5 text-white">Water Board</span>
                </div>
              </div>
              <div className="hero-tile tile-c glass relative overflow-hidden rounded-[2rem] p-5">
                <svg viewBox="0 0 200 140" className="absolute inset-0 h-full w-full opacity-60">
                  <path d="M0 40 H200 M0 95 H200 M55 0 V140 M140 0 V140" stroke="#13274f" strokeOpacity="0.15" strokeWidth="10" />
                  <path d="M0 120 Q100 60 200 20" stroke="#6aa7ff" strokeWidth="6" fill="none" strokeOpacity="0.5" />
                </svg>
                <span className="absolute left-[30%] top-[45%] size-4 rounded-full border-2 border-white bg-red-500 shadow" />
                <span className="absolute left-[65%] top-[25%] size-4 rounded-full border-2 border-white bg-signal shadow" />
                <span className="absolute left-[75%] top-[65%] size-4 rounded-full border-2 border-white bg-emerald-500 shadow" />
                <p className="relative text-xs font-bold uppercase tracking-widest text-muted">Live city map</p>
              </div>
            </div>
          </div>

          <dl className="land-reveal glass relative mx-4 grid max-w-5xl lg:mx-auto grid-cols-2 gap-6 rounded-[2rem] p-8 md:grid-cols-4">
            {[
              { label: 'Reports filed', value: stats?.total ?? 0 },
              { label: 'Critical open', value: stats?.criticalOpen ?? 0 },
              { label: 'Being fixed now', value: stats?.byStatus['In Progress'] ?? 0 },
              { label: 'Resolution rate', value: stats?.resolutionRate ?? 0, suffix: '%' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <dd className="font-display text-5xl font-bold text-ink" data-count={s.value} data-suffix={s.suffix}>{s.value}{s.suffix}</dd>
                <dt className="mt-1 text-xs font-bold uppercase tracking-widest text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-24 overflow-hidden bg-ink py-6 text-white" aria-label="Issue categories handled">
          <ul className="marquee-track flex w-max gap-10 whitespace-nowrap font-display text-3xl font-bold uppercase">
            {[...CATEGORIES, ...CATEGORIES].map((c, i) => (
              <li key={i} aria-hidden={i >= CATEGORIES.length} className="flex items-center gap-10">
                {c}
                <span aria-hidden="true" className="text-signal">✦</span>
              </li>
            ))}
          </ul>
        </div>

        <section id="features" className="features mx-auto max-w-6xl px-4 py-32 sm:px-6" aria-labelledby="features-title">
          <div className="land-reveal mx-auto max-w-2xl text-center">
            <p className={kicker}>Everything the challenge asks for</p>
            <h2 id="features-title" className="mt-2 font-display text-4xl font-bold uppercase md:text-5xl">One platform, end to end</h2>
          </div>
          <ul className="mt-16 grid gap-6 [perspective:1200px] sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="feature glass group rounded-[2rem] p-8 transition-shadow duration-300 hover:shadow-2xl">
                <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-ink text-xl text-signal transition group-hover:rotate-6 group-hover:scale-110">{f.icon}</span>
                <h3 className="mt-6 font-display text-2xl font-bold">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="how" className="story" aria-labelledby="how-title">
          <div className="mx-auto grid min-h-svh max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[auto_1fr_1fr]">
            <div aria-hidden="true" className="hidden h-72 w-1.5 overflow-hidden rounded-full bg-line lg:block">
              <div className="story-progress h-full w-full origin-top scale-y-0 bg-gradient-to-b from-signal to-signal-deep" />
            </div>
            <div>
              <p className={kicker}>How it works</p>
              <h2 id="how-title" className="mb-10 mt-2 font-display text-4xl font-bold uppercase md:text-5xl">From pothole to closed ticket</h2>
              <ol className="grid gap-8 lg:block">
                {STORY.map((s) => (
                  <li key={s.title} className="story-panel lg:absolute lg:max-w-md">
                    <p className="text-sm font-bold uppercase tracking-widest text-signal-deep">{s.kicker}</p>
                    <h3 className="mt-1 font-display text-3xl font-bold">{s.title}</h3>
                    <p className="mt-3 text-lg leading-relaxed text-muted">{s.body}</p>
                  </li>
                ))}
              </ol>
              <div aria-hidden="true" className="hidden h-48 lg:block" />
            </div>
            <div aria-hidden="true" className="relative hidden h-80 lg:block">
              {STORY.map((s, i) => (
                <div key={s.title} className="story-card glass absolute inset-0 rounded-[2rem] p-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted">{s.card.label}</p>
                  <p className="mt-3 font-display text-3xl font-bold">{s.card.title}</p>
                  <p className="mt-2 text-muted">{s.card.meta}</p>
                  <div className="mt-6 flex gap-2">
                    {s.card.chips.map((c) => <span key={c} className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">{c}</span>)}
                  </div>
                  <div className="mt-8 h-2 rounded-full bg-line">
                    <div className="h-full rounded-full bg-signal" style={{ width: `${((i + 1) / STORY.length) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="gemini" className="relative overflow-hidden bg-ink py-32 text-white" aria-labelledby="gemini-title">
          <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-sky/25 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-20 size-[28rem] rounded-full bg-signal/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
            <div className="land-reveal">
              <p className="font-display text-lg italic text-signal">Google Gemini, with guardrails</p>
              <h2 id="gemini-title" className="mt-2 font-display text-4xl font-bold uppercase md:text-5xl">The model understands. The rules keep it honest.</h2>
              <ul className="mt-10 space-y-5">
                {GUARDRAILS.map((g) => (
                  <li key={g} className="flex gap-3 text-white/80">
                    <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-signal text-xs font-bold text-ink">✓</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
            <figure className="receipt land-reveal glass-dark rounded-[2rem] p-7 font-mono text-sm shadow-2xl">
              <figcaption className="mb-5 flex items-center justify-between text-xs text-white/60">
                <span>gemini-2.5-flash · structured output</span>
                <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-emerald-300">schema valid</span>
              </figcaption>
              <pre className="whitespace-pre-wrap break-words text-[13px]">
                {RECEIPT.split('\n').map((line, i) => <span key={i} className="receipt-line block text-white/85">{line}</span>)}
              </pre>
            </figure>
          </div>
        </section>

        <section id="pipeline" className="mx-auto max-w-6xl px-4 py-32 sm:px-6" aria-labelledby="pipeline-title">
          <div className="land-reveal max-w-2xl">
            <p className={kicker}>Live pipeline</p>
            <h2 id="pipeline-title" className="mt-2 font-display text-4xl font-bold uppercase md:text-5xl">Every complaint, in the open</h2>
          </div>
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {pipeline.map((p, i) => (
              <li key={p.label} className="land-reveal glass rounded-[2rem] p-8">
                <p className="flex items-center gap-2 text-sm font-semibold text-muted">
                  <span aria-hidden="true" className={`size-2.5 rounded-full ${p.dot}`} />0{i + 1} · {p.label}
                </p>
                <p className="mt-4 font-display text-7xl font-bold" data-count={p.value}>{p.value}</p>
              </li>
            ))}
          </ol>
          <h3 className="mb-5 mt-20 text-sm font-bold uppercase tracking-widest text-muted">Departments on the network</h3>
          <ul className="flex flex-wrap gap-3">
            {DEPARTMENTS.map((d) => <li key={d} className="land-reveal glass rounded-full px-5 py-2.5 text-sm font-medium">{d}</li>)}
          </ul>
        </section>

        <section className="px-4 pb-24" aria-labelledby="cta-title">
          <div className="land-reveal relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-ink to-ink-soft p-10 text-white md:flex-row md:items-center md:p-16">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-signal/30 blur-3xl" />
            <h2 id="cta-title" className="relative max-w-2xl font-display text-4xl font-bold uppercase md:text-5xl">Seen something broken on your street?</h2>
            <a href={hrefFor('report')} className="btn-signal relative px-8 py-4 text-lg">Report it now →</a>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white/40 backdrop-blur">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm sm:px-6 md:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 font-display text-xl font-bold"><img src="/favicon.svg" alt="" className="size-7" />Metron AI</p>
            <p className="mt-3 text-muted">AI-powered citizen grievance management and resolution.</p>
          </div>
          <nav aria-label="Footer">
            <ul className="space-y-2 text-ink-soft">
              <li><a href={hrefFor('report')} className="hover:underline">Report an issue</a></li>
              <li><a href={hrefFor('track')} className="hover:underline">Live tracker</a></li>
              <li><a href={hrefFor('overview')} className="hover:underline">City overview</a></li>
              <li><a href={hrefFor('admin')} className="hover:underline">Admin console</a></li>
            </ul>
          </nav>
          <p className="text-muted md:text-right">Powered by Google Gemini · Google Maps<br />Built for PromptWars × GDG on Campus PSG iTech</p>
        </div>
      </footer>
    </div>
  );
}
