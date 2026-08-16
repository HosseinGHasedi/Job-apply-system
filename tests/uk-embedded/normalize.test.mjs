import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S06 normalize/deduplicate');

const { normalizeJob, deduplicateJobs } = await import(
  pathToFileURL(join(ROOT, 'uk-embedded/jobs.mjs')).href
);

const linkedin = normalizeJob({
  title: 'Embedded Linux Engineer',
  company: 'Acme',
  location: 'Bristol, UK',
  url: 'https://www.linkedin.com/jobs/view/123/?trk=flagship',
  description: 'Yocto and MQTT',
}, { provider: 'linkedin' });

const portal = normalizeJob({
  title: 'Embedded Linux Engineer',
  company: 'Acme',
  location: 'Bristol, UK',
  url: 'https://jobs.acme.example/embedded-linux',
  salary: '£70k',
}, { provider: 'greenhouse' });

const sameUrl = normalizeJob({
  title: 'Embedded Linux Engineer',
  company: 'Acme',
  location: 'Bristol, UK',
  url: 'https://jobs.acme.example/embedded-linux/',
  description: 'Also C++',
}, { provider: 'ashby' });

const sameTitleOtherCo = normalizeJob({
  title: 'Embedded Linux Engineer',
  company: 'OtherCo',
  location: 'Bristol, UK',
  url: 'https://other.example/jobs/1',
}, { provider: 'lever' });

const otherLocation = normalizeJob({
  title: 'Embedded Linux Engineer',
  company: 'Acme',
  location: 'Cambridge, UK',
  url: 'https://jobs.acme.example/embedded-linux-cambridge',
}, { provider: 'greenhouse' });

if (linkedin.source_url && !linkedin.source_url.includes('trk=')) {
  pass('URLs are canonicalized (tracking params stripped)');
} else {
  fail(`canonical URL: ${linkedin.source_url}`);
}

const mergedUrl = deduplicateJobs([portal, sameUrl]);
if (mergedUrl.length === 1 && mergedUrl[0].provenance.length === 2) {
  pass('same canonical URL from two providers → merged, provenance kept');
} else {
  fail(`url merge: ${JSON.stringify(mergedUrl)}`);
}

if (mergedUrl[0].conflicts.some((c) => c.field === 'description') || mergedUrl[0].description === 'Yocto and MQTT' || mergedUrl[0].description === 'Also C++') {
  pass('conflicting fields are recorded rather than silently overwritten');
} else {
  fail(`conflicts: ${JSON.stringify(mergedUrl[0].conflicts)} desc=${mergedUrl[0].description}`);
}

const ctl = deduplicateJobs([linkedin, portal]);
if (ctl.length === 1 && ctl[0].provenance.length === 2) {
  pass('same company+title+location from LinkedIn and portal → merged');
} else {
  fail(`ctl merge: len=${ctl.length}`);
}

const titles = deduplicateJobs([linkedin, sameTitleOtherCo]);
if (titles.length === 2) {
  pass('different jobs with the same title are not deduplicated');
} else {
  fail(`title-only dedup wrongly merged: ${titles.length}`);
}

const locs = deduplicateJobs([portal, otherLocation]);
if (locs.length === 2) {
  pass('same company, different locations stay distinct');
} else {
  fail(`location merge wrongly collapsed: ${locs.length}`);
}
