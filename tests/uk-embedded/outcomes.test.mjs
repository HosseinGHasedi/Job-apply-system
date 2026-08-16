import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S20 outcomes');

const { createApplication, transition } = await import(pathToFileURL(join(ROOT, 'uk-embedded/tracking.mjs')).href);
const { recordOutcome } = await import(pathToFileURL(join(ROOT, 'uk-embedded/outcomes.mjs')).href);
const { normalizeJob } = await import(pathToFileURL(join(ROOT, 'uk-embedded/jobs.mjs')).href);

const job = normalizeJob({
  title: 'Embedded Linux Engineer', company: 'Acme', location: 'Bristol', url: 'https://acme.example/o',
});
let app = createApplication({ job });
for (const s of ['qualified', 'shortlisted', 'researching', 'drafting', 'ready_for_review', 'approved', 'submitted', 'interview']) {
  app = transition(app, s);
}
const chain = [
  recordOutcome(app, { type: 'interview', stage: 'interview', date: '2026-01-01' }),
  recordOutcome(app, { type: 'rejected_technical', stage: 'rejected_technical', date: '2026-01-15', reason: 'Yocto depth' }),
];
if (chain[0].application_id === app.id && chain[1].type === 'rejected_technical') {
  pass('application → interview → rejection technical chain is retained');
} else {
  fail(JSON.stringify(chain));
}

try {
  recordOutcome(null, { type: 'interview' });
  fail('outcome assigned to unknown application');
} catch {
  pass('no outcome can be assigned to an unknown application');
}
