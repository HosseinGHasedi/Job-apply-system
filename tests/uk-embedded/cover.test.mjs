import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S15 cover letter');

const { loadEvidenceStore } = await import(pathToFileURL(join(ROOT, 'uk-embedded/evidence.mjs')).href);
const { generateCoverLetter } = await import(pathToFileURL(join(ROOT, 'uk-embedded/documents.mjs')).href);
const { attachCompanyResearch } = await import(pathToFileURL(join(ROOT, 'uk-embedded/company.mjs')).href);
const { normalizeJob } = await import(pathToFileURL(join(ROOT, 'uk-embedded/jobs.mjs')).href);

const store = loadEvidenceStore(join(ROOT, 'test-fixtures/uk-embedded/evidence'));
const job = normalizeJob({
  title: 'IoT Firmware Engineer',
  company: 'ExampleCo',
  location: 'Bristol',
  url: 'https://ex.example/letter',
  description: 'MQTT Linux',
  requirements: ['MQTT', 'Linux', 'Yocto'],
});
const research = attachCompanyResearch(job, {
  product_domain: 'sensor gateways',
  sources: ['https://exampleco.example/about'],
  sources_by_field: { product_domain: 'https://exampleco.example/about' },
});

const letter = generateCoverLetter(job, store, research);
const blob = letter.paragraphs.join(' ').toLowerCase();
if (blob.includes('iot firmware') && blob.includes('sensor gateways') && blob.includes('mqtt')) {
  pass('letter references actual role, verified company, and evidence');
} else {
  fail(`letter ${letter.paragraphs.join(' | ')}`);
}

if (letter.gaps.includes('yocto') && !blob.includes('yocto experience') && !letter.skills.includes('yocto')) {
  pass('generated letter contains no unsupported technology claim');
} else {
  fail(`yocto leaked: skills=${letter.skills} blob=${blob}`);
}

if (!/passionate|thrilled|synergy/.test(blob)) {
  pass('letter avoids generic filler phrases');
} else {
  fail('generic filler');
}
