import { useGSAP } from '@gsap/react';
import { useId, useRef, useState, type FormEvent } from 'react';
import { CATEGORIES, type Category } from '../../../server/domain';
import type { Issue } from '../../../server/schema';
import { api, compressImage, mapsUrl } from '../api';
import { gsap, prefersReducedMotion } from '../motion';
import { PriorityBadge, SectionHeading } from './ui';

interface Coords {
  lat: number;
  lng: number;
}

export function ReportForm({ onCreated }: { onCreated: (issue: Issue) => void }) {
  const ids = useId();
  const resultRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<Coords>();
  const [address, setAddress] = useState('');
  const [image, setImage] = useState<string>();
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Issue>();

  useGSAP(
    () => {
      if (result && !prefersReducedMotion()) {
        gsap.from('.result-item', { y: 16, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' });
      }
    },
    { scope: resultRef, dependencies: [result], revertOnUpdate: true },
  );

  const locate = () => {
    if (!('geolocation' in navigator)) return setError('Geolocation is not supported by this browser.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        const next = { lat: Number(c.latitude.toFixed(5)), lng: Number(c.longitude.toFixed(5)) };
        setCoords(next);
        setAddress((prev) => prev || `Near ${next.lat}, ${next.lng}`);
        setLocating(false);
      },
      () => {
        setError('Could not get your location. Please type the address instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const onImage = async (file?: File) => {
    setError('');
    if (!file) return setImage(undefined);
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.');
    try {
      setImage(await compressImage(file));
    } catch {
      setError('That image could not be read. Try a JPEG or PNG.');
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError('');
    setSubmitting(true);
    try {
      const issue = await api.create({
        title: String(data.get('title')),
        description: String(data.get('description')),
        category: (data.get('category') || undefined) as Category | undefined,
        location: { address, ...coords },
        image,
      });
      setResult(issue);
      onCreated(issue);
      form.reset();
      setAddress('');
      setCoords(undefined);
      setImage(undefined);
      resultRef.current?.focus();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="report" tabIndex={-1} className="scroll-mt-20" aria-labelledby={`${ids}-h`}>
      <SectionHeading id={`${ids}-h`} eyebrow="Citizen report" title="Tell us what's broken.">
        Describe it in your own words. Gemini reads the text and the photo, picks the category, judges urgency and routes it to the
        right department.
      </SectionHeading>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <form onSubmit={onSubmit} className="card space-y-5 p-6 sm:p-8" aria-describedby={`${ids}-err`}>
          <div>
            <label htmlFor={`${ids}-title`} className="mb-1.5 block text-sm font-semibold">
              Title <span aria-hidden="true" className="text-red-400">*</span>
            </label>
            <input id={`${ids}-title`} name="title" className="field" required minLength={5} maxLength={120} placeholder="e.g. Deep pothole outside the bus depot" />
          </div>
          <div>
            <label htmlFor={`${ids}-desc`} className="mb-1.5 block text-sm font-semibold">
              Description <span aria-hidden="true" className="text-red-400">*</span>
            </label>
            <textarea id={`${ids}-desc`} name="description" className="field min-h-32" required minLength={10} maxLength={2000} placeholder="What's happening, since when, and who is affected?" />
          </div>
          <div>
            <label htmlFor={`${ids}-loc`} className="mb-1.5 block text-sm font-semibold">
              Location <span aria-hidden="true" className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <input id={`${ids}-loc`} className="field" required minLength={3} maxLength={200} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, landmark" autoComplete="street-address" />
              <button type="button" className="btn-ghost shrink-0" onClick={locate} disabled={locating} aria-label="Use my current location">
                <span className="hidden sm:inline">{locating ? 'Locating…' : 'Use my location'}</span>
              </button>
            </div>
            {coords && (
              <p className="mt-1.5 text-xs text-muted">
                GPS pinned at {coords.lat}, {coords.lng} ·{' '}
                <a className="underline" href={mapsUrl({ address, ...coords })} target="_blank" rel="noreferrer">
                  check on Google Maps
                </a>
              </p>
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`${ids}-cat`} className="mb-1.5 block text-sm font-semibold">
                Category <span className="font-normal text-muted">(optional)</span>
              </label>
              <select id={`${ids}-cat`} name="category" className="field" defaultValue="">
                <option value="">Let AI decide</option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${ids}-img`} className="mb-1.5 block text-sm font-semibold">
                Photo <span className="font-normal text-muted">(optional)</span>
              </label>
              <input id={`${ids}-img`} type="file" accept="image/png,image/jpeg,image/webp" className="field file:mr-3 file:rounded-full file:border-0 file:bg-signal file:px-3 file:py-1 file:text-paper" onChange={(e) => onImage(e.target.files?.[0])} />
            </div>
          </div>
          {image && <img src={image} alt="Preview of the attached photo" className="max-h-48 rounded-xl border border-line object-cover" />}

          <p id={`${ids}-err`} role="alert" className="text-sm font-medium text-red-400">
            {error}
          </p>
          <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={submitting}>
            {submitting ? 'Gemini is analysing…' : 'Submit report'}
          </button>
        </form>

        <div ref={resultRef} tabIndex={-1} aria-live="polite">
          {submitting ? (
            <div className="card grid h-full min-h-72 place-items-center p-8 text-center" role="status">
              <div>
                <div aria-hidden="true" className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-line border-t-signal" />
                <p className="font-semibold">Reading your report…</p>
                <p className="text-sm text-muted">Classifying · prioritising · routing</p>
              </div>
            </div>
          ) : result ? (
            <article className="card h-full overflow-hidden" aria-label="AI triage result">
              <div className="result-item border-b border-line bg-signal/10 p-6">
                <p className="text-xs uppercase tracking-widest text-muted">Ticket created</p>
                <p className="font-mono text-2xl font-medium">{result.id}</p>
                <p className="mt-1 text-sm text-muted">Save this ID to track progress.</p>
              </div>
              <dl className="space-y-4 p-6">
                <div className="result-item">
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted">Category</dt>
                  <dd className="text-lg font-semibold">{result.category}</dd>
                </div>
                <div className="result-item">
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted">Urgency</dt>
                  <dd className="mt-1">
                    <PriorityBadge priority={result.priority} />
                  </dd>
                </div>
                <div className="result-item">
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted">Routed to</dt>
                  <dd className="text-lg font-semibold">{result.department}</dd>
                </div>
                <div className="result-item">
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted">Why</dt>
                  <dd className="text-sm text-ink-soft">{result.analysis.reasoning}</dd>
                </div>
                <div className="result-item">
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted">
                    Confidence · {result.analysis.source === 'gemini' ? 'Google Gemini' : 'Rule engine'}
                  </dt>
                  <dd className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-signal" style={{ width: `${Math.round(result.analysis.confidence * 100)}%` }} />
                    <span className="sr-only">{Math.round(result.analysis.confidence * 100)} percent</span>
                  </dd>
                </div>
              </dl>
            </article>
          ) : (
            <div className="card flex h-full min-h-72 flex-col justify-center gap-4 border-dashed p-8">
              <p className="text-xl font-bold tracking-tight">How triage works</p>
              <ol className="space-y-3 text-sm text-ink-soft">
                {[
                  'Gemini reads your words and photo together.',
                  'It picks one of 8 civic categories and an urgency level based on public risk.',
                  'The ticket lands in the right department’s queue — no forms to route.',
                  'You track every status change publicly, with a timeline.',
                ].map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="w-6 shrink-0 font-mono text-xs font-medium text-signal-deep">0{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
