/**
 * rubric.ts — Claude evaluation rubric for Lanham prose analysis
 *
 * Exports reusable constants and builder functions consumed by the
 * labeling pipeline. Three sections:
 *   A. Framework introduction  (~300 tokens)
 *   B. Few-shot examples       (Burns, Hemingway, Brougham)
 *   C. Output schema + helpers
 *
 * Gold-set source: tests/calibration/lanham-gold-set.jsonl
 */

// ---------------------------------------------------------------------------
// Section A — Framework introduction
// ---------------------------------------------------------------------------

export const FRAMEWORK_INTRO = `You are evaluating English prose passages using Richard Lanham's analytical framework from "Analyzing Prose." Your task is descriptive, not evaluative — you are identifying what the prose does, not whether it is good or bad. Each axis is genre-relative, not absolute.

For each passage, analyze these six independent axes:

1. NOUN/VERB AXIS: Is the prose dominated by nominalizations and prepositional phrase chains ("the implementation of the assessment of"), or by active verbs with human agents ("she walked in and stopped")? Lanham's "Official Style" is noun-heavy; his verb style is action-driven.

2. PARATAXIS/HYPOTAXIS: Are clauses coordinated by "and/but/or" in parallel chains (parataxis), or embedded inside each other through "because/although/since/which/who" (hypotaxis)?

3. PERIODIC/RUNNING: Does the sentence deliver its main predication early and trail qualifications afterward (running), or delay the main clause behind introductory subordinate material (periodic)? "If X, if Y, if Z, then W" is periodic. "He walked in and sat down" is running.

4. VOICE: Does this prose reward being read aloud? Can you find natural places for emphasis, dynamic range between loud and soft? Or does it resist performance — a flat, bureaucratic evenness where "you feel ridiculous trying to add a voice"?

5. REGISTER: Is the diction formal and Latinate (high), plain and Anglo-Saxon (low), or unmarked middle?

6. OPACITY: Does this prose draw attention to its own surface through sound patterns, rhetorical figures, meta-linguistic gestures, or deliberate structural display (opaque)? Or does it let you look through to the content without noticing the language itself (transparent)?`;

// ---------------------------------------------------------------------------
// Section B — Few-shot examples (from gold set)
// ---------------------------------------------------------------------------

