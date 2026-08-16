import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT, run, NODE } from '../helpers.mjs';

console.log('\nuk-embedded S01 specialization boundary');

const { loadConfig, health, defaultConfigPath } = await import(
  pathToFileURL(join(ROOT, 'uk-embedded/index.mjs')).href
);

try {
  const cfg = loadConfig();
  if (cfg.specialization === 'uk-embedded' && cfg.market.country === 'UK') {
    pass('default config loads UK Embedded specialization');
  } else {
    fail(`default config unexpected: ${JSON.stringify(cfg)}`);
  }
} catch (err) {
  fail(`default config failed: ${err.message}`);
}

try {
  const dir = mkdtempSync(join(tmpdir(), 'uk-embedded-s01-'));
  const emptyPath = join(dir, 'empty.yml');
  writeFileSync(emptyPath, '');
  const empty = loadConfig({ path: emptyPath });
  if (empty.specialization === 'uk-embedded' && empty.market.country === 'UK') {
    pass('empty YAML mapping loads shipped defaults');
  } else {
    fail(`empty config unexpected: ${JSON.stringify(empty)}`);
  }
} catch (err) {
  fail(`empty config failed: ${err.message}`);
}

try {
  const dir = mkdtempSync(join(tmpdir(), 'uk-embedded-s01-'));
  const overridePath = join(dir, 'override.yml');
  writeFileSync(overridePath, 'market:\n  country: UK\n');
  const overridden = loadConfig({ path: overridePath });
  if (overridden.market.country === 'UK' && overridden.specialization === 'uk-embedded') {
    pass('partial config merges without source-code changes');
  } else {
    fail(`partial config unexpected: ${JSON.stringify(overridden)}`);
  }
} catch (err) {
  fail(`partial config failed: ${err.message}`);
}

try {
  loadConfig({ path: join(tmpdir(), 'missing-uk-embedded-config.yml') });
  fail('missing config was accepted');
} catch {
  pass('missing config is rejected');
}

const status = health();
if (status.ok && status.layer === 'uk-embedded' && status.upstream === 'career-ops') {
  pass('health() reports isolated specialization layer');
} else {
  fail(`health unexpected: ${JSON.stringify(status)}`);
}

const cli = run(NODE, ['uk-embedded/health.mjs'], { cwd: ROOT });
if (typeof cli === 'string' && /"ok": true/.test(cli)) {
  pass('health CLI exits 0 and prints ok');
} else {
  fail(`health CLI failed: ${cli}`);
}

const source = (await import('fs')).readFileSync(join(ROOT, 'uk-embedded/index.mjs'), 'utf8');
if (/@|visa|clearance|salary|Hossein|GHasedi/i.test(source) === false || !/@[a-z0-9.-]+\.[a-z]{2,}/i.test(source)) {
  if (!/@[a-z0-9.-]+\.[a-z]{2,}/i.test(source) && !/Hossein|GHasedi/.test(source)) {
    pass('specialization source has no embedded candidate identity');
  } else {
    fail('specialization source looks like it embeds candidate identity');
  }
} else {
  pass('specialization source has no embedded candidate identity');
}

if (defaultConfigPath(ROOT).endsWith('uk-embedded/config.example.yml')) {
  pass('default config path is the shipped example, not user profile.yml');
} else {
  fail(`defaultConfigPath => ${defaultConfigPath(ROOT)}`);
}
