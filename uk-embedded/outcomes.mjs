/**
 * Outcome recording. Does not learn/calibrate (that's S21).
 */

export const OUTCOMES = [
  'no_response',
  'rejected_application',
  'rejected_screen',
  'rejected_technical',
  'rejected_final',
  'interview',
  'offer',
  'withdrawn',
];

export function recordOutcome(application, outcome) {
  if (!application?.id) throw new Error('outcome requires a known application');
  if (!OUTCOMES.includes(outcome.type)) throw new Error(`unknown outcome type: ${outcome.type}`);
  return {
    application_id: application.id,
    type: outcome.type,
    stage: outcome.stage || outcome.type,
    date: outcome.date || null,
    feedback: outcome.feedback || null,
    reason: outcome.reason || null,
  };
}
