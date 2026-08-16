# Upstream Extension Map

> Slice **S00**. How to specialize career-ops for UK Embedded/IoT **without**
> forking its core. Pair with [`ARCHITECTURE_BASELINE.md`](ARCHITECTURE_BASELINE.md).

## 1. The rule

Prefer this stack:

```text
career-ops core (unmodified)
  + user-layer config / evidence
  + modes/regional/uk-embedded.md
  + providers/ or plugins.local/ for UK sources
  + tests against fixtures only
```

over:

```text
career-ops
  ↓
uk-embedded/ Python-style evaluators
  ↓
permanent divergence
```

A new top-level `uk-embedded/` directory is **not** an extension point. Every
tracked path must be in `SYSTEM_PATHS` or `USER_PATHS` (`update-system.mjs`).
Unregistered paths fail `validate-system-paths-coverage.mjs`.

## 2. Native extension surfaces

| Need | Put it here | Layer |
| --- | --- | --- |
| House rules, always/never | `modes/_custom.md` | user |
| Archetypes, narrative | `modes/_profile.md` | user |
| Identity, visa, salary, location | `config/profile.yml` | user |
| Fact allowlist / forbidden phrases | `config/cv-facts.json` | user |
| Company list + title filters | `portals.yml` | user |
| Master CV / diplomas / LinkedIn export | `documents/` + `intake.mjs` | user |
| Structured evidence (S02) | new files under `documents/` or `data/` (user), not Python modules | user |
| UK Embedded scoring notes | `modes/regional/uk-embedded.md` | system (`modes/regional/` already listed) |
| No-auth UK job board | `providers/<id>.mjs` + `tests/providers/<id>.test.mjs` | system |
| Auth-gated source (LinkedIn, Reed login) | `plugins.local/<id>/` | user |
| Do-not-apply list | `data/blacklist.md` | user |
| Persistent workflow glue | existing `auto-pipeline.md` / `pipeline.md`; extra rules in `_custom.md` | mix |

## 3. Slice remapping (do not rebuild what exists)

| Slice | Planned in Implementation_Slices.md | Do this instead |
| --- | --- | --- |
| S01 Specialization boundary | `uk-embedded/` package + health CLI | User-layer files + `modes/regional/uk-embedded.md`. Optional `node doctor.mjs` already exists. |
| S02 Evidence | `candidate/evidence/**` YAML graph | Typed markdown/YAML under `documents/` + `config/cv-facts.json` + intake. Parser may be a small `*.mjs` if YAML validation is needed. |
| S03 Taxonomy | `uk-embedded/taxonomy/*.yml` | Declarative YAML, but live under `modes/regional/` or `config/` (register path). Keep independent of the candidate. |
| S04 UK market | `search/tracks.yml` etc. | `config/profile.yml` + `portals.yml` + regional mode. Add SC/DV, IR35, Skilled Worker, commute as **config fields**, not source. |
| S05 Discovery | new discovery engine | Reuse `scan.mjs` + `providers/`. Add UK providers or `plugins.local`. Do not scrape LinkedIn in core. |
| S06 Normalize/dedup | new canonical job + dedup | Reuse `Job` + `url-key.mjs` + `dedup-tracker.mjs`. Enrich missing fields in reports, not a second job store. |
| S07 Hard filters | new evaluator | Extend `portals.yml` title/content filters + profile work-auth + blacklist. Add clearance/IR35 as deterministic pre-LLM gates. |
| S08 Technical fit | 0–100 deterministic scorer | Keep LLM Block B. Optional **deterministic pre-rank** on structured requirements only; do not replace `_shared.md`. |
| S09 Gaps | new transferability module | Specialize `jd-skill-gap.mjs` / `upskill.mjs` + regional taxonomy. Never promote transfer into claimed experience. |
| S10 Interview probability | new score | Heuristic overlay on the 1–5 global score + hard-filter residual. Do not claim calibration until S21. |
| S11 ROI | new evaluator | Priority sort using existing score + estimated effort. Config weights in profile, not a new engine. |
| S12 Company research | new adapter | Reuse `modes/deep.md` + `contacto.md`. |
| S13 Evidence retrieval | new retriever | Select from the S02 store into the existing PDF/cover prompts. |
| S14 CV | Mads-style generator | **Still a required slice.** Start from `generate-pdf.mjs` + `modes/pdf.md` + `verify-cv-facts.mjs`, but feed **S02 evidence**, keep ChatGPT’s no-invention tests, and import Mads honesty rules. Vanilla career-ops CV output is not the definition of done. |
| S15 Cover letter | new generator | **Still a required slice.** Start from `generate-cover-letter.mjs` + `modes/cover.md` + existing `assertFacts`. Must stay specific, evidence-backed, company-researched, and fail if it claims a technology not in evidence. |
| S16 Independent review | new reviewer | **Still a required slice.** career-ops `hm-audit` is opt-in — ChatGPT requires it as a blocking stage with planted-defect tests (invented tech, irrelevant project, missing mandatory requirement). Make that the default for UK Embedded applications. |
| S17 ATS/PDF | new validator | **Still a required slice.** career-ops fact-gate runs on HTML; Mads/`pdftotext` checks the **compiled PDF text layer**. S17 is not done until ChatGPT’s fixtures pass: valid PDF, image-only fail, missing name fail, truthful keywords present, layout/blank-page checks. |
| S18 Tracking | new state machine | Reuse `data/applications.md` + `templates/states.yml`. Map extra states via aliases if needed; do not create `applications/active/`. |
| S19 Interview prep | new generator | Reuse `modes/interview-prep.md` + `interview/`. |
| S20 Outcomes | new schema | Reuse `outcome.mjs` + `data/outcomes/`. |
| S21 Calibration | new learner | Reuse `analyze-patterns.mjs` + `config/benchmarks.yml`. Advisory only. Never let tests write here. |
| S22 Orchestration | new orchestrator | Reuse `auto-pipeline.md` / `pipeline.md` / `batch/`. Stop at human submit (already the rule). |

