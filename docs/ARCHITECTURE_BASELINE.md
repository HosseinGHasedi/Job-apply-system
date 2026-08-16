# Architecture Baseline — career-ops 1.26.0

> Slice **S00** inspection record. No specialization was implemented in this
> slice. Inspected on 2026-08-16 from a shallow clone of
> `https://github.com/santifer/career-ops` at version `1.26.0`.

## 1. What career-ops actually is

career-ops is **not** a Python/TypeScript library of evaluators.

It is a **local-first, AI-agnostic, human-in-the-loop job-search command
center**:

| Layer | What it is | Where it lives |
| --- | --- | --- |
| Agent brain | Markdown skill/prompt files executed by an AI coding CLI | `modes/*.md`, `AGENTS.md` |
| Zero-token tools | Plain Node ESM scripts (`*.mjs`) | repository root, `providers/`, `lib/` |
| User data | Git-diffable files the updater never touches | `cv.md`, `config/profile.yml`, `data/`, `reports/`, … |
| Derived index | SQLite rebuilt from files; never canonical | `data/applications.db` |
| Optional UI | Go TUI + web dashboard | `dashboard/`, `web/` |

Design principles (from upstream `ARCHITECTURE.md`):

1. Local-first.
2. AI-agnostic (Claude Code, Codex, OpenCode, Cursor, Grok, Qwen, …).
3. Human-in-the-loop — the tool **never submits applications**.

The planned `uk-embedded/` Python-style package in `Implementation_Slices.md`
does **not** match this architecture. See
[`UPSTREAM_EXTENSION_MAP.md`](UPSTREAM_EXTENSION_MAP.md).

## 2. Repository structure (inspected)

Relevant top-level areas:

```text
career-ops/
├── AGENTS.md, CLAUDE.md, CODEX.md, …   CLI entry / agent instructions
├── modes/                              scoring, eval, apply, scan, cover, …
│   ├── _shared.md                      scoring core (system, auto-updated)
│   ├── _profile.md / _custom.md        user overlays (never auto-updated)
│   ├── oferta.md                       A–G evaluation
│   ├── auto-pipeline.md / pipeline.md  orchestration
│   ├── pdf.md / cover.md / apply.md
│   ├── deep.md / contacto.md / email.md
│   ├── interview-prep.md / interview/
│   ├── outcome.md / patterns.md / upskill.md
│   └── regional/eu-swe.md              only regional mode today (UK is a note)
├── providers/                          zero-token job-source modules
├── plugins/ / plugins.local/           opt-in integrations (keys, ingest)
├── config/
│   ├── profile.example.yml
│   ├── cv-facts.example.json
│   └── plugins.example.yml
├── templates/                          CV HTML, portals.example.yml, states.yml
├── data/                               tracker, pipeline inbox, outcomes (user)
├── reports/                            evaluation reports (user)
├── documents/                          intake sources: master CV, LinkedIn, …
├── interview-prep/                     STAR bank + per-company prep (user)
├── scan.mjs, generate-pdf.mjs, …
├── tracker.mjs, dedup-tracker.mjs, outcome.mjs, analyze-patterns.mjs
├── verify-cv-facts.mjs
├── test-all.mjs, tests/, test-fixtures/
├── DATA_CONTRACT.md                    system vs user file boundary
└── update-system.mjs                   SYSTEM_PATHS / USER_PATHS enforcer
```

The flat root (~70 `*.mjs` scripts) is intentional. Upstream will not reorganize
it; forks that invent a new top-level package fight the updater.

## 3. CLI entry points

There is no single `uk-embedded` CLI. Entry is:

| Interface | How |
| --- | --- |
| AI coding CLI | Open this directory; agent reads `AGENTS.md` + `modes/` |
| Slash / skills | `/career-ops scan`, `/career-ops pipeline`, `/career-ops pdf`, `/career-ops cover`, `/career-ops apply`, `/career-ops tracker`, … |
| npm scripts | `npm run scan`, `npm run pdf`, `npm run tracker`, … (see `package.json`) |
| Direct node | `node scan.mjs`, `node generate-pdf.mjs`, `node verify-cv-facts.mjs` |
| Doctor | `npm run doctor` / `node doctor.mjs` |
| Docker wrapper | `./cops <command>` |
| Dashboard | `npm run serve:dashboard` (Go TUI; optional) |

First-run onboarding is conversational (CV, profile, target roles), not a
custom installer for a specialization layer.

## 4. Configuration

