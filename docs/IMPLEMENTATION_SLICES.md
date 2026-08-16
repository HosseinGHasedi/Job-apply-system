# UK Embedded/IoT AI Job Search — Implementation Slices

> **Purpose:** Incrementally transform `career-ops` into a UK-focused Embedded/IoT job-search system without unnecessarily modifying its upstream core.
>
> **Primary execution environment:** Cursor + Claude Code or another coding agent.
>
> **Core principle:** Build one independently testable vertical slice at a time. Every slice must leave the repository in a working state and should be independently commit-able.

---

## 0. System Goal

Build a personal AI-assisted job-search system optimized for:

- UK job market
- Embedded Software
- Embedded Linux
- IoT
- Edge Computing
- Firmware
- Device Software
- Systems Software
- Embedded/Edge Computer Vision
- Technical Lead / Senior Embedded roles

The system should optimize for:

> **interviews per hour of candidate effort**

rather than:

> number of applications submitted.

The system should:

1. Discover jobs.
2. Remove duplicates.
3. Apply hard eligibility filters.
4. Understand Embedded/IoT technical requirements.
5. Compare requirements against verified candidate evidence.
6. Identify transferable skills and learning gaps.
7. Estimate interview probability.
8. Estimate application effort and ROI.
9. Research promising companies.
10. Generate a tailored application.
11. Independently review the application.
12. Validate ATS/PDF output.
13. Track applications.
14. Track outcomes.
15. Learn from historical outcomes.
16. Improve future ranking.

The system **must not autonomously submit job applications**.

---

# 1. Architectural Principles

## 1.1 Preserve upstream compatibility

`career-ops` is the underlying job-search engine.

Do not rewrite its core unless there is no viable extension point.

Prefer:

```text
career-ops core
      +
adapters
      +
configuration
      +
specialization layer
```

over:

```text
career-ops
      ↓
large custom fork
      ↓
permanent divergence
```

The goal is to make future upstream updates reasonably easy to merge.

---

## 1.2 Separate generic functionality from personal data

Generic system logic:

```text
uk-embedded/
search/
applications/
```

Candidate-specific information:

```text
candidate/
outcomes/
```

Do not hard-code personal facts into Python/TypeScript source code.

---

## 1.3 Evidence over assertions

The system must distinguish:

```text
Known evidence
Transferable capability
Probable capability
Learning exposure
Unknown
```

Never convert:

```text
"worked with Linux"
```

into:

```text
"Yocto expert"
```

unless there is actual evidence.

---

## 1.4 Human-in-the-loop

AI may:

- discover
- rank
- research
- draft
- review
- prepare
- recommend

The user must retain final control over:

- application submission
- legal/work-authorisation declarations
- salary declarations
- security-clearance answers
- personal information
- factual corrections

---

## 1.5 Small vertical slices

Every slice must have:

- clear input
- clear output
- limited scope
- tests
- acceptance criteria
- definition of done

Do not implement future slices early merely because their code seems convenient.

---

# 2. Target Repository Structure

The exact existing `career-ops` structure must be inspected during **S00**.

The following is the target specialization structure. Adapt paths if the upstream repository already has an equivalent mechanism.

```text
career-ops/
│
├── docs/
│   └── IMPLEMENTATION_SLICES.md
│
├── uk-embedded/
│   ├── config/
│   │   ├── profile.yml
│   │   ├── scoring.yml
│   │   ├── filters.yml
│   │   └── market.yml
│   │
│   ├── taxonomy/
│   │   ├── roles.yml
│   │   ├── technologies.yml
│   │   ├── domains.yml
│   │   └── relationships.yml
│   │
│   ├── evaluators/
│   │   ├── technical_fit.*
│   │   ├── transferability.*
│   │   ├── gaps.*
│   │   ├── interview_probability.*
│   │   └── roi.*
│   │
│   ├── adapters/
│   │   ├── jobs.*
│   │   └── companies.*
│   │
│   └── prompts/
│       ├── technical_fit.*
│       ├── gap_analysis.*
│       ├── evidence_retrieval.*
│       └── recruiter_review.*
│
├── candidate/
│   ├── profile.md
│   ├── goals.md
│   ├── constraints.md
│   ├── evidence/
│   │   ├── projects/
│   │   ├── technologies/
│   │   ├── achievements/
│   │   └── responsibilities/
│   └── cv/
│
├── search/
│   ├── tracks.yml
│   ├── queries.yml
│   ├── exclusions.yml
│   └── jobs/
│
├── applications/
│   ├── active/
│   ├── submitted/
│   ├── rejected/
│   └── templates/
│
├── outcomes/
│   ├── interviews/
│   ├── rejections/
│   └── calibration/
│
└── tests/
    └── uk-embedded/
```

**Important:** Do not create duplicate infrastructure if `career-ops` already provides it.

---

# 3. Dependency Graph

```text
S00 Baseline
 │
 ▼
S01 Specialization Boundary
 │
 ├──────────────┐
 ▼              ▼
S02 Evidence   S03 Taxonomy
 │              │
 └──────┬───────┘
        ▼
S04 UK Market
        │
        ▼
S05 Discovery
        │
        ▼
S06 Normalize/Deduplicate
        │
        ▼
S07 Hard Filters
        │
        ├───────────────┐
        ▼               ▼
S08 Technical Fit    S12 Company Research
        │
        ▼
S09 Transferability
        │
        ▼
S10 Interview Probability
        │
        ▼
S11 Application ROI
        │
        ├───────────────┐
        ▼               ▼
S13 Evidence Retrieval S18 Tracking
        │
        ▼
S14 CV
        │
        ▼
S15 Cover Letter
        │
        ▼
S16 Application Review
        │
        ▼
S17 ATS/PDF Validation
        │
        ▼
S19 Interview Preparation
        │
        ▼
S20 Outcome Collection
        │
        ▼
S21 Learning/Calibration
        │
        ▼
S22 Orchestration
```

---

# 4. Recommended Execution Order

Implement in exactly this order initially:

```text
S00
S01
S02
S03
S04
S05
S06
S07
S08
S09
S10
S11
S12
S13
S14
S15
S16
S17
S18
S19
S20
S21
S22
```

Do not skip S00.

The actual `career-ops` version may make some dependencies unnecessary or allow two slices to be parallelized later. That decision must be made only after repository inspection.

