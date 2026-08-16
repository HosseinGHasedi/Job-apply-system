# UK Embedded workflow

```text
discover → normalize → hard-filter → technical-fit → gaps
  → interview probability → ROI → company research → evidence
  → CV → cover letter → independent review → ATS/PDF
  → READY_FOR_REVIEW → human submits
```

Run the fixture pipeline:

```bash
node uk-embedded/health.mjs
node test-all.mjs --only uk-embedded
```

There is no `AUTO_SUBMIT` state. `runPipeline()` always returns `submitted: false`.
