import type { ReactNode } from 'react';
import { STATUSES, type Priority, type Status } from '../../../server/domain';

const PRIORITY_STYLE: Record<Priority, string> = {
  Low: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  Medium: 'bg-sky-100 text-sky-900 border-sky-300',
  High: 'bg-amber-100 text-amber-900 border-amber-300',
  Critical: 'bg-red-100 text-red-900 border-red-300',
};

const STATUS_STYLE: Record<Status, string> = {
  Reported: 'bg-white text-ink border-line',
  'In Progress': 'bg-signal/20 text-signal-deep border-signal/50',
  Resolved: 'bg-emerald-600 text-white border-emerald-700',
};

const pill = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold';

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`${pill} ${PRIORITY_STYLE[priority]}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {priority} priority
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`${pill} ${STATUS_STYLE[status]}`}>{status}</span>;
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
              i <= current ? 'bg-ink text-white' : 'border border-line bg-white text-muted'
            }`}
          >
            {i < current ? '✓' : i + 1}
          </span>
          <span className={`text-xs ${i <= current ? 'font-semibold text-ink' : 'text-muted'}`}>{step}</span>
          {i < STATUSES.length - 1 && <span aria-hidden="true" className={`h-px flex-1 ${i < current ? 'bg-ink' : 'bg-line'}`} />}
        </li>
      ))}
    </ol>
  );
}

export function SectionHeading({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="reveal mb-8 max-w-2xl">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-signal-deep">{eyebrow}</p>
      <h2 id={id} className="font-display text-4xl font-bold leading-tight md:text-5xl">{title}</h2>
      {children && <p className="mt-3 text-lg text-muted">{children}</p>}
    </header>
  );
}
