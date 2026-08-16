import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S10 interview probability');

const { interviewProbability } = await import(
  pathToFileURL(join(ROOT, 'uk-embedded/interview-probability.mjs')).href
);

const strong = interviewProbability({
  fit: { score: 90, missing_requirements: [] },
  gaps: [],
  job: { location: 'Bristol, UK', work_mode: 'hybrid' },
});
const medium = interviewProbability({
  fit: { score: 60, missing_requirements: ['yocto'] },
  gaps: [{ application_blocker: false }],
  job: { location: 'Bristol, UK', work_mode: 'hybrid' },
});
const weak = interviewProbability({
  fit: { score: 20, missing_requirements: ['yocto', 'autosar'] },
  gaps: [{ application_blocker: true }],
  job: { location: '', work_mode: 'unknown' },
});

if (strong.score > medium.score && medium.score > weak.score) {
  pass('strong > medium > weak interview-probability ordering');
} else {
  fail(`order ${strong.score} ${medium.score} ${weak.score}`);
}

if (strong.calibrated === false && typeof strong.uncertainty === 'number') {
  pass('estimate is explicitly uncalibrated with separate uncertainty');
} else {
  fail('false statistical precision');
}

if (weak.uncertainty > strong.uncertainty && weak.confidence === 'low') {
  pass('unknown information increases uncertainty');
} else {
  fail(`uncertainty strong=${strong.uncertainty} weak=${weak.uncertainty}`);
}

if (strong.factors.some((f) => f.name === 'technical_fit')) {
  pass('score is explainable via factors');
} else {
  fail('missing factors');
}
