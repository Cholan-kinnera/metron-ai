# Testing

`npm test` runs 28 Vitest tests in under a second:

| Suite | Covers |
| --- | --- |
| `server/app.test.ts` | Create/list/get/update/delete over HTTP, validation errors, image checks, malformed JSON, admin auth, status workflow + timeline, security headers |
| `server/ai.test.ts` | Rule classifier routing, Critical escalation, Gemini structured output (mocked SDK), inline image parts, fallback on invalid output and API errors |
| `server/analytics.test.ts` | SLA countdown and breach logic, KPI aggregation, median, empty data, hazard safety floor |
| `server/store.test.ts` | JSON persistence round-trip, idempotent seeding, timeline only on status change |

CI (`.github/workflows/ci.yml`) runs lint, tests and a strict type-checked build on every push.