---

# 5. Global Cursor Rules

Every Cursor task generated from this document must follow these rules.

```text
1. Read this slice completely before changing code.
2. Inspect the existing implementation before creating new files.
3. Reuse existing career-ops functionality whenever possible.
4. Do not invent APIs that do not exist.
5. Do not modify upstream core without explaining why.
6. Keep specialization code isolated.
7. Add tests before declaring the slice complete.
8. Do not implement future slices.
9. Do not delete existing functionality without an explicit reason.
10. Do not submit applications automatically.
11. Never fabricate candidate experience, metrics, employers, technologies, certifications, or achievements.
12. Preserve source provenance for candidate evidence.
13. Run relevant tests after changes.
14. Report changed files and test results.
15. Make one logical commit per completed slice.
```

---

# 6. Slice S00 — Inspect and Baseline `career-ops`

## Objective

Understand the actual repository before modifying it.

## Why

The implementation must be based on the current repository rather than assumptions about its structure.

## Dependencies

None.

## Inputs

- Current `career-ops` repository.
- This document.

## Outputs

```text
docs/ARCHITECTURE_BASELINE.md
docs/UPSTREAM_EXTENSION_MAP.md
```

## Files

Create:

```text
docs/ARCHITECTURE_BASELINE.md
docs/UPSTREAM_EXTENSION_MAP.md
```

Do not modify application code unless required to run baseline tests.

## Implementation

1. Inspect repository structure.
2. Identify:
   - CLI entry points.
   - configuration.
   - job providers.
   - job models.
   - scoring.
   - persistence.
   - application generation.
   - ATS functionality.
   - browser functionality.
   - tests.
3. Identify extension points.
4. Identify existing candidate/profile representations.
5. Identify existing application pipeline.
6. Identify provider abstractions.
7. Identify existing prompts/skills.
8. Run the existing test suite.
9. Record the exact baseline.
10. Identify which planned slices already exist partially.

## Acceptance Criteria

- [ ] Repository structure documented.
- [ ] Existing test command documented.
- [ ] Job model identified.
- [ ] Provider model identified.
- [ ] Candidate/profile model identified.
- [ ] Application-generation mechanism identified.
- [ ] Persistence mechanism identified.
- [ ] Extension points identified.
- [ ] Files likely to require modification documented.
- [ ] Upstream-sensitive files documented.

## Acceptance Tests

Run the repository's existing test command.

Expected:

```text
Existing tests pass
```

If tests fail before modification:

```text
BASELINE FAILURE
```

must be recorded rather than silently fixing unrelated problems.

## Definition of Done

Baseline is reproducible and documented.

## Cursor Task

> Inspect the existing `career-ops` repository without implementing the new system. Map its architecture, extension points, job models, providers, scoring, candidate/profile handling, application generation, ATS validation, persistence, CLI and tests. Run the existing tests. Create `docs/ARCHITECTURE_BASELINE.md` and `docs/UPSTREAM_EXTENSION_MAP.md`. Do not make speculative architectural changes.

---

# 7. Slice S01 — Create the Specialization Boundary

## Objective

Create a clean boundary between upstream `career-ops` and UK Embedded/IoT functionality.

## Dependencies

S00.

## Files

Target:

```text
uk-embedded/
uk-embedded/config/
uk-embedded/taxonomy/
uk-embedded/evaluators/
uk-embedded/adapters/
uk-embedded/prompts/
```

Adapt to the actual repository language and conventions discovered in S00.

## Implementation

1. Create specialization namespace/module.
2. Add minimal configuration loading.
3. Add a health/self-test command if compatible with the existing CLI.
4. Do not implement scoring yet.
5. Add documentation explaining upstream/custom boundaries.

## Acceptance Criteria

- [ ] Specialization code is isolated.
- [ ] Existing career-ops tests still pass.
- [ ] Specialization module can be imported/loaded.
- [ ] Configuration loading works.
- [ ] No candidate-specific data is embedded in source code.

## Acceptance Test

Run:

```text
existing career-ops tests
specialization unit tests
```

Verify specialization can load an empty/default configuration.

## Definition of Done

A future developer can identify exactly which code belongs to upstream and which belongs to the UK Embedded/IoT layer.

## Cursor Task

> Implement only the UK Embedded/IoT specialization boundary identified in S00. Create the smallest compatible namespace/module and configuration-loading mechanism. Do not implement job scoring or discovery. Preserve upstream behavior and add tests.

---

# 8. Slice S02 — Candidate Evidence Model

## Objective

Represent the candidate as a structured evidence base rather than a flat skills list.

## Dependencies

S01.

## Files

```text
candidate/profile.md
candidate/goals.md
candidate/constraints.md
candidate/evidence/
candidate/evidence/projects/
candidate/evidence/technologies/
candidate/evidence/achievements/
candidate/evidence/responsibilities/
```

Add schema documentation:

```text
candidate/EVIDENCE_SCHEMA.md
```

## Evidence Model

Each evidence record should support:

```yaml
id:
type:
title:
description:
technologies:
domain:
strength:
years:
production:
source:
confidence:
related_evidence:
```

Possible confidence:

```text
verified
strong
probable
weak
unknown
```

## Implementation

1. Define schema.
2. Create sample/non-sensitive fixture data.
3. Add parser/validator.
4. Validate required fields.
5. Reject malformed evidence.
6. Preserve provenance.
7. Prevent unsupported claims.

## Acceptance Criteria

- [ ] Evidence schema documented.
- [ ] Evidence can be loaded.
- [ ] Invalid records are rejected.
- [ ] Evidence has provenance.
- [ ] Technology records can reference projects.
- [ ] Project records can reference technologies.

## Acceptance Tests

Test:

```text
valid evidence → accepted
missing ID → rejected
invalid confidence → rejected
unknown technology → accepted as unknown, not promoted to expertise
```

## Definition of Done

The system can represent candidate capability using evidence instead of relying on a generated CV as the source of truth.

## Cursor Task

> Implement the candidate evidence model. Inspect existing profile mechanisms first and integrate rather than duplicate them. Add schema validation and fixtures. Do not infer missing experience. Every claim must have a source/provenance field.

---

# 9. Slice S03 — Embedded/IoT Taxonomy

## Objective

Teach the system how Embedded/IoT roles and technologies relate.

