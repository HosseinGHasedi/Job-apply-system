/**
 * Embedded/IoT taxonomy — declarative, candidate-independent.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'js-yaml';

const TAXONOMY_DIR = join(dirname(fileURLToPath(import.meta.url)), 'taxonomy');

function loadListAt(dir, name) {
  const parsed = yaml.load(readFileSync(join(dir, name), 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`${name} must be a YAML list`);
  return parsed;
}

function indexById(items) {
  const byId = new Map();
  const synonyms = new Map();
  for (const item of items) {
    byId.set(item.id, item);
    synonyms.set(item.id.toLowerCase(), item.id);
    synonyms.set(String(item.name || '').toLowerCase(), item.id);
    for (const syn of item.synonyms || []) {
      synonyms.set(String(syn).toLowerCase(), item.id);
    }
  }
  return { items, byId, synonyms };
}

/**
 * @param {string} [dir]
 */
export function loadTaxonomy(dir = TAXONOMY_DIR) {
  const roles = indexById(loadListAt(dir, 'roles.yml'));
  const technologies = indexById(loadListAt(dir, 'technologies.yml'));
  const domains = indexById(loadListAt(dir, 'domains.yml'));
  const relationships = loadListAt(dir, 'relationships.yml');
  return { roles, technologies, domains, relationships };
}

/**
 * @param {ReturnType<typeof loadTaxonomy>} taxonomy
 * @param {string} token
 */
export function resolveTech(taxonomy, token) {
  if (!token) return null;
  return taxonomy.technologies.synonyms.get(String(token).toLowerCase()) || null;
}

/**
 * @param {ReturnType<typeof loadTaxonomy>} taxonomy
 * @param {string} from
 * @param {string} to
 */
export function relation(taxonomy, from, to) {
  const a = resolveTech(taxonomy, from) || from;
  const b = resolveTech(taxonomy, to) || to;
  return taxonomy.relationships.find((rel) => rel.from === a && rel.to === b) || null;
}

export function isEquivalent(taxonomy, a, b) {
  const idA = resolveTech(taxonomy, a);
  const idB = resolveTech(taxonomy, b);
  if (idA && idB && idA === idB) return true;
  const rel = relation(taxonomy, a, b);
  const back = relation(taxonomy, b, a);
  return rel?.type === 'equivalent_to' || back?.type === 'equivalent_to';
}

export function relevance(taxonomy, from, to) {
  const rel = relation(taxonomy, from, to);
  if (!rel) return { relevant: false, equivalent: isEquivalent(taxonomy, from, to), strength: null };
  return {
    relevant: rel.type === 'relevant_to' || rel.type === 'equivalent_to',
    equivalent: rel.type === 'equivalent_to',
    strength: rel.strength || null,
  };
}
