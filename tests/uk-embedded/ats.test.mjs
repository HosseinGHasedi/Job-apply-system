import { join } from 'path';
import { pathToFileURL } from 'url';
import { fail, pass, ROOT } from '../helpers.mjs';

console.log('\nuk-embedded S17 ATS/PDF validation');

const { validateDocument, extractPdfText } = await import(
  pathToFileURL(join(ROOT, 'uk-embedded/documents.mjs')).href
);

const validHtml = `
<html><body>
<h1>Candidate</h1>
<h2>Professional Summary</h2>
<p>Embedded Linux engineer.</p>
<h2>Work Experience</h2>
<ul><li>Linux MQTT gateway</li></ul>
</body></html>`;

const valid = validateDocument({ html: validHtml, candidateName: 'Candidate', requiredKeywords: ['linux'] });
if (valid.ok) pass('valid document → pass');
else fail(`valid failed ${valid.reasons}`);

const missingName = validateDocument({ html: validHtml.replace('Candidate', 'Engineer'), candidateName: 'Candidate' });
if (!missingName.ok && missingName.reasons.includes('missing_name')) pass('missing name → fail');
else fail(`missing name ${JSON.stringify(missingName)}`);

const missingExp = validateDocument({
  html: '<html><body><h1>Candidate</h1><h2>Professional Summary</h2><p>Hi</p></body></html>',
  candidateName: 'Candidate',
});
if (!missingExp.ok && missingExp.reasons.includes('missing_experience_section')) pass('missing experience section → fail');
else fail(`missing exp ${JSON.stringify(missingExp)}`);

const imageOnly = Buffer.from('%PDF-1.1\n1 0 obj<< /Type /Catalog >>endobj\ntrailer<<>>\n%%EOF\n');
const img = validateDocument({ pdfBuffer: imageOnly, candidateName: 'Candidate' });
if (!img.ok && img.reasons.includes('image_only_or_empty_text_layer')) pass('image-only PDF → fail ATS check');
else fail(`image-only ${JSON.stringify(img)}`);

const textPdf = Buffer.from('%PDF-1.1\n(Candidate Professional Summary Work Experience Linux MQTT)\n%%EOF\n');
const extracted = extractPdfText(textPdf);
if (/Candidate/.test(extracted) && /Linux/.test(extracted)) {
  pass('PDF text layer extraction works');
} else {
  fail(`extract ${extracted}`);
}

const kw = validateDocument({ pdfBuffer: textPdf, candidateName: 'Candidate', requiredKeywords: ['linux'] });
if (kw.ok) pass('valid PDF with keyword → pass');
else fail(`keyword pdf ${JSON.stringify(kw)}`);
