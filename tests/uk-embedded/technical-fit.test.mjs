import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S08 technical fit');

const { loadEvidenceStore } = await import(pathToFileURL(join(ROOT, 'uk-embedded/evidence.mjs')).href);
const { loadTaxonomy } = await import(pathToFileURL(join(ROOT, 'uk-embedded/taxonomy.mjs')).href);
const { technicalFit } = await import(pathToFileURL(join(ROOT, 'uk-embedded/technical-fit.mjs')).href);
const { normalizeJob } = await import(pathToFileURL(join(ROOT, 'uk-embedded/jobs.mjs')).href);

const store = loadEvidenceStore(join(ROOT, 'test-fixtures/uk-embedded/evidence'));
const taxonomy = loadTaxonomy();

const linuxJob = normalizeJob({
  title: 'Embedded Linux Engineer',
  company: 'A',
  location: 'Bristol',
  url: 'https://ex.example/linux',
  description: 'Linux MQTT gateway',
  requirements: ['Linux', 'MQTT'],
});
const iotJob = normalizeJob({
  title: 'IoT Firmware Engineer',
  company: 'B',
  location: 'Cambridge',
  url: 'https://ex.example/iot',
  description: 'MQTT IoT sensors',
  requirements: ['MQTT'],
});
const backendJob = normalizeJob({
  title: 'Backend Engineer',
  company: 'C',
  location: 'London',
  url: 'https://ex.example/be',
  description: 'Go microservices Kubernetes',
  requirements: ['Go', 'Kubernetes'],
});
const yoctoJob = normalizeJob({
  title: 'Yocto Engineer',
  company: 'D',
  location: 'Bristol',
  url: 'https://ex.example/yocto',
  description: 'Must have Yocto production experience',
  requirements: ['Yocto'],
});

const linux = technicalFit(linuxJob, store, taxonomy);
const iot = technicalFit(iotJob, store, taxonomy);
const backend = technicalFit(backendJob, store, taxonomy);
const yocto = technicalFit(yoctoJob, store, taxonomy);

if (linux.score > backend.score && linux.supporting_evidence.length) {
  pass('strong Embedded/Linux match ranks above unrelated backend');
} else {
  fail(`linux=${linux.score} backend=${backend.score}`);
}

if (iot.score > backend.score && iot.missing_requirements.length === 0) {
  pass('strong IoT/MQTT match is explainable and high');
} else {
  fail(`iot=${JSON.stringify(iot)}`);
}

if (backend.score < 50) {
  pass('unrelated backend match scores low');
} else {
  fail(`backend score too high ${backend.score}`);
}

if (yocto.missing_requirements.includes('yocto') && yocto.score <= 25) {
  pass('mandatory Yocto is missing: Linux evidence is not treated as Yocto');
} else {
  fail(`yocto fit ${JSON.stringify(yocto)}`);
}

const again = technicalFit(linuxJob, store, taxonomy);
if (again.score === linux.score) {
  pass('score is deterministic for identical structured inputs');
} else {
  fail('non-deterministic score');
}
