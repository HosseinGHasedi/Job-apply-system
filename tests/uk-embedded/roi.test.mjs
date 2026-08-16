import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S11 application ROI');

const { applicationRoi } = await import(pathToFileURL(join(ROOT, 'uk-embedded/roi.mjs')).href);

const highFitHighEffort = applicationRoi({
  fit: { score: 90 },
  interview: { score: 0.8 },
  estimated_effort_minutes: 120,
  career_value: 1,
});
const slightlyLowerLowEffort = applicationRoi({
  fit: { score: 80 },
  interview: { score: 0.75 },
  estimated_effort_minutes: 20,
  career_value: 1,
});

if (slightlyLowerLowEffort.priority > highFitHighEffort.priority) {
  pass('slightly-lower-fit/low-effort can rank above high-fit/high-effort');
} else {
  fail(`roi ${slightlyLowerLowEffort.priority} vs ${highFitHighEffort.priority}`);
}

if (highFitHighEffort.rationale.technical_fit === 90 && highFitHighEffort.estimated_effort_minutes === 120) {
  pass('priority is explainable through component scores and effort');
} else {
  fail('missing rationale');
}