export const FEW_SHOT_EXAMPLES = `
Here are three evaluated examples to calibrate your analysis:

EXAMPLE 1 (academic social-science prose):
"The connection between behaviour in the socially real world and dramatic performance is a double link. Much of everyday social behaviour and socially consequential action is itself composed, and often in a fashion which is recognised at the time as 'theatrical' or is revealed as such afterwards. When we construct special buildings or settings for ritual occasions of many kinds, from judicial proceedings to love-making, when we set scenes and dress up or dress down for a social occasion there is a resemblance, which may not be admitted even to ourselves, to the enactment of composed theatrical performances by professional actors. Tacitly or explicitly we constantly draw on symbolic references and typifications shared by playwright, actors and audience."
— Elizabeth Burns, Theatricality (1972)

{"axes": {"nounVerb": {"label": "predominantly noun-style", "confidence": 0.95, "justification": "Heavy nominalization throughout — connection, performance, resemblance, enactment, adoption, elaboration, analysis, interaction — chained with prepositional phrases (of/by/in/as). The noun + 'is' + prepositional phrase pattern suppresses action."}, "parataxisHypotaxis": {"label": "predominantly hypotactic", "confidence": 0.90, "justification": "Clauses embed inside each other through 'which,' 'when,' and 'that' constructions, creating multiple levels of subordination rather than coordinate chains."}, "periodicRunning": {"label": "predominantly running", "confidence": 0.80, "justification": "Main predications arrive early in each sentence, with qualifications and elaborations trailing afterward through appositives and relative clauses."}, "voice": {"label": "unvoiced", "confidence": 0.90, "justification": "The prose resists vocal performance — no natural places for emphasis or dynamic range. Flat, even pacing with no personality behind the statement."}, "primaryRegister": {"label": "high", "confidence": 0.90, "justification": "Formal Latinate diction throughout: 'consequential,' 'typifications,' 'dramaturgic.' Academic social-science register."}, "opacity": {"label": "transparent", "confidence": 0.85, "justification": "The language serves its conceptual argument without drawing attention to its own surface. No sound patterns, rhetorical figures, or structural display."}}}

EXAMPLE 2 (literary fiction):
"In the late summer of that year we lived in a house in a village that looked across the river and the plain to the mountains. In the bed of the river there were pebbles and boulders, dry and white in the sun, and the water was clear and swiftly moving and blue in the channels. Troops went by the house and down the road and the dust they raised powdered the leaves of the trees. The trunks of the trees too were dusty and the leaves fell early that year and we saw the troops marching along the road and the dust rising and leaves, stirred by the breeze, falling and the soldiers marching and afterwards the road bare and white except for the leaves."
— Ernest Hemingway, A Farewell to Arms

{"axes": {"nounVerb": {"label": "predominantly verb-style", "confidence": 0.90, "justification": "Active verbs drive the prose — lived, looked, went, raised, powdered, fell, saw, marching, rising, falling. No nominalizations; the prose moves through physical actions observed and endured."}, "parataxisHypotaxis": {"label": "predominantly paratactic", "confidence": 0.95, "justification": "The 'and' connection runs through the passage like a backbone — basically asyndetic with symbolic polysyndetic 'and.' Clauses are coordinated in parallel chains, never embedded inside each other."}, "periodicRunning": {"label": "predominantly running", "confidence": 0.90, "justification": "Main assertions arrive immediately — 'we lived,' 'there were pebbles,' 'Troops went by' — with observations trailing in coordinate chains. No suspended main clauses."}, "voice": {"label": "strongly voiced", "confidence": 0.90, "justification": "Strongly voiced through rhythmic flatness that is itself a deliberate stylistic choice. The controlled monotone creates a performable cadence — the Hemingway hero notes and endures the world he passes through."}, "primaryRegister": {"label": "low", "confidence": 0.90, "justification": "Monosyllabic Anglo-Saxon diction throughout: house, river, sun, dust, road, trees, leaves. No Latinate vocabulary."}, "opacity": {"label": "opaque", "confidence": 0.85, "justification": "The severe restriction of vocabulary and syntax draws attention to the prose surface. The relentless 'and' pattern, the repetition of 'dust' and 'leaves' and 'marching,' foregrounds the writing itself as a deliberate formal choice."}}}

EXAMPLE 3 (legal/parliamentary oratory):
"My Lords, I feel that I owe some apology to your lordships for standing in the way of any noble lords who wish to address you: but after much deliberation, and after consulting with several of my noble friends on both sides of the House, it did appear to us, as I am sure it will to your lordships, desirable, on many grounds, that the debate should be brought to a close this night; and I thought I could not better contribute to that end than by taking the present opportunity of addressing you. Indeed, I am urged on by the anxiety I feel on this mighty subject, which is so great, that I should hardly have been able to delay the expression of my opinion much longer; if I had, I feel assured that I must have lost the power to address you."
— Lord Brougham, House of Lords speech on Reform Bill (1832)

{"axes": {"nounVerb": {"label": "balanced", "confidence": 0.80, "justification": "Both nominal and verbal elements are present. Nominalizations appear (deliberation, expression, anxiety) alongside active first-person verbs (I feel, I owe, I thought, I am urged). Neither dominates."}, "parataxisHypotaxis": {"label": "predominantly hypotactic", "confidence": 0.90, "justification": "Three levels of subordination: first-rank statements, second-rank elaborations, third-rank qualifications. Clauses embed through 'that,' 'which,' 'if,' and participial phrases, creating ranked hierarchical structure."}, "periodicRunning": {"label": "predominantly periodic", "confidence": 0.90, "justification": "Front-loaded conditionals and qualifying clauses suspend the main predication. The reader must hold multiple subordinate elements in mind before reaching the resolution of each sentence."}, "voice": {"label": "strongly voiced", "confidence": 0.85, "justification": "First-person address with rhetorical force — 'My Lords, I feel.' The prose is meant for oral delivery and carries natural emphases, rises, and falls. The voice can stress and perform."}, "primaryRegister": {"label": "high", "confidence": 0.90, "justification": "Formal parliamentary diction: 'your lordships,' 'noble lords,' 'deliberation,' 'mighty subject.' Ceremonial Latinate register throughout."}, "opacity": {"label": "transparent", "confidence": 0.80, "justification": "The language serves the argument without calling attention to its own surface. Despite the elaborate syntax, there are no sound patterns, rhetorical figures, or self-conscious display — the prose is instrumental."}}}
`;

