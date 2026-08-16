import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S14 CV generation');

const { loadEvidenceStore } = await import(pathToFileURL(join(ROOT, 'uk-embedded/evidence.mjs')).href);
const { generateCv, validateCvClaims } = await import(pathToFileURL(join(ROOT, 'uk-embedded/documents.mjs')).href);
const { normalizeJob } = await import(pathToFileURL(join(ROOT, 'uk-embedded/jobs.mjs')).href);

const store = loadEvidenceStore(join(ROOT, 'test-fixtures/uk-embedded/evidence'));
const job = normalizeJob({
  title: 'Yocto Engineer',
  company: 'Chip',
  location: 'Bristol',
  url: 'https://ex.example/yocto-cv',
  description: 'Yocto Linux MQTT',
  requirements: ['Yocto', 'Linux', 'MQTT'],
});

const cv = generateCv(job, store);
if (cv.gaps.includes('yocto') && !cv.skills.includes('yocto')) {
  pass('absent technology may appear in gap analysis, not as experience');
} else {
  fail(`cv skills=${cv.skills} gaps=${cv.gaps}`);
}

const gate = validateCvClaims(cv, store);
if (gate.ok) {
  pass('generated CV claims are evidence-backed');
} else {
  fail(`invented ${gate.invented}`);
}

const stuffed = validateCvClaims({ ...cv, skills: [...cv.skills, 'yocto'] }, store);
if (!stuffed.ok && stuffed.invented.includes('yocto')) {
  pass('unsupported claims rejected by fact gate');
} else {
  fail(`stuffed yocto passed: ${JSON.stringify(stuffed)}`);
}
