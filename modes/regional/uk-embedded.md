# Mode: uk-embedded — UK Embedded/IoT specialization

Use this mode when the candidate is targeting UK Embedded Software, Embedded
Linux, IoT, firmware, edge, or related systems roles.

This mode is the agent-facing entry to the `uk-embedded/` specialization
layer. It does not replace official immigration, tax, labour, or
security-clearance advice.

## Boundary

- Upstream career-ops owns scan, tracker, PDF engines, and A–G evaluation.
- `uk-embedded/` owns UK Embedded config, evidence, taxonomy, hard filters,
  ranking overlays, and document quality gates.
- Personal facts live in `config/profile.yml`, `cv.md`, and `documents/`.
  Never invent them here.

## Before scoring or drafting

1. Run `node uk-embedded/health.mjs` if the specialization has not been
   checked this session.
2. Load specialization config via `uk-embedded/` — not by hard-coding
   locations or visa status into prompts.
3. Do not implement discovery, scoring, or CV generation in this file.
   Those belong to later slices and their modules.

## Human-in-the-loop

Never submit an application, send a message, or accept a legal declaration.
Stop at ready-for-submission.
