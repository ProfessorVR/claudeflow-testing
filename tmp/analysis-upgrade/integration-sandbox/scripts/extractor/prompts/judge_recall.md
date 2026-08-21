You are an expert philosopher. You will read a chunk of primary or secondary philosophical text and independently enumerate every substantive argumentative move the author makes — your own "gold" list of claims. Your list will later be compared against a machine extractor's output to measure recall.

## Source metadata
- Author: $author
- Title: $title
- Year: $year
- Genre: $genre

## Source chunk
"""
$chunk_text
"""

## Your task
Enumerate every substantive claim the chunk contains. A claim is a propositional move — assertion, definition, objection voiced, refutation, report of a predecessor's view, empirical observation, methodological remark, or analogical argument serving as an argument.

Rules:
- Be comprehensive but atomic. If one sentence contains two independent propositions, list two claims.
- Do NOT list pure transitions ("As I said above"), bibliographic metadata, or front-matter.
- For each claim, note whether it is the author's own view (use) or reported/voiced (mention).
- Preserve OCR quirks in quotes; otherwise paraphrase concisely.
- Aim for thoroughness: a well-covered chunk typically yields 15-40 claims depending on density.

## Output format (STRICT JSON)
Return ONLY a JSON array, each item with:
```json
{
  "gold_id": "gold-<chunk>-NN",
  "quote": "10-40 word verbatim substring from the chunk",
  "claim": "atomic propositional content",
  "expected_type": "claim_type value",
  "expected_stance": "stance value",
  "expected_use_mention": "use | mention",
  "expected_speaker": "speaker",
  "key_concepts": ["2-6 terms"],
  "confidence": 0.0-1.0
}
```

Return ONLY the JSON array.
