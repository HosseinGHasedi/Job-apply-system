import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S22 orchestration');

const { loadEvidenceStore } = await import(pathToFileURL(join(ROOT, 'uk-embedded/evidence.mjs')).href);
const { loadConfig } = await import(pathToFileURL(join(ROOT, 'uk-embedded/index.mjs')).href);
const { runPipeline } = await import(pathToFileURL(join(ROOT, 'uk-embedded/orchestrate.mjs')).href);

const store = loadEvidenceStore(join(ROOT, 'test-fixtures/uk-embedded/evidence'));
const config = loadConfig();
const providers = [
  {
    id: 'fixture',
    async fetch() {
      return [
        {
          title: 'Embedded Linux Engineer',
          company: 'Acme',
          location: 'Bristol, UK',
          url: 'https://acme.example/jobs/linux',
          description: 'Linux MQTT gateway hybrid Bristol',
          requirements: ['Linux', 'MQTT'],
        },
        {
          title: 'PHP WordPress Developer',
          company: 'Shop',
          location: 'London, UK',
          url: 'https://shop.example/wp',
        },
      ];
    },
  },
];

const result = await runPipeline({
  providers,
  store,
  config,
  companyResearch: {
    product_domain: 'industrial gateways',
    sources: ['https://acme.example/about'],
    sources_by_field: { product_domain: 'https://acme.example/about' },
  },
});

const names = result.stages.map((s) => s.stage);
if (['discovery', 'normalize', 'hard-filter', 'rank'].every((s) => names.includes(s))) {
  pass('end-to-end stages ran on fixtures');
} else {
  fail(`stages ${names}`);
}

if (result.applications.length >= 1 && result.applications[0].application.status === 'ready_for_review') {
  pass('application stops at ready_for_review');
} else {
  fail(`status ${result.applications[0]?.application?.status}`);
}

if (result.submitted === false && result.applications.every((a) => a.submitted === false)) {
  pass('no submission occurs');
} else {
  fail('pipeline submitted an application');
}

if (result.applications[0].ats && result.applications[0].review && result.applications[0].cv) {
  pass('each stage produced inspectable output');
} else {
  fail('missing artifacts');
}
