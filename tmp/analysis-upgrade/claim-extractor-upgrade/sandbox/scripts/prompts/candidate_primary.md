You are extracting structured philosophical claims from a primary-source chunk of classical philosophy (e.g., Aristotle, Heidegger, Uexküll). The passage may mix the author's own positions with views they voice to refute or discuss. Your job is to identify every substantive propositional move, atomically, and tag it with its speaker and stance.

## Source metadata
- Author: $author
- Title: $title
- Year: $year
- Book/Chapter: $book_chapter
- Bekker range: $bekker_range
- PDF pages: $pdf_pages

## The chunk
The chunk text is OCR'd. Bekker numbers (e.g. "427a1", "427b15") and line-margin numbers (e.g. "5", "10", "15") are interspersed in the flow. Asterisks in numbers (e.g. "404*1") are OCR renderings of italic "a". Treat them as "a".

Chunk:
"""
$chunk_text
"""

## Critical distinctions (use-mention and voicing)

Classical philosophical texts systematically voice positions the author does NOT endorse. Every claim you extract must distinguish:

1. Who says this? (speaker)
2. Does the author ($author) endorse, report-neutrally, concede, critique, or refute this? (stance)
3. Is this a claim the author is *using* (making their own assertion) or *mentioning* (reporting another's)? (use_mention)

Trigger phrases for voiced/reported positions (set use_mention: mention):
- "Some say that...", "Others hold that...", "It is thought that..."
- Named predecessors: "Democritus held...", "Empedocles claims...", "Plato in the Timaeus says..."
- "For this reason they think...", "They say that..."

Trigger phrases for authorial positions (set use_mention: use):
- "We must therefore say...", "It is clear that...", "The truth is...", "Thus..."
- Constructive definitions: "X is Y", where Y is being given as essence
- Arguments by analogy the author is making
- "For if X were the case, then Y, but Y is absurd, therefore not X" (reductio — the negated conclusion is the author's use)

## Claim types (choose exactly one)
- `thetic` — the author's own thesis (endorsed assertion)
- `definitional` — genus-differentia or conceptual delimitation
- `dialectical_objection` — a view voiced to be tested or refuted
- `dialectical_refutation` — the author's counter-move against a voiced objection
- `aporetic` — a puzzle raised but not yet resolved
- `predecessor_report` — "X said/held Y" where X is a named historical figure
- `exegetical_claim` — what the author takes a predecessor's position to mean (interpretation, not report)
- `empirical_observation` — observation about nature, animals, perception, etc.
- `analogical_argument` — structured analogy serving as argument
- `methodological_remark` — remark about how to proceed, where to look, what to inquire into

## Stance values (choose exactly one)
- `endorses` — author affirms this claim
- `reports_neutral` — author presents this without evaluation
- `concedes` — author acknowledges this as partially valid
- `critiques` — author raises problems with this without fully refuting
- `refutes` — author actively rejects this

## Output schema (STRICT JSON)
Return a JSON array of claim objects. No prose around it. Each object:

```json
{
  "quote": "10-40 word verbatim substring from the chunk (preserve OCR characters exactly)",
  "claim": "atomic paraphrased proposition, single sentence",
  "ground": "evidence/argument given for the claim; empty string if none",
  "warrant": "implicit inference rule bridging ground to claim; empty string if none",
  "qualifier": "scope/modality marker like 'in animals only', 'generally'; empty string if none",
  "rebuttal": "counter-consideration author addresses inside this claim; empty string if none",
  "claim_type": "one of the 10 enum values",
  "stance": "one of the 5 enum values",
  "use_mention": "use | mention",
  "speaker": "whose claim this is — '$author' / 'Democritus' / 'Empedocles' / 'Plato' / etc.",
  "key_concepts": ["2-6 short terms, mix Greek + English, e.g. 'phantasia', 'aisthesis', 'motion'"],
  "nearby_provenance": "nearest Bekker marker visible in the chunk, e.g. '427b1', or '' if none"
}
```

## Extraction guidance
- Target: 12-25 claims per chunk. Skip purely transitional sentences.
- Atomicity: if a sentence asserts two independent propositions, emit two claims.
- Dialectical passages: extract BOTH the objection AND the refutation as separate claims, using `claim_type: dialectical_objection` and `claim_type: dialectical_refutation`.
- If uncertain about use-mention, prefer `mention` — false mentions are easier to recover from than false uses.
- `quote` MUST be a verbatim substring, not paraphrased. Include OCR noise characters if present.
- If the chunk is almost pure exposition with no extractable claims, return [].

Return ONLY the JSON array.
