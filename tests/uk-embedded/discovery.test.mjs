import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S05 discovery');

const { discoverJobs, retainedJobs } = await import(
  pathToFileURL(join(ROOT, 'uk-embedded/jobs.mjs')).href
);

const greenhouse = (await import(pathToFileURL(join(ROOT, 'providers/greenhouse.mjs')).href)).default;
if (greenhouse?.id === 'greenhouse' && typeof greenhouse.fetch === 'function') {
  pass('real career-ops greenhouse provider is reusable through existing infrastructure');
} else {
  fail('greenhouse provider missing or malformed');
}

const okProvider = {
  id: 'fixture-ok',
  async fetch() {
    return [
      { title: 'Embedded Linux Engineer', company: 'Acme', location: 'Bristol, UK', url: 'https://acme.example/jobs/1' },
    ];
  },
};
const badProvider = {
  id: 'fixture-fail',
  async fetch() {
    throw new Error('timeout');
  },
};
const noUrlProvider = {
  id: 'fixture-nourl',
  async fetch() {
    return [{ title: 'Firmware Engineer', company: 'Beta', location: 'Cambridge' }];
  },
};
const dup = { ...okProvider };

const result = await discoverJobs([okProvider, badProvider, noUrlProvider, dup]);
const kept = retainedJobs(result);

if (kept.length === 1 && kept[0].source_url.includes('acme.example/jobs/1') && kept[0].provider === 'fixture-ok') {
  pass('valid job → retained with source URL');
} else {
  fail(`retained unexpected: ${JSON.stringify(kept)}`);
}

if (result.errors.some((e) => e.provider === 'fixture-fail' && /timeout/.test(e.error)) && kept.length === 1) {
  pass('provider failure → other providers continue');
} else {
  fail(`isolation failed: ${JSON.stringify(result.errors)}`);
}

const quarantined = result.jobs.filter((j) => j.quarantine);
if (quarantined.length === 1 && quarantined[0].quarantine_reason === 'missing_url') {
  pass('missing URL → job quarantined');
} else {
  fail(`quarantine unexpected: ${JSON.stringify(quarantined)}`);
}

if (result.errors.some((e) => e.provider === 'fixture-ok' || e.error.includes('duplicate'))) {
  pass('duplicate providers do not crash the pipeline');
} else {
  fail(`duplicate provider handling: ${JSON.stringify(result.errors)}`);
}
