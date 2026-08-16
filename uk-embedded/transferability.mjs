/**
 * Transferability and gaps — separate from direct technical-fit matches.
 * Never promote a transferable skill into claimed experience.
 */

import { loadTaxonomy, relevance, isEquivalent, resolveTech } from './taxonomy.mjs';
import { technicalFit } from './technical-fit.mjs';

const SEVERITY = ['none', 'minor', 'learnable', 'moderate', 'major', 'critical'];

function evidenceDomains(store) {
  return new Set(store.records.map((r) => r.domain).filter(Boolean));
}

function evidenceTechIds(store, taxonomy) {
  const ids = new Set();
  for (const rec of store.records) {
    if (rec.confidence === 'unknown') continue;
    const id = resolveTech(taxonomy, rec.title) || resolveTech(taxonomy, rec.id);
    if (id) ids.add(id);
    for (const t of rec.technologies || []) {
      const tid = resolveTech(taxonomy, t);
      if (tid) ids.add(tid);
    }
  }
  return ids;
}

/**
 * @param {string} have
 * @param {string} need
 * @param {object} taxonomy
 */
export function transferability(have, need, taxonomy = loadTaxonomy()) {
  if (isEquivalent(taxonomy, have, need)) {
    return { transferable: true, equivalent: true, strength: 'direct', note: 'same technology' };
  }
  const forward = relevance(taxonomy, have, need);
  const back = relevance(taxonomy, need, have);
  if (forward.relevant || back.relevant) {
    return {
      transferable: true,
      equivalent: false,
      strength: forward.strength || back.strength || 'related',
      note: 'related, not equivalent',
    };
  }
  return { transferable: false, equivalent: false, strength: null, note: 'unrelated' };
}

/**
 * @param {object} job
 * @param {object} store
 * @param {object} [taxonomy]
 */
export function analyzeGaps(job, store, taxonomy = loadTaxonomy()) {
  const fit = technicalFit(job, store, taxonomy);
  const have = evidenceTechIds(store, taxonomy);
  const domains = evidenceDomains(store);
  const gaps = [];

  for (const req of fit.requirements) {
    if (!fit.missing_requirements.includes(req.id)) {
      gaps.push({
        technology: req.id,
        severity: 'none',
        evidence: fit.supporting_evidence.find((s) => s.requirement === req.id)?.evidence || [],
        transferability: { transferable: false, equivalent: true, note: 'direct evidence' },
        estimated_learning_cost: 0,
        application_blocker: false,
      });
      continue;
    }

    let best = { transferable: false, equivalent: false, strength: null, via: null };
    for (const id of have) {
      const t = transferability(id, req.id, taxonomy);
      if (t.equivalent || (t.transferable && !best.transferable)) {
        best = { ...t, via: id };
      }
    }
    for (const domain of domains) {
      const t = transferability(domain, req.id, taxonomy);
      if (t.transferable && !best.transferable) best = { ...t, via: domain };
    }

    let severity = req.mandatory ? 'critical' : 'major';
    if (best.transferable && !best.equivalent) severity = req.mandatory ? 'moderate' : 'learnable';
    if (best.equivalent) severity = 'none';

    gaps.push({
      technology: req.id,
      severity,
      evidence: best.via ? [best.via] : [],
      transferability: best,
      estimated_learning_cost: severity === 'critical' ? 80 : severity === 'moderate' ? 30 : 10,
      application_blocker: severity === 'critical',
    });
  }

  return { fit, gaps };
}