| File | Layer | Role |
| --- | --- | --- |
| `config/profile.yml` | user | identity, target roles, compensation, location, visa/work-auth |
| `modes/_profile.md` | user | archetypes, narrative, negotiation |
| `modes/_custom.md` | user | house rules / persistent instructions (not factual claims) |
| `modes/_brief.md` | user | compact profile for two-pass triage |
| `portals.yml` | user | title filters, search queries, tracked companies |
| `config/cv-facts.json` | user | fact-check allowlist + forbidden phrases |
| `config/plugins.yml` | user | opt-in plugins |
| `voice-dna.md` | user | writing-style guardrail |
| `data/blacklist.md` | user | do-not-apply companies |
| `templates/states.yml` | system | canonical tracker states |

Personal facts must stay in the user layer. They must not be hard-coded into
`modes/_shared.md` or `*.mjs` system files.

## 5. Job model

Scanner contract (`providers/_types.js`):

```text
Job {
  title        required
  url          required, absolute; used as the scan-level dedup key
  company      may be empty
  location     may be empty
  description  optional; only if the list payload already has it (zero-token)
  postedAt     optional epoch ms
  trustScore / trustFlags / trustLevel   optional
}
```

This is thinner than the canonical job proposed in S06 (`work_mode`,
`employment_type`, `salary`, `requirements`, `desirable`, `closing_at`,
`provider`). Those fields appear later in evaluation reports, not in the
scanner object.

Dedup today:

- Scan: URL key (`url-key.mjs`)
- Tracker: `dedup-tracker.mjs`
- Cross-listing: SimHash JD fingerprint in `data/scan-history.tsv`
- Similarity: `jd-similarity.mjs`

## 6. Provider model

- Filesystem convention: every `providers/*.mjs` not starting with `_` is a
  provider (`providers/_registry.mjs`).
- Contract: `{ id, detect?(entry), fetch(entry, ctx) → Job[] }`.
- Sources are **open, no-auth** ATS/RSS/HTML boards (Greenhouse, Ashby, Lever,
  Workday, Teamtailor, BambooHR, …).
- Auth-gated boards (LinkedIn login, Indeed session, Reed account) are
  **out of core**. They belong in `plugins/` / `plugins.local/`.
- A community plugin already exists for LinkedIn **alert email ingest**, not
  LinkedIn scraping.
- There is **no** Reed, Indeed, CWJobs, Totaljobs, or JobServe provider.

`portals.yml` `tracked_companies` entries route by explicit `provider:` or
`detect()` on `careers_url`.

## 7. Candidate / profile model

Sources of truth for claims (`modes/_shared.md`):

| File | Use |
| --- | --- |
| `cv.md` | always |
| `article-digest.md` | proof points; wins over `cv.md` for article metrics |
| `config/profile.yml` | identity and targets |
| `modes/_profile.md` | archetypes / narrative |
| `documents/` | intake sources (master CV, LinkedIn export, diplomas) via `intake.mjs` |
| `config/cv-facts.json` | fact-check allowlist |
| `interview-prep/story-bank.md` | STAR stories |

There is **no** structured evidence graph
(`candidate/evidence/projects|technologies|achievements`). Capability is
markdown + YAML + a fact-allowlist. That is the real S02 gap.

## 8. Scoring

Evaluation is **LLM reasoning**, not a deterministic 0–100 formula.

- Blocks A–F in `modes/oferta.md`; scoring rules in `modes/_shared.md`.
- Five dimensions + a **holistic** global 1.0–5.0 score (explicitly *not*
  an arithmetic mean).
- Block G is posting-legitimacy and **does not** affect the 1–5 score.
- Work-authorization: explicit no-sponsorship in the JD is a hard blocker
  when `config/profile.yml` says the candidate needs sponsorship.
- Standalone evaluators: `gemini-eval.mjs`, `ollama-eval.mjs`,
  `openai-eval.mjs`.
- Golden evals: `eval-golden.mjs` + `evals/`.
- Skill-gap script: `jd-skill-gap.mjs` / `upskill.mjs`.

S08–S11 (technical fit, transferability, interview probability, ROI) would
**duplicate** this unless they are implemented as:

1. deterministic *pre-filters* before the LLM eval, and/or
2. specialization of `_custom.md` / a new `modes/regional/uk-embedded.md`,
   without replacing `_shared.md`.

## 9. Application generation

Already present:

