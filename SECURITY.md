# Security

| Threat | Mitigation | Code |
| --- | --- | --- |
| XSS / clickjacking | Helmet strict CSP (`default-src 'self'`, framing only from Google Maps), React output escaping | `server/app.ts` |
| Malformed or oversized input | Zod schemas on every body and query; 3 MB JSON limit; image must be PNG/JPEG/WebP data URL ≤ 2 MB | `server/schema.ts` |
| Abuse / spam | Per-IP rate limits: 120 req/min API-wide, 10 submissions/min | `server/app.ts` |
| Admin key brute force / timing | `crypto.timingSafeEqual`; server refuses to boot in production without a ≥12-char `ADMIN_KEY` | `server/app.ts`, `server/index.ts` |
| Prompt injection | Complaint passed to Gemini as JSON data; system prompt marks it as data; output constrained to enums and validated | `server/gemini.ts` |
| AI downgrading a real hazard | Safety floor keeps rule-detected Critical hazards Critical | `applySafetyFloor` |
| Secret leakage | Keys only via env vars, `.env` git-ignored, never sent to the client | `.gitignore` |
| Info disclosure | `x-powered-by` disabled; generic 500 responses; stack traces only in server logs | `server/app.ts` |

Report vulnerabilities privately to the repository owner.
