/**
 * Requirement → evidence retrieval. Never generates new evidence.
 */

import { loadTaxonomy, resolveTech } from './taxonomy.mjs';
import { extractRequirements } from './technical-fit.mjs';

/**
 * @param {object} job
 * @param {object} store
 * @param {object} [taxonomy]
 */
export function retrieveEvidence(job, store, taxonomy = loadTaxonomy()) {
  const requirements = extractRequirements(job, taxonomy);
  const selections = [];

  for (const req of requirements) {
    const candidates = store.records.filter((rec) => {
      if (rec.confidence === 'unknown') return false;
      const id = resolveTech(taxonomy, rec.title) || resolveTech(taxonomy, rec.id);
      const listed = (rec.technologies || []).some((t) => resolveTech(taxonomy, t) === req.id || t === req.id);
      return id === req.id || listed || rec.domain === req.id;
    });

    candidates.sort((a, b) => {
      const conf = { verified: 4, strong: 3, probable: 2, weak: 1 };
      return (conf[b.confidence] || 0) - (conf[a.confidence] || 0);
    });

    if (!candidates.length) {
      selections.push({
        requirement: req.id,
        evidence: [],
        relevance: 0,
        confidence: 'none',
        reason: 'no supporting evidence',
      });
      continue;
    }

    const top = candidates[0];
    selections.push({
      requirement: req.id,
      evidence: [top.id],
      record: top,
      relevance: top.type === 'technology' ? 1 : 0.8,
      confidence: top.confidence,
      reason: `selected ${top.id} from evidence store`,
    });
  }

  return { selections };
}
