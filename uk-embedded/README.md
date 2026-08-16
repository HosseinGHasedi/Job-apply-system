# UK Embedded/IoT specialization

This directory is the **Job-apply-system** layer on top of upstream
`career-ops`. It is registered in `SYSTEM_PATHS` so path-coverage tests pass,
but it is not part of santifer/career-ops.

| Layer | Location | Rule |
| --- | --- | --- |
| Upstream career-ops | `modes/`, root `*.mjs`, `providers/`, `templates/` | Do not put personal facts or UK Embedded scoring here |
| This specialization | `uk-embedded/` | Isolated pipeline: evidence, taxonomy, filters, ranking, document gates |
| User data | `cv.md`, `config/profile.yml`, `documents/`, `data/` | Personal facts; never committed |

Health check (no network, no scoring):

```bash
node uk-embedded/health.mjs
node uk-embedded/run.mjs --fixtures
node test-all.mjs --only uk-embedded
```

The fixture runner never writes `data/outcomes/` or `config/benchmarks.yml`.

Agent-facing calibration lives in `modes/regional/uk-embedded.md`.
Personal house rules still go in `modes/_custom.md`.
