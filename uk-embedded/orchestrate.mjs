/**
 * End-to-end UK Embedded workflow. Stops at READY_FOR_SUBMISSION.
 * Never submits, sends, or clicks.
 */

import { loadConfig } from './index.mjs';
import { loadTaxonomy } from './taxonomy.mjs';
import { discoverJobs, deduplicateJobs } from './jobs.mjs';
import { applyHardFilters } from './hard-filters.mjs';
import { analyzeGaps } from './transferability.mjs';
import { interviewProbability } from './interview-probability.mjs';
import { applicationRoi } from './roi.mjs';
import { attachCompanyResearch } from './company.mjs';
import { retrieveEvidence } from './retrieve.mjs';
import { generateCv, generateCoverLetter, reviewApplication, validateDocument } from './documents.mjs';
import { createApplication, transition } from './tracking.mjs';
import { prepareInterview } from './interview-prep.mjs';

export const STOP_STATE = 'ready_for_review';

/**
 * @param {object} opts
 */
export async function runPipeline(opts) {
  const config = opts.config || loadConfig();
  const taxonomy = opts.taxonomy || loadTaxonomy();
  const store = opts.store;
  const stages = [];

  const discovered = await discoverJobs(opts.providers || []);
  stages.push({ stage: 'discovery', ok: true, jobs: discovered.jobs.length, errors: discovered.errors });

  const normalized = deduplicateJobs(discovered.jobs);
  stages.push({ stage: 'normalize', ok: true, jobs: normalized.length });

  const filtered = applyHardFilters(normalized, config);
  stages.push({ stage: 'hard-filter', ok: true, retained: filtered.retained.length, rejected: filtered.rejected.length });

  const ranked = [];
  for (const row of filtered.retained) {
    try {
      const { fit, gaps } = analyzeGaps(row.job, store, taxonomy);
      const interview = interviewProbability({ fit, gaps, job: row.job });
      const roi = applicationRoi({
        fit,
        interview,
        estimated_effort_minutes: opts.estimated_effort_minutes || 45,
      });
      ranked.push({ job: row.job, fit, gaps, interview, roi });
    } catch (err) {
      stages.push({ stage: 'evaluate', ok: false, job: row.job.id, error: err.message });
    }
  }
  ranked.sort((a, b) => b.roi.priority - a.roi.priority);
  stages.push({ stage: 'rank', ok: true, jobs: ranked.length });

  const applications = [];
  for (const item of ranked.slice(0, opts.limit || 5)) {
    let app = createApplication({
      job: item.job,
      scores: { fit: item.fit, interview: item.interview, roi: item.roi },
    });
    app = transition(app, 'qualified');
    app = transition(app, 'shortlisted');
    app = transition(app, 'researching');
    const research = attachCompanyResearch(item.job, opts.companyResearch || {});
    app = transition(app, 'drafting');
    const retrieval = retrieveEvidence(item.job, store, taxonomy);
    const cv = generateCv(item.job, store, taxonomy);
    const cover = generateCoverLetter(item.job, store, research, taxonomy);
    const review = reviewApplication({ cv, cover, job: item.job, store, taxonomy });
    const ats = validateDocument({ html: cv.html, candidateName: 'Candidate', requiredKeywords: cv.skills.slice(0, 2) });
    const prep = prepareInterview(item.job, store, taxonomy);
    app = transition(app, 'ready_for_review');
    applications.push({
      application: app,
      research,
      retrieval,
      cv,
      cover,
      review,
      ats,
      prep,
      submitted: false,
    });
  }

  return {
    stages,
    ranked,
    applications,
    stop: STOP_STATE,
    submitted: false,
  };
}
