import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import { CATEGORIES, DEPARTMENTS } from '../../../server/domain';
import type { Stats } from '../api';
import { gsap, prefersReducedMotion, scrollToSection } from '../motion';
import { hrefFor } from '../router';
import credits from './credits.json';

const CAPABILITIES = [
  {
    title: 'Citizen reporting',
    body: 'Title, description, GPS location, optional category and photo, submitted from any phone in under a minute.',
  },
  {
    title: 'Gemini classification',
    body: 'Google Gemini reads the complaint and the photo together and assigns one of eight civic categories.',
  },
  {
    title: 'Priority detection',
    body: 'Urgency is judged by public risk, from Low to Critical, with a hazard floor the model cannot override.',
  },
  {
    title: 'Department routing',
    body: 'Each ticket goes straight to the department that owns the fix, with a service-level deadline attached.',
  },
  {
    title: 'Public tracking',
    body: 'Reported, In Progress, Resolved. Every change is time-stamped and visible to the citizen who filed it.',
  },
  {
    title: 'Administration',
    body: 'Officials review AI triage, override priority, reassign departments and close tickets with audit notes.',
  },
];

const STORY = [
  {
    step: '01',
    title: 'A citizen reports it.',
    body: 'A photo of the pothole, a sentence about it, and the location from GPS. No forms about departments or ward numbers.',
    label: 'New report',
    card: 'Deep pothole on Trichy Road, two bikes skidded this week',
    meta: 'Singanallur, Coimbatore · photo attached',
  },
  {
    step: '02',
    title: 'Gemini triages it.',
    body: 'The model reads the words and the photo together, then returns category, urgency and the responsible department as validated JSON.',
    label: 'AI triage · 2.1s',
    card: 'Roads & Potholes · High priority',
    meta: 'Routed to Public Works Department · due in 72h',
  },
  {
    step: '03',
    title: 'The city resolves it.',
    body: 'Field teams update the ticket as work progresses. The citizen sees the same timeline the officials do.',
    label: 'Resolved',
    card: 'Patch laid and road surface restored',
    meta: 'Closed in 31h · within service level',
  },
] as const;

const GUARDRAILS = [
  [
    'Structured output',
    'Replies must match a JSON schema generated from the same Zod schema that validates them on the server.',
  ],
  [
    'Hazard floor',
    'Gemini can raise urgency but can never downgrade an exposed wire, open manhole or collapse detected by rules.',
  ],
  ['Injection resistant', 'Complaint text is passed to the model strictly as data, never as instructions.'],
  [
    'Always available',
    'On timeout or invalid output a deterministic rule engine triages instead, so no report is lost.',
  ],
] as const;

const RECEIPT = `{
  "category": "Drainage & Sewage",
  "priority": "Critical",
  "department": "Water Supply & Sewerage Board",
  "summary": "Uncovered manhole on a school route.",
  "reasoning": "Fall hazard to children; immediate risk.",
  "confidence": 0.94
}`;