## 4. Real gaps (worth building)

These are the slices that are **not** already career-ops, for a UK Embedded search:

1. **S02** — structured evidence with provenance (so CVs cannot invent Yocto).
2. **S03** — Embedded/IoT taxonomy (Yocto ≠ Buildroot ≠ “Linux”).
3. **S04/S07** — UK constraints: Skilled Worker, SC/DV, UK nationality, ITAR,
   IR35, Cheltenham–Bristol–Cambridge geography.
4. **S05** — UK-relevant sources. Public ATS coverage is US/EU-startup heavy.
   Reed/Indeed/CWJobs/company career pages matter more for Embedded.
5. **S08/S09** — taxonomy-aware fit and transferability **on top of** Block B.
6. **S11** — effort-aware queue (interviews per hour).
7. **S14–S17** — document pipeline at Mads/ChatGPT quality, not vanilla
   career-ops output. See §5. Reuse the *engines*; keep the *acceptance tests*.

Discovery, ranking, and UK filters are configuration/adapters on career-ops.
CV, cover letter, independent review, and ATS validation are **not** skipped
just because career-ops already generates PDFs.

## 5. ChatGPT / Mads document-quality bars (non-negotiable)

ChatGPT’s instruction for S14 was: adapt the **strongest** of career-ops *and*
Mads `ai-job-search`. That is not “use career-ops and ignore Mads.”

Mads is stronger at the **application-document loop**. Those capabilities must
exist in the finished system, even if the files live in career-ops:

| ChatGPT / Mads bar | career-ops today | What we still must do |
| --- | --- | --- |
| CV from verified evidence, not model memory | Reads `cv.md`; no typed evidence graph | S02 + S13 + S14: every bullet traceable to evidence |
| Never invent experience / metrics / tech / seniority | `verify-cv-facts.mjs` on HTML; `jd-skill-gap.mjs` before draft | Keep as a **hard gate**. Add ChatGPT’s test: absent tech may appear in gaps, never as experience |
| Tailor: reorder, emphasise, select projects | `modes/pdf.md` already does this | Keep; drive selection from S13 evidence, not free-form memory |
| Cover letter: specific problem + evidence + company, no generic praise | `modes/cover.md` + company WebSearch + `assertFacts` | Keep ChatGPT S15 tests; reject unsupported technology claims |
| Independent reviewer that must not rubber-stamp | `modes/pdf/hm-audit.md` **opt-in** | Make default for this system. Planted-defect fixtures must catch invented tech, irrelevant project, missing mandatory requirement. Blocking issues stop finalization |
| ATS: PDF text layer, not the pretty HTML | Fact-gate on HTML; `pdftotext` in visual **tests**, not every application | S17 hard gate on the compiled PDF: text layer exists, name/contact/headings present, image-only PDF fails, truthful keywords present, no blank/corrupt pages |
| Honesty: unsupported JD keyword stays a gap, never stuffed | `modes/pdf.md` Step 4 already forbids stuffing `gap` skills | Preserve and test. This is the Mads rule ChatGPT cared about |
| Failed validation blocks “ready to apply” | Fact-gate blocks PDF; page overflow is often a warning | ChatGPT S17: failed ATS/review → not ready_for_submission |

Do **not** port from Mads:

- a second Claude-Code skill tree
- a second tracker
- a second PDF toolchain **as a default** (career-ops already has HTML+Playwright *and* LaTeX). If the HTML path fails S17 text-layer fixtures, use or tighten the existing LaTeX path rather than importing Mads’ whole `/apply` tree.

## 6. Test vs training isolation

Later slices will add tests. Those tests must not become calibration data.

| Safe | Forbidden as test I/O |
| --- | --- |
| `tests/` | `data/applications.md` |
| `tests/uk-embedded/` (if added, register in SYSTEM_PATHS) | `data/outcomes/` |
| `test-fixtures/` (fictional) | `data/scan-history.tsv` |
| `os.tmpdir()` / `mkdtempSync` | `config/benchmarks.yml` |
| `seed-fixture.mjs` | `evals/` golden files (unless an explicit eval-update slice) |
| `CAREER_OPS_*` env pointing at a temp root | live `reports/` |

S21 may **read** fixture outcomes. It must not append them to the user’s
outcome log, and it must not silently rewrite `modes/_shared.md` or
`config/profile.yml` scoring weights.

## 7. Recommended execution after S00

Keep the slice IDs so the plan stays traceable, but implement against this
map, not the invented directory tree.

Next: **S01** as a specialization boundary that uses career-ops native
surfaces, not a parallel framework.
