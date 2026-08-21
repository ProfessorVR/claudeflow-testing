# Lanham Prose Analysis Module - Complete Implementation Guide

**Version:** 1.0 (commit `50f87f361` on `writing-pipeline-v2`)
**Date:** 2026-04-16
**Total Lines:** 4,099 across 13 core files
**Dependencies:** Zero external (pure TypeScript, no NLP libraries, no LLM calls for analysis)
**Runtime:** Node.js / Bun with TypeScript (ESM modules with `.js` extension imports)

---

## 1. What This Module Does

The Lanham module is a computational implementation of Richard A. Lanham's prose analysis framework from *Analyzing Prose* (2003). It takes arbitrary English text and produces a multi-axis rhetorical profile measuring **7 dimensions of prose style**:

1. **Noun/Verb Axis** - Is the prose dominated by nominalizations ("the implementation of") or active verbs ("they implemented")?
2. **Parataxis/Hypotaxis** - Are clauses coordinated ("and...and...and") or subordinated ("because...although...since")?
3. **Periodic/Running** - Is the main predication delayed (periodic suspension) or delivered early (running style)?
4. **Voice** - Does the prose have rhythmic personality and dynamic range, or is it bureaucratically flat?
5. **Register** - Is the diction high (Latinate, formal), low (Anglo-Saxon, colloquial), or middle?
6. **Opacity/Transparency** - Does the prose draw attention to its own surface (opaque/AT) or let you look through to content (transparent/THROUGH)?
7. **Tacit Persuasion Patterns** - Are rhetorical figures present (alliteration, chiasmus, anaphora, isocolon, antithesis, polyptoton, climax)?

The module operates at **two tiers**:
- **Tier 1 (Heuristic):** Regex/counting heuristics. Fast, no deps. Confidence: high for noun/verb and register, medium for others.
- **Tier 2 (Deep):** Clause-level POS tagging, phonemic analysis, semantic opposition detection. Upgrades periodic/running from LOW to MEDIUM, parataxis from MEDIUM to HIGH.

### Integration with God-Agent Write Pipeline

The module integrates into the god-agent writing pipeline as a **style enforcement loop**:

```
[Style Profile] --> [Lanham Analysis of corpus samples]
                          |
                    [Target Metrics stored on profile]
                          |
[Section Generation] --> [Lanham Analysis of draft]
                          |
                    [Drift Detection: compare draft vs. target]
                          |
                    [Conditional Regeneration if hard constraints violated]
                          |
                    [Revision Guidance for next section]
```

---

## 2. Architecture

### File Map

```
src/god-agent/
  cli/style/
    lanham-analyzer-interface.ts   (18 lines)   Interface contract: ILanhamAnalyzer
    lanham-shared.ts               (212 lines)  Shared constants + utilities
    lanham-style-policy.ts         (104 lines)  Genre-specific thresholds (6 genres)
    lanham-prose-analyzer.ts       (849 lines)  Tier 1: heuristic analyzer
    advanced-lanham-analyzer.ts    (1049 lines) Tier 2: deep analyzer (POS + phonemic)
  universal/
    lanham-style-controller.ts     (307 lines)  Facade: drift detection + regeneration
    style-analyzer.ts              (modified)   LanhamProseMetrics type definition
    stages/stage-types.ts          (modified)   LanhamStyleTarget type definition
  agents/
    lanham-prose-analyst.ts        (612 lines)  4-mode conversational agent

scripts/
  enrich-style-lanham.mjs         (140 lines)  Profile enrichment CLI tool

tests/
  god-agent/cli/style/
    lanham-prose-analyzer.test.ts  (160 lines)  Unit tests
  integration/
    lanham-pipeline-smoke.test.ts  (59 lines)   Pipeline smoke test
  calibration/
    lanham-calibration.test.ts     (509 lines)  Gold set calibration suite
    lanham-gold-set.jsonl          (40 lines)   Active gold set
    lanham-gold-set-authoritative.jsonl (40 lines) Authoritative gold set

god-learn/
  analysis-trajectories.jsonl      (19 lines)   Worked-example trajectories
```

### Dependency Graph

```
lanham-shared.ts (constants + utilities)
    |
    +---> lanham-style-policy.ts (genre thresholds)
    |         |
    +---> lanham-prose-analyzer.ts (Tier 1)
    |         |
    |         +---> advanced-lanham-analyzer.ts (Tier 2, wraps Tier 1)
    |
    +---> lanham-analyzer-interface.ts (ILanhamAnalyzer contract)
              |
              +---> lanham-style-controller.ts (facade)
              |         |
              |         +---> lanham-prose-analyst.ts (agent, 4 modes)
              |
              +---> [write-pipeline-orchestrator.ts] (consumer)
```

### Type Dependencies (must exist in your codebase)

Two types must be defined in your god-agent's type system:

**`LanhamProseMetrics`** (in `style-analyzer.ts` or equivalent):
```typescript
export interface LanhamProseMetrics {
  // 15 continuous numeric fields
  nounVerbRatio: number;                    // 0=pure noun, 1=pure verb
  nominalizationDensity: number;            // per 100 words
  prepositionalPhraseDensity: number;       // per sentence
  beVerbRatio: number;                      // be-verbs as fraction of all verbs
  parataxisHypotaxisRatio: number;          // 0=parataxis, 1=hypotaxis
  coordinatingConjunctionDensity: number;
  subordinatingConjunctionDensity: number;
  periodicRunningRatio: number;             // 0=periodic, 1=running
  preMainVerbClauseCount: number;
  voiceScore: number;                       // 0=unvoiced, 1=strongly voiced
  dynamicRange: number;                     // sentence length variance
  latinateGermanicRatio: number;            // lexical register cue
  registerMarkednessScore: number;          // 0=unmarked middle, 1=strongly marked
  opacityScore: number;                     // 0=transparent, 1=opaque
  selfConsciousnessScore: number;

  tacitPatterns: {
    alliterationDensity: number;
    polyptotonDensity: number;
    chiasmusCount: number;
    antithesisCount: number;
    anaphoraCount: number;
    isocolonCount: number;
    climaxPatternCount: number;
  };

  labels: {
    nounVerb: 'predominantly noun-style' | 'balanced' | 'predominantly verb-style';
    parataxisHypotaxis: 'predominantly paratactic' | 'mixed' | 'predominantly hypotactic';
    periodicRunning: 'predominantly periodic' | 'mixed' | 'predominantly running';
    voice: 'unvoiced' | 'moderate voice' | 'strongly voiced';
    primaryRegister: 'high' | 'middle' | 'low' | 'mixed';
    registerMixed: boolean;
    opacity: 'transparent' | 'mixed opacity' | 'opaque';
  };

  explanations: {
    nounVerb: string;
    parataxisHypotaxis: string;
    periodicRunning: string;
    voice: string;
    register: string;
    opacity: string;
    tacitPatterns: string;
  };

  analysisDepth: 'heuristic' | 'deep' | 'hybrid';
  confidenceByAxis: {
    nounVerb: 'high' | 'medium' | 'low';
    parataxisHypotaxis: 'high' | 'medium' | 'low';
    periodicRunning: 'high' | 'medium' | 'low';
    voice: 'high' | 'medium' | 'low';
    register: 'high' | 'medium' | 'low';
    opacity: 'high' | 'medium' | 'low';
    tacitPatterns: 'high' | 'medium' | 'low';
  };
}
```

**`LanhamStyleTarget`** (in `stage-types.ts` or equivalent):
```typescript
export interface LanhamStyleTarget {
  atThroughMode: 'mostly transparent' | 'transparent with AT moments'
    | 'oscillating' | 'mostly opaque';
  genre: 'academic' | 'legal' | 'narrative' | 'journalistic' | 'technical' | 'general';
  voiceTarget: 'voiced' | 'moderate' | 'unvoiced';
  registerTarget?: 'high' | 'middle' | 'low' | 'mixed';
  allowRegisterPlay?: boolean;
  tacitPersuasionLevel?: 'almost none' | 'some' | 'moderate' | 'dense';
  emphasisAxes?: string[];
}
```

---

## 3. How Each Heuristic Works

### 3.1 Noun/Verb Axis (nounVerbRatio: 0=noun, 1=verb)

**Signals measured:**
- **Nominalization density:** Words ending in -tion, -sion, -ment, -ness, -ity, -ence, -ance, -ism, -ure (with exclusion list for words like "question", "nature", etc.)
- **Be-verb ratio:** is/are/was/were/been/being/am as fraction of total verbs
- **Prepositional phrase density:** Prepositions per sentence (50-word preposition set)
- **Action verb density:** Total verbs minus be-verbs, normalized

**Formula:**
```
nounSignal = (nomDensity/6)*0.45 + beVerbRatio*0.25 + (ppDensity/5)*0.30
verbSignal = actionVerbCount / wordCount / 0.14
nounVerbRatio = (verbSignal - nounSignal + 1) / 2    [clamped 0-1]
```

**Override:** When all three noun-style signals exceed genre thresholds simultaneously (nominalization > 8/100, be-verb > 25%, PP > 3.0/sentence for academic), "balanced" is overridden to "predominantly noun-style."

### 3.2 Parataxis/Hypotaxis (0=paratactic, 1=hypotactic)

**Signals:**
- Explicit coordinating conjunctions (and, but, or, nor, for, yet, so)
- Explicit subordinating conjunctions (30-word set: although, because, since, etc.)
- Implicit subordination: relative clause patterns (that/which/who + verb within 3 words)
- Prepositional phrase nesting depth (consecutive prepositions)
- Sentence-initial conjunctions ("And", "But" starting a sentence = paratactic macro-structure)
- Average sentence length (short = paratactic tendency)

**Tier 2 upgrade:** Adds participial phrase detection at clause boundaries, nesting depth measurement, weighted scoring with nesting bonus.

### 3.3 Periodic/Running (0=periodic, 1=running)

**Signals (Tier 1):**
- Front-loaded subordination (sentence starts with subordinating conjunction)
- Participial openings (sentence starts with -ing/-ed word)
- Comma distribution: early commas vs. late commas relative to sentence midpoint
- Short sentences (<10 words) = running; long sentences (30+) with coordinate chains = running

**Tier 2 upgrade:** Clause-level analysis: splits sentences at punctuation, locates main verb clause position, computes suspension ratio (material before main predication / total material).

### 3.4 Voice (0=unvoiced, 1=voiced)

**Positive signals:**
- Dynamic range: coefficient of variation of sentence lengths (0.30 weight)
- Personality markers: "I believe/think/argue", "crucially/importantly", etc. (0.25 weight)
- Deliberate restriction: very short avg sentence length is itself a voice (Hemingway effect) (0.15 weight)
- Rhetorical repetition: repeated sentence openings (anaphora-like) in rhetorical context (0.15 weight)
- Engagement: question/exclamation density (0.15 weight)

**Negative signals (unvoiced):**
- Passive voice density (is/are/was/were + past participle)
- Filler phrases ("of course", "as you know", "in terms of", "with respect to")
- Impersonal subject starts ("The X", "It", "This", "These")
- Absence of personality markers
- Absence of engagement markers

**Formula:** `voiceScore = (1 - unvoicedSignal)*0.60 + positiveVoice*0.40`

### 3.5 Register (registerMarkednessScore: 0=low, 0.5=middle, 1=high)

**High-register signals:**
- Latinate vocabulary ratio (suffixes: -tion, -sion, -ment, -ance, -ence, -ity, -ous, -ive, -able, -ible, -al, -ual)
- Polysyllabic word ratio (8+ characters)
- Formal discourse markers (furthermore, moreover, nevertheless, etc.)
- Long average sentence length
- Semicolon density
- Average word length

**Low-register signals:**
- Contraction frequency
- Short average sentence length (<12 words)
- Short average word length (<5 chars)
- Anglo-Saxon vocabulary dominance

**Genre-specific thresholds** determine label boundaries (e.g., academic: lowToMiddle=0.15, middleToHigh=0.30; narrative: lowToMiddle=0.25, middleToHigh=0.45).

### 3.6 Opacity/Transparency (0=transparent, 1=opaque)

Lanham's AT/THROUGH distinction: opaque prose draws attention to its own surface.

**Six signals (weighted):**
1. Sound patterns: triple alliteration of content words (0.20)
2. Polysyndeton: "and" density as deliberate connector chaining (0.15)
3. Repetition: repeated content words creating surface awareness (0.20)
4. Sentence length extremes: fragments or very long sentences = display (0.15)
5. Meta-linguistic markers: "the word X", "so-called", "in the sense that" (0.15)
6. Content-level opacity: prose about language/form/rhetoric (0.15)

**Post-processing:** Tacit pattern density (from axis 7) further adjusts opacity: rhetorical figures, alliteration density, and polyptoton density are blended with base opacity (50% base + 25% tacit + 15% alliteration + 10% polyptoton).

### 3.7 Tacit Persuasion Patterns

Detects 7 classical rhetorical figures:

| Figure | Detection Method |
|--------|-----------------|
| **Alliteration** | 3+ adjacent content words sharing initial consonant |
| **Polyptoton** | Same stem in different forms within 8-word window (via `roughStem()`) |
| **Chiasmus** | A-B...B-A stem reversal across sentence pairs; Tier 2 adds POS trigram reversal |
| **Antithesis** | Semantic opposition pairs within 40 characters; Tier 2 adds balanced clause length + opposition markers |
| **Anaphora** | 3+ consecutive sentences with identical 3-word opening |
| **Isocolon** | 3+ consecutive sentences within 20% word count of each other |
| **Climax** | 3+ consecutive sentences with ascending length (min 5-word spread) |

---

## 4. Calibration Metrics

Calibrated against 40 authoritative passages from Lanham's *Analyzing Prose* (all 9 chapters), covering 12 genre groups.

### Per-Axis Scores (Spearman rank monotonicity)

| Axis | Tier | Monotonicity | Target | Status |
|------|------|-------------|--------|--------|
| nounVerb | Hard | 0.590 | 0.85 | BELOW (regex ceiling) |
| register | Hard | 0.574 | 0.85 | BELOW (regex ceiling) |
| voice | Firm | 0.372 | 0.75 | BELOW |
| parataxisHypotaxis | Soft | 0.372 | 0.70 | BELOW |
| opacity | Soft | 0.193 | 0.70 | BELOW |
| periodicRunning | Info | 0.349 | 0.65 | BELOW |

**Important:** These scores reflect the regex heuristic ceiling. The synthetic gold set (25 entries) gave inflated scores (register 0.894, voice 0.777) because the synthetic labels were easier to predict. The authoritative 40-passage gold set from the actual book is the ground truth.

### Known Ceiling Factors

1. **Noun/verb:** Be-verb exclusion helps but "balanced" labels dominate the gold set (26/40 = 65%)
2. **Register:** Latinate ratio is a decent lexical proxy but misses sentence complexity and formality signals beyond vocabulary
3. **Voice:** The unvoiced/voiced distinction requires understanding authorial intention, not just measurable signals
4. **Opacity:** True opacity (Lanham's AT/THROUGH) is fundamentally a reader-response phenomenon that regex cannot fully capture
5. **Periodic/running:** Requires genuine syntactic parsing; heuristic comma-position analysis is coarse

### Path Forward

The heuristic module is useful for **relative ranking** (this passage is more noun-heavy than that one) and for **flagging extreme outliers** (clearly unvoiced bureaucratic prose, clearly paratactic Hemingway). For absolute label accuracy on diverse literary/academic prose, LLM-assisted analysis would be needed as a Tier 3.

---

## 5. Step-by-Step Implementation Guide

### Step 1: Create Type Definitions

Add `LanhamProseMetrics` and `LanhamStyleTarget` (see Section 2 above) to your type system. These are the contracts that all other modules depend on.

### Step 2: Drop in Core Files (5 files)

Copy these files preserving the directory structure relative to your god-agent source root:

1. `cli/style/lanham-analyzer-interface.ts` - 18 lines, the interface contract
2. `cli/style/lanham-shared.ts` - 212 lines, shared constants and utilities
3. `cli/style/lanham-style-policy.ts` - 104 lines, genre-specific thresholds
4. `cli/style/lanham-prose-analyzer.ts` - 849 lines, the Tier 1 analyzer
5. `cli/style/advanced-lanham-analyzer.ts` - 1049 lines, the Tier 2 analyzer

**Import path adjustments needed:**
- All files import `LanhamProseMetrics` from `../../universal/style-analyzer.js` - adjust to wherever your type lives
- The interface file is at `./lanham-analyzer-interface.js` - adjust if you rename
- Policy is at `./lanham-style-policy.js` - adjust if you rename

### Step 3: Drop in Controller (1 file)

Copy `universal/lanham-style-controller.ts` (307 lines). This is the facade that your orchestrator calls.

**Import adjustments:**
- `LanhamProseMetrics` from `./style-analyzer.js`
- `LanhamStyleTarget` from `./stages/stage-types.js`
- Analyzers from `../cli/style/`

### Step 4: Drop in Agent (1 file)

Copy `agents/lanham-prose-analyst.ts` (612 lines). This provides 4 analysis modes:
- **describe**: Non-evaluative structural analysis
- **revise**: Generates before/after revision pairs + orchestrator instructions
- **critique**: Evaluates text against a declared LanhamStyleTarget
- **teach**: Metacommentary in Lanham's pedagogical style (AT/THROUGH, duck/rabbit)

**Data dependency:** The agent loads `god-learn/analysis-trajectories.jsonl` for trajectory selection. Copy this file too.

### Step 5: Wire into Your Orchestrator

The controller exposes 3 methods your orchestrator needs:

```typescript
// 1. Instantiate (once per write task)
const controller = new LanhamStyleController({
  analyzerTier: 'heuristic',  // or 'deep' or 'auto'
  genre: 'academic',
  targetMetrics: profileLanhamMetrics,  // from style profile
  lanhamStyleTarget: {
    atThroughMode: 'transparent with AT moments',
    genre: 'academic',
    voiceTarget: 'moderate',
    registerTarget: 'high',
  },
});

// 2. After each section draft, check for drift + conditionally regenerate
const result = await controller.maybeRegenerateWithLanham(
  sectionContent,
  async (advisory) => {
    // Your regeneration function: re-prompt the LLM with the advisory
    return await regenerateWithAdvisory(advisory);
  }
);
sectionContent = result.content;  // original or regenerated

// 3. Get revision guidance for the NEXT section
const guidance = await controller.buildLanhamRevisionGuidance(sectionContent);
// Pass this guidance into the next section's prompt
```

### Step 6: Enrich Style Profiles

Run the enrichment script to add Lanham metrics to existing style profiles:

```bash
node scripts/enrich-style-lanham.mjs                  # Tier 1 (default)
node scripts/enrich-style-lanham.mjs --analyzer advanced  # Tier 2
```

This reads `.agentdb/universal/style-profiles.json`, runs `fullAnalysis()` on each profile's `sampleTexts`, and stores the resulting `LanhamProseMetrics` on `profile.characteristics.lanhamMetrics`.

### Step 7: Run Tests

```bash
# Unit tests (should all pass immediately)
npx vitest run tests/god-agent/cli/style/lanham-prose-analyzer.test.ts

# Calibration suite (reports agreement + monotonicity per axis)
npx vitest run tests/calibration/lanham-calibration.test.ts
```

---

## 6. Genre Configuration

The policy file defines 6 genres with per-axis thresholds:

| Genre | nounVerb Bands | Register Boundaries | Voice Bands | Expected Defaults |
|-------|---------------|---------------------|-------------|-------------------|
| academic | 0.35-0.65 | low>0.15, high>0.30 | 0.30-0.70 | high register, moderate tacit |
| legal | 0.25-0.55 | low>0.15, high>0.30 | 0.20-0.50 | high register, almost no tacit |
| narrative | 0.40-0.70 | low>0.25, high>0.45 | 0.40-0.75 | mixed register, some tacit |
| journalistic | 0.40-0.70 | low>0.25, high>0.45 | 0.35-0.70 | middle register, some tacit |
| technical | 0.30-0.60 | low>0.20, high>0.40 | 0.20-0.50 | middle register, no tacit |
| general | 0.35-0.65 | low>0.25, high>0.45 | 0.30-0.70 | middle register, some tacit |

The `nounStyleOverride` thresholds allow the system to override a "balanced" nounVerb label when all three noun-style signals (nominalization, be-verbs, prepositional phrases) simultaneously exceed genre-specific ceilings.

---

## 7. Drift Detection & Regeneration Logic

The controller implements a tiered enforcement system:

### Hard Constraints (trigger regeneration)
- **nounVerb axis**: If draft label drifts away from target label
- **primaryRegister axis**: Any label mismatch triggers

### Firm Guidance (advisory only, no regeneration)
- **voice axis**: Advisory issued when voice drops from "strongly voiced" target to "unvoiced"

### Soft/Informational (not enforced)
- parataxisHypotaxis, opacity, periodicRunning, tacitPatterns

### Regeneration Flow
1. Analyze drafted section with `fullAnalysis()`
2. Compare labels on hard-constraint axes against target
3. If any hard constraint violated: build correction prompt with specific guidance
4. Call regeneration function (your LLM re-prompting)
5. Re-analyze regenerated content
6. Return whichever version is final (no recursive regen)

---

## 8. Gold Set Details

The authoritative gold set contains 40 passages from Lanham's *Analyzing Prose*, covering all 9 chapters:

| Genre Group | Count | Example Authors |
|-------------|-------|-----------------|
| Academic (humanities, social sci, sciences) | 4 | Burns, Bradley, Lichtenstein, geology excerpt |
| Legal | 3 | Federal Register (original + revised), Brougham |
| Political | 6 | Declaration, Gettysburg, Churchill (3), Eisenhower, Marx |
| Literary Fiction | 5 | Woolf, Hemingway, Malory, Dickens, Sterne, James |
| Narrative Nonfiction | 3 | Dean, Drummond, Herr, Cage |
| Literary Criticism | 1 | Swinburne |
| Journalism | 1 | Variety |
| Polemical | 2 | Mencken, Hennesy |
| Religious | 1 | Bible (Matthew 5) |
| Textbook | 1 | Pittsburgh 3rd-grade textbook |
| Military | 1 | Eisenhower letter |
| Personal Correspondence | 1 | Janet Flanner |

Each entry has: `id`, `genre`, `text`, `labels` (all 6 axes), `source` (full citation), `notes` (Lanham's own commentary).

---

## 9. Manifest of Included Files

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | `src/cli/style/lanham-analyzer-interface.ts` | 18 | ILanhamAnalyzer interface |
| 2 | `src/cli/style/lanham-shared.ts` | 212 | Shared constants + utilities |
| 3 | `src/cli/style/lanham-style-policy.ts` | 104 | Genre thresholds (6 genres) |
| 4 | `src/cli/style/lanham-prose-analyzer.ts` | 849 | Tier 1 heuristic analyzer |
| 5 | `src/cli/style/advanced-lanham-analyzer.ts` | 1049 | Tier 2 deep analyzer |
| 6 | `src/universal/lanham-style-controller.ts` | 307 | Pipeline facade |
| 7 | `src/agents/lanham-prose-analyst.ts` | 612 | 4-mode conversational agent |
| 8 | `scripts/enrich-style-lanham.mjs` | 140 | Profile enrichment CLI |
| 9 | `tests/unit/lanham-prose-analyzer.test.ts` | 160 | Unit tests |
| 10 | `tests/integration/lanham-pipeline-smoke.test.ts` | 59 | Pipeline smoke test |
| 11 | `tests/calibration/lanham-calibration.test.ts` | 509 | Calibration suite |
| 12 | `tests/calibration/lanham-gold-set.jsonl` | 40 | Active gold set |
| 13 | `tests/calibration/lanham-gold-set-authoritative.jsonl` | 40 | Authoritative gold set |
| 14 | `data/analysis-trajectories.jsonl` | 19 | Worked-example trajectories |
| 15 | `docs/lanham-module-port-plan.md` | 615 | Original port plan |
| 16 | `docs/lanham-audit-report.md` | - | Code audit report |
| 17 | `docs/lanham-reaudit-report.md` | - | Re-audit after fixes |
| 18 | `IMPLEMENTATION-GUIDE.md` | - | This document |