const eyebrow = 'flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-signal';
const Rule = () => <span aria-hidden="true" className="h-px w-10 bg-signal" />;

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
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-[#0a0f1c]/70 backdrop-blur-xl">
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8"
          aria-label="Site"
        >
          <a
            href={hrefFor('home')}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white"
          >
            <img src="/favicon.svg" alt="" className="size-7" />
            Metron AI
          </a>
          <ul className="hidden gap-8 text-sm font-medium text-slate-400 md:flex">
            {[
              ['problem', 'The problem'],
              ['capabilities', 'Capabilities'],
              ['how', 'How it works'],
              ['gemini', 'AI safeguards'],
              ['government', 'For government'],
            ].map(([id, label]) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="transition hover:text-white"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
          <a
            href={hrefFor('overview')}
            className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
          >
            Open console
          </a>
        </nav>
      </header>

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

        <section
          id="problem"
          className="mx-auto max-w-7xl px-5 py-32 sm:px-8"
          aria-labelledby="problem-title"
        >
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div className="land-reveal lg:sticky lg:top-32 lg:self-start">
              <p className={eyebrow}>
                <Rule />
                The problem
              </p>
              <h2
                id="problem-title"
                className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl"
              >
                Small failures, made worse by slow routing.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-400">
                A pothole, an overflowing bin, a dark street. Each is minor until it is not. Citizens rarely
                know which department to call, and complaints arrive unstructured, unprioritised and
                untracked.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-slate-400">
                Metron AI gives every complaint a category, an urgency, an owner and a deadline the moment it
                is filed.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <figure className="reveal-img col-span-2 overflow-hidden rounded-3xl">
                <img
                  src="/images/road-damage.webp"
                  alt="A deep, water-filled pothole in a broken asphalt road in Bengaluru"
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover"
                />
              </figure>
              <figure className="reveal-img overflow-hidden rounded-3xl">
                <img
                  src="/images/pothole.webp"
                  alt="An auto-rickshaw driving through a pothole-ridden rural road in Kerala"
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover"
                />
              </figure>
              <figure className="reveal-img overflow-hidden rounded-3xl">
                <img
                  src="/images/garbage.webp"
                  alt="Uncollected garbage spilling around a roadside bin beside a wall"
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover"
                />
              </figure>
            </div>
          </div>
        </section>

        <section
          id="capabilities"
          className="border-t border-white/5 bg-[#0d1424] py-32"
          aria-labelledby="cap-title"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="land-reveal max-w-2xl">
              <p className={eyebrow}>
                <Rule />
                Capabilities
              </p>
              <h2 id="cap-title" className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
                One workflow, from complaint to closure.
              </h2>
            </div>
            <ol className="mt-20 grid gap-x-16 md:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((c, i) => (
                <li key={c.title} className="land-reveal border-t border-white/10 py-10">
                  <p className="font-mono text-sm text-signal">0{i + 1}</p>
                  <h3 className="mt-4 text-xl font-semibold text-white">{c.title}</h3>
                  <p className="mt-3 leading-relaxed text-slate-400">{c.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="how" className="story border-t border-white/5" aria-labelledby="how-title">
          <div className="mx-auto grid min-h-svh max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[auto_1fr_1fr] lg:gap-16">
            <div aria-hidden="true" className="hidden h-80 w-px overflow-hidden bg-white/10 lg:block">
              <div className="story-progress h-full w-full origin-top scale-y-0 bg-signal" />
            </div>
            <div>
              <p className={eyebrow}>
                <Rule />
                How it works
              </p>
              <h2
                id="how-title"
                className="mb-12 mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl"
              >
                Three steps. No paperwork.
              </h2>
              <ol className="grid gap-10 lg:block">
                {STORY.map((s) => (
                  <li key={s.step} className="story-panel lg:absolute lg:max-w-md">
                    <p className="font-mono text-sm text-signal">{s.step}</p>
                    <h3 className="mt-2 text-3xl font-semibold text-white">{s.title}</h3>
                    <p className="mt-4 text-lg leading-relaxed text-slate-400">{s.body}</p>
                  </li>
                ))}
              </ol>
              <div aria-hidden="true" className="hidden h-52 lg:block" />
            </div>
            <div aria-hidden="true" className="relative hidden h-72 lg:block">
              {STORY.map((s, i) => (
                <div key={s.step} className="story-card glass-dark absolute inset-0 rounded-2xl p-8">
                  <p className="font-mono text-xs uppercase tracking-wider text-slate-400">{s.label}</p>
                  <p className="mt-5 text-2xl font-semibold leading-snug text-white">{s.card}</p>
                  <p className="mt-3 text-slate-400">{s.meta}</p>
                  <div className="mt-10 grid grid-cols-3 gap-2">
                    {STORY.map((_, j) => (
                      <span key={j} className={`h-1 rounded-full ${j <= i ? 'bg-signal' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="gemini"
          className="relative overflow-hidden border-t border-white/5 bg-[#0d1424] py-32"
          aria-labelledby="gemini-title"
        >
          <div className="relative mx-auto grid max-w-7xl items-start gap-16 px-5 sm:px-8 lg:grid-cols-2">
            <div className="land-reveal">
              <p className={eyebrow}>
                <Rule />
                AI safeguards
              </p>
              <h2 id="gemini-title" className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
                Gemini understands. Rules keep it accountable.
              </h2>
              <dl className="mt-12 divide-y divide-white/10 border-y border-white/10">
                {GUARDRAILS.map(([title, body]) => (
                  <div key={title} className="grid gap-2 py-6 sm:grid-cols-[11rem_1fr]">
                    <dt className="font-semibold text-white">{title}</dt>
                    <dd className="text-slate-400">{body}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <figure className="receipt land-reveal overflow-hidden rounded-2xl border border-white/10 bg-black/40 lg:mt-24">
              <figcaption className="flex items-center justify-between border-b border-white/10 px-6 py-4 font-mono text-xs text-slate-400">
                <span>gemini-3.5-flash-lite · response</span>
                <span className="text-emerald-400">schema valid</span>
              </figcaption>
              <pre className="whitespace-pre-wrap break-words p-6 font-mono text-[13px] leading-relaxed">
                {RECEIPT.split('\n').map((line, i) => (
                  <span key={i} className="receipt-line block text-slate-300">
                    {line}
                  </span>
                ))}
              </pre>
            </figure>
          </div>
        </section>

        <section id="government" className="gov relative overflow-hidden" aria-labelledby="gov-title">
          <img
            src="/images/municipal.webp"
            alt=""
            loading="lazy"
            className="gov-img absolute inset-0 h-[124%] w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-[#0a0f1c]/80" />
          <div className="relative mx-auto max-w-7xl px-5 py-36 sm:px-8">
            <div className="land-reveal max-w-2xl">
              <p className={eyebrow}>
                <Rule />
                For government
              </p>
              <h2 id="gov-title" className="mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
                Built around how a municipal corporation actually works.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-300">
                Tickets map to real departments with service-level deadlines by priority. Officials get a live
                overview of workload, breaches and resolution time, and every action leaves an audit trail.
              </p>
            </div>
            <ul className="land-reveal mt-16 grid gap-x-10 border-t border-white/15 sm:grid-cols-2 lg:grid-cols-4">
              {DEPARTMENTS.map((d) => (
                <li key={d} className="border-b border-white/10 py-5 text-white">
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </section>

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

        <section className="relative overflow-hidden" aria-labelledby="cta-title">
          <img
            src="/images/hero.webp"
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#0a0f1c] via-[#0a0f1c]/85 to-[#0a0f1c]/40"
          />
          <div className="land-reveal relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-5 py-32 sm:px-8">
            <h2 id="cta-title" className="max-w-2xl text-4xl font-bold tracking-tight text-white md:text-6xl">
              Seen something broken on your street?
            </h2>
            <a
              href={hrefFor('report')}
              className="rounded-md bg-signal px-7 py-4 text-lg font-semibold text-[#0a0f1c] transition hover:bg-amber-300"
            >
              File a report
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 text-sm sm:px-8 md:grid-cols-[1fr_auto_1.4fr]">
          <div>
            <p className="flex items-center gap-2.5 text-lg font-bold text-white">
              <img src="/favicon.svg" alt="" className="size-7" />
              Metron AI
            </p>
            <p className="mt-3 max-w-xs text-slate-500">
              AI-assisted citizen grievance management. Triage by Google Gemini, maps by Google Maps.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="space-y-2.5 text-slate-400">
              <li>
                <a href={hrefFor('report')} className="hover:text-white">
                  Report an issue
                </a>
              </li>
              <li>
                <a href={hrefFor('track')} className="hover:text-white">
                  Live tracker
                </a>
              </li>
              <li>
                <a href={hrefFor('overview')} className="hover:text-white">
                  City overview
                </a>
              </li>
              <li>
                <a href={hrefFor('admin')} className="hover:text-white">
                  Admin console
                </a>
              </li>
            </ul>
          </nav>
          <div className="text-xs leading-relaxed text-slate-500">
            <p className="mb-2 font-semibold uppercase tracking-wider text-slate-400">Photography</p>
            <ul className="space-y-1">
              {credits.map((c) => (
                <li key={c.file}>
                  <a href={c.source} target="_blank" rel="noreferrer" className="hover:text-slate-300">
                    {c.title}
                  </a>{' '}
                  · {c.author} · {c.license}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