## Dependencies

S02.

## Files

```text
uk-embedded/taxonomy/roles.yml
uk-embedded/taxonomy/technologies.yml
uk-embedded/taxonomy/domains.yml
uk-embedded/taxonomy/relationships.yml
tests/uk-embedded/test_taxonomy.*
```

## Initial Role Families

```text
embedded-software
embedded-linux
firmware
iot
edge-computing
device-software
systems-software
connectivity
embedded-ai
technical-lead
```

## Technology Families

```text
Embedded C
C++
Python
Linux
Linux kernel
device drivers
systemd
Yocto
Buildroot
RTOS
MQTT
Zigbee
BLE
LTE
I2C
SPI
UART
CAN
FPGA
Docker
Azure IoT
AWS IoT
networking
computer vision
```

## Relationships

Support:

```text
Yocto → Embedded Linux
MQTT → IoT
Zigbee → IoT/Connectivity
Azure IoT → Cloud IoT
I2C → Embedded Hardware
Linux kernel → Embedded Linux
```

Do not treat related technologies as identical.

## Acceptance Criteria

- [ ] Role taxonomy loads.
- [ ] Technology taxonomy loads.
- [ ] Relationships are directional.
- [ ] Synonyms can be represented.
- [ ] Related technologies are not automatically considered equivalent.

## Acceptance Tests

Example:

```text
MQTT → strong IoT relevance
MQTT → NOT equivalent to Zigbee
Yocto → Embedded Linux relevance
Yocto → NOT equivalent to Buildroot
```

## Definition of Done

The evaluator can reason about technical relationships without conflating technologies.

## Cursor Task

> Build the Embedded/IoT taxonomy using declarative data files. Keep the taxonomy independent of the candidate. Add tests for relationships and non-equivalence. Do not add candidate skill levels in this slice.

---

# 10. Slice S04 — UK Market Configuration

## Objective

Represent UK-specific job-search constraints and terminology.

## Dependencies

S01, S03.

## Files

```text
uk-embedded/config/market.yml
uk-embedded/config/filters.yml
uk-embedded/config/profile.yml
search/tracks.yml
search/queries.yml
search/exclusions.yml
```

## Configuration

Support:

```text
country: UK

locations:
  - Cheltenham
  - Gloucester
  - Bristol
  - Swindon
  - Oxford
  - Birmingham
  - Reading
  - Cambridge
  - London
  - Remote UK

work_modes:
  - onsite
  - hybrid
  - remote

job_types:
  - permanent
  - contract
```

Do not hard-code personal salary or visa information in source code.

## Implementation

Create configurable fields for:

- geographic preferences
- commute constraints
- work mode
- salary preferences
- work-authorisation requirements
- role preferences
- excluded roles

## Acceptance Criteria

- [ ] UK configuration loads.
- [ ] Location preferences configurable.
- [ ] Work mode configurable.
- [ ] Filters configurable.
- [ ] No UK assumptions embedded in generic scoring code.

## Acceptance Test

Change a configuration value and verify behavior changes without source-code modification.

## Definition of Done

The system can represent UK search preferences entirely through configuration.

## Cursor Task

> Implement UK market configuration as data/configuration. Do not encode personal preferences directly into evaluator logic. Add validation and tests for configuration loading.

---

# 11. Slice S05 — Job Discovery

## Objective

Connect existing `career-ops` discovery mechanisms to the specialization layer.

## Dependencies

S04.

## Files

Prefer adapters:

```text
uk-embedded/adapters/jobs.*
search/discovery.*
tests/uk-embedded/test_discovery.*
```

Only modify upstream providers when the existing extension mechanism cannot support the integration.

## Implementation

1. Inspect existing providers.
2. Reuse existing providers.
3. Add UK-specific search queries.
4. Add company-career discovery where supported.
5. Preserve source URL.
6. Preserve provider/source metadata.
7. Never fabricate jobs.

## Acceptance Criteria

- [ ] At least one real provider works through the existing infrastructure.
- [ ] Search configuration controls discovery.
- [ ] Every job retains source URL.
- [ ] Provider failures are isolated.
- [ ] Duplicate providers do not crash the pipeline.

## Acceptance Tests

Fixture:

```text
source → raw jobs → normalized job objects
```

Test:

```text
provider failure → other providers continue
missing URL → job rejected or quarantined
valid job → retained
```

## Definition of Done

The system can discover UK jobs using existing infrastructure without duplicating provider implementations.

## Cursor Task

> Integrate UK search configuration with existing career-ops discovery. Inspect and reuse provider abstractions. Do not build browser automation or new provider implementations unless required by an actual missing extension point.

---

# 12. Slice S06 — Job Normalization and Deduplication

## Objective

Turn jobs from different providers into comparable canonical records.

## Dependencies

S05.

## Files

```text
search/jobs/schema.*
search/jobs/normalize.*
search/jobs/deduplicate.*
tests/uk-embedded/test_job_normalization.*
```

## Canonical Job

Support:

```yaml
id:
title:
company:
location:
work_mode:
employment_type:
salary:
description:
requirements:
desirable:
source:
source_url:
posted_at:
closing_at:
provider:
```

## Deduplication

Use multiple signals:

```text
canonical URL
company + title + location
provider IDs
content similarity where available
```

Never deduplicate solely on title.

## Acceptance Criteria

- [ ] Different provider formats normalize to one model.
- [ ] URLs are canonicalized.
- [ ] Duplicate postings are merged.
- [ ] Source provenance retained.
- [ ] Conflicting fields do not silently overwrite information.

## Acceptance Tests

Create fixtures:

```text
same job from LinkedIn
same job from company portal
different jobs with same title
same company, different locations
```

Expected results are deterministic.

## Definition of Done

The evaluator operates on canonical jobs rather than provider-specific structures.

## Cursor Task

> Implement canonical job normalization and deterministic deduplication. Preserve source provenance and conflicting information. Add representative fixtures and tests. Do not implement scoring.

---

# 13. Slice S07 — Hard Eligibility Filters

## Objective

Remove jobs that should not reach expensive AI evaluation.

## Dependencies

S06, S04.

## Files

```text
uk-embedded/evaluators/hard_filters.*
uk-embedded/config/filters.yml
tests/uk-embedded/test_hard_filters.*
```

## Hard Filters

Examples:

