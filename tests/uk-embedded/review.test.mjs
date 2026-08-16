import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S16 independent reviewer');

const { loadEvidenceStore } = await import(pathToFileURL(join(ROOT, 'uk-embedded/evidence.mjs')).href);
const { generateCv, reviewApplication } = await import(pathToFileURL(join(ROOT, 'uk-embedded/documents.mjs')).href);
const { normalizeJob } = await import(pathToFileURL(join(ROOT, 'uk-embedded/jobs.mjs')).href);

const store = loadEvidenceStore(join(ROOT, 'test-fixtures/uk-embedded/evidence'));
const job = normalizeJob({
  title: 'Embedded Linux Engineer',
  company: 'A',
  location: 'Bristol',
  url: 'https://ex.example/rev',
  requirements: ['Linux', 'MQTT', 'Yocto'],
  description: 'Linux MQTT Yocto',
});

const honest = generateCv(job, store);
const honestReview = reviewApplication({ cv: honest, job, store });
if (honestReview.blocking_issues.some((b) => b.code === 'missing_mandatory_requirement')) {
  pass('honest CV still flags missing mandatory Yocto');
} else {
  fail(`honest ${JSON.stringify(honestReview.blocking_issues)}`);
}

const flawed = {
  ...honest,
  skills: [...honest.skills, 'yocto'],
  bullets: [
    ...honest.bullets,
    { text: 'Shipped a React Native shopping app', evidence: 'proj-unrelated', requirement: 'linux' },
  ],
};
const review = reviewApplication({ cv: flawed, job, store });
const codes = review.blocking_issues.map((b) => b.code);
if (codes.includes('invented_technology') && codes.includes('irrelevant_project') && codes.includes('missing_mandatory_requirement')) {
  pass('reviewer identifies invented technology, irrelevant project, missing mandatory requirement');
} else {
  fail(`reviewer missed defects: ${codes.join(',')}`);
}

if (review.overall === 'block') {
  pass('blocking factual issues prevent finalization');
} else {
  fail('reviewer rubber-stamped flawed CV');
}