| Artifact | Mechanism |
| --- | --- |
| Tailored CV PDF | `generate-pdf.mjs` (HTML + Playwright), `modes/pdf.md` |
| LaTeX CV | `generate-latex.mjs` / `build-cv-latex.mjs` |
| Cover letter | `generate-cover-letter.mjs`, `modes/cover.md` |
| Application form drafts | `modes/apply.md`, `application-answers.mjs` |
| Email drafts | `modes/email.md` (never sends) |
| Fact gate | `verify-cv-facts.mjs` — generated claims must be in source files |
| Hiring-manager audit | `modes/pdf/hm-audit.md` (opt-in adversarial CV review) |

Mads `ai-job-search` ideas worth **porting as prompts/checks**, not as a
second pipeline: independent reviewer fixtures, LaTeX compile loop, ATS
`pdftotext` keyword honesty. career-ops already has the fact gate and an
optional HM audit.

## 10. ATS / PDF / browser

- PDF: Playwright Chromium HTML→PDF; ATS-safe single-column templates.
- Visual regression: `npm run test:cv-visual` (Playwright).
- JD extraction: `browser-extract.mjs`, liveness checks `check-liveness.mjs`.
- Playwright Chromium install on this machine **failed** during `npm install`
  (`playwright install chromium --with-deps` required sudo). Baseline tests
  were therefore run with `--quick` after `npm install --ignore-scripts`.
  PDF generation is **not** verified on this host until Chromium is installed
  without `--with-deps`, or deps are installed with user approval.

## 11. Persistence

Canonical files, not a primary database:

| File | Role |
| --- | --- |
| `data/pipeline.md` | URL inbox from scan |
| `data/applications.md` | tracker source of truth |
| `data/applications.db` | derived SQLite index |
| `reports/{NNN}-{company}-{date}.md` | full evaluation |
| `data/outcomes/*` | outcome logs (`outcome.mjs`) |
| `data/scan-history.tsv` | append-only scan history |
| `output/` | generated PDFs |
| `jds/` | saved job descriptions |
| `data/status-log.tsv` | append-only status transitions |

Canonical states (`templates/states.yml`):

```text
evaluated → applied → responded → interview → offer
terminal: rejected | discarded | skip | hired
```

This is **not** the S18 state machine (`discovered`, `qualified`,
`shortlisted`, `drafting`, `ready_for_review`, `approved`, `submitted`, …).
Tracking already exists; do not invent a parallel store.

## 12. Tests

| Command | Meaning |
| --- | --- |
| `node test-all.mjs` | full suite (500+ checks) |
| `node test-all.mjs --quick` | skip dashboard build |
| `node test-all.mjs --only <substring>` | **only** `tests/**/*.test.mjs` matches; **not** a green suite |
| `node updater-migration-tests.mjs` | system/user path boundary |
| `node verify-cv-facts.mjs --self-test` | fact-gate unit tests |
| `npm run eval:golden` | scoring golden evals |

Provider tests: `tests/providers/{name}.test.mjs` (auto-discovered).

Upgrade fixtures: `test-fixtures/` + `seed-fixture.mjs` — **fictional** data,
system layer, never user data.

## 13. Extension points (summary)

Preferred, in order:

1. **User layer** — `modes/_custom.md`, `_profile.md`, `config/profile.yml`,
   `portals.yml`, `config/cv-facts.json`, `documents/`.
2. **Regional mode** — `modes/regional/` (already a system path).
3. **Provider module** — `providers/<board>.mjs` for no-auth UK sources.
4. **Local plugin** — `plugins.local/` for anything needing keys or login.
5. **Prompt-only mode** — new `modes/*.md` only if an existing mode cannot
   carry the behaviour.
6. **Root `*.mjs`** — last resort; must be added to `SYSTEM_PATHS`.

Do **not** create a sibling `uk-embedded/` tree unless it is registered in
`update-system.mjs` and the coverage test still passes. That is a fork.

## 14. Files likely to need change (later slices, not S00)

Touch only after a slice proves the native extension point is insufficient.

| Area | Sensitive? | Notes |
| --- | --- | --- |
| `modes/_shared.md` | **yes** | scoring core; auto-updated; do not put personal data here |
| `modes/oferta.md` | **yes** | evaluation procedure |
| `update-system.mjs` | **yes** | any new tracked path must be listed |
| `scan.mjs` / `providers/_registry.mjs` | **yes** | only if the provider contract must change |
| `templates/states.yml` | **yes** | dashboard + tracker must stay in sync |
| `generate-pdf.mjs` / templates | medium | reuse before editing |
| `modes/regional/uk-embedded.md` | low | **add**, do not replace `eu-swe.md` |
| user files listed above | n/a | the intended specialization surface |

