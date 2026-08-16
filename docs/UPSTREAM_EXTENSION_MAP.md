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
| S14 CV | Mads-style generator | Reuse `generate-pdf.mjs` + `modes/pdf.md` + `verify-cv-facts.mjs`. |
| S15 Cover letter | new generator | Reuse `generate-cover-letter.mjs` + `modes/cover.md`. |
| S16 Independent review | new reviewer | Enable/extend `modes/pdf/hm-audit.md`; add flawed fixtures. |
| S17 ATS/PDF | new validator | Reuse fact gate + Playwright visual tests. |
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
7. **S16** — make adversarial review default for generated CVs, with fixtures.

Everything else should be configuration, prompts, or thin adapters.

## 5. What not to copy from Mads `ai-job-search`

Port **ideas**:

- independent reviewer that must catch planted defects
- ATS text-layer honesty (`pdftotext`)
- “keyword the profile doesn’t support stays a gap”

Do **not** port:

- a second Claude-Code skill tree
- a second tracker
- a second PDF toolchain as the default (career-ops already has HTML+Playwright and LaTeX)

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
