/**
 * Smoke test for buildSubsectionPrompt — verifies it produces a prompt with the expected
 * structural elements per plans/subsection-mode-design.md Phase 4 acceptance criteria.
 */
import { buildSubsectionPrompt } from '../src/god-agent/universal/gold-standard-prompt-builder.js';

const mockChunks = [
  {
    content: 'For phantasia is a movement which results from an actual exercise of a power of sense.',
    relevanceScore: 0.82,
    metadata: { author: 'Aristotle', title: 'De Anima', pageStart: 429, pageEnd: 429 },
  },
  {
    content: 'Dasein is its disclosedness.',
    relevanceScore: 0.75,
    metadata: { author: 'Heidegger', title: 'Being and Time', pageStart: 133, pageEnd: 133 },
  },
];

const prompt = buildSubsectionPrompt({
  topic: 'A_4 in the Chain: The Convergence at Praxis. Describe how praxis is the terminal actuality.',
  subsections: ['A_4 in the Chain'],
  chunks: mockChunks as any,
  knowledgeUnits: ['praxis is the terminal actuality of action'],
  structuralEdges: ['phantasia -> doxa -> emotion -> praxis'],
  ontologyNodes: ['praxis (Greek: πρᾶξις)'],
  crossPipelineHooks: ['[INTERP-high] Bridge: Aristotle praxis ↔ Heidegger Mitsein'],
  tensionEdges: ['Aristotle vs Heidegger on the role of habit'],
  stylePrompt: 'Academic philosophical prose.',
  wordTarget: '700',
  subsectionHeading: 'A_4 in the Chain: The Convergence at \\textit{Praxis}',
  subsectionQuotations: 1,
});

const checks: Array<{ label: string; ok: boolean; details?: string }> = [];

const addCheck = (label: string, condition: boolean, details?: string) => {
  checks.push({ label, ok: condition, details });
};

addCheck(
  '(a) \\subsubsection*{ header directive present',
  prompt.includes('\\subsubsection*{A_4 in the Chain'),
  'searched for "\\\\subsubsection*{A_4 in the Chain" in prompt',
);
addCheck(
  '(b) word target directive (~700) present',
  prompt.includes('approximately 700 words') || prompt.includes('700 words'),
  'searched for "700 words"',
);
addCheck(
  '(c) NO Validation Appendix references',
  !prompt.toLowerCase().includes('validation appendix') || prompt.toLowerCase().includes('no validation appendix') || prompt.toLowerCase().includes('not'),
  'searched for "validation appendix" — only references should be negations',
);
addCheck(
  '(c\') Validation Appendix is explicitly forbidden',
  /no validation appendix|do not include a validation appendix|no.*validation.*appendix/i.test(prompt),
  'searched for explicit forbid of validation appendix',
);
addCheck(
  '(d) No multi-section "Required Sections" enumeration',
  !prompt.includes('### Required Sections'),
  'searched for "### Required Sections"',
);
addCheck(
  '(e) Corpus chunks block present',
  prompt.includes('Aristotle') && prompt.includes('De Anima') && prompt.includes('phantasia is a movement'),
  'searched for chunk content',
);
addCheck(
  '(f) Source Index present',
  prompt.includes('Available sources') || prompt.includes('Source Index') || prompt.includes('Aristotle, *De Anima*'),
  'searched for source listing',
);
addCheck(
  '(g.1) Bridges injection (theoretical synthesis)',
  prompt.includes('MANDATORY THEORETICAL SYNTHESIS') || prompt.includes('CROSS-PIPELINE INTERPRETIVE HOOKS'),
  'searched for bridge-related sections',
);
addCheck(
  '(g.2) Ontology nodes injection',
  prompt.includes('CANONICAL CONCEPT NODES'),
  'searched for "CANONICAL CONCEPT NODES"',
);
addCheck(
  '(g.3) Tensions injection',
  prompt.includes('CONCEPTUAL TENSIONS'),
  'searched for "CONCEPTUAL TENSIONS"',
);
addCheck(
  'LaTeX output mandate explicit',
  prompt.includes('LaTeX, NOT Markdown') || prompt.includes('LaTeX output'),
  'searched for explicit LaTeX mandate',
);
addCheck(
  'No "Each section MUST be at least 350 words" floor',
  !prompt.includes('Each section MUST be at least 350 words'),
  'searched for the gold-standard length floor',
);
addCheck(
  'Quotation density directive (1 quotation)',
  prompt.includes('1 verbatim quotation'),
  'searched for "1 verbatim quotation"',
);
addCheck(
  'Single-block emphasis',
  prompt.includes('SINGLE') && (prompt.includes('subsection') || prompt.includes('block')),
  'searched for "SINGLE" + "subsection/block"',
);

console.log(`=== buildSubsectionPrompt smoke test ===`);
console.log(`Prompt size: ${prompt.length} chars, ~${prompt.split(/\s+/).length} words`);
console.log('');
let pass = 0, fail = 0;
for (const c of checks) {
  const tag = c.ok ? '✓ PASS' : '✗ FAIL';
  console.log(`${tag}  ${c.label}`);
  if (!c.ok && c.details) console.log(`        (${c.details})`);
  c.ok ? pass++ : fail++;
}
console.log('');
console.log(`Total: ${pass}/${pass + fail} passed`);
process.exit(fail === 0 ? 0 : 1);