## 15. Upstream-sensitive files

Never casually edit:

- `DATA_CONTRACT.md`
- `update-system.mjs` (`SYSTEM_PATHS`, `USER_PATHS`)
- `validate-system-paths-coverage.mjs`
- `modes/_shared.md`
- `AGENTS.md` / `CLAUDE.md`
- `templates/states.yml`
- tracker writers (`tracker.mjs`, `merge-tracker.mjs`, `set-status.mjs`)

New tracked files that are not under an existing `SYSTEM_PATHS` /
`USER_PATHS` prefix **fail CI**.

## 16. Which planned slices already exist (partially or fully)

| Slice | Upstream status |
| --- | --- |
| S00 Baseline | this document |
| S01 Specialization boundary | **exists**: user vs system contract; `_custom.md`, `_profile.md`, `plugins.local/` |
| S02 Evidence model | **partial**: `cv.md` + `article-digest.md` + `cv-facts.json` + `documents/` + `intake.mjs`. No typed evidence graph |
| S03 Embedded/IoT taxonomy | **missing** |
| S04 UK market config | **partial**: `profile.yml` location/visa; `modes/regional/eu-swe.md` has a UK row; no UK Embedded config |
| S05 Discovery | **exists** for public ATS; **missing** UK boards (Reed/Indeed/CWJobs) and LinkedIn scrape (intentionally) |
| S06 Normalize/dedup | **exists** (thinner job object + URL/tracker dedup) |
| S07 Hard filters | **partial**: title filters, content_filter, work-auth blocker, blacklist. No SC/DV/IR35/defence filters |
| S08 Technical fit | **exists** as LLM Block B, not a deterministic scorer |
| S09 Transferability / gaps | **partial**: `jd-skill-gap.mjs`, `upskill.mjs`, Block B gaps |
| S10 Interview probability | **missing** as a named score; global 1–5 is the proxy |
| S11 Application ROI | **missing** as effort-aware ranking |
| S12 Company research | **exists**: `modes/deep.md`, `contacto.md` |
| S13 Evidence retrieval | **partial**: agent reads SoT files; no structured retriever |
| S14 CV | **exists** |
| S15 Cover letter | **exists** |
| S16 Independent review | **partial**: `modes/pdf/hm-audit.md` (opt-in) |
| S17 ATS/PDF validation | **exists**: fact gate + Playwright visual tests |
| S18 Tracking | **exists**: `data/applications.md` |
| S19 Interview prep | **exists**: `modes/interview-prep.md`, `interview/` |
| S20 Outcomes | **exists**: `modes/outcome.md`, `outcome.mjs`, `data/outcomes/` |
| S21 Learning/calibration | **partial**: `analyze-patterns.mjs`, `config/benchmarks.yml`, `eval-golden.mjs`. Advisory, not auto-weight updates |
| S22 Orchestration | **exists**: `auto-pipeline.md`, `pipeline.md`, `batch/` |

## 17. Baseline test record

Environment:

- Node `v24.15.0`
- npm `11.12.1`
- Install: `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --ignore-scripts`
- Playwright Chromium with OS deps: **not installed** (sudo required)
- Command: `node test-all.mjs --quick`
- Duration: 75.6s

Result:

```text
3935 passed, 0 failed, 2 warnings
```

The two warnings are environmental, not product defects:

1. `cv-sync-check.mjs exited with error (expected without user data)` — no `cv.md` yet.
2. `archive render skipped — no Playwright browser in env` — Chromium not installed.

This is **not** a BASELINE FAILURE. Scoring, tracker, providers, fact-gate, and
path-coverage tests are green on an unmodified 1.26.0 tree.

PDF visual tests (`npm run test:cv-visual`) were **not** run. They need
`npx playwright install chromium` (without `--with-deps` if sudo is unavailable).

## 18. Test isolation rule (applies to every later slice)

Automated tests must **never** write to the live user layer that calibration
reads:

```text
data/applications.md
data/outcomes/
data/scan-history.tsv
config/benchmarks.yml
evals/            (golden scoring — update only with an explicit eval slice)
```

Tests use `test-fixtures/`, `os.tmpdir()`, or `seed-fixture.mjs`.
`analyze-patterns.mjs` / S21 calibration must take an explicit data root
(or only run against fixtures). A green test suite must not change future
ranking, golden evals, or outcome statistics.
