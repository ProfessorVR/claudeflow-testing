# 00 — Data Audit (T0)

- Source: 3 Canvas Student Analysis CSVs (W25/S25/W26), parsed with csv module (multi-line fields safe).
- Extraction: `scripts/extract-anonymize.py` → `data/respondents.csv` (241 rows), `data/open_text.csv` (873 rows).
- Anonymization: name/id/sis_id/section columns DROPPED; respondent codes <TERM>-Rnnn assigned in raw row order (reproducible from raw + script; no mapping file written). Instructor/author names + emails masked in free text (7 responses affected: 6 instructor/author scrubs 2026-07-06 + W26-R007/Q5 self-identifying question masked 2026-07-23 per coder MASK flag). Raw dir gitignored 2026-07-06 (`.gitignore` L38).
- All 14 question columns located in all terms (header-snippet matching); attempt=1 throughout; IDs unique per Agent-recon and row counts (102/79/60).
- Missingness: Q7 blank 10; Q8 blank 10; open-item non-response by item/term in 01-quant §Open-text.
- Known limits: single self-report instrument (no depth channel); content items at ceiling; IA stats excluded as artifacts; instrument says 'VR platform' but deployment era is 2D-PC-primary (terminology gap stated once in §III.3).
- PII residual risk: heuristic scrub only (instructor/author/emails); coding passes must flag any remaining self-identifying text for masking in exemplars.