```text
location impossible
work mode incompatible
employment type excluded
explicit no-sponsorship condition where relevant
clearly junior role
clearly unrelated domain
mandatory impossible requirement
```

Hard filters must distinguish:

```text
definitely incompatible
unknown
potentially compatible
```

Unknown must not automatically mean reject.

## Acceptance Criteria

- [ ] Filters are configuration-driven.
- [ ] Filter reasons are recorded.
- [ ] Unknown data does not cause unjustified rejection.
- [ ] Every rejected job has a machine-readable reason.

## Acceptance Test

Example:

```text
job A → rejected: incompatible work mode
job B → rejected: unrelated domain
job C → retained: unknown sponsorship status
job D → retained: technical evaluation required
```

## Definition of Done

Only plausible jobs reach expensive evaluation.

## Cursor Task

> Implement configurable hard filters with explicit reasons. Do not use an LLM for deterministic filters. Preserve unknown states and do not infer negative facts from missing information.

---

# 14. Slice S08 — Technical Fit Evaluator

## Objective

Measure how well the job's technical requirements match verified candidate evidence.

## Dependencies

S02, S03, S07.

## Files

```text
uk-embedded/evaluators/technical_fit.*
uk-embedded/prompts/technical_fit.*
uk-embedded/config/scoring.yml
tests/uk-embedded/test_technical_fit.*
```

## Score Components

```text
mandatory technical requirements
core technologies
domain experience
responsibility similarity
seniority
desirable technologies
```

Suggested initial output:

```yaml
technical_fit:
  score: 0-100
  mandatory_match:
  core_match:
  domain_match:
  responsibility_match:
  evidence_confidence:
  missing_requirements:
  supporting_evidence:
```

## Critical Rule

Do not equate:

```text
Linux experience
```

with:

```text
Yocto experience
```

Use taxonomy relationships only for transferability in S09.

## Acceptance Criteria

- [ ] Score is deterministic for identical structured inputs.
- [ ] Evidence is traceable.
- [ ] Missing requirements are explicit.
- [ ] Mandatory requirements can reduce score substantially.
- [ ] Related technologies are not treated as identical.

## Acceptance Tests

Create synthetic jobs with:

1. Strong Embedded/Linux match.
2. Strong IoT match.
3. Strong but unrelated backend match.
4. Major missing mandatory requirement.

Verify ranking is sensible and explainable.

## Definition of Done

A job receives an explainable technical-fit assessment.

## Cursor Task

> Implement technical-fit scoring using structured job requirements, candidate evidence and the Embedded/IoT taxonomy. Keep scoring explainable. If an LLM is used for requirement extraction, separate extraction from deterministic scoring.

---

# 15. Slice S09 — Transferability and Gap Analysis

## Objective

Distinguish genuine matches from learnable gaps.

## Dependencies

S08.

## Files

```text
uk-embedded/evaluators/transferability.*
uk-embedded/evaluators/gaps.*
uk-embedded/prompts/gap_analysis.*
tests/uk-embedded/test_transferability.*
```

## Gap Categories

```text
none
minor
learnable
moderate
major
critical
```

Example:

```text
Linux → Embedded Linux
```

may be a transferable capability.

But:

```text
Python → AUTOSAR
```

is not a reasonable direct equivalence.

## Output

```yaml
gaps:
  - technology:
    severity:
    evidence:
    transferability:
    estimated_learning_cost:
    application_blocker:
```

## Acceptance Criteria

- [ ] Gaps are explicit.
- [ ] Transferability is separate from direct evidence.
- [ ] Critical gaps can be identified.
- [ ] Learning gaps do not become claimed experience.

## Acceptance Tests

Test:

```text
Linux → Embedded Linux = transferable
Python → Embedded C = not equivalent
IoT → MQTT = relevant
IoT → AUTOSAR = unrelated
```

## Definition of Done

The system can explain:

> "You do not have this exact requirement, but your existing experience transfers."

without misrepresenting experience.

## Cursor Task

> Implement transferability and gap analysis as a separate layer from technical-fit scoring. Never promote transferable skills into direct experience.

---

# 16. Slice S10 — Interview Probability Scoring

## Objective

Estimate how likely the candidate is to receive an interview.

## Dependencies

S08, S09, S04.

## Files

```text
uk-embedded/evaluators/interview_probability.*
uk-embedded/config/scoring.yml
tests/uk-embedded/test_interview_probability.*
```

## Initial Factors

```text
technical fit
mandatory requirement match
domain match
seniority match
location fit
work-authorisation compatibility
company/role alignment
evidence strength
application quality potential
```

The result is an estimate, not a factual probability.

Output:

```yaml
interview_probability:
  score:
  confidence:
  factors:
  uncertainty:
```

## Acceptance Criteria

- [ ] Score is explainable.
- [ ] Confidence is separate from score.
- [ ] Unknown information increases uncertainty.
- [ ] No false statistical precision is presented.

## Acceptance Test

Given synthetic jobs:

```text
strong match
medium match
weak match
```

verify ordering and explanation.

## Definition of Done

The system can prioritize jobs based on likely interview value while explicitly representing uncertainty.

## Cursor Task

> Implement an explainable interview-probability estimate. Do not claim the score is statistically calibrated until S21. Treat it as a heuristic until historical outcome data exists.

---

# 17. Slice S11 — Application ROI

## Objective

Prioritize jobs based on expected value relative to candidate effort.

## Dependencies

S10.

## Files

```text
uk-embedded/evaluators/roi.*
uk-embedded/config/scoring.yml
tests/uk-embedded/test_roi.*
```

## Inputs

```text
technical fit
interview probability
career value
company fit
application effort
salary preference
location/commute
```

## Output

```yaml
application_roi:
  priority:
  expected_value:
  estimated_effort_minutes:
  rationale:
```

## Example

A slightly lower-fit job requiring 20 minutes may rank above an excellent job requiring 2 hours if interview probability and expected value are similar.

## Acceptance Criteria

- [ ] Effort is represented.
- [ ] Priority is explainable.
- [ ] No single score hides important factors.
- [ ] User can configure weighting.

## Acceptance Tests

Verify that:

```text
high-fit/high-effort
```

can reasonably rank below:

```text
slightly-lower-fit/low-effort
```

when configured weights justify it.

## Definition of Done

