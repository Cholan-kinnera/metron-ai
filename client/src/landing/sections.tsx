import { DEPARTMENTS } from '../../../server/domain';
import { scrollToSection } from '../motion';
import { hrefFor } from '../router';
import { CAPABILITIES, GUARDRAILS, RECEIPT, STORY } from './content';
import credits from './credits.json';

/** Shared eyebrow label style for landing sections. */
export const eyebrow = 'flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-signal';

/** Short amber rule shown before each eyebrow label. */
export const Rule = () => <span aria-hidden="true" className="h-px w-10 bg-signal" />;

/** Fixed site navigation with in-page section links. */
export function SiteHeader() {
  return (
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
  );
}

/** Real civic photographs illustrating the problem being solved. */
export function ProblemSection() {
  return (
    <section id="problem" className="mx-auto max-w-7xl px-5 py-32 sm:px-8" aria-labelledby="problem-title">
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
            A pothole, an overflowing bin, a dark street. Each is minor until it is not. Citizens rarely know
            which department to call, and complaints arrive unstructured, unprioritised and untracked.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-slate-400">
            Metron AI gives every complaint a category, an urgency, an owner and a deadline the moment it is
            filed.
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
  );
}

/** The six capabilities required by the problem statement. */
export function CapabilitiesSection() {
  return (
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
  );
}

/** Pinned three-step scroll story from report to resolution. */
export function HowItWorksSection() {
  return (
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
          <h2 id="how-title" className="mb-12 mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
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
  );
}

/** How Gemini output is constrained and validated. */
export function SafeguardsSection() {
  return (
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
  );
}

/** Department list over a parallax municipal building photo. */
export function GovernmentSection() {
  return (
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
  );
}

/** Closing call to action. */
export function CallToAction() {
  return (
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
  );
}

/** Footer with navigation and photo credits. */
export function SiteFooter() {
  return (
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
  );
}
