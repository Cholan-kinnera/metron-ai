import { classifyByRules } from './classifier.js';
import type { CreateIssueInput } from './schema.js';
import type { IssueStore } from './store.js';

const SAMPLES: CreateIssueInput[] = [
  { title: 'Open manhole near bus stop', description: 'The manhole cover on the main road is missing and children walk past it to school every day. Very dangerous at night.', location: { address: 'Avinashi Road, Peelamedu, Coimbatore', lat: 11.0247, lng: 77.0028 } },
  { title: 'Garbage bin overflowing for a week', description: 'The community dustbin has not been cleared for a week, waste is spilling onto the street and the smell is unbearable.', location: { address: 'Gandhipuram 2nd Street, Coimbatore', lat: 11.0168, lng: 76.9674 } },
  { title: 'Streetlight not working', description: 'Three streetlights on our lane have been off since last month, the road is completely dark after 7pm.', location: { address: 'RS Puram West, Coimbatore', lat: 11.0089, lng: 76.9497 } },
  { title: 'Water pipe burst flooding road', description: 'A water supply pipe burst this morning and clean water is wasting and flooding the road.', location: { address: 'Saibaba Colony, Coimbatore', lat: 11.0273, lng: 76.9437 } },
  { title: 'Large pothole damaging vehicles', description: 'A deep pothole in the middle of the road has caused two bike skids this week.', location: { address: 'Trichy Road, Singanallur, Coimbatore', lat: 10.9995, lng: 77.0331 } },
];

/** Populates an empty store with realistic demo complaints in varied states. */
export async function seedDemoData(store: IssueStore): Promise<void> {
  if (store.size > 0) return;
  const statuses = ['Reported', 'In Progress', 'Resolved', 'In Progress', 'Reported'] as const;
  for (const [index, sample] of SAMPLES.entries()) {
    const issue = await store.create(sample, classifyByRules(`${sample.title}\n${sample.description}`));
    if (statuses[index] !== 'Reported') await store.update(issue.id, { status: 'In Progress', note: 'Field team assigned' });
    if (statuses[index] === 'Resolved') await store.update(issue.id, { status: 'Resolved', note: 'Repair completed and verified' });
  }
}
