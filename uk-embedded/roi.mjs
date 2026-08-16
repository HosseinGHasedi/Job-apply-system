/**
 * Application ROI — effort-aware priority. Does not change technical-fit.
 */

export function applicationRoi({
  fit,
  interview,
  estimated_effort_minutes = 60,
  career_value = 1,
  weights = { interview: 1, effort: 1, career: 1 },
}) {
  const minutes = Math.max(1, Number(estimated_effort_minutes) || 60);
  const p = Number(interview?.score ?? 0);
  const expected_value = p * Number(career_value || 1) * (weights.career || 1) * (weights.interview || 1);
  const priority = expected_value / (minutes / 60 * (weights.effort || 1));
  return {
    priority: Math.round(priority * 100) / 100,
    expected_value: Math.round(expected_value * 100) / 100,
    estimated_effort_minutes: minutes,
    rationale: {
      interview_probability: p,
      technical_fit: fit?.score ?? null,
      effort_hours: minutes / 60,
    },
  };
}
