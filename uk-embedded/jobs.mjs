/**
 * Job discovery adapter — reuses career-ops provider Job shape.
 * Never fabricates jobs. Provider failures are isolated.
 */

import { createHash } from 'crypto';
import { normalizeUrl } from '../url-key.mjs';

function fingerprint(parts) {
  return createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 16);
}

function inferWorkMode(raw) {
  const text = `${raw.work_mode || ''} ${raw.location || ''} ${raw.title || ''} ${raw.description || ''}`.toLowerCase();
  if (/\bremote uk\b|\buk remote\b/.test(text)) return 'remote';
  if (/\bremote\b/.test(text) && !/\bon[- ]?site\b/.test(text)) return 'remote';
  if (/\bhybrid\b/.test(text)) return 'hybrid';
  if (/\bon[- ]?site\b|\boffice[- ]based\b/.test(text)) return 'onsite';
  return 'unknown';
}

function inferEmployment(raw) {
  const text = `${raw.employment_type || ''} ${raw.title || ''} ${raw.description || ''}`.toLowerCase();
  if (/\bcontract\b|\bcontractor\b|\bir35\b/.test(text)) return 'contract';
  if (/\bpermanent\b|\bperm\b/.test(text)) return 'permanent';
  return raw.employment_type || 'unknown';
}

/**
 * @param {object} raw  career-ops provider Job or similar
 * @param {{ provider?: string, source?: string }} [meta]
 */
export function normalizeJob(raw = {}, meta = {}) {
  const source_url_raw = String(raw.url || raw.source_url || '').trim();
  const source_url = source_url_raw ? (normalizeUrl(source_url_raw) || source_url_raw) : '';
  const title = String(raw.title || '').trim();
  const company = String(raw.company || '').trim();
  const location = String(raw.location || '').trim();
  const provider = meta.provider || raw.provider || 'unknown';
  const missingUrl = !source_url;

  return {
    id: fingerprint([source_url || 'nourl', provider, company, title, location]),
    title,
    company,
    location,
    work_mode: raw.work_mode || inferWorkMode(raw),
    employment_type: inferEmployment(raw),
    salary: raw.salary ?? null,
    description: raw.description || '',
    requirements: Array.isArray(raw.requirements) ? raw.requirements : [],
    desirable: Array.isArray(raw.desirable) ? raw.desirable : [],
    source: meta.source || raw.source || provider,
    source_url,
    posted_at: raw.postedAt ?? raw.posted_at ?? null,
    closing_at: raw.closing_at ?? null,
    provider,
    provenance: [{ provider, url: source_url_raw || null }],
    quarantine: missingUrl,
    quarantine_reason: missingUrl ? 'missing_url' : null,
    conflicts: [],
  };
}

/**
 * @param {Array<{ id: string, fetch: Function, entry?: object, ctx?: object }>} providers
 */
export async function discoverJobs(providers) {
  const jobs = [];
  const errors = [];
  const seenIds = new Set();

  for (const provider of providers || []) {
    if (!provider || seenIds.has(provider.id)) {
      errors.push({
        provider: provider?.id || 'duplicate',
        error: 'duplicate or missing provider skipped',
        retryable: false,
      });
      continue;
    }
    seenIds.add(provider.id);
    try {
      const rawJobs = await provider.fetch(provider.entry || {}, provider.ctx || {});
      if (!Array.isArray(rawJobs)) {
        throw new Error('fetch did not return an array');
      }
      for (const raw of rawJobs) {
        jobs.push(normalizeJob(raw, { provider: provider.id, source: provider.id }));
      }
    } catch (err) {
      errors.push({
        provider: provider.id,
        error: err.message || String(err),
        retryable: true,
        stage: 'discovery',
      });
    }
  }

  return { jobs, errors };
}

export function retainedJobs(result) {
  return result.jobs.filter((j) => !j.quarantine);
}
