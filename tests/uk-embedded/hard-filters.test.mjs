import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S07 hard filters');

const { loadConfig } = await import(pathToFileURL(join(ROOT, 'uk-embedded/index.mjs')).href);
const { normalizeJob } = await import(pathToFileURL(join(ROOT, 'uk-embedded/jobs.mjs')).href);
const { hardFilter } = await import(pathToFileURL(join(ROOT, 'uk-embedded/hard-filters.mjs')).href);

const base = loadConfig();
const cfg = {
  ...base,
  filters: {
    ...base.filters,
    excluded_work_modes: ['remote'],
    sponsorship: { reject_if_no_sponsorship: false },
  },
};

const jobA = normalizeJob({
  title: 'Embedded Linux Engineer',
  company: 'Acme',
  location: 'Remote',
  url: 'https://a.example/1',
  description: 'Fully remote worldwide',
  work_mode: 'remote',
});
const a = hardFilter(jobA, cfg);
if (a.reject && a.reasons.some((r) => r.code === 'incompatible_work_mode')) {
  pass('job A → rejected: incompatible work mode');
} else {
  fail(`job A ${JSON.stringify(a)}`);
}

const jobB = normalizeJob({
  title: 'PHP WordPress Developer',
  company: 'Shop',
  location: 'London, UK',
  url: 'https://b.example/2',
});
const b = hardFilter(jobB, cfg);
if (b.reject && b.reasons.some((r) => r.code === 'unrelated_domain')) {
  pass('job B → rejected: unrelated domain');
} else {
  fail(`job B ${JSON.stringify(b)}`);
}

const jobC = normalizeJob({
  title: 'IoT Firmware Engineer',
  company: 'DevCo',
  location: 'Bristol, UK',
  url: 'https://c.example/3',
  description: 'Embedded C and MQTT. Sponsorship not mentioned.',
});
const c = hardFilter(jobC, cfg);
if (!c.reject) {
  pass('job C → retained: unknown sponsorship status');
} else {
  fail(`job C wrongly rejected ${JSON.stringify(c)}`);
}

const jobD = normalizeJob({
  title: 'Senior Embedded Software Engineer',
  company: 'ChipCo',
  location: 'Cambridge, UK',
  url: 'https://d.example/4',
  description: 'Yocto, Linux kernel, C. Hybrid Bristol.',
});
const d = hardFilter(jobD, cfg);
if (!d.reject && d.decision !== 'definitely_incompatible') {
  pass('job D → retained: technical evaluation required');
} else {
  fail(`job D ${JSON.stringify(d)}`);
}

const unknownLoc = hardFilter(normalizeJob({
  title: 'Firmware Engineer',
  company: 'Mystery',
  url: 'https://e.example/5',
  description: 'RTOS work',
}), cfg);
if (!unknownLoc.reject) {
  pass('unknown location does not cause unjustified rejection');
} else {
  fail(`unknown location rejected ${JSON.stringify(unknownLoc)}`);
}
