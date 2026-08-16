import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S04 UK market configuration');

const { loadConfig } = await import(pathToFileURL(join(ROOT, 'uk-embedded/index.mjs')).href);

const cfg = loadConfig();
if (cfg.market.country === 'UK' && Array.isArray(cfg.market.locations) && cfg.market.locations.includes('Cheltenham')) {
  pass('UK configuration loads with location preferences');
} else {
  fail(`market load failed: ${JSON.stringify(cfg.market)}`);
}

if (Array.isArray(cfg.market.work_modes) && cfg.market.work_modes.includes('hybrid')) {
  pass('work mode is configurable via YAML');
} else {
  fail(`work_modes missing: ${JSON.stringify(cfg.market.work_modes)}`);
}

if (cfg.filters && Array.isArray(cfg.filters.unrelated_title_keywords)) {
  pass('filters are configuration-driven');
} else {
  fail('filters.yml did not load');
}

if (cfg.search?.queries?.length > 0 && cfg.search.tracks.includes('embedded-linux')) {
  pass('search tracks and queries load from configuration');
} else {
  fail(`search failed: ${JSON.stringify(cfg.search)}`);
}

const dir = mkdtempSync(join(tmpdir(), 'uk-embedded-s04-'));
writeFileSync(join(dir, 'market.yml'), 'country: UK\nlocations:\n  - Leeds\nwork_modes:\n  - remote\n');
writeFileSync(join(dir, 'filters.yml'), 'excluded_work_modes:\n  - onsite\n');
writeFileSync(join(dir, 'search.yml'), 'queries:\n  - firmware Leeds\ntracks:\n  - firmware\n');
const alt = loadConfig({ configDir: dir });
if (
  alt.market.locations[0] === 'Leeds'
  && alt.market.work_modes[0] === 'remote'
  && alt.filters.excluded_work_modes[0] === 'onsite'
  && alt.search.queries[0] === 'firmware Leeds'
  && cfg.market.locations[0] !== 'Leeds'
) {
  pass('changing YAML changes behaviour without source-code modification');
} else {
  fail(`override config unexpected: ${JSON.stringify(alt)}`);
}

const src = (await import('fs')).readFileSync(join(ROOT, 'uk-embedded/index.mjs'), 'utf8')
  + (await import('fs')).readFileSync(join(ROOT, 'uk-embedded/config/market.yml'), 'utf8');
if (!/Skilled Worker visa granted|ILR|my salary|£[0-9]{2,}/.test(src)) {
  pass('no personal salary or visa facts in specialization source/config');
} else {
  fail('personal facts found in specialization config');
}
