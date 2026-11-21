import { useEffect, useRef, useState } from 'react';
import type { Issue } from '../../../server/schema';
import { api, mapsUrl } from '../api';
import { PriorityBadge, StatusBadge, StatusStepper } from './ui';

/** Native modal dialog with full issue detail, photo, Google Map and timeline. */
export function IssueDialog({ id, onClose }: { id?: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [issue, setIssue] = useState<Issue>();
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = ref.current;
    if (!id || !dialog) return;
    setIssue(undefined);
    setError('');
    dialog.showModal();
    api.get(id).then(setIssue, (e: Error) => setError(e.message));
  }, [id]);

  const { lat, lng } = issue?.location ?? {};

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(92vw,44rem)] rounded-2xl bg-card p-0 text-ink shadow-2xl"
      aria-labelledby="issue-dialog-title"
    >
      <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8" data-lenis-prevent>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted">{id}</p>
            <h2 id="issue-dialog-title" className="text-2xl font-bold tracking-tight">
              {issue?.title ?? (error ? 'Unavailable' : 'Loading…')}
            </h2>
          </div>
          <button type="button" className="btn-ghost size-10 p-0" onClick={() => ref.current?.close()} aria-label="Close details">
            ✕
          </button>
        </div>
        {error && <p role="alert" className="text-red-400">{error}</p>}
        {issue && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <span className="text-sm text-muted">{issue.category}</span>
            </div>
            <StatusStepper status={issue.status} />
            <p className="whitespace-pre-line text-ink-soft">{issue.description}</p>
            {issue.image && <img src={issue.image} alt={`Photo submitted for: ${issue.title}`} className="max-h-80 w-full rounded-xl object-cover" />}
            <div className="rounded-xl bg-paper p-4 text-sm">
              <p>
                <strong>Department:</strong> {issue.department}
              </p>
              <p className="mt-1">
                <strong>AI summary:</strong> {issue.analysis.summary}
              </p>
              <p className="mt-1 text-muted">
                {issue.analysis.reasoning} ({issue.analysis.source === 'gemini' ? 'Google Gemini' : 'rule engine'},{' '}
                {Math.round(issue.analysis.confidence * 100)}% confidence)
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm">
                <strong>Location:</strong> {issue.location.address} ·{' '}
                <a className="font-semibold underline" href={mapsUrl(issue.location)} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
              </p>
              {lat != null && lng != null && (
                <iframe
                  title={`Map of ${issue.location.address}`}
                  className="h-56 w-full rounded-xl border border-line"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                />
              )}
            </div>
            <section aria-label="Timeline">
              <h3 className="mb-3 font-semibold">Timeline</h3>
              <ol className="relative space-y-4 border-l-2 border-line pl-5">
                {issue.timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span aria-hidden="true" className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-card bg-signal" />
                    <p className="font-semibold">{t.status}</p>
                    <p className="text-xs text-muted">
                      <time dateTime={t.at}>{new Date(t.at).toLocaleString()}</time>
                    </p>
                    {t.note && <p className="text-sm text-ink-soft">{t.note}</p>}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </div>
    </dialog>
  );
}
