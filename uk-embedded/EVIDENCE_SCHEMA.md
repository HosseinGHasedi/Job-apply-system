# Candidate evidence schema

Evidence is the factual source of truth for CV, cover letter, and review.
A generated CV is a *view* of this store. It must not invent claims.

Personal evidence files live in the user layer (`documents/evidence/` or a
path passed to the loader). This document is the schema. Fixtures under
`test-fixtures/uk-embedded/` are fictional.

## Record

```yaml
id: proj-iot-gateway          # required, unique
type: project                 # project | technology | achievement | responsibility
title: IoT edge gateway
description: >-
  Designed a Linux gateway that forwards sensor data over MQTT.
technologies: [linux, mqtt, c]   # ids or names; unknown names stay unknown
domain: iot
strength: working             # expert | proficient | working | exposure | unknown
years: 2
production: true
source: documents/projects/gateway.md   # required provenance
confidence: verified          # verified | strong | probable | weak | unknown
related_evidence: [tech-mqtt]
```

## Rules

- Missing `id` or `source` is rejected.
- Invalid `confidence` is rejected.
- Unknown technologies are stored with `confidence: unknown`. They are never
  promoted to `strength: expert`.
- The loader does not infer missing years, employers, or metrics.
