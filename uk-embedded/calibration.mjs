/**
 * Advisory calibration from outcomes. Never silently rewrites scoring.
 * Tests must pass a fixture list — never live data/outcomes/.
 */

export function calibrate({ outcomes = [], predictions = [] }) {
  const n = outcomes.length;
  let confidence = 'insufficient_data';
  if (n >= 30) confidence = 'high_confidence';
  else if (n >= 15) confidence = 'medium_confidence';
  else if (n >= 5) confidence = 'low_confidence';

  const byFamily = new Map();
  for (const row of outcomes) {
    const key = row.role_family || 'unknown';
    const cur = byFamily.get(key) || { interviews: 0, total: 0 };
    cur.total += 1;
    if (row.type === 'interview' || row.type === 'offer') cur.interviews += 1;
    byFamily.set(key, cur);
  }

  const patterns = [...byFamily.entries()].map(([family, s]) => ({
    family,
    interview_rate: s.total ? s.interviews / s.total : 0,
    sample_size: s.total,
  })).sort((a, b) => b.interview_rate - a.interview_rate);

  const recommendations = [];
  if (patterns.length >= 2 && patterns[0].interview_rate > patterns[patterns.length - 1].interview_rate) {
    recommendations.push({
      type: 'weight_role_family',
      family: patterns[0].family,
      note: `Higher interview rate for ${patterns[0].family}; propose raising its track weight after human approval.`,
    });
  }

  return {
    sample_size: n,
    confidence,
    patterns,
    recommendations,
    applied: false,
    predictions_considered: predictions.length,
  };
}
