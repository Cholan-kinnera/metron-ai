import type { ReactNode } from 'react';
import { STATUSES, type Priority, type Status } from '../../../server/domain';

const PRIORITY_BAR: Record<Priority, string> = {
  Low: 'bg-slate-400',
  Medium: 'bg-sky-600',
  High: 'bg-amber-500',
  Critical: 'bg-red-600',
};

const STATUS_BAR: Record<Status, string> = {
  Reported: 'bg-slate-400',
  'In Progress': 'bg-amber-500',
  Resolved: 'bg-emerald-600',
};

/** Plain-text indicator: a short colour rule plus the label, so meaning never relies on colour. */
function Indicator({ bar, children }: { bar: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-ink">
      <span aria-hidden="true" className={`h-3.5 w-[3px] rounded-full ${bar}`} />
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Indicator bar={PRIORITY_BAR[priority]}>{priority}</Indicator>;
}

export function StatusBadge({ status }: { status: Status }) {
  return <Indicator bar={STATUS_BAR[status]}>{status}</Indicator>;
}

/** Three-step progress indicator: Reported → In Progress → Resolved. */
export function StatusStepper({ status }: { status: Status }) {
  const current = STATUSES.indexOf(status);
  return (
    <ol className="flex items-center gap-2" aria-label={`Progress: ${status}`}>
      {STATUSES.map((step, i) => (
        <li key={step} className="flex flex-1 items-center gap-2" aria-current={i === current ? 'step' : undefined}>
          <span
            className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
              i <= current ? 'bg-signal text-paper' : 'border border-line bg-card text-muted'
            }`}
          >
            {i < current ? '✓' : i + 1}
          </span>
          <span className={`text-xs ${i <= current ? 'font-semibold text-ink' : 'text-muted'}`}>{step}</span>
          {i < STATUSES.length - 1 && <span aria-hidden="true" className={`h-px flex-1 ${i < current ? 'bg-signal' : 'bg-line'}`} />}
        </li>
      ))}
    </ol>
  );
}

export function SectionHeading({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-6 max-w-2xl">
      <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        <span aria-hidden="true" className="h-px w-8 bg-signal" />
        {eyebrow}
      </p>
      <h1 id={id} className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      {children && <p className="mt-3 text-lg text-muted">{children}</p>}
    </header>
  );
}
