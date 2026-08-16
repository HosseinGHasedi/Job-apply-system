/**
 * Deterministic technical-fit scoring.
 * Related technologies are not treated as identical (transfer is S09).
 */

import { loadTaxonomy, resolveTech } from './taxonomy.mjs';
import { technologyStatus } from './evidence.mjs';

function tokensFrom(job) {
  const parts = [
    ...(job.requirements || []),
    ...(job.desirable || []),
    job.title || '',
    job.description || '',
  ];
  return parts.join(' ').toLowerCase();
}

/**
 * @param {object} job
 * @param {ReturnType<typeof loadTaxonomy>} taxonomy
 */
export function extractRequirements(job, taxonomy) {
  const text = tokensFrom(job);
  const mandatoryHints = /\b(must|required|mandatory|essential)\b/i.test(text);
  const found = [];
  for (const tech of taxonomy.technologies.items) {
    const names = [tech.id, tech.name, ...(tech.synonyms || [])];
    const hit = names.some((n) => new RegExp(`\\b${escapeRe(n)}\\b`, 'i').test(text));
    if (!hit) continue;
    const inRequirements = (job.requirements || []).some((r) => resolveTech(taxonomy, r) === tech.id || String(r).toLowerCase().includes(tech.name.toLowerCase()));
    found.push({
      id: tech.id,
      name: tech.name,
      mandatory: inRequirements || (mandatoryHints && hit),
    });
  }
  if (Array.isArray(job.requirements)) {
    for (const req of job.requirements) {
      const id = resolveTech(taxonomy, req);
      if (id && !found.some((f) => f.id === id)) {
        found.push({ id, name: taxonomy.technologies.byId.get(id)?.name || req, mandatory: true });
      }
    }
  }
  return found;
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function evidenceForTech(store, taxonomy, techId) {
  const matches = [];
  for (const rec of store.records) {
    const recTech = rec.type === 'technology'
      ? (resolveTech(taxonomy, rec.title) || resolveTech(taxonomy, rec.id) || rec.id)
      : null;
    const listed = (rec.technologies || []).some((t) => resolveTech(taxonomy, t) === techId || t === techId);
    if (recTech === techId || listed) {
      matches.push(rec);
    }
  }
  return matches;
}

/**
 * @param {object} job
 * @param {object} store  loadEvidenceStore result
 * @param {object} [taxonomy]
 */
export function technicalFit(job, store, taxonomy = loadTaxonomy()) {
  const requirements = extractRequirements(job, taxonomy);
  const supporting = [];
  const missing = [];
  let mandatoryHits = 0;
  let mandatoryTotal = 0;
  let coreHits = 0;

  for (const req of requirements) {
    const ev = evidenceForTech(store, taxonomy, req.id)
      .filter((r) => r.confidence !== 'unknown');
    const direct = ev.filter((r) => {
      if (r.type === 'technology') {
        const status = technologyStatus(r);
        return status.expertise || r.confidence === 'verified' || r.confidence === 'strong' || r.confidence === 'probable';
      }
      return true;
    });
    if (req.mandatory) mandatoryTotal += 1;
    if (direct.length) {
      if (req.mandatory) mandatoryHits += 1;
      coreHits += 1;
      supporting.push({ requirement: req.id, evidence: direct.map((e) => e.id) });
    } else {
      missing.push(req.id);
    }
  }

  const mandatoryRatio = mandatoryTotal === 0 ? 0.6 : mandatoryHits / mandatoryTotal;
  const coreRatio = requirements.length === 0 ? 0.4 : coreHits / requirements.length;
  let score = Math.round(100 * (0.65 * mandatoryRatio + 0.35 * coreRatio));
  if (mandatoryTotal && mandatoryHits === 0) score = Math.min(score, 25);
  if (requirements.length === 0) score = 40;

  return {
    score,
    mandatory_match: { hits: mandatoryHits, total: mandatoryTotal },
    core_match: { hits: coreHits, total: requirements.length },
    domain_match: null,
    responsibility_match: null,
    evidence_confidence: supporting.length ? 'traced' : 'none',
    missing_requirements: missing,
    supporting_evidence: supporting,
    requirements,
  };
}
