import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S02 evidence model');

const {
  validateRecord,
  loadEvidenceStore,
  technologyStatus,
  EvidenceError,
} = await import(pathToFileURL(join(ROOT, 'uk-embedded/evidence.mjs')).href);

const fixtureDir = join(ROOT, 'test-fixtures/uk-embedded/evidence');

try {
  const store = loadEvidenceStore(fixtureDir);
  const gateway = store.byId.get('proj-iot-gateway');
  const linux = store.byId.get('tech-linux');
  if (
    gateway
    && linux
    && gateway.related_evidence.includes('tech-linux')
    && linux.related_evidence.includes('proj-iot-gateway')
    && gateway.source.includes('iot-gateway.yml')
  ) {
    pass('valid evidence → accepted with provenance and bidirectional refs');
  } else {
    fail('valid fixture store did not load expected records');
  }
} catch (err) {
  fail(`valid evidence rejected: ${err.message}`);
}

try {
  validateRecord({
    type: 'project',
    title: 'No id',
    description: 'x',
    source: 'lab.md',
    confidence: 'verified',
  });
  fail('missing ID → accepted');
} catch (err) {
  if (err instanceof EvidenceError && err.code === 'missing_id') pass('missing ID → rejected');
  else fail(`missing ID threw ${err.code || err.message}`);
}

try {
  validateRecord({
    id: 'x',
    type: 'project',
    title: 'Bad confidence',
    description: 'x',
    source: 'lab.md',
    confidence: 'legendary',
  });
  fail('invalid confidence → accepted');
} catch (err) {
  if (err instanceof EvidenceError && err.code === 'invalid_confidence') pass('invalid confidence → rejected');
  else fail(`invalid confidence threw ${err.code || err.message}`);
}

try {
  validateRecord({
    id: 'no-source',
    type: 'project',
    title: 'No source',
    description: 'x',
    confidence: 'verified',
  });
  fail('missing source → accepted');
} catch (err) {
  if (err instanceof EvidenceError && err.code === 'missing_source') pass('missing source/provenance → rejected');
  else fail(`missing source threw ${err.code || err.message}`);
}

const obscure = validateRecord({
  id: 'tech-obscure',
  type: 'technology',
  title: 'FictionalBus-9000',
  description: 'lab only',
  source: 'note.md',
  confidence: 'unknown',
  strength: 'expert',
});
const status = technologyStatus(obscure, new Set(['linux', 'mqtt']));
if (obscure.strength === 'unknown' && status.expertise === false && status.confidence === 'unknown') {
  pass('unknown technology → accepted as unknown, not promoted to expertise');
} else {
  fail(`unknown tech promoted: strength=${obscure.strength} status=${JSON.stringify(status)}`);
}
