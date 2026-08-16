/**
 * Candidate evidence store — parse and validate, never infer experience.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { extname, join } from 'path';
import yaml from 'js-yaml';

export const EVIDENCE_TYPES = ['project', 'technology', 'achievement', 'responsibility'];
export const CONFIDENCE = ['verified', 'strong', 'probable', 'weak', 'unknown'];
export const STRENGTH = ['expert', 'proficient', 'working', 'exposure', 'unknown'];

export class EvidenceError extends Error {
  /**
   * @param {string} message
   * @param {string} [code]
   */
  constructor(message, code = 'invalid_evidence') {
    super(message);
    this.name = 'EvidenceError';
    this.code = code;
  }
}

/**
 * @param {unknown} raw
 * @returns {object}
 */
export function validateRecord(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new EvidenceError('evidence record must be a mapping');
  }
  const rec = /** @type {Record<string, unknown>} */ (raw);
  if (typeof rec.id !== 'string' || !rec.id.trim()) {
    throw new EvidenceError('missing ID', 'missing_id');
  }
  if (!EVIDENCE_TYPES.includes(/** @type {string} */ (rec.type))) {
    throw new EvidenceError(`invalid type: ${rec.type}`, 'invalid_type');
  }
  if (typeof rec.title !== 'string' || !rec.title.trim()) {
    throw new EvidenceError(`missing title for ${rec.id}`, 'missing_title');
  }
  if (typeof rec.description !== 'string') {
    throw new EvidenceError(`missing description for ${rec.id}`, 'missing_description');
  }
  if (typeof rec.source !== 'string' || !rec.source.trim()) {
    throw new EvidenceError(`missing source/provenance for ${rec.id}`, 'missing_source');
  }
  if (!CONFIDENCE.includes(/** @type {string} */ (rec.confidence))) {
    throw new EvidenceError(`invalid confidence for ${rec.id}: ${rec.confidence}`, 'invalid_confidence');
  }

  const technologies = Array.isArray(rec.technologies)
    ? rec.technologies.filter((t) => typeof t === 'string')
    : [];
  const related = Array.isArray(rec.related_evidence)
    ? rec.related_evidence.filter((t) => typeof t === 'string')
    : [];

  let strength = STRENGTH.includes(/** @type {string} */ (rec.strength))
    ? rec.strength
    : 'unknown';
  if (rec.confidence === 'unknown' && strength === 'expert') {
    strength = 'unknown';
  }

  return {
    id: rec.id.trim(),
    type: rec.type,
    title: rec.title.trim(),
    description: rec.description,
    technologies,
    domain: typeof rec.domain === 'string' ? rec.domain : 'unknown',
    strength,
    years: typeof rec.years === 'number' ? rec.years : null,
    production: rec.production === true,
    source: rec.source.trim(),
    confidence: rec.confidence,
    related_evidence: related,
  };
}

/**
 * @param {string} file
 * @returns {object[]}
 */
export function loadEvidenceFile(file) {
  if (!existsSync(file)) {
    throw new EvidenceError(`evidence file not found: ${file}`, 'missing_file');
  }
  const parsed = yaml.load(readFileSync(file, 'utf8'));
  const records = Array.isArray(parsed) ? parsed : parsed == null ? [] : [parsed];
  return records.map((item) => validateRecord(item));
}

/**
 * Load all YAML files in a directory (non-recursive except one level of
 * type folders: projects/, technologies/, achievements/, responsibilities/).
 *
 * @param {string} dir
 */
export function loadEvidenceStore(dir) {
  if (!existsSync(dir)) {
    throw new EvidenceError(`evidence directory not found: ${dir}`, 'missing_dir');
  }
  const files = [];
  const walk = (path) => {
    for (const name of readdirSync(path).sort()) {
      const full = join(path, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (/\.ya?ml$/i.test(extname(name))) files.push(full);
    }
  };
  walk(dir);

  /** @type {object[]} */
  const records = [];
  for (const file of files) {
    records.push(...loadEvidenceFile(file));
  }

  const byId = new Map();
  for (const rec of records) {
    if (byId.has(rec.id)) {
      throw new EvidenceError(`duplicate evidence id: ${rec.id}`, 'duplicate_id');
    }
    byId.set(rec.id, rec);
  }

  for (const rec of records) {
    for (const rel of rec.related_evidence) {
      if (!byId.has(rel)) {
        throw new EvidenceError(`${rec.id} references missing evidence ${rel}`, 'missing_related');
      }
    }
  }

  return { records, byId };
}

/**
 * Unknown technology names are kept, never treated as expertise.
 *
 * @param {object} record
 * @param {Set<string>} knownTaxonomyIds
 */
export function technologyStatus(record, knownTaxonomyIds = new Set()) {
  if (record.type !== 'technology') {
    return { known: false, expertise: false };
  }
  const known = knownTaxonomyIds.size === 0
    ? record.confidence !== 'unknown'
    : knownTaxonomyIds.has(record.id) || knownTaxonomyIds.has(record.title.toLowerCase());
  if (!known || record.confidence === 'unknown') {
    return { known: false, expertise: false, confidence: 'unknown' };
  }
  return {
    known: true,
    expertise: record.strength === 'expert' && (record.confidence === 'verified' || record.confidence === 'strong'),
    confidence: record.confidence,
  };
}
