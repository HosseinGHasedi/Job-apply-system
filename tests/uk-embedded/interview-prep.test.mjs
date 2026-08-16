import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S19 interview preparation');

const { loadEvidenceStore } = await import(pathToFileURL(join(ROOT, 'uk-embedded/evidence.mjs')).href);
const { prepareInterview } = await import(pathToFileURL(join(ROOT, 'uk-embedded/interview-prep.mjs')).href);
const { normalizeJob } = await import(pathToFileURL(join(ROOT, 'uk-embedded/jobs.mjs')).href);

const store = loadEvidenceStore(join(ROOT, 'test-fixtures/uk-embedded/evidence'));
const job = normalizeJob({
  title: 'Embedded Linux Engineer',
  company: 'Acme',
  location: 'Bristol',
  url: 'https://ex.example/prep',
  requirements: ['Linux', 'MQTT', 'Yocto'],
  description: 'Linux MQTT Yocto',
});
const prep = prepareInterview(job, store);
const covered = ['linux', 'mqtt', 'yocto'].every((t) => prep.technical_topics.includes(t) || prep.knowledge_gaps.some((g) => g.technology === t));
if (covered) pass('prep covers the three technical requirements');
else fail(`topics=${prep.technical_topics} gaps=${JSON.stringify(prep.knowledge_gaps)}`);

if (prep.candidate_evidence.every((s) => s.source && s.evidence)) {
  pass('answers use candidate evidence with provenance');
} else {
  fail('invented stories');
}

if (prep.knowledge_gaps.some((g) => g.technology === 'yocto')) {
  pass('gaps become preparation topics');
} else {
  fail('yocto gap missing from prep');
}
