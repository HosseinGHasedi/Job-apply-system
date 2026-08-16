import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S18 tracking');

const { createApplication, transition } = await import(
  pathToFileURL(join(ROOT, 'uk-embedded/tracking.mjs')).href
);
const { normalizeJob } = await import(pathToFileURL(join(ROOT, 'uk-embedded/jobs.mjs')).href);

const job = normalizeJob({
  title: 'Embedded Linux Engineer',
  company: 'Acme',
  location: 'Bristol',
  url: 'https://acme.example/jobs/1',
});
const app = createApplication({ job, scores: { roi: { priority: 1.2 } }, documents: { cv_version: 'v001' } });
if (app.id && app.source && app.status === 'discovered' && app.cv_version === 'v001') {
  pass('application has job identity, source, and linked documents');
} else {
  fail(`create ${JSON.stringify(app)}`);
}

try {
  transition(app, 'offer');
  fail('discovered → offer was accepted');
} catch (err) {
  if (err.code === 'invalid_transition') pass('discovered → offer rejected');
  else fail(err.message);
}

const submitted = transition(
  transition(
    transition(
      transition(
        transition(
          transition(
            transition(app, 'qualified'),
            'shortlisted',
          ),
          'researching',
        ),
        'drafting',
      ),
      'ready_for_review',
    ),
    'approved',
  ),
  'submitted',
);
if (submitted.status === 'submitted' && submitted.history.length === 8) {
  pass('history is preserved through valid transitions');
} else {
  fail(`history ${submitted.history.length} status=${submitted.status}`);
}
