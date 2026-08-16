import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S13 evidence retrieval');

const { loadEvidenceStore } = await import(pathToFileURL(join(ROOT, 'uk-embedded/evidence.mjs')).href);
const { retrieveEvidence } = await import(pathToFileURL(join(ROOT, 'uk-embedded/retrieve.mjs')).href);
const { normalizeJob } = await import(pathToFileURL(join(ROOT, 'uk-embedded/jobs.mjs')).href);

const store = loadEvidenceStore(join(ROOT, 'test-fixtures/uk-embedded/evidence'));
const job = normalizeJob({
  title: 'Embedded Linux Engineer',
  company: 'A',
  location: 'Bristol',
  url: 'https://ex.example/el',
  description: 'Linux MQTT',
  requirements: ['Linux', 'MQTT', 'Yocto'],
});

const { selections } = retrieveEvidence(job, store);
const linux = selections.find((s) => s.requirement === 'linux');
const mqtt = selections.find((s) => s.requirement === 'mqtt');
const yocto = selections.find((s) => s.requirement === 'yocto');

if (linux?.evidence.length && mqtt?.evidence.length) {
  pass('Linux/IoT evidence selected for Embedded Linux job');
} else {
  fail(`selection ${JSON.stringify(selections)}`);
}

if (yocto && yocto.evidence.length === 0 && yocto.confidence === 'none') {
  pass('unsupported Yocto requirement returns no evidence');
} else {
  fail(`yocto ${JSON.stringify(yocto)}`);
}

if (!selections.some((s) => (s.record?.title || '').includes('FictionalBus'))) {
  pass('unknown/unrelated evidence is excluded');
} else {
  fail('obscure tech selected');
}