The system produces an actionable queue rather than merely a relevance ranking.

## Cursor Task

> Implement application ROI as a configurable prioritization layer. Do not modify technical-fit semantics. Make the final priority explainable through its component scores.

---

# 18. Slice S12 — Company Research

## Objective

Research companies behind high-priority jobs.

## Dependencies

S06, S11.

## Files

```text
uk-embedded/adapters/companies.*
uk-embedded/research/company.*
tests/uk-embedded/test_company_research.*
```

## Research Fields

```text
company
product/domain
engineering domain
technology relevance
location
work model
career growth signals
company size
public company information
role context
possible hiring contacts
```

Do not invent facts.

## Acceptance Criteria

- [ ] Company research is attached to a job.
- [ ] Sources are retained.
- [ ] Missing information remains unknown.
- [ ] Research does not alter factual candidate evidence.
- [ ] Contact information is only used where legitimately available.

## Acceptance Test

Use a fixture company with partial information and verify unknown fields remain unknown.

## Definition of Done

High-priority jobs can be enriched with company context.

## Cursor Task

> Implement company research using existing project capabilities where available. Preserve source provenance. Never fabricate company facts or contacts.

---

# 19. Slice S13 — Candidate Evidence Retrieval

## Objective

Select the strongest candidate evidence for a specific job.

## Dependencies

S02, S03, S08, S12.

## Files

```text
uk-embedded/evaluators/evidence_retrieval.*
uk-embedded/prompts/evidence_retrieval.*
tests/uk-embedded/test_evidence_retrieval.*
```

## Retrieval Process

```text
job requirement
      ↓
taxonomy mapping
      ↓
candidate evidence
      ↓
evidence strength
      ↓
recency
      ↓
relevance
      ↓
selected evidence
```

## Output

```yaml
evidence_selection:
  requirement:
  evidence:
  relevance:
  confidence:
  reason:
```

## Acceptance Criteria

- [ ] Evidence is selected per requirement.
- [ ] Source is retained.
- [ ] Unsupported requirements return no evidence.
- [ ] Generic CV text is not treated as stronger than source evidence.

## Acceptance Test

For a synthetic Embedded Linux job, verify Linux/IoT evidence is selected while unrelated evidence is excluded.

## Definition of Done

Application generation receives factual evidence rather than relying on free-form model memory.

## Cursor Task

> Implement requirement-to-evidence retrieval. Use the candidate evidence store as the source of truth. Never generate new evidence during retrieval.

---

# 20. Slice S14 — Tailored CV Generation

## Objective

Generate a role-specific CV from verified evidence.

## Dependencies

S13.

## Files

Adapt to existing Mads/career-ops generation architecture:

```text
applications/cv/
uk-embedded/prompts/cv/
candidate/cv/
tests/uk-embedded/test_cv_generation.*
```

## Process

```text
job
 ↓
requirements
 ↓
selected evidence
 ↓
CV structure
 ↓
tailored CV
```

The CV may:

- reorder experience
- emphasize relevant technologies
- select relevant projects
- adjust summary
- adjust bullet ordering

It must not:

- invent experience
- invent metrics
- invent technologies
- inflate seniority
- claim missing skills

## Acceptance Criteria

- [ ] CV generated from verified evidence.
- [ ] Unsupported claims rejected.
- [ ] Job-specific keywords used where truthful.
- [ ] CV remains readable.
- [ ] Existing CV facts remain traceable.
- [ ] Generic hallucinated achievements are detected.

## Acceptance Tests

Create a job requiring a technology absent from evidence.

Expected:

```text
technology may appear in gap analysis
technology must NOT appear as candidate experience
```

## Definition of Done

A tailored CV can be generated without compromising factual integrity.

## Cursor Task

> Adapt the strongest existing CV-generation workflow from career-ops/Mads-style architecture. Use candidate evidence as the factual source of truth. Add automated fact validation before allowing generated CVs to proceed.

---

# 21. Slice S15 — Cover Letter Generation

## Objective

Generate concise, job-specific application letters only where they provide value.

## Dependencies

S13, S14.

## Files

```text
applications/letters/
uk-embedded/prompts/cover_letter.*
tests/uk-embedded/test_cover_letter.*
```

## Principles

Avoid:

```text
generic enthusiasm
generic company praise
CV repetition
unsupported claims
```

Prefer:

```text
specific problem
specific candidate evidence
specific company/product connection
specific reason for fit
```

## Acceptance Criteria

- [ ] Letter references actual role.
- [ ] Company references are verified.
- [ ] Candidate claims come from evidence.
- [ ] Letter does not simply duplicate CV.
- [ ] Length is configurable.

## Acceptance Test

Verify a generated letter contains no unsupported technology claim.

## Definition of Done

A useful, concise and factual role-specific letter can be generated.

## Cursor Task

> Implement cover-letter generation using job-specific evidence and verified company research. Avoid generic filler. Add factual validation.

---

# 22. Slice S16 — Independent Application Reviewer

## Objective

Introduce an independent reviewer that critiques the generated application.

## Dependencies

S14, S15.

## Files

```text
applications/review/
uk-embedded/prompts/reviewer.*
tests/uk-embedded/test_application_review.*
```

## Review Dimensions

```text
technical alignment
evidence accuracy
clarity
seniority
ATS keyword coverage
recruiter first impression
generic language
unsupported claims
missing important evidence
overemphasis
```

## Critical Rule

The reviewer must not simply approve everything.

## Output

```yaml
review:
  overall:
  strengths:
  weaknesses:
  unsupported_claims:
  missing_evidence:
  recommendations:
  blocking_issues:
```

## Acceptance Criteria

- [ ] Reviewer runs independently of generator.
- [ ] Reviewer identifies intentional fixture defects.
- [ ] Blocking factual issues prevent finalization.
- [ ] Review is structured.

## Acceptance Test

Provide a deliberately flawed CV containing:

```text
invented technology
irrelevant project
missing mandatory requirement
```

Reviewer must identify all three.

## Definition of Done

Application generation has an adversarial review stage.

## Cursor Task

> Implement an independent application reviewer. Do not let the reviewer share hidden state that causes it to automatically agree with the generator. Add intentionally flawed fixtures and tests.

---

# 23. Slice S17 — ATS and PDF Validation

## Objective

Verify that final CV files are both machine-readable and visually usable.

