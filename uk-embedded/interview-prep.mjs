/**
 * Interview prep from the job, evidence, and gaps. Never invent project details.
 */

import { retrieveEvidence } from './retrieve.mjs';
import { analyzeGaps } from './transferability.mjs';
import { loadTaxonomy } from './taxonomy.mjs';

export function prepareInterview(job, store, taxonomy = loadTaxonomy()) {
  const { selections } = retrieveEvidence(job, store, taxonomy);
  const { gaps, fit } = analyzeGaps(job, store, taxonomy);
  const topics = selections.map((s) => s.requirement);
  const questions = topics.map((t) => `Explain your production experience with ${t}.`);
  const stories = selections
    .filter((s) => s.record)
    .map((s) => ({
      situation: s.record.title,
      action: s.record.description,
      evidence: s.record.id,
      source: s.record.source,
    }));
  const prepGaps = gaps.filter((g) => g.severity !== 'none').map((g) => ({
    technology: g.technology,
    severity: g.severity,
    topic: `Prepare to discuss learning plan for ${g.technology}`,
  }));

  return {
    role_summary: job.title,
    technical_topics: topics,
    likely_questions: questions,
    candidate_evidence: stories,
    knowledge_gaps: prepGaps,
    company_questions: job.company ? [`What is ${job.company} shipping in this domain?`] : [],
    questions_to_ask: ['What does success look like in the first 90 days?'],
    fit_score: fit.score,
  };
}
