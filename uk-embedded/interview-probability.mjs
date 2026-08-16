/**
 * Heuristic interview-probability estimate. Not statistically calibrated (S21).
 */

export function interviewProbability({ fit, gaps = [], job = {} }) {
  const blockers = gaps.filter((g) => g.application_blocker).length;
  let score = Number(fit?.score ?? 0);
  const factors = [{ name: 'technical_fit', value: score }];

  if (blockers) {
    score *= 0.45;
    factors.push({ name: 'mandatory_blockers', value: blockers });
  }

  const locationKnown = Boolean(job.location && String(job.location).trim());
  let uncertainty = locationKnown ? 0.2 : 0.55;
  if ((fit?.missing_requirements || []).length) uncertainty = Math.min(1, uncertainty + 0.15);
  if (job.work_mode === 'unknown' || !job.work_mode) uncertainty = Math.min(1, uncertainty + 0.1);

  factors.push({ name: 'uncertainty', value: uncertainty });

  const confidence = uncertainty >= 0.5 ? 'low' : uncertainty >= 0.3 ? 'medium' : 'high';

  return {
    score: Math.round(score) / 100,
    confidence,
    factors,
    uncertainty,
    calibrated: false,
  };
}
