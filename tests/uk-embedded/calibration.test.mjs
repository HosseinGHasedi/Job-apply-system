import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S21 calibration');

const { calibrate } = await import(pathToFileURL(join(ROOT, 'uk-embedded/calibration.mjs')).href);

const outcomes = [
  ...Array.from({ length: 6 }, () => ({ role_family: 'embedded-linux', type: 'interview' })),
  ...Array.from({ length: 6 }, () => ({ role_family: 'backend', type: 'rejected_application' })),
];
const result = calibrate({ outcomes });
if (result.patterns[0].family === 'embedded-linux') {
  pass('system identifies the higher-interview role family');
} else {
  fail(JSON.stringify(result.patterns));
}

if (result.confidence === 'low_confidence' && result.sample_size === 12) {
  pass('system reports confidence and sample size');
} else {
  fail(`confidence ${result.confidence} n=${result.sample_size}`);
}

if (result.recommendations.length && result.applied === false) {
  pass('system proposes adjustment and does not silently modify production scoring');
} else {
  fail(`applied=${result.applied} recs=${result.recommendations.length}`);
}
