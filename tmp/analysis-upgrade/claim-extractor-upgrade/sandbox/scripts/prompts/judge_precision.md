You are an expert philosopher auditing machine-extracted claims from a primary or secondary philosophical text. For EACH extracted claim, judge whether the extractor's decisions are correct.

## Source metadata
- Author: $author
- Title: $title
- Year: $year
- Genre: $genre

## The source chunk (what the extractor saw)
"""
$chunk_text
"""

## The extractor's claims
$claims_json

## Your task
For each claim, return a judgment object with these fields:
- `id`: the claim id (unchanged)
- `is_claim`: true if the quote supports some substantive propositional content; false if the extractor fabricated a claim or extracted from non-claim material (e.g., transitions, tables of contents, bibliographic metadata).
- `claim_paraphrase_ok`: true if the paraphrased `claim` field accurately captures what the quote says; false if it distorts, exaggerates, or changes the proposition.
- `claim_type_ok`: true if the assigned `claim_type` matches your judgment. For primary texts use: thetic, definitional, dialectical_objection, dialectical_refutation, aporetic, predecessor_report, exegetical_claim, empirical_observation, analogical_argument, methodological_remark. For secondary use: primary_thesis, subsidiary_claim, interpretive_claim, textual_claim, critical_claim, methodological_claim, concession.
- `claim_type_correct`: the correct type if `claim_type_ok` is false; otherwise same as extractor's value.
- `stance_ok`: true if the assigned `stance` (endorses/reports_neutral/concedes/critiques/refutes) reflects the paper's author's relationship to the claim.
- `stance_correct`: correct stance if wrong; else same.
- `use_mention_ok`: true if `use_mention` is correct. "use" = the author is asserting the claim; "mention" = the author is reporting another's position without asserting it. For dialectical objections voiced but not endorsed, this should be "mention".
- `use_mention_correct`: correct value if wrong.
- `speaker_ok`: true if `speaker` correctly identifies who is asserting the claim IN THE TEXT (not who the extractor is). For texts by $author where the author is expressing their own view, speaker = "$author". For reported views, speaker = the named predecessor or an anonymous-voicing label like "objector".
- `speaker_correct`: correct speaker if wrong.
- `confidence`: your confidence in this judgment, 0.0 to 1.0. Flag anything below 0.7 as uncertain.
- `note`: one-sentence explanation of any flagged disagreement.

## Guidance
- Be strict about use-mention. LLMs frequently conflate mention with use. If the quote reads "Democritus held soul is fire," the claim "Soul is fire" with `use_mention: use` is WRONG — it should be `mention` with `speaker: Democritus`.
- For primary texts, the author is the primary speaker unless a predecessor is named or a dialectical voicing is introduced ("Some say...", "One might object...").
- For secondary texts, watch for nested attribution: "Caston argues that Aristotle thinks..." — the outer speaker is Caston, but the claim itself is about what Aristotle thinks.
- Allow semantic paraphrase; don't require verbatim matching on the `claim` paraphrase field.
- If a claim is genuinely borderline between two valid labels, set `confidence` to 0.5-0.7 and note both candidates.

## Output format (STRICT JSON)
Return ONLY a JSON array with one judgment object per input claim, in input order. Do not include prose outside the JSON.
