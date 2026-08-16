/**
 * UK Embedded/IoT specialization — public API.
 *
 * Isolated from upstream career-ops scoring. Personal candidate facts must
 * never be hard-coded here; they live in the user layer.
 */

import { existsSync, readFileSync } from 'fs';
import { dirname, isAbsolute, join } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const SPECIALIZATION_ROOT = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(SPECIALIZATION_ROOT, '..');

const DEFAULTS = {
  version: 1,
  specialization: 'uk-embedded',
  market: { country: 'UK' },
};

/**
 * @param {string} [root]
 * @returns {string}
 */
export function defaultConfigPath(root = REPO_ROOT) {
  return join(root, 'uk-embedded', 'config.example.yml');
}

/**
 * Load specialization config. Missing optional keys take shipped defaults.
 * An empty YAML mapping is valid.
 *
 * @param {{ path?: string, root?: string }} [options]
 */
export function loadConfig(options = {}) {
  const root = options.root ?? REPO_ROOT;
  const file = options.path
    ? (isAbsolute(options.path) ? options.path : join(root, options.path))
    : defaultConfigPath(root);

  if (!existsSync(file)) {
    throw new Error(`UK Embedded config not found: ${file}`);
  }

  const parsed = yaml.load(readFileSync(file, 'utf8'));
  if (parsed == null) {
    return structuredClone(DEFAULTS);
  }
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('UK Embedded config must be a YAML mapping');
  }

  const raw = /** @type {Record<string, unknown>} */ (parsed);
  const market = (raw.market && typeof raw.market === 'object' && !Array.isArray(raw.market))
    ? raw.market
    : {};

  return {
    ...DEFAULTS,
    ...raw,
    specialization: typeof raw.specialization === 'string' && raw.specialization
      ? raw.specialization
      : DEFAULTS.specialization,
    market: { ...DEFAULTS.market, ...market },
  };
}

/**
 * @param {{ path?: string, root?: string }} [options]
 */
export function health(options = {}) {
  const config = loadConfig(options);
  return {
    ok: true,
    specialization: config.specialization,
    country: config.market?.country ?? null,
    layer: 'uk-embedded',
    upstream: 'career-ops',
  };
}