## Dependencies

S16.

## Files

Reuse existing implementation where available:

```text
applications/validation/
tests/uk-embedded/test_document_validation.*
```

## Checks

```text
PDF generated
text layer exists
candidate name present
contact details present
section headings present
required truthful keywords present
no missing pages
no corrupted layout
no accidental blank pages
```

If visual validation tooling exists upstream, reuse it.

## Acceptance Criteria

- [ ] PDF extraction works.
- [ ] Required content detected.
- [ ] Missing text detected.
- [ ] Visual validation runs where supported.
- [ ] Failed validation blocks finalization.

## Acceptance Tests

Fixtures:

```text
valid PDF → pass
image-only PDF → fail ATS check
missing name → fail
missing experience section → fail
valid PDF with keyword → pass
```

## Definition of Done

Only validated application artifacts reach the final review state.

## Cursor Task

> Reuse existing ATS/PDF tooling before implementing anything new. Add UK Embedded-specific validation only where necessary. A visually attractive but text-inaccessible PDF must fail validation.

---

# 24. Slice S18 — Application Tracking

## Objective

Track the lifecycle of every serious application opportunity.

## Dependencies

S06, S11, S17.

## Files

```text
applications/schema.*
applications/active/
applications/submitted/
applications/rejected/
applications/templates/
```

Or adapt to the existing career-ops persistence model.

## States

```text
discovered
qualified
shortlisted
researching
drafting
ready_for_review
approved
submitted
interview
offer
rejected
withdrawn
expired
```

## Required Metadata

```text
job
company
source
priority
scores
date discovered
date applied
CV version
letter version
status
notes
outcome
```

## Acceptance Criteria

- [ ] State transitions validated.
- [ ] Every application has job identity.
- [ ] Generated documents are linked.
- [ ] Duplicate application submission is detectable.
- [ ] History is preserved.

## Acceptance Test

Attempt invalid transition:

```text
discovered → offer
```

Expected:

```text
rejected
```

## Definition of Done

Application history is reliable and auditable.

## Cursor Task

> Implement application tracking using existing persistence if possible. Add a validated state machine and immutable/append-only history where practical. Do not build a separate database if career-ops already provides one.

---

# 25. Slice S19 — Interview Preparation

## Objective

Generate interview preparation based on the actual job and candidate evidence.

## Dependencies

S13, S18.

## Files

```text
applications/interviews/
uk-embedded/prompts/interview.*
tests/uk-embedded/test_interview_preparation.*
```

## Output

```text
role summary
technical topics
likely questions
candidate evidence
STAR stories
knowledge gaps
company questions
questions to ask interviewer
```

## Technical Preparation

For Embedded/IoT roles include relevant areas such as:

```text
Linux
Embedded C
Python
networking
IoT protocols
device/cloud architecture
debugging
concurrency
hardware interfaces
system reliability
deployment
OTA
observability
```

Only include technologies relevant to the actual job.

## Acceptance Criteria

- [ ] Questions derived from JD.
- [ ] Answers use candidate evidence.
- [ ] Gaps become preparation topics.
- [ ] No invented project details.

## Acceptance Test

A synthetic job with three technical requirements must generate preparation material covering those requirements.

## Definition of Done

A shortlisted job produces targeted interview preparation rather than generic interview questions.

## Cursor Task

> Implement interview preparation from the job, candidate evidence and identified gaps. Reuse verified evidence and never invent project details.

---

# 26. Slice S20 — Outcome and Feedback Collection

## Objective

Capture what actually happens after applications.

## Dependencies

S18, S19.

## Files

```text
outcomes/schema.*
outcomes/interviews/
outcomes/rejections/
outcomes/README.md
tests/uk-embedded/test_outcomes.*
```

## Outcome Types

```text
no_response
rejected_application
rejected_screen
rejected_technical
rejected_final
interview
offer
withdrawn
```

## Optional Feedback

```text
recruiter feedback
technical feedback
reason
stage
date
```

## Acceptance Criteria

- [ ] Outcomes link to application.
- [ ] Outcome stage recorded.
- [ ] Feedback is optional.
- [ ] No outcome can be assigned to unknown application.
- [ ] Historical records are preserved.

## Acceptance Test

Create:

```text
application → interview → rejection technical
```

and verify the complete chain is retained.

## Definition of Done

The system captures enough historical data to learn from actual outcomes.

## Cursor Task

> Implement structured outcome recording. Keep the schema minimal and useful for future calibration. Do not attempt statistical learning yet.

---

# 27. Slice S21 — Learning and Calibration Loop

## Objective

Use historical outcomes to improve ranking.

## Dependencies

S08, S10, S11, S20.

## Files

```text
outcomes/calibration/
uk-embedded/evaluators/calibration.*
uk-embedded/config/scoring.yml
tests/uk-embedded/test_calibration.*
```

## Initial Learning Signals

Compare:

```text
predicted technical fit
predicted interview probability
application priority
actual interview outcome
actual rejection stage
```

Find patterns such as:

```text
roles overestimated
roles underestimated
technologies correlated with interviews
companies producing interviews
seniority mismatch
location effects
```

## Important Rule

Do not pretend a small dataset is statistically reliable.

Use:

```text
insufficient_data
low_confidence
medium_confidence
high_confidence
```

## Acceptance Criteria

- [ ] Historical outcomes can be summarized.
- [ ] Calibration recommendations are generated.
- [ ] Small sample sizes are explicitly marked.
- [ ] Existing scores are not silently changed.
- [ ] Recommended configuration changes require approval.

## Acceptance Test

Provide synthetic outcome data where one role family has consistently higher interview rates.

Expected:

```text
system identifies the pattern
system reports confidence/sample size
system proposes adjustment
system does not silently modify production scoring
```

## Definition of Done

The system can learn from outcomes without becoming an opaque self-modifying system.

## Cursor Task

> Implement outcome analysis and calibration recommendations. Keep calibration advisory initially. Never silently modify scoring configuration based on small samples.

---

# 28. Slice S22 — End-to-End Orchestration

## Objective

Connect all completed slices into one controlled workflow.

## Dependencies

S00-S21.

## Files

Adapt to existing CLI architecture:

```text
uk-embedded/orchestrator.*
uk-embedded/workflows.*
tests/uk-embedded/test_end_to_end.*
docs/WORKFLOW.md
```

