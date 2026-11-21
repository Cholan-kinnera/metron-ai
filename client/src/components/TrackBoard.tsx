import { useGSAP } from '@gsap/react';
import { useDeferredValue, useEffect, useId, useRef, useState } from 'react';
import { CATEGORIES, STATUSES, type Category, type Status } from '../../../server/domain';
import { api, timeAgo, type IssueSummary } from '../api';
import { gsap, prefersReducedMotion } from '../motion';
import { PriorityBadge, SectionHeading, StatusStepper } from './ui';

export function TrackBoard({ refreshKey, onOpen }: { refreshKey: number; onOpen: (id: string) => void }) {
  const ids = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [status, setStatus] = useState<Status | ''>('');
  const [category, setCategory] = useState<Category | ''>('');
  const [search, setSearch] = useState('');
  const q = useDeferredValue(search);
  const [issues, setIssues] = useState<IssueSummary[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .list({ status: status || undefined, category: category || undefined, q: q || undefined })
      .then((rows) => active && setIssues(rows), (e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [status, category, q, refreshKey]);

  useGSAP(
    () => {
      if (issues?.length && !prefersReducedMotion()) {
        gsap.from('.issue-card', { y: 20, opacity: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out' });
      }
    },
    { scope: listRef, dependencies: [issues], revertOnUpdate: true },
  );

  return (
    <section id="track" tabIndex={-1} className="scroll-mt-20" aria-labelledby={`${ids}-h`}>
      <div>
        <SectionHeading id={`${ids}-h`} eyebrow="02 — Track" title="Every complaint, in the open.">
          Search by ticket ID, street or keyword. Urgent issues float to the top.
        </SectionHeading>

        <div className="mb-6 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]" role="search">
          <label className="sr-only" htmlFor={`${ids}-q`}>Search issues</label>
          <input id={`${ids}-q`} type="search" className="field" placeholder="Search CR-1234, street, title…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <label className="sr-only" htmlFor={`${ids}-s`}>Filter by status</label>
          <select id={`${ids}-s`} className="field" value={status} onChange={(e) => setStatus(e.target.value as Status | '')}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor={`${ids}-c`}>Filter by category</label>
          <select id={`${ids}-c`} className="field" value={category} onChange={(e) => setCategory(e.target.value as Category | '')}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {error && <p role="alert" className="text-red-700">{error}</p>}
        <p className="sr-only" aria-live="polite">
          {issues ? `${issues.length} issues shown` : 'Loading issues'}
        </p>
        <ul ref={listRef} className="grid gap-4 md:grid-cols-2">
          {issues?.map((issue) => (
            <li key={issue.id} className="issue-card">
              <button
                type="button"
                onClick={() => onOpen(issue.id)}
                className="card group flex h-full w-full flex-col gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-ink hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted">{issue.id}</p>
                    <h3 className="text-lg font-bold leading-snug group-hover:underline">{issue.title}</h3>
                  </div>
                  <PriorityBadge priority={issue.priority} />
                </div>
                <p className="line-clamp-2 text-sm text-ink-soft">{issue.description}</p>
                <StatusStepper status={issue.status} />
                <p className="mt-auto flex flex-wrap gap-x-3 text-xs text-muted">
                  <span>{issue.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{issue.department}</span>
                  <span aria-hidden="true">·</span>
                  <span>{timeAgo(issue.createdAt)}</span>
                </p>
              </button>
            </li>
          ))}
        </ul>
        {issues?.length === 0 && <p className="card p-8 text-center text-muted">No issues match these filters.</p>}
      </div>
    </section>
  );
}
