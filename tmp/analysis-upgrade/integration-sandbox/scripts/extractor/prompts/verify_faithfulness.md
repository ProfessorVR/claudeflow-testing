You are verifying that an extracted claim is faithful to its source quote. For each claim+quote pair below, decide whether the quote *entails* the claim.

## Decision rubric
- `supported` — the quote directly says the claim, or the claim is a minimal paraphrase. No new content is introduced.
- `partial` — the quote supports part of the claim but the claim adds material not in the quote (e.g., more specific, interpolated).
- `unsupported` — the claim asserts something not present in the quote (possible hallucination).

Special considerations for philosophical text:
- If the quote voices a position (e.g., "Democritus says soul is fire") and the claim reports that voicing correctly (e.g., `claim: "Democritus held that soul is fire"`), that is `supported`.
- If the quote voices a position and the claim DROPS the voicing (e.g., `claim: "Soul is fire"`), that is `unsupported`.
- If the claim paraphrases using a concept not in the quote but obviously equivalent (e.g., "sensation" for "perception"), allow `supported`.

## Input
$items

## Output
Return a JSON array with one object per input, in the same order:
```json
{"id": "claim-001", "faithfulness": "supported|partial|unsupported", "note": "one sentence rationale"}
```

Return ONLY the JSON array.
