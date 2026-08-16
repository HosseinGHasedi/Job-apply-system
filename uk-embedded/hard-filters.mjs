/**
 * Deterministic hard filters. Unknown never means reject.
 */

const JUNIOR_RE = /\b(intern|internship|graduate|junior|apprentice|entry[- ]level)\b/i;
const NON_UK_RE = /\b(united states|usa|u\.s\.a?\.|california|new york|san francisco|texas|india|bangalore|hyderabad|remote us)\b/i;
const UK_RE = /\b(uk|united kingdom|england|scotland|wales|bristol|cambridge|london|cheltenham|gloucester|oxford|reading|birmingham|swindon|remote uk)\b/i;
const NO_SPONSOR_RE = /\b(no sponsorship|cannot sponsor|without visa sponsorship|must (already )?have (the )?right to work)\b/i;

function haystack(job) {
  return `${job.title || ''} ${job.location || ''} ${job.description || ''}`;
}

/**
 * @param {object} job  canonical job
 * @param {object} config  loadConfig() result
 */
export function hardFilter(job, config = {}) {
  const filters = config.filters || {};
  const reasons = [];

  const excludedModes = filters.excluded_work_modes || [];
  if (job.work_mode && job.work_mode !== 'unknown' && excludedModes.includes(job.work_mode)) {
    reasons.push({ code: 'incompatible_work_mode', detail: job.work_mode });
  }

  const excludedTypes = filters.excluded_employment_types || [];
  if (job.employment_type && job.employment_type !== 'unknown' && excludedTypes.includes(job.employment_type)) {
    reasons.push({ code: 'incompatible_employment_type', detail: job.employment_type });
  }

  if (filters.require_uk_location) {
    const loc = job.location || '';
    if (loc && NON_UK_RE.test(loc) && !UK_RE.test(loc)) {
      reasons.push({ code: 'incompatible_location', detail: loc });
    }
  }

  if (JUNIOR_RE.test(job.title || '')) {
    reasons.push({ code: 'clearly_junior', detail: job.title });
  }

  for (const kw of filters.unrelated_title_keywords || []) {
    if (kw && String(job.title || '').toLowerCase().includes(String(kw).toLowerCase())) {
      reasons.push({ code: 'unrelated_domain', detail: kw });
    }
  }

  for (const domain of filters.reject_unrelated_domains || []) {
    const text = haystack(job).toLowerCase();
    if (domain === 'frontend' && /\b(react|vue|angular)\b/.test(text) && !/\bembedded|firmware|yocto|rtos|iot\b/.test(text)) {
      reasons.push({ code: 'unrelated_domain', detail: domain });
    }
  }

  if (filters.sponsorship?.reject_if_no_sponsorship === true && NO_SPONSOR_RE.test(haystack(job))) {
    reasons.push({ code: 'no_sponsorship', detail: 'explicit' });
  }

  const reject = reasons.length > 0;
  return {
    decision: reject ? 'definitely_incompatible' : (job.location ? 'potentially_compatible' : 'unknown'),
    reject,
    reasons,
  };
}

export function applyHardFilters(jobs, config) {
  const retained = [];
  const rejected = [];
  for (const job of jobs || []) {
    if (job.quarantine) {
      rejected.push({ job, filter: { decision: 'definitely_incompatible', reject: true, reasons: [{ code: 'quarantine', detail: job.quarantine_reason }] } });
      continue;
    }
    const filter = hardFilter(job, config);
    if (filter.reject) rejected.push({ job, filter });
    else retained.push({ job, filter });
  }
  return { retained, rejected };
}
