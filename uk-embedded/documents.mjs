/**
 * Application documents: CV, cover letter, independent review, ATS/PDF gates.
 * Claims must trace to evidence. Unsupported JD keywords stay gaps.
 */

import { retrieveEvidence } from './retrieve.mjs';
import { loadTaxonomy, resolveTech } from './taxonomy.mjs';

function evidenceText(store) {
  return store.records
    .filter((r) => r.confidence !== 'unknown')
    .map((r) => `${r.title} ${r.description} ${(r.technologies || []).join(' ')}`)
    .join('\n')
    .toLowerCase();
}

function claimAllowed(claim, store, taxonomy = loadTaxonomy()) {
  const id = resolveTech(taxonomy, claim) || String(claim).toLowerCase();
  const blob = evidenceText(store);
  for (const rec of store.records) {
    if (rec.confidence === 'unknown') continue;
    const recId = resolveTech(taxonomy, rec.title) || rec.id;
    if (recId === id) return { ok: true, evidence: rec.id };
    if ((rec.technologies || []).some((t) => resolveTech(taxonomy, t) === id || t === id)) {
      return { ok: true, evidence: rec.id };
    }
  }
  if (blob.includes(String(claim).toLowerCase())) return { ok: true, evidence: 'text' };
  return { ok: false, evidence: null };
}

/**
 * Tailored CV draft from retrieved evidence. Does not invent experience.
 */
export function generateCv(job, store, taxonomy = loadTaxonomy()) {
  const { selections } = retrieveEvidence(job, store, taxonomy);
  const used = selections.filter((s) => s.evidence.length);
  const gaps = selections.filter((s) => !s.evidence.length).map((s) => s.requirement);
  const bullets = used.map((s) => {
    const rec = store.byId.get(s.evidence[0]);
    return {
      text: rec.description,
      evidence: rec.id,
      source: rec.source,
      requirement: s.requirement,
    };
  });
  const skills = used.map((s) => s.requirement);
  const html = [
    '<html><body>',
    '<h1>Candidate</h1>',
    '<h2>Professional Summary</h2>',
    `<p>${job.title} candidate. Evidence-backed summary.</p>`,
    '<h2>Work Experience</h2>',
    '<ul>',
    ...bullets.map((b) => `<li data-evidence="${b.evidence}">${b.text}</li>`),
    '</ul>',
    '<h2>Skills</h2>',
    `<p>${skills.join(', ')}</p>`,
    '</body></html>',
  ].join('\n');

  return { html, bullets, skills, gaps, job_id: job.id };
}

export function validateCvClaims(cv, store, taxonomy = loadTaxonomy()) {
  const invented = [];
  for (const skill of cv.skills || []) {
    const allowed = claimAllowed(skill, store, taxonomy);
    if (!allowed.ok) invented.push(skill);
  }
  return { ok: invented.length === 0, invented };
}

export function generateCoverLetter(job, store, companyResearch, taxonomy = loadTaxonomy()) {
  const { selections } = retrieveEvidence(job, store, taxonomy);
  const used = selections.filter((s) => s.evidence.length);
  const companyFact = companyResearch?.research?.product_domain?.value;
  const companyKnown = companyFact && companyFact !== 'unknown';
  const paragraphs = [
    `Role: ${job.title} at ${job.company}.`,
    companyKnown ? `Company context: ${companyFact}.` : 'Company context: unknown — omitted generic praise.',
    ...used.map((s) => {
      const rec = store.byId.get(s.evidence[0]);
      return `Evidence for ${s.requirement}: ${rec.description}`;
    }),
  ];
  const html = `<html><body><h1>Cover letter</h1>${paragraphs.map((p) => `<p>${p}</p>`).join('')}</body></html>`;
  return { html, paragraphs, skills: used.map((s) => s.requirement), gaps: selections.filter((s) => !s.evidence.length).map((s) => s.requirement) };
}

/**
 * Independent reviewer. Must catch planted defects; must not rubber-stamp.
 */
export function reviewApplication({ cv, cover, job, store, taxonomy = loadTaxonomy() }) {
  const cvGate = validateCvClaims(cv, store, taxonomy);
  const coverGate = validateCvClaims(cover || { skills: [] }, store, taxonomy);
  const unsupported = [...cvGate.invented, ...coverGate.invented];
  const { selections } = retrieveEvidence(job, store, taxonomy);
  const missing = selections.filter((s) => !s.evidence.length).map((s) => s.requirement);

  const cvBlob = `${cv.html || ''} ${(cv.bullets || []).map((b) => b.text).join(' ')}`.toLowerCase();
  const irrelevant = (cv.bullets || []).filter((b) => {
    const rec = store.byId.get(b.evidence);
    if (!rec) return true;
    const reqs = (job.requirements || []).map((r) => String(r).toLowerCase());
    if (!reqs.length) return false;
    return !reqs.some((r) => (rec.title || '').toLowerCase().includes(r) || (rec.description || '').toLowerCase().includes(r) || (rec.technologies || []).join(' ').toLowerCase().includes(r));
  });

  const blocking = [];
  if (unsupported.length) blocking.push({ code: 'invented_technology', items: unsupported });
  if (missing.length) blocking.push({ code: 'missing_mandatory_requirement', items: missing });
  if (irrelevant.length) blocking.push({ code: 'irrelevant_project', items: irrelevant.map((b) => b.evidence) });

  return {
    overall: blocking.length ? 'block' : 'pass',
    strengths: (cv.skills || []).filter((s) => !unsupported.includes(s)),
    weaknesses: missing,
    unsupported_claims: unsupported,
    missing_evidence: missing,
    recommendations: blocking.map((b) => b.code),
    blocking_issues: blocking,
  };
}

/**
 * ATS / PDF validation. Image-only PDFs fail. Text-layer preferred via pdftotext.
 */
export function extractPdfText(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const raw = buf.toString('latin1');
  if (!raw.includes('%PDF')) {
    throw new Error('not a PDF');
  }
  const textChunks = [];
  const paren = /\((?:\\.|[^\\)])*\)/g;
  let m;
  while ((m = paren.exec(raw))) {
    const inner = m[0].slice(1, -1).replace(/\\n/g, '\n').replace(/\\[()\\]/g, '');
    if (/[A-Za-z]{3,}/.test(inner)) textChunks.push(inner);
  }
  return textChunks.join(' ');
}

export function validateDocument({ html, pdfBuffer, candidateName = 'Candidate', requiredKeywords = [] }) {
  const reasons = [];
  let text = '';
  if (pdfBuffer) {
    try {
      text = extractPdfText(pdfBuffer);
    } catch (err) {
      reasons.push('pdf_unreadable');
    }
    if (pdfBuffer && text.trim().length < 20) {
      reasons.push('image_only_or_empty_text_layer');
    }
  } else if (html) {
    text = String(html).replace(/<[^>]+>/g, ' ');
  } else {
    reasons.push('no_document');
  }

  const lower = text.toLowerCase();
  if (candidateName && !lower.includes(String(candidateName).toLowerCase())) {
    reasons.push('missing_name');
  }
  if (!/work experience|experience/.test(lower)) {
    reasons.push('missing_experience_section');
  }
  if (!/professional summary|summary/.test(lower)) {
    reasons.push('missing_summary');
  }
  for (const kw of requiredKeywords) {
    if (!lower.includes(String(kw).toLowerCase())) reasons.push(`missing_keyword:${kw}`);
  }

  return { ok: reasons.length === 0, reasons, text };
}
