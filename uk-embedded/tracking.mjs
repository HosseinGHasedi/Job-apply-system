/**
 * Application tracking overlay. Canonical career-ops states remain the
 * tracker source of truth; this machine adds UK Embedded substates.
 */

export const STATES = [
  'discovered',
  'qualified',
  'shortlisted',
  'researching',
  'drafting',
  'ready_for_review',
  'approved',
  'submitted',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
  'expired',
  'skip',
];

const ALLOWED = {
  discovered: ['qualified', 'skip', 'expired'],
  qualified: ['shortlisted', 'skip', 'expired'],
  shortlisted: ['researching', 'skip'],
  researching: ['drafting', 'skip'],
  drafting: ['ready_for_review', 'drafting'],
  ready_for_review: ['approved', 'drafting'],
  approved: ['submitted', 'drafting'],
  submitted: ['interview', 'rejected', 'withdrawn', 'expired'],
  interview: ['offer', 'rejected', 'withdrawn'],
  offer: ['rejected', 'withdrawn'],
  rejected: [],
  withdrawn: [],
  expired: [],
  skip: [],
};

export const CAREER_OPS_STATUS = {
  discovered: 'evaluated',
  qualified: 'evaluated',
  shortlisted: 'evaluated',
  researching: 'evaluated',
  drafting: 'evaluated',
  ready_for_review: 'evaluated',
  approved: 'evaluated',
  submitted: 'applied',
  interview: 'interview',
  offer: 'offer',
  rejected: 'rejected',
  withdrawn: 'discarded',
  expired: 'discarded',
  skip: 'skip',
};

export function canTransition(from, to) {
  return (ALLOWED[from] || []).includes(to);
}

export function createApplication({ job, scores = {}, documents = {} }) {
  if (!job?.id || !job?.source_url) {
    throw new Error('application requires job identity and source URL');
  }
  return {
    id: job.id,
    job,
    company: job.company,
    source: job.source_url,
    priority: scores.roi?.priority ?? null,
    scores,
    discovered_at: new Date(0).toISOString(),
    applied_at: null,
    cv_version: documents.cv_version || null,
    letter_version: documents.letter_version || null,
    status: 'discovered',
    career_ops_status: CAREER_OPS_STATUS.discovered,
    notes: [],
    outcome: null,
    history: [{ at: new Date(0).toISOString(), from: null, to: 'discovered' }],
  };
}

export function transition(app, to, { at = new Date(0).toISOString(), note } = {}) {
  if (!canTransition(app.status, to)) {
    const err = new Error(`invalid transition ${app.status} → ${to}`);
    err.code = 'invalid_transition';
    throw err;
  }
  const next = {
    ...app,
    status: to,
    career_ops_status: CAREER_OPS_STATUS[to],
    history: [...app.history, { at, from: app.status, to, note: note || null }],
  };
  if (to === 'submitted') next.applied_at = at;
  return next;
}
