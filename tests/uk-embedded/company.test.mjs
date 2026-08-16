import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S12 company research');

const { attachCompanyResearch } = await import(
  pathToFileURL(join(ROOT, 'uk-embedded/company.mjs')).href
);
const { normalizeJob } = await import(pathToFileURL(join(ROOT, 'uk-embedded/jobs.mjs')).href);

const job = normalizeJob({
  title: 'Embedded Linux Engineer',
  company: 'ExampleCo',
  location: 'Bristol',
  url: 'https://exampleco.example/jobs/1',
});

const partial = attachCompanyResearch(job, {
  product_domain: 'industrial IoT',
  sources: ['https://exampleco.example/about'],
  sources_by_field: { product_domain: 'https://exampleco.example/about' },
});

if (partial.research.product_domain.value === 'industrial IoT' && partial.research.product_domain.source) {
  pass('company research is attached with sources');
} else {
  fail('source not retained');
}

if (partial.research.hiring_contacts.value === 'unknown' && partial.research.company_size.value === 'unknown') {
  pass('missing information remains unknown');
} else {
  fail(`unknown fields filled: ${JSON.stringify(partial.research)}`);
}

const invented = attachCompanyResearch(job, {
  hiring_contacts: [{ name: 'Jane Doe', email: 'jane@x.com' }],
  sources: [],
});
if (invented.research.hiring_contacts.value === 'unknown') {
  pass('contacts without a source are not used');
} else {
  fail('unsourced contacts accepted');
}
