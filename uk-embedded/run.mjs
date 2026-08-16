#!/usr/bin/env node
/**
 * Fixture pipeline runner. Never submits applications.
 *
 *   node uk-embedded/run.mjs --fixtures
 */

import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { loadConfig } from './index.mjs';
import { loadEvidenceStore } from './evidence.mjs';
import { runPipeline } from './orchestrate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = process.argv.includes('--fixtures');

if (!fixtures) {
  console.log(`Usage: node uk-embedded/run.mjs --fixtures

Runs the UK Embedded pipeline on fictional fixtures.
Does not submit applications. Does not write data/outcomes/.`);
  process.exit(0);
}

const store = loadEvidenceStore(join(ROOT, 'test-fixtures/uk-embedded/evidence'));
const result = await runPipeline({
  config: loadConfig(),
  store,
  providers: [{
    id: 'fixture',
    async fetch() {
      return [{
        title: 'Embedded Linux Engineer',
        company: 'Acme',
        location: 'Bristol, UK',
        url: 'https://acme.example/jobs/linux',
        description: 'Linux MQTT gateway',
        requirements: ['Linux', 'MQTT'],
      }];
    },
  }],
  companyResearch: {
    product_domain: 'industrial gateways',
    sources: ['https://acme.example/about'],
    sources_by_field: { product_domain: 'https://acme.example/about' },
  },
});

console.log(JSON.stringify({
  submitted: result.submitted,
  stop: result.stop,
  ranked: result.ranked.map((r) => ({
    title: r.job.title,
    fit: r.fit.score,
    interview: r.interview.score,
    roi: r.roi.priority,
  })),
  applications: result.applications.map((a) => ({
    status: a.application.status,
    review: a.review.overall,
    ats: a.ats.ok,
    submitted: a.submitted,
  })),
}, null, 2));
