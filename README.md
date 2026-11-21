# Metron AI — AI-Powered Citizen Grievance Management

> Our solution to the **CivicResolve** challenge (PromptWars × GDG on Campus PSG iTech).

**Live demo:** https://metron-ai.onrender.com · **Repo:** https://github.com/Cholan-kinnera/metron-ai

Metron AI lets citizens report potholes, overflowing garbage, broken streetlights, water leaks and other civic issues in
plain language (plus an optional photo). **Google Gemini** reads the text *and* the image, classifies the issue, judges its
urgency, and routes it to the responsible municipal department. Every ticket is tracked publicly from **Reported → In
Progress → Resolved**, and administrators manage the queue from a dashboard.

## Challenge requirements → implementation

| Requirement | Where |
| --- | --- |
| Citizen reporting (title, description, location, category, optional image) | `client/src/components/ReportForm.tsx` — GPS via Geolocation API, client-side image compression, optional category hint |
| AI classification with Google Gemini | `server/gemini.ts` — `@google/genai`, `gemini-3.5-flash-lite`, multimodal (text + photo), structured JSON output enforced by a Zod-derived JSON schema |
| Priority detection | Gemini prompt defines Low / Medium / High / Critical by public risk; validated by `analysisSchema` |
| Department recommendation | Gemini picks from a fixed department list; `DEPARTMENT_FOR` map in `server/classifier.ts` backs it up |
| Issue tracking dashboard | `console/Overview.tsx` (KPIs, SLA breaches, status pipeline, department workload) + `TrackBoard.tsx` / `IssueDialog.tsx` (search, filters, status stepper, timeline, Google Maps embed) |
| Admin dashboard | `AdminPanel.tsx` — key-protected; update status / priority / department, delete, live stats |

## Google services used
- **Google Gemini API** (`@google/genai`) — classification, prioritisation, routing, summary and reasoning, with image understanding.
- **Google Maps** — embedded map and deep links for every reported location.
- **Google Fonts** — Public Sans + IBM Plex Mono.
- Built with **Google Antigravity**; deployable to **Cloud Run** via the included `Dockerfile`.

## Beyond the brief
- **SLA tracking** per priority (Critical 24h → Low 14d) with breach detection (`server/domain.ts`).
- **Hazard safety floor** — Gemini may raise urgency but never downgrade a detected life-safety hazard (`applySafetyFloor`).
- **Analytics** — resolution rate, median fix time, per-department workload (`server/analytics.ts`).
- **Landing page** with GSAP ScrollTrigger storytelling, Lenis smooth scroll and glassmorphism UI on a dark, editorial design with real civic photography.

## Architecture
```
React 19 + Vite + Tailwind v4 + GSAP/Lenis  ──►  Express 5 API  ──►  Gemini Flash-Lite (cascade)
       (client/)                                 (server/)            │ timeout / invalid output
                                                    │                 ▼
                                             IssueStore (JSON)    rule-based classifier
```
- **Resilient AI:** a 15 s timeout, schema validation of every model response, and a deterministic keyword classifier
  fallback mean a citizen's report is never lost because of an AI outage.
- **Prompt-injection aware:** complaint text is sent as JSON data and the system prompt instructs the model to treat it as data only;
  outputs are constrained to enums.

## Security
Helmet (strict CSP, no `x-powered-by`), per-IP rate limits (stricter on submissions), 3 MB body limit, Zod validation on
every input (including image MIME/size via data-URL checks), constant-time admin-key comparison, secrets only via env vars,
and in production a missing or weak `ADMIN_KEY` locks every admin endpoint (fail closed). See [SECURITY.md](SECURITY.md).

## Accessibility
Skip link, landmarks, labelled form controls, `aria-live` results and errors, native `<dialog>` with focus management,
keyboard-only flows, visible focus rings, text-labelled status/priority badges (never colour alone), and all GSAP/Lenis
motion disabled under `prefers-reduced-motion`.

## Efficiency
Images downscaled in the browser before upload; list endpoints omit photos; zod kept out of the client bundle; gzip
compression and immutable caching for hashed assets; deferred search input.

## Testing
```bash
npm test        # 28 Vitest + Supertest tests: API, validation, auth, workflow, Gemini (mocked) + fallback, safety floor, SLA, analytics, persistence
npm run lint    # ESLint (typescript-eslint, react-hooks)
npm run build   # strict tsc + Vite build
```

## Run locally
```bash
cp .env.example .env    # add GEMINI_API_KEY (https://aistudio.google.com/apikey) and ADMIN_KEY
npm install
npm run build && npm start   # http://localhost:8080
# or: npm run dev            # Vite on :5173 proxying the API on :8080
```

## Deploy
- **Render:** `render.yaml` blueprint — set `GEMINI_API_KEY`; `ADMIN_KEY` is generated.
- **Cloud Run:** `gcloud run deploy metron-ai --source . --set-env-vars GEMINI_API_KEY=...,ADMIN_KEY=...`

Data persists to `data/issues.json` (seeded with demo complaints). For multi-instance deployments, swap `IssueStore` for Firestore.

## Photography credits
Photos from Wikimedia Commons, resized and converted to WebP:

- [Long exposure of Durgam cheruvu road in Hyderabad.jpg](https://commons.wikimedia.org/wiki/File:Long_exposure_of_Durgam_cheruvu_road_in_Hyderabad.jpg) — iMahesh, CC BY-SA 4.0
- [Driving through potholes.jpg](https://commons.wikimedia.org/wiki/File:Driving_through_potholes.jpg) — KEmel49, CC BY-SA 4.0
- [Roads deformed T munnekollala Bengaluru.jpg](https://commons.wikimedia.org/wiki/File:Roads_deformed_T_munnekollala_Bengaluru.jpg) — Gangaasoonu, CC BY-SA 4.0
- [Ripon Building panorama.jpg](https://commons.wikimedia.org/wiki/File:Ripon_Building_panorama.jpg) — PlaneMad, CC BY-SA 2.5
- [Bhubaneswar at night.JPG](https://commons.wikimedia.org/wiki/File:Bhubaneswar_at_night.JPG) — Adityakay, CC BY-SA 4.0
- [India - Sights & Culture - Common garbage dump outside a temple (2566331277).jpg](https://commons.wikimedia.org/wiki/File:India_-_Sights_%26_Culture_-_Common_garbage_dump_outside_a_temple_(2566331277).jpg) — McKay Savage from London, UK, CC BY 2.0
