/** Static copy for the landing page, kept separate from presentation. */

export const CAPABILITIES = [
  {
    title: 'Citizen reporting',
    body: 'Title, description, GPS location, optional category and photo, submitted from any phone in under a minute.',
  },
  {
    title: 'Gemini classification',
    body: 'Google Gemini reads the complaint and the photo together and assigns one of eight civic categories.',
  },
  {
    title: 'Priority detection',
    body: 'Urgency is judged by public risk, from Low to Critical, with a hazard floor the model cannot override.',
  },
  {
    title: 'Department routing',
    body: 'Each ticket goes straight to the department that owns the fix, with a service-level deadline attached.',
  },
  {
    title: 'Public tracking',
    body: 'Reported, In Progress, Resolved. Every change is time-stamped and visible to the citizen who filed it.',
  },
  {
    title: 'Administration',
    body: 'Officials review AI triage, override priority, reassign departments and close tickets with audit notes.',
  },
];

export const STORY = [
  {
    step: '01',
    title: 'A citizen reports it.',
    body: 'A photo of the pothole, a sentence about it, and the location from GPS. No forms about departments or ward numbers.',
    label: 'New report',
    card: 'Deep pothole on Trichy Road, two bikes skidded this week',
    meta: 'Singanallur, Coimbatore · photo attached',
  },
  {
    step: '02',
    title: 'Gemini triages it.',
    body: 'The model reads the words and the photo together, then returns category, urgency and the responsible department as validated JSON.',
    label: 'AI triage · 2.1s',
    card: 'Roads & Potholes · High priority',
    meta: 'Routed to Public Works Department · due in 72h',
  },
  {
    step: '03',
    title: 'The city resolves it.',
    body: 'Field teams update the ticket as work progresses. The citizen sees the same timeline the officials do.',
    label: 'Resolved',
    card: 'Patch laid and road surface restored',
    meta: 'Closed in 31h · within service level',
  },
] as const;

export const GUARDRAILS = [
  [
    'Structured output',
    'Replies must match a JSON schema generated from the same Zod schema that validates them on the server.',
  ],
  [
    'Hazard floor',
    'Gemini can raise urgency but can never downgrade an exposed wire, open manhole or collapse detected by rules.',
  ],
  ['Injection resistant', 'Complaint text is passed to the model strictly as data, never as instructions.'],
  [
    'Always available',
    'On timeout or invalid output a deterministic rule engine triages instead, so no report is lost.',
  ],
] as const;

export const RECEIPT = `{
  "category": "Drainage & Sewage",
  "priority": "Critical",
  "department": "Water Supply & Sewerage Board",
  "summary": "Uncovered manhole on a school route.",
  "reasoning": "Fall hazard to children; immediate risk.",
  "confidence": 0.94
}`;