## Target Workflow

```text
discover
    ↓
normalize
    ↓
deduplicate
    ↓
hard-filter
    ↓
technical-fit
    ↓
gap-analysis
    ↓
interview-probability
    ↓
company-research
    ↓
application-ROI
    ↓
rank
    ↓
candidate-evidence retrieval
    ↓
CV generation
    ↓
cover letter
    ↓
independent review
    ↓
ATS/PDF validation
    ↓
human approval
    ↓
manual submission
    ↓
tracking
    ↓
outcome
    ↓
calibration
```

## Critical State Boundary

The workflow must stop at:

```text
READY_FOR_SUBMISSION
```

and require explicit human action.

There must be no:

```text
AUTO_SUBMIT
```

state.

## Acceptance Criteria

- [ ] End-to-end workflow can run on fixtures.
- [ ] Each stage produces inspectable output.
- [ ] Failure in one job does not destroy the batch.
- [ ] Failed stages are recorded.
- [ ] Human approval is mandatory before submission.
- [ ] No browser submission is automatically triggered.
- [ ] Existing career-ops workflows continue to work.

## Acceptance Test

Run an entirely synthetic job through:

```text
discovery
→ ranking
→ application generation
→ review
→ validation
→ ready_for_submission
```

Verify:

```text
no submission occurs
```

Then verify application state is correctly recorded.

## Definition of Done

The complete system can discover and prioritize UK Embedded/IoT opportunities and prepare high-quality applications while keeping final submission under explicit human control.

## Cursor Task

> Connect only the already-completed slices into an end-to-end workflow. Do not add new business logic unless required to connect existing components. Every stage must have inspectable input/output and failure handling. Stop at `READY_FOR_SUBMISSION`; never implement autonomous application submission.

---

# 29. Acceptance Test Strategy

Every slice should have three levels of testing.

## Level 1 — Unit

Test individual functions:

```text
normalization
taxonomy lookup
scoring
filtering
validation
state transitions
```

## Level 2 — Integration

Test:

```text
job source
→ canonical job
→ evaluator
→ ranking
```

or:

```text
candidate evidence
→ CV generator
→ reviewer
→ validator
```

## Level 3 — End-to-End

Use synthetic fixtures:

```text
fixture job
fixture company
fixture candidate evidence
        ↓
complete workflow
        ↓
expected ranking/application state
```

Do not use live applications as automated tests.

---

# 30. Golden Fixtures

Create stable fixtures once the architecture is established.

Recommended:

```text
tests/fixtures/
├── jobs/
│   ├── embedded_linux_strong.yml
│   ├── iot_strong.yml
│   ├── firmware_medium.yml
│   ├── unrelated_backend.yml
│   └── impossible_requirement.yml
│
├── candidates/
│   ├── embedded_candidate.yml
│   └── minimal_candidate.yml
│
├── companies/
│   └── example_company.yml
│
└── applications/
    ├── valid_cv.*
    ├── flawed_cv.*
    └── invalid_pdf.*
```

Fixtures must not contain real personal data unless explicitly intended for local-only testing.

---

# 31. Required Invariants

The following must always remain true.

## Candidate truth

```text
Generated claim
    ↓
must be traceable
    ↓
to candidate evidence
```

## Job truth

```text
Generated job information
    ↓
must be traceable
    ↓
to source/provider data
```

## Company truth

```text
Company claim
    ↓
must have source/provenance
```

## Scoring truth

```text
score
    ↓
must have component explanation
```

## Application truth

```text
application
    ↓
must identify source job
    ↓
must identify candidate version
```

---

# 32. Error Handling Requirements

Provider failures must not terminate the entire batch.

Preferred:

```text
Job provider A → success
Job provider B → failure
Job provider C → success

Batch continues.
```

Similarly:

```text
Job 1 → evaluation success
Job 2 → malformed → quarantine
Job 3 → evaluation success
```

Every failure should include:

```text
stage
job/provider
error type
message
retryability
timestamp
```

Do not swallow errors silently.

---

# 33. Logging

Logs should distinguish:

```text
discovery
normalization
filtering
evaluation
research
generation
validation
tracking
calibration
```

Do not log sensitive candidate information unnecessarily.

Avoid logging:

```text
full CV
personal address
phone number
authentication tokens
cookies
passwords
session data
```

---

# 34. Secrets and Credentials

Never commit:

```text
API keys
browser cookies
session tokens
passwords
OAuth tokens
personal authentication data
```

Use the existing project secret-management mechanism.

If none exists, document the expected environment variables rather than inventing a secret store.

---

# 35. Application Submission Safety

The system may eventually assist with browser form preparation.

It must never automatically:

```text
click Submit
send application
accept legal declaration
answer eligibility question without review
send recruiter message without approval
```

The final state is:

```text
READY_FOR_SUBMISSION
```

Human action is required.

---

# 36. Commit Strategy

One logical slice should normally equal one commit.

Recommended:

```text
feat(uk-embedded): establish specialization boundary
feat(candidate): add evidence model
feat(uk-embedded): add embedded taxonomy
feat(uk): add market configuration
feat(search): integrate UK discovery
feat(search): normalize and deduplicate jobs
feat(uk-embedded): add eligibility filters
feat(uk-embedded): add technical fit evaluator
feat(uk-embedded): add transferability analysis
feat(uk-embedded): add interview probability
feat(uk-embedded): add application ROI
feat(uk-embedded): add company research
feat(uk-embedded): add evidence retrieval
feat(applications): add tailored CV generation
feat(applications): add cover letter generation
feat(applications): add independent reviewer
feat(applications): add ATS validation
feat(applications): add tracking
feat(applications): add interview preparation
feat(outcomes): add outcome tracking
feat(calibration): add outcome calibration
feat(workflow): add end-to-end orchestration
```

Do not combine unrelated slices into one large commit.

---

# 37. Definition of a Completed Slice

A slice is complete only when all are true:

```text
[ ] Implementation exists
[ ] Existing architecture was respected
[ ] Tests exist
[ ] Tests pass
[ ] Acceptance criteria pass
[ ] Error cases considered
[ ] No unsupported candidate claims introduced
[ ] No secrets committed
[ ] Documentation updated where necessary
[ ] No future slice was prematurely implemented
[ ] Git diff reviewed
[ ] Logical commit created
```