// ---------------------------------------------------------------------------
// Section C — Output schema
// ---------------------------------------------------------------------------

export const OUTPUT_SCHEMA = `Return your analysis as a single JSON object with this exact structure:
{
  "axes": {
    "nounVerb": {"label": "predominantly noun-style" | "balanced" | "predominantly verb-style", "confidence": 0.0-1.0, "justification": "1-2 sentences"},
    "parataxisHypotaxis": {"label": "predominantly paratactic" | "mixed" | "predominantly hypotactic", "confidence": 0.0-1.0, "justification": "1-2 sentences"},
    "periodicRunning": {"label": "predominantly periodic" | "mixed" | "predominantly running", "confidence": 0.0-1.0, "justification": "1-2 sentences"},
    "voice": {"label": "unvoiced" | "moderate voice" | "strongly voiced", "confidence": 0.0-1.0, "justification": "1-2 sentences"},
    "primaryRegister": {"label": "high" | "middle" | "low" | "mixed", "confidence": 0.0-1.0, "justification": "1-2 sentences"},
    "opacity": {"label": "transparent" | "mixed opacity" | "opaque", "confidence": 0.0-1.0, "justification": "1-2 sentences"}
  }
}
Do not include any text outside the JSON object. Do not wrap in markdown code blocks.`;

// ---------------------------------------------------------------------------
// Builder functions
// ---------------------------------------------------------------------------

/**
 * Assemble the full system prompt for the Lanham evaluator.
 * @param includeFewShot - whether to include the three calibration examples (default: true)
 */
export function buildSystemPrompt(includeFewShot: boolean = true): string {
  if (includeFewShot) {
    return FRAMEWORK_INTRO + '\n\n' + FEW_SHOT_EXAMPLES + '\n\n' + OUTPUT_SCHEMA;
  }
  return FRAMEWORK_INTRO + '\n\n' + OUTPUT_SCHEMA;
}

/**
 * Build the user-turn prompt wrapping a passage for evaluation.
 */
export function buildUserPrompt(passageText: string): string {
  return `Evaluate the following prose passage on all six Lanham axes:\n\n${passageText}`;
}

// ---------------------------------------------------------------------------
// Response types and parser
// ---------------------------------------------------------------------------

export interface AxisJudgment {
  label: string;
  confidence: number;
  justification: string;
}

export interface LanhamJudgment {
  axes: {
    [axis: string]: AxisJudgment;
  };
}

/** Canonical axis names in evaluation order. */
export const AXIS_NAMES = [
  'nounVerb',
  'parataxisHypotaxis',
  'periodicRunning',
  'voice',
  'primaryRegister',
  'opacity',
] as const;

export type AxisName = (typeof AXIS_NAMES)[number];

/**
 * Parse a raw LLM response into a structured LanhamJudgment.
 * Returns null if the response cannot be parsed or lacks the expected shape.
 */
export function parseJudgment(response: string): LanhamJudgment | null {
  try {
    // Strip markdown code blocks if the model wraps its output
    const cleaned = response
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object' && parsed.axes) {
      return parsed as LanhamJudgment;
    }
    return null;
  } catch {
    return null;
  }
}
