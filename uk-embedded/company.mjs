/**
 * Company research attachment. Never invent facts or contacts.
 */

export function attachCompanyResearch(job, research = {}) {
  const fields = [
    'company', 'product_domain', 'engineering_domain', 'technology_relevance',
    'location', 'work_model', 'career_growth', 'company_size', 'public_info',
    'role_context', 'hiring_contacts',
  ];
  const attached = {};
  const sources = Array.isArray(research.sources) ? research.sources : [];

  for (const field of fields) {
    const value = research[field];
    if (value == null || value === '') {
      attached[field] = { value: 'unknown', source: null };
    } else if (field === 'hiring_contacts' && (!sources.length)) {
      attached[field] = { value: 'unknown', source: null, note: 'contacts require a source' };
    } else {
      attached[field] = { value, source: research.sources_by_field?.[field] || sources[0] || null };
    }
  }

  return {
    job_id: job.id,
    company: job.company,
    research: attached,
    sources,
  };
}