---

# 38. Cursor Execution Template

For each slice, Cursor should receive this general instruction:

```text
Read:

docs/IMPLEMENTATION_SLICES.md

Execute only:

<SLICExx>

Before editing:

1. Inspect the existing implementation.
2. Read the dependency slices.
3. Identify reusable career-ops functionality.
4. Identify existing tests.
5. Confirm the planned file locations against the actual repository.

Implementation rules:

- Do not implement future slices.
- Do not duplicate existing infrastructure.
- Do not invent APIs.
- Preserve upstream compatibility.
- Keep UK Embedded/IoT specialization isolated.
- Add tests for normal and failure cases.
- Do not fabricate candidate information.
- Do not submit applications.
- Do not modify unrelated files.

After implementation:

1. Run relevant tests.
2. Run the complete existing test suite if practical.
3. Inspect the git diff.
4. Report:
   - files changed
   - behavior added
   - tests executed
   - test results
   - known limitations
5. Commit only this slice using the prescribed commit format.
```

---

# 39. Recommended First 10 Slices

Do not attempt the entire project immediately.

Start:

```text
S00 → understand career-ops
S01 → isolate customization
S02 → build candidate evidence
S03 → build Embedded taxonomy
S04 → configure UK market
S05 → discover jobs
S06 → normalize jobs
S07 → filter jobs
S08 → technical matching
S09 → gap analysis
```

At this point you already have the foundation of a useful system.

Then:

```text
S10 → interview probability
S11 → application ROI
```

Now the system can answer:

> **Which jobs should I actually spend my time applying to?**

Only after that should application generation become a priority.

---

# 40. Milestones

## Milestone M1 — Foundation

```text
S00-S04
```

Result:

```text
career-ops
+
candidate evidence
+
Embedded taxonomy
+
UK configuration
```

---

## Milestone M2 — Job Intelligence

```text
S05-S11
```

Result:

```text
jobs
 ↓
deduplicate
 ↓
filter
 ↓
technical fit
 ↓
gap analysis
 ↓
interview probability
 ↓
application ROI
```

This is the first genuinely useful product milestone.

---

## Milestone M3 — Application Intelligence

```text
S12-S17
```

Result:

```text
job
 ↓
company research
 ↓
evidence selection
 ↓
tailored CV
 ↓
cover letter
 ↓
independent review
 ↓
ATS validation
```

---

## Milestone M4 — Career Feedback

```text
S18-S21
```

Result:

```text
applications
 ↓
interviews/rejections
 ↓
outcome analysis
 ↓
calibration
```

---

## Milestone M5 — Full System

```text
S22
```

Result:

```text
discover
→ rank
→ prepare
→ review
→ validate
→ human submission
→ track
→ learn
```

---

# 41. What NOT to Build Early

Do not start with:

```text
❌ Autonomous browser application submission
❌ Multi-agent swarm
❌ Vector database
❌ Complex RAG platform
❌ Custom web UI
❌ Mobile app
❌ Custom job scraper for every website
❌ Statistical ML model
❌ Automatic scoring self-modification
❌ Fully autonomous recruiter messaging
```

First prove that:

```text
better jobs
+
better ranking
+
better applications
=
better interview rate
```

Only then optimize infrastructure.

---

# 42. Success Metrics

The system should eventually track:

```text
jobs discovered
unique jobs
qualified jobs
shortlisted jobs
applications submitted
application effort
interviews
interview rate
interviews/hour
rejection rate
rejection stage
offer rate
```

The primary KPI should be:

> **Interviews per hour of candidate effort**

Secondary KPIs:

```text
application → interview conversion
shortlist → interview conversion
technical-fit calibration
false-positive rate
false-negative rate
average application preparation time
```

Avoid optimizing for:

```text
number of applications
number of generated CVs
number of generated cover letters
```

---

# 43. Final Target Workflow

The completed system should feel like this:

```text
                    DAILY JOB SEARCH
                           │
                           ▼
                  ┌─────────────────┐
                  │ DISCOVER JOBS   │
                  └────────┬────────┘
                           ▼
                     100–200 jobs
                           │
                           ▼
                  ┌─────────────────┐
                  │ NORMALIZE       │
                  │ + DEDUPLICATE   │
                  └────────┬────────┘
                           ▼
                      80–150 jobs
                           │
                           ▼
                  ┌─────────────────┐
                  │ HARD FILTER     │
                  └────────┬────────┘
                           ▼
                       30–60 jobs
                           │
                           ▼
                  ┌─────────────────┐
                  │ TECHNICAL FIT   │
                  └────────┬────────┘
                           ▼
                       10–25 jobs
                           │
                           ▼
                  ┌─────────────────┐
                  │ GAP + EVIDENCE  │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │ INTERVIEW       │
                  │ PROBABILITY     │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │ APPLICATION ROI │
                  └────────┬────────┘
                           ▼
                     TOP 3–10
                           │
                           ▼
                  ┌─────────────────┐
                  │ COMPANY         │
                  │ RESEARCH        │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │ EVIDENCE        │
                  │ RETRIEVAL       │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │ TAILORED CV     │
                  │ + LETTER        │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │ INDEPENDENT     │
                  │ REVIEW          │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │ ATS/PDF CHECK   │
                  └────────┬────────┘
                           ▼
                    READY TO APPLY
                           │
                           ▼
                    ┌─────────────┐
                    │    HUMAN    │
                    │   SUBMITS   │
                    └──────┬──────┘
                           ▼
                       TRACKING
                           │
                           ▼
                    INTERVIEW /
                      REJECTION
                           │
                           ▼
                    OUTCOME DATA
                           │
                           ▼
                     CALIBRATION
                           │
                           └──────────► BETTER RANKING
```

---

# 44. Final Implementation Rule

The system is **not finished when all 23 slices are implemented**.

It is finished when the system demonstrates, using real job-search data and human-reviewed applications, that it can reliably answer:

> **"Of the jobs available to me today, which 2–5 are most worth my limited time, why am I a credible candidate for them, what evidence should I present, what gaps should I address, and how should I prepare the application?"**

The first practical target is therefore:

```text
S00-S11
```

not S22.

Once S11 works well, the project already has substantial value. Everything after S11 increases the quality and automation of the application lifecycle rather than being a prerequisite for useful job search.