#!/usr/bin/env npx tsx
/**
 * Verification tests for ICP pipeline hardening (H-06, H-08, cross-author).
 * Run: npx tsx scripts/verify-hardening.ts
 */

import {
  isValidAuthorTitlePair,
  buildCorpusCatalog,
  loadManifestCanonicals,
  resolveAuthor,
  resolveTitle,
  getActiveBridges,
  extractTopicWords,
  expandQueryWithCanonicalTerms,
} from '../src/god-agent/shared/cross-author-utils.js';
import { KNOWN_KU_DOMAINS, parseKnowledgeUnit } from '../src/god-agent/retrieval/types.js';
import { loadAuthorKUIndex, getKUsByAuthor, loadKnowledgeUnitsSync } from '../src/god-agent/shared/jsonl-loaders.js';
import { deriveAuthorConflictEvents, summarizeOcrQuality } from '../src/god-agent/universal/quality-integration.js';
import * as fs from 'fs';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  FAIL: ${testName}`);
    failed++;
  }
}

// =============================================================================
// H-06: Author-Title Pairing Validation
// =============================================================================
console.log('\n=== H-06: Author-Title Pairing ===');

// Valid pairings
assert(isValidAuthorTitlePair('Aristotle', 'On The Soul (De Anima)'), 'Aristotle + De Anima = valid');
assert(isValidAuthorTitlePair('Aristotle', 'De Anima'), 'Aristotle + De Anima (Latin) = valid (alias)');
assert(isValidAuthorTitlePair('Aristotle', 'Physics'), 'Aristotle + Physics = valid');
assert(isValidAuthorTitlePair('Aristotle', 'Rhetoric'), 'Aristotle + Rhetoric = valid');
assert(isValidAuthorTitlePair('Heidegger, Martin', 'Being and Time'), 'Heidegger + Being and Time = valid');
assert(isValidAuthorTitlePair('Heidegger, Martin', 'Basic Concepts of Aristotelian Philosophy'), 'Heidegger + BCAP = valid');
assert(isValidAuthorTitlePair('Burke, Kenneth', 'A Grammar of Motives'), 'Burke + Grammar = valid');
assert(isValidAuthorTitlePair('von Uexkull, Jacob', 'A Foray Into the Worlds of Animals and Humans with A Theory of Meaning'), 'Uexkull + Foray = valid');

// Invalid pairings (hallucinations)
assert(!isValidAuthorTitlePair('Aristotle', 'Being and Time'), 'Aristotle + Being and Time = INVALID');
assert(!isValidAuthorTitlePair('Aristotle', "Plato's Sophist"), "Aristotle + Plato's Sophist = INVALID");
assert(!isValidAuthorTitlePair('Aristotle', 'De Memoria et Reminiscentia'), 'Aristotle + De Memoria = INVALID (not in corpus)');
assert(!isValidAuthorTitlePair('Heidegger, Martin', 'De Anima'), 'Heidegger + De Anima = INVALID');
assert(!isValidAuthorTitlePair('Heidegger, Martin', "Plato's Sophist"), "Heidegger + Plato's Sophist = INVALID");
assert(!isValidAuthorTitlePair('Burke, Kenneth', 'Being and Time'), 'Burke + Being and Time = INVALID');

// Edge cases
assert(!isValidAuthorTitlePair('Nonexistent Author', 'Any Title'), 'Unknown author = INVALID');
assert(!isValidAuthorTitlePair('Aristotle', 'Nonexistent Work'), 'Known author + unknown title = INVALID');

// Multi-work citation groups (Task #42)
assert(isValidAuthorTitlePair('Aristotle', 'Physics; De Anima'), 'Semicolon group: Physics; De Anima = valid');
assert(isValidAuthorTitlePair('Aristotle', 'Physics, De Anima'), 'Comma group: Physics, De Anima = valid');
assert(isValidAuthorTitlePair('Aristotle', 'Physics, De Anima, and Rhetoric'), 'Oxford comma: Physics, De Anima, and Rhetoric = valid');
assert(isValidAuthorTitlePair('Aristotle', 'Physics and Rhetoric'), '"And" group: Physics and Rhetoric = valid');
assert(!isValidAuthorTitlePair('Aristotle', 'Physics, De Anima, and Being and Time'), 'Poisoned group: includes Being and Time for Aristotle = INVALID');
assert(isValidAuthorTitlePair('Heidegger, Martin', 'Being and Time'), 'Title with "and": Being and Time = valid (exact match)');
// "Physics and" with trailing "and" is a sloppy citation — the substring match
// correctly identifies "Physics" within it, which is valid for Aristotle.
assert(isValidAuthorTitlePair('Aristotle', 'Physics and'), 'Trailing "and": Physics and = valid (sloppy but "Physics" is valid)');

// =============================================================================
// H-08: Authority Tiers
// =============================================================================
console.log('\n=== H-08: Authority Tiers ===');

const catalog = buildCorpusCatalog();
assert(catalog.includes('PRIMARY TEXTS:'), 'Catalog has PRIMARY section');
assert(catalog.includes('SECONDARY SCHOLARSHIP:'), 'Catalog has SECONDARY section');
assert(catalog.includes('Aristotle: On The Soul (De Anima)'), 'Aristotle De Anima in PRIMARY');
assert(catalog.includes('Heidegger, Martin: Being and Time'), 'Heidegger B&T in PRIMARY');
assert(catalog.includes('Frede, Dorothea'), 'Frede in SECONDARY');
assert(catalog.includes('Caston, Victor'), 'Caston in SECONDARY');

// Verify tier doesn't bleed
const primarySection = catalog.split('SECONDARY SCHOLARSHIP:')[0];
const secondarySection = catalog.split('SECONDARY SCHOLARSHIP:')[1] || '';
assert(!primarySection.includes('Frede, Dorothea'), 'Frede NOT in PRIMARY section');
assert(!primarySection.includes('Caston, Victor'), 'Caston NOT in PRIMARY section');
assert(!secondarySection.includes('Aristotle: On The Soul'), 'Aristotle De Anima NOT in SECONDARY section');

// =============================================================================
// Manifest Canonicals
// =============================================================================
console.log('\n=== Manifest Canonicals ===');

const manifest = loadManifestCanonicals();
assert(manifest.authorCanonical.size > 0, 'Author canonical table populated');
assert(manifest.titleCanonical.size > 0, 'Title canonical table populated');
assert(manifest.titleAuthority.size > 0, 'Title authority table populated');
assert(manifest.authorTitles.size > 0, 'Author-titles mapping populated');

// Author resolution
assert(resolveAuthor('heidegger') === 'Heidegger, Martin', 'resolveAuthor: heidegger → Heidegger, Martin');
assert(resolveAuthor('aristotle') === 'Aristotle', 'resolveAuthor: aristotle → Aristotle');
assert(resolveAuthor('uexkull') === 'von Uexkull, Jacob', 'resolveAuthor: uexkull → von Uexkull, Jacob');

// Title resolution
const resolvedDA = resolveTitle('De Anima');
assert(resolvedDA.includes('Soul') || resolvedDA.includes('Anima'), 'resolveTitle: De Anima resolves to manifest title');

// =============================================================================
// Cross-Author Bridges
// =============================================================================
console.log('\n=== Cross-Author Bridges ===');

const phantasiaTopics = extractTopicWords('phantasia and Erschlossenheit in disclosing the environment');
const bridges = getActiveBridges(phantasiaTopics);
assert(bridges.length > 0, 'Bridge detected for phantasia+Erschlossenheit prompt');
if (bridges.length > 0) {
  assert(bridges[0].id.includes('hook-de-anima'), 'Top bridge is hook-de-anima');
  assert(bridges[0].sourceAuthor !== 'Unknown', 'Bridge sourceAuthor resolved');
  assert(bridges[0].targetAuthor !== 'Unknown', 'Bridge targetAuthor resolved');
}

// =============================================================================
// Query Expansion (H-15)
// =============================================================================
console.log('\n=== Query Expansion (H-15) ===');

const expanded = expandQueryWithCanonicalTerms('Aristotle phantasia De Anima perception');
assert(expanded.length > 'Aristotle phantasia De Anima perception'.length, 'Query expanded with ontology terms');
assert(expanded.includes('φαντασία') || expanded.includes('phantasia'), 'Expansion includes Greek or transliterated terms');

// =============================================================================
// H-13: Domain Validation
// =============================================================================
console.log('\n=== H-13: Domain Validation ===');

// Known domains list is populated
assert(KNOWN_KU_DOMAINS.length >= 3, `Known domains: ${KNOWN_KU_DOMAINS.length} (expected >= 3)`);
assert(KNOWN_KU_DOMAINS.includes('aristotle'), 'aristotle is a known domain');
assert(KNOWN_KU_DOMAINS.includes('heidegger_bt'), 'heidegger_bt is a known domain');
assert(KNOWN_KU_DOMAINS.includes('rickert'), 'rickert is a known domain');

// Valid KU with known domain parses successfully
const validKU = parseKnowledgeUnit(JSON.stringify({
  id: 'ku_test_valid', claim: 'Test claim', sources: [], confidence: 'high', domain: 'aristotle'
}));
assert(validKU !== null, 'Valid KU with known domain parses OK');
assert((validKU as any)?.domain === 'aristotle', 'Domain preserved after parse');

// Valid KU with unknown domain still parses (warn, not block)
const unknownDomainKU = parseKnowledgeUnit(JSON.stringify({
  id: 'ku_test_unknown', claim: 'Test claim', sources: [], confidence: 'high', domain: 'political_philosophy'
}));
assert(unknownDomainKU !== null, 'KU with unknown domain still parses (warn, not block)');
assert((unknownDomainKU as any)?.domain === 'political_philosophy', 'Unknown domain preserved (not rejected)');

// Auto-normalization: uppercase → lowercase
const upperKU = parseKnowledgeUnit(JSON.stringify({
  id: 'ku_test_upper', claim: 'Test claim', sources: [], confidence: 'high', domain: 'Aristotle'
}));
assert(upperKU !== null, 'KU with uppercase domain parses OK');
assert((upperKU as any)?.domain === 'aristotle', 'Domain auto-normalized to lowercase');

// All 401 existing KUs parse without errors
let kuParseErrors = 0;
const kuLines = fs.readFileSync('god-learn/knowledge.jsonl', 'utf-8').split('\n').filter(l => l.trim());
for (const line of kuLines) {
  if (parseKnowledgeUnit(line) === null) kuParseErrors++;
}
assert(kuParseErrors === 0, `All ${kuLines.length} existing KUs parse without errors (${kuParseErrors} failures)`);

// =============================================================================
// H-09: Author-Level KU Index
// =============================================================================
console.log('\n=== H-09: Author-Level KU Index ===');

const authorIndex = loadAuthorKUIndex();
assert(authorIndex instanceof Map, 'loadAuthorKUIndex returns a Map');
assert(authorIndex.size > 0, `Author index has ${authorIndex.size} authors (expected > 0)`);
assert(authorIndex.has('Aristotle'), 'Aristotle exists as a key in author index');
assert((authorIndex.get('Aristotle')?.length ?? 0) > 0, 'Aristotle has > 0 KUs');

// Parity check: index count matches fresh runtime filter
const allKUs = loadKnowledgeUnitsSync();
const aristotleFiltered = allKUs.filter(ku => {
  const sources = (ku as any).sources;
  return Array.isArray(sources) && sources.length > 0 && sources[0]?.author === 'Aristotle';
});
assert(
  authorIndex.get('Aristotle')?.length === aristotleFiltered.length,
  `Aristotle index parity: ${authorIndex.get('Aristotle')?.length} === ${aristotleFiltered.length} (fresh filter)`
);

// Normalization path via getKUsByAuthor
const heideggerKUs = getKUsByAuthor('heidegger');
assert(heideggerKUs.length > 0, `getKUsByAuthor("heidegger") returns ${heideggerKUs.length} KUs (expected > 0)`);

const uexkullKUs = getKUsByAuthor('uexkull');
assert(uexkullKUs.length > 0, `getKUsByAuthor("uexkull") returns ${uexkullKUs.length} KUs (expected > 0)`);

// =============================================================================
// H-12: Author Conflict Events
// =============================================================================
console.log('\n=== H-12: Author Conflict Events ===');

// Test with mock tensions — both acknowledged and unacknowledged
const mockAllTensions = [
  { tensionId: 'CT-01', nodeA: 'energeia (Met)', nodeB: 'energeia (Rhet)', description: 'Metaphysical vs rhetorical' },
  { tensionId: 'CT-02', nodeA: 'phantasia (DA)', nodeB: 'Erschlossenheit (BT)', description: 'Faculty vs existential' },
];
const mockUnack = [
  { tensionId: 'CT-02', nodeA: 'phantasia (DA)', nodeB: 'Erschlossenheit (BT)', description: 'Faculty vs existential' },
];
const conflictEvents = deriveAuthorConflictEvents('facet-test-01', 2, 1, mockUnack, mockAllTensions);
assert(conflictEvents.length === 2, `Conflict events: ${conflictEvents.length} === 2 (one per tension)`);
assert(conflictEvents[0].unacknowledged === false, 'First tension (CT-01) is acknowledged');
assert(conflictEvents[1].unacknowledged === true, 'Second tension (CT-02) is unacknowledged');
assert(conflictEvents[0].facetId === 'facet-test-01', 'Event carries facetId');
assert(conflictEvents[1].authors.length === 2, 'Event carries 2 authors');
assert(conflictEvents[0].timestamp.length > 0, 'Event has timestamp');

// Empty case
const noConflicts = deriveAuthorConflictEvents('facet-empty', 0, 0, [], []);
assert(noConflicts.length === 0, 'No events when no tensions');

// =============================================================================
// H-14: OCR Quality Summary
// =============================================================================
console.log('\n=== H-14: OCR Quality Summary ===');

// Mock spans with OCR scores
const mockSpans = [
  { ocr_quality: 0.95 },
  { ocr_quality: 0.90 },
  { ocr_quality: 0.70 },
];
const ocrSummary = summarizeOcrQuality(mockSpans);
assert(ocrSummary !== undefined, 'OCR summary returned for scored spans');
assert(ocrSummary!.min === 0.70, `OCR min: ${ocrSummary!.min} === 0.70`);
assert(ocrSummary!.max === 0.95, `OCR max: ${ocrSummary!.max} === 0.95`);
assert(ocrSummary!.low_quality_count === 1, `Low quality count: ${ocrSummary!.low_quality_count} === 1 (below 0.8 threshold)`);
assert(Math.abs(ocrSummary!.average - 0.85) < 0.001, `OCR average: ${ocrSummary!.average} ≈ 0.85`);

// Empty case — no spans have OCR scores (current corpus state)
const noOcr = summarizeOcrQuality([{}, {}, {}]);
assert(noOcr === undefined, 'OCR summary undefined when no spans have scores');

// =============================================================================
// Summary
// =============================================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`  PASSED: ${passed}`);
console.log(`  FAILED: ${failed}`);
console.log(`  TOTAL:  ${passed + failed}`);
console.log(`${'='.repeat(50)}`);

process.exit(failed > 0 ? 1 : 0);
