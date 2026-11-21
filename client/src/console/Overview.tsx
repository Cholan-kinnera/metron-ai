import { useEffect, useState } from 'react';
import { PRIORITIES, STATUSES, slaState } from '../../../server/domain';
import { api, type IssueSummary, type Stats } from '../api';
import { PriorityBadge, StatusBadge } from '../components/ui';
import { hrefFor } from '../router';

const STATUS_FILL = { Reported: '#8a93a8', 'In Progress': '#fca311', Resolved: '#059669' } as const;

function Kpi({ label, value, hint, tone = '' }: { label: string; value: string | number; hint: string; tone?: string }) {
  return (
    <div className={`card p-5 ${tone}`}>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</dd>
      <dd className="mt-1 text-xs text-muted">{hint}</dd>
    </div>
  );
}

/** Horizontal single-hue bars for magnitudes, each labelled with its value. */
function BarList({ rows, label }: { rows: [string, number][]; label: string }) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <figure className="card p-5">
      <figcaption className="mb-4 text-sm font-bold">{label}</figcaption>
      <ul className="space-y-3">
        {rows.map(([name, count]) => (
          <li key={name} className="grid grid-cols-[minmax(0,11rem)_1fr_2rem] items-center gap-3 text-sm" title={`${name}: ${count}`}>
            <span className="truncate text-ink-soft">{name}</span>
            <span className="h-3 rounded-full bg-line/60">
              <span className="block h-full rounded-full bg-ink transition-[width] duration-700" style={{ width: `${(count / max) * 100}%` }} />
            </span>
            <span className="text-right font-semibold tabular-nums">{count}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function Overview({ stats, refreshKey }: { stats?: Stats; refreshKey: number }) {
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    api.list().then((rows) => {
      setIssues(rows);
      setNow(Date.now());
    }, () => {});
  }, [refreshKey]);

  const attention = issues
    .filter((i) => i.status !== 'Resolved')
    .map((i) => ({ issue: i, sla: slaState(i, now) }))
    .sort((a, b) => a.sla.hoursLeft - b.sla.hoursLeft)
    .slice(0, 5);
  const total = Math.max(1, stats?.total ?? 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          <span aria-hidden="true" className="h-px w-8 bg-signal" />
          City overview
        </p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Resolution at a glance</h1>
      </header>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total reports" value={stats?.total ?? '…'} hint="All time" />
        <Kpi label="Open" value={stats?.open ?? '…'} hint="Reported + in progress" />
        <Kpi label="Critical open" value={stats?.criticalOpen ?? '…'} hint="Risk to life" tone={stats?.criticalOpen ? 'shadow-[inset_3px_0_0_#dc2626]' : ''} />
        <Kpi label="SLA breached" value={stats?.overdue ?? '…'} hint="Open past target" tone={stats?.overdue ? 'shadow-[inset_3px_0_0_#f59e0b]' : ''} />
        <Kpi label="Resolution rate" value={stats ? `${stats.resolutionRate}%` : '…'} hint="Resolved / total" />
        <Kpi label="Median fix time" value={stats?.medianResolutionHours != null ? `${stats.medianResolutionHours}h` : '—'} hint="Report → resolved" />
      </dl>

      <figure className="card p-5">
        <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
          Status pipeline
          <ul className="flex flex-wrap gap-4 text-xs font-medium text-ink-soft">
            {STATUSES.map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ background: STATUS_FILL[s] }} />
                {s} · {stats?.byStatus[s] ?? 0}
              </li>
            ))}
          </ul>
        </figcaption>
        <div className="flex h-5 gap-0.5 overflow-hidden rounded-md" role="img" aria-label={STATUSES.map((s) => `${s}: ${stats?.byStatus[s] ?? 0}`).join(', ')}>
          {STATUSES.map((s) => (
            <span key={s} title={`${s}: ${stats?.byStatus[s] ?? 0}`} style={{ width: `${((stats?.byStatus[s] ?? 0) / total) * 100}%`, background: STATUS_FILL[s] }} />
          ))}
        </div>
      </figure>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList label="Issues by category" rows={Object.entries(stats?.byCategory ?? {}).sort((a, b) => b[1] - a[1])} />
        <BarList label="Issues by priority" rows={[...PRIORITIES].reverse().map((p) => [p, stats?.byPriority[p] ?? 0])} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-5" aria-labelledby="attention-h">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="attention-h" className="text-sm font-bold">Needs attention</h2>
            <a href={hrefFor('track')} className="text-sm font-semibold underline">View all</a>
          </div>
          <ul className="divide-y divide-line">
            {attention.map(({ issue, sla }) => (
              <li key={issue.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{issue.title}</p>
                  <p className="text-xs text-muted"><span className="font-mono">{issue.id}</span> · {issue.department}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={issue.priority} />
                  <span className={`text-xs font-bold ${sla.breached ? 'text-red-700' : 'text-ink-soft'}`}>{sla.label}</span>
                </div>
              </li>
            ))}
            {attention.length === 0 && <li className="py-6 text-center text-muted">No open issues.</li>}
          </ul>
        </section>

        <section className="card p-5" aria-labelledby="dept-h">
          <h2 id="dept-h" className="mb-4 text-sm font-bold">Department workload</h2>
          <table className="w-full text-sm">
            <caption className="sr-only">Open and resolved issues per department</caption>
            <thead className="text-left text-xs uppercase tracking-widest text-muted">
              <tr>
                <th scope="col" className="pb-2">Department</th>
                <th scope="col" className="pb-2 text-right">Open</th>
                <th scope="col" className="pb-2 text-right">Resolved</th>
              </tr>
            </thead>
            <tbody>
              {stats?.byDepartment.filter((d) => d.open + d.resolved > 0).map((d) => (
                <tr key={d.department} className="border-t border-line">
                  <th scope="row" className="py-2 text-left font-medium">{d.department}</th>
                  <td className="py-2 text-right tabular-nums">{d.open}</td>
                  <td className="py-2 text-right tabular-nums">{d.resolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-muted">{stats?.aiShare ?? 0}% of tickets triaged by Google Gemini.</p>
        </section>
      </div>

      <section className="card p-5" aria-labelledby="recent-h">
        <h2 id="recent-h" className="mb-3 text-sm font-bold">Recent activity</h2>
        <ul className="grid gap-x-8 md:grid-cols-2">
          {[...issues].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6).map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm">
              <span className="truncate">{i.title}</span>
              <StatusBadge status={i.status} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
