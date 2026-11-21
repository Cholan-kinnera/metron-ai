import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { DEPARTMENTS, PRIORITIES, STATUSES } from '../../../server/domain';
import type { UpdateIssueInput } from '../../../server/schema';
import { api, type IssueSummary, type Stats } from '../api';
import { SectionHeading } from './ui';

const KEY_STORAGE = 'metron-ai-admin-key';

function readKey(): string {
  try {
    return sessionStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

/** Key-protected admin console for reviewing triage and updating status, priority and department. */
export function AdminPanel({
  stats,
  onChanged,
  onOpen,
}: {
  stats?: Stats;
  onChanged: () => void;
  onOpen: (id: string) => void;
}) {
  const ids = useId();
  const [key, setKey] = useState(readKey);
  const [authed, setAuthed] = useState(false);
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string>();

  const load = useCallback(() => api.list().then(setIssues, (e: Error) => setMessage(e.message)), []);

  const login = useCallback(
    async (candidate: string) => {
      try {
        await api.verifyAdmin(candidate);
        sessionStorage.setItem(KEY_STORAGE, candidate);
        setAuthed(true);
        setMessage('');
        await load();
      } catch {
        setAuthed(false);
        setMessage('That admin key was not accepted.');
      }
    },
    [load],
  );

  useEffect(() => {
    const saved = readKey();
    if (!saved) return;
    api.verifyAdmin(saved).then(
      () => {
        setAuthed(true);
        return load();
      },
      () => sessionStorage.removeItem(KEY_STORAGE),
    );
  }, [load]);

  const update = async (id: string, patch: UpdateIssueInput) => {
    try {
      await api.update(id, patch, key);
      setMessage(`${id} updated.`);
      await load();
      onChanged();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.remove(id, key);
      setConfirmDelete(undefined);
      setMessage(`${id} deleted.`);
      await load();
      onChanged();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  const onLogin = (e: FormEvent) => {
    e.preventDefault();
    void login(key);
  };

  const categoryRows = Object.entries(stats?.byCategory ?? {}).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(1, ...categoryRows.map(([, n]) => n));

  return (
    <section id="admin" tabIndex={-1} className="scroll-mt-20" aria-labelledby={`${ids}-h`}>
      <SectionHeading id={`${ids}-h`} eyebrow="Administration" title="Run the queue.">
        Review AI triage, reassign departments, override urgency and move tickets to resolution.
      </SectionHeading>

      {!authed ? (
        <form onSubmit={onLogin} className="card flex max-w-lg flex-col gap-3 p-6 sm:flex-row">
          <label htmlFor={`${ids}-key`} className="sr-only">
            Admin key
          </label>
          <input
            id={`${ids}-key`}
            type="password"
            className="field"
            placeholder="Admin key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="submit" className="btn-primary shrink-0">
            Unlock
          </button>
        </form>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
            <dl className="grid grid-cols-2 gap-4">
              {[
                ['Total', stats?.total ?? 0],
                ['Critical', stats?.byPriority.Critical ?? 0],
                ['Open', (stats?.byStatus.Reported ?? 0) + (stats?.byStatus['In Progress'] ?? 0)],
                ['Resolved', stats?.byStatus.Resolved ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="card p-5">
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted">{label}</dt>
                  <dd className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <figure className="card p-5">
              <figcaption className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
                Issues by category
              </figcaption>
              <ul className="space-y-2">
                {categoryRows.map(([name, count]) => (
                  <li key={name} className="grid grid-cols-[10rem_1fr_2rem] items-center gap-3 text-sm">
                    <span className="truncate">{name}</span>
                    <span className="h-2.5 rounded-full bg-line">
                      <span
                        className="block h-full rounded-full bg-sky-400/80"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </span>
                    <span className="text-right font-semibold tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            </figure>
          </div>

          <p role="status" className="min-h-5 text-sm font-medium text-ink-soft">
            {message}
          </p>

          <div className="card overflow-x-auto" data-lenis-prevent>
            <table className="w-full min-w-[56rem] text-left text-sm">
              <caption className="sr-only">All reported issues, most urgent first</caption>
              <thead className="border-b border-line text-xs uppercase tracking-widest text-muted">
                <tr>
                  <th scope="col" className="p-4">
                    Issue
                  </th>
                  <th scope="col" className="p-4">
                    Status
                  </th>
                  <th scope="col" className="p-4">
                    Priority
                  </th>
                  <th scope="col" className="p-4">
                    Department
                  </th>
                  <th scope="col" className="p-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id} className="border-b border-line/70 last:border-0">
                    <th scope="row" className="p-4 font-normal">
                      <button
                        type="button"
                        className="text-left font-semibold hover:underline"
                        onClick={() => onOpen(issue.id)}
                      >
                        {issue.title}
                      </button>
                      <p className="text-xs text-muted">
                        <span className="font-mono">{issue.id}</span> · {issue.location.address}
                      </p>
                    </th>
                    <td className="p-4">
                      <select
                        aria-label={`Status for ${issue.id}`}
                        className="field py-2"
                        value={issue.status}
                        onChange={(e) =>
                          update(issue.id, { status: e.target.value as IssueSummary['status'] })
                        }
                      >
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        aria-label={`Priority for ${issue.id}`}
                        className="field py-2"
                        value={issue.priority}
                        onChange={(e) =>
                          update(issue.id, { priority: e.target.value as IssueSummary['priority'] })
                        }
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        aria-label={`Department for ${issue.id}`}
                        className="field py-2"
                        value={issue.department}
                        onChange={(e) =>
                          update(issue.id, { department: e.target.value as IssueSummary['department'] })
                        }
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      {confirmDelete === issue.id ? (
                        <span className="inline-flex gap-2">
                          <button
                            type="button"
                            className="btn bg-red-600 px-3 py-1.5 text-white"
                            onClick={() => remove(issue.id)}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="btn-ghost px-3 py-1.5"
                            onClick={() => setConfirmDelete(undefined)}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-ghost px-3 py-1.5"
                          onClick={() => setConfirmDelete(issue.id)}
                          aria-label={`Delete ${issue.id}`}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!authed && message && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {message}
        </p>
      )}
    </section>
  );
}
