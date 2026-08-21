You are extracting structured argumentative claims from a secondary-literature chunk — an academic paper or monograph about philosophy (e.g., Nussbaum, Caston, Frede on Aristotle; Rickert on Heidegger). Your job is to identify every substantive argumentative move, atomically, with correct attribution of voice (the paper's author vs. scholars she discusses vs. primary texts she cites).

## Source metadata
- Author: $author
- Title: $title
- Year: $year
- PDF pages: $pdf_pages
- Section header: $section_header

## The chunk
The chunk text is OCR'd. Citations to primary philosophical texts (Bekker numbers like "427a26-29", page numbers) and inline quotations are common. Preserve them in your `quote` field exactly as they appear.

Chunk:
"""
$chunk_text
"""

## Critical distinctions (use-mention and voicing)

Academic prose mixes (1) the paper's own argument, (2) positions of other scholars the author engages with, and (3) claims of the primary texts themselves. Your tagging must reflect this.

For every claim, decide:
1. Who says this? (speaker)
2. What is the paper's author's stance? (stance)
3. Is the author *using* the claim (asserting it) or *mentioning* it (reporting)? (use_mention)

Trigger phrases:
- "Wedin argues...", "According to Schofield...", "Hamlyn holds..." → speaker is the named scholar; typically stance: reports_neutral unless evaluated.
- "Aristotle writes at DA 432b15...", "As De Anima III.3 makes clear..." → speaker: Aristotle (primary text being reported); typically stance: reports_neutral, use_mention: mention, claim_type: textual_claim or interpretive_claim.
- "Nussbaum is right that...", "I agree with X..." → author is endorsing another's position. use_mention: use (author is asserting).
- "This overlooks...", "But this cannot be correct because..." → stance: critiques or refutes.
- No attribution cues and first-person-plural reasoning → speaker: $author, use_mention: use.

## Claim types (choose exactly one)
- `primary_thesis` — the paper's overall argument or a main sub-thesis
- `subsidiary_claim` — supporting step in the paper's argument
- `interpretive_claim` — "Aristotle means X when he says Y" (paper's interpretation of primary text)
- `textual_claim` — "Aristotle writes X at [citation]" (report of primary-text content)
- `critical_claim` — author rejects or problematizes a prior reading
- `methodological_claim` — "We should read this passage by ...", remarks about interpretive method
- `concession` — author acknowledges a counterpoint or limitation

## Stance values (choose exactly one)
- `endorses` — author affirms (including agreement with cited scholar)
- `reports_neutral` — presented without evaluation
- `concedes` — acknowledged as partially valid counterpoint
- `critiques` — raises problems without fully refuting
- `refutes` — actively rejects

## Output schema (STRICT JSON)
Return a JSON array of claim objects. No prose around it.

```json
{
  "quote": "10-40 word verbatim substring from the chunk (preserve as-is)",
  "claim": "atomic paraphrased proposition, single sentence",
  "ground": "evidence/argument; empty string if none",
  "warrant": "bridging principle; empty string if none",
  "qualifier": "scope marker; empty string if none",
  "rebuttal": "counter-consideration addressed; empty string if none",
  "claim_type": "one of the 7 enum values",
  "stance": "one of the 5 enum values",
  "use_mention": "use | mention",
  "speaker": "'$author' / 'Aristotle' / 'Wedin' / 'Nussbaum' / 'Schofield' / etc.",
  "key_concepts": ["2-6 short terms, mix Greek + English"],
  "nearby_provenance": "citation visible near this claim, e.g. '427a26-29', 'p. 281', or '' if none"
}
```

## Extraction guidance
- Target: 22-32 claims per chunk. Capture every substantive argumentative move, but PRIORITIZE PRECISION — if it is not a propositional claim, do not extract it.
- Atomicity: split compound sentences into separate claims when they assert independent propositions. Don't split a single argumentative move into fragments.
- Avoid duplicates: if two nearby sentences express the same proposition, extract once with the stronger quote.
- Do NOT extract: running references to other scholars ("see Caston 1995") without a propositional claim; pure section transitions; quotation formatting; question-only sentences unless they pose a substantive aporia.
- If the author is reporting someone who is reporting another (e.g., "Nussbaum thinks Wedin misreads Aristotle"), record the claim closest to the text surface — usually the inner claim plus a surrounding critique.
- When in doubt about author attribution: if no scholar name appears in the surrounding 2-3 sentences, assume speaker: $author.
- `quote` MUST be a verbatim substring from the chunk.
- If the chunk is mostly bibliographic, front-matter, or notes, return [].

Return ONLY the JSON array.
