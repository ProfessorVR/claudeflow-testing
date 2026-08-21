# Rickert & Uexküll KU Promotion Execution Plan — 42 Queries Across 9 Tiers

**Date**: 2026-04-09
**Corpus**: 50 PDFs, 3,091 chunks in ChromaDB (`knowledge_chunks`)
**Baseline**: Modeled on `claudeflow-new/plans/ku-promotion-execution-plan.md` (43 queries, 8 tiers)
**Branch**: `writing-pipeline-v2`

## Motivation

The god-write pipeline's gold-standard prompt builder generates section outlines from the compiled KU index. With only 2 Rickert-domain KUs and 0 Uexküll-domain KUs, the pipeline produces Aristotle-dominated architecture even when the prompt explicitly requests Rickert/Uexküll sections. Building 20+ KUs per domain will:

1. Give the prompt builder enough KU mass to generate balanced multi-author outlines
2. Enable Phase 7 to auto-derive cross-domain edges (Rickert↔Aristotle, Uexküll↔Heidegger, etc.)
3. Improve SmartRetrievalLayer's KG boost for Rickert/Uexküll queries
4. Populate the STRUCTURAL RELATIONSHIPS block with Rickert/Uexküll edges

## Current KU State

| Domain | KUs | Edges | Status |
|--------|-----|-------|--------|
| aristotle | 102 | ~600+ | Healthy |
| heidegger_bt | 1 | few | Critically low |
| rickert | 2 | few | Critically low |
| uexkull | 0 | 0 | Empty |

## Execution Protocol

1. **Order**: Complete all Rickert tiers R1–R5, then all Uexküll tiers U1–U4. Sequential within tiers.
2. **After each query**: Apply Inspection Checklist. If any item fails, apply Running Patterns (fallback, discard, retag, or skip).
3. **Promotion gate**: Only promote a KU when it passes the full checklist AND has the correct domain tag.
4. **Per-query threshold**: Promotion-ready if >= 2 chunks meet checklist and at least one comes from the intended primary text (e.g., *Ambient Rhetoric* for Rickert, *A Foray* for Uexküll).
5. **Per-domain stop rule**: Stop once >= 20 Rickert KUs and >= 20 Uexküll KUs meet criteria, even if queries remain. Remaining queries become optional stretch.
6. **Cross-domain tagging**: If a promoted KU clearly aligns with an existing Aristotle/Heidegger KU, tag it with a tentative edge hint (e.g., `possible_contrasts_with: ku_xxx`, `possible_refines: ku_yyy`) to be resolved in Phase 7. This keeps the structural aim wired into promotion.

## Default Parameters

```bash
--k 8 --overfetch 30 --where '{"collection":"rhetorical_ontology"}'
```

## Fallback Types

| Type | When | Action |
|------|------|--------|
| **F1** (re-scope) | Scoped query returns < 10 chunks | Re-run unscoped: drop `--where`, keep `--k 8 --overfetch 30` |
| **F2** (reduce) | Thin source (< 20 chunks) | Reduce to `--k 5 --overfetch 15`; if still empty, apply F1 |
| **F3** (reweight) | Query pulls wrong-author chunks | Shift emphasis from citation terms to concept vocabulary; drop author-specific page refs, let semantic priming carry retrieval from secondary sources |

## Running Patterns

| Symptom | Adjustment |
|---------|------------|
| Pool < 30 chunks | Apply F1 (unscoped fallback) |
| Pool < 10 chunks | Apply F2 (reduced params), then F1 if still empty |
| Wrong-author chunks dominate | Apply F3 (reweight concept terms) |
| Index page / bibliography fragment promoted | Discard — no argumentative claim |
| OCR artifacts (lone page numbers, running headers) | Discard |
| KU tagged wrong domain | Re-tag manually in knowledge.jsonl |
| Duplicate claim from prior query | Skip — already in KU set |

## Inspection Checklist (After Each Query)

- [ ] Text length >= 120 characters
- [ ] No OCR artifacts (running headers, footnote fragments, index entries)
- [ ] Subject-predicate structure (argumentative claim, not definition fragment or bibliography)
- [ ] Correct source attribution (doc_id matches expected text)
- [ ] Correct domain tag (rickert or uexkull, NOT aristotle)
- [ ] Cross-domain check: does this KU align with an existing Aristotle/Heidegger KU? If yes, note tentative edge hint

---

## Pool Risk Summary

| Source | Author | Chunks | Risk | Params |
|--------|--------|--------|------|--------|
| *Ambient Rhetoric* | Rickert | 212 | Low | Default |
| *Towards Ecosophy* | Rickert | 15 | Thin | `--k 5 --overfetch 15` |
| *It Is All There* | Rickert | 5 | Critical | `--k 5 --overfetch 10` + fallback |
| *A Foray Into the Worlds of Animals and Humans* | von Uexküll | 117 | Low | Default |

---

# PART I: RICKERT — 22 Queries Across 5 Tiers

## Tier R1 — Core Thesis: Ambient Rhetoric as Ontological Reconception (5 queries)

These establish Rickert's central argument that rhetoric is ontological, not merely persuasive.

```bash
# R1. Core thesis — rhetoric as ontological ground, not technique of persuasion
god-learn update \
  --query "Rickert ambient rhetoric attunements rhetorical being ontological ground rhetoric not merely persuasion suasion disclosure" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R2. Ambiance as pre-discursive ground — the order that eludes consciousness
god-learn update \
  --query "Rickert ambiance mood constitutive conditions discourse underlying order knowledge emerges eludes consciousness" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R3. Critique of Bitzer/Vatz — situation reconceived to include material surroundings
god-learn update \
  --query "Rickert critique Bitzer exigence rhetorical situation reconceived situation includes material surroundings ongoing activities" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R4. Rhetoric reconceived not replaced — working anew with what has been brought forward
god-learn update \
  --query "Rickert we do not need new rhetoric rather work anew brought forward rhetorical theory practice" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R5. Suasion beyond persuasion — pre-reflective affect and disposed openness
god-learn update \
  --query "Rickert suasion beyond persuasion pre-reflective affect orientation disposed openness world not deliberate intent" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'
```

---

## Tier R2 — Dwelling, Chōra, Place (5 queries)

These cover Rickert's spatial/ontological infrastructure: chōra, dwelling, emplacement.

```bash
# R6. Chōra as ambient space — Platonic receptacle, Derrida's khora
god-learn update \
  --query "Rickert chora Platonic receptacle ambient space neither being nor non-being Derrida khora" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R7. Dwelling and the fourfold — Heidegger's Geviert, gathering of earth sky mortals divinities
god-learn update \
  --query "Rickert dwelling fourfold Geviert Heidegger earth sky mortals divinities gathering place" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R8. Place beyond location — emplacement, situatedness, embodied being-there
god-learn update \
  --query "Rickert place emplacement situatedness beyond location embodied being-there world not container" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R9. Subject/object dissolution — originary belongingness, not substance and attribute
god-learn update \
  --query "Rickert subject object derive originary belongingness more complexly than substance and attribute" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R10. Ambient environment as generative cradle — overarching, complexly generating
god-learn update \
  --query "Rickert ambient environment cradles surroundings overarching complexly generating" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'
```

---

## Tier R3 — Materiality, Nonhuman Agency, Technology (5 queries)

These cover Rickert's engagement with new materialism, Latour, and technology.

```bash
# R11. Materiality and nonhuman agency — rhetoric distributed beyond human intentionality
god-learn update \
  --query "Rickert materiality nonhuman agency rhetoric distributed beyond human intentionality things objects" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R12. Latour/ANT — Dingpolitik, parliament of things, object-oriented rhetoric
god-learn update \
  --query "Rickert Latour actor-network Dingpolitik object-oriented concrete demonstrations parliament things" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R13. Ambient music as rhetoric — Brian Eno, power of place, technology integral
god-learn update \
  --query "Rickert ambient music important development form of thinking power of place agency technology integral creation" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R14. Technology and techne — apparatus, invention, production beyond human control
god-learn update \
  --query "Rickert technology techne apparatus rhetorical invention production beyond human control" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R15. Extended cognition — Andy Clark, Dourish, distributed cognition, embodied mind
god-learn update \
  --query "Rickert cognitive science Andy Clark Paul Dourish distributed cognition extended mind embodied" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'
```

---

## Tier R4 — Attunement, Affect, Heidegger Dialogue (5 queries)

These cover Rickert's engagement with Heidegger on attunement, meaning, and world-disclosure.

```bash
# R16. Heidegger/attunement bridge — Befindlichkeit, Stimmung, mood grounds rhetoric
god-learn update \
  --query "Rickert Heidegger Befindlichkeit attunement Stimmung disposed openness world mood grounds rhetoric" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R17. Meaning-in-the-world — warmth of fire, meaning of food, rhetoric of everyday
god-learn update \
  --query "Rickert warmth fire sensation meaning food rhetoric persuasive enough idea used" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R18. World-disclosure — worldview constitutes appearance, cultural lenses, intelligibility
god-learn update \
  --query "Rickert worldview constitutes world appears colored cultural lenses intelligibility spiral human meaning" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R19. Language, meaning, dwelling — Heidegger on language's relation to being
god-learn update \
  --query "Rickert Heidegger work meaning language language's relation being dwelling thinking" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# R20. Withdrawal and disclosure — concealment, revealing, gathering
god-learn update \
  --query "Rickert participation world withdrawn disclosure concealment revealing gathering" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'
```

---

## Tier R5 — Ecosophy, Reasoning-in-the-World (2 queries)

*Towards Ecosophy*: 15 chunks (Thin). *It Is All There*: 5 chunks (Critical).
Use reduced params. Fallback: unscoped `--k 8 --overfetch 30`.

```bash
# R21. Ecosophy — Empedocles' four roots, Heidegger's fourfold, participating world
#      Towards Ecosophy: 15 chunks (Thin). FALLBACK (F2): reduce params, then F1 unscoped.
god-learn update \
  --query "Rickert Empedocles four roots Heidegger fourfold ecosophy participating world rhetoric cosmology" \
  --k 5 --overfetch 15 \
  --where '{"collection":"rhetorical_ontology"}'
# FALLBACK (F1 — unscoped):
# god-learn update \
#   --query "Rickert Empedocles four roots Heidegger fourfold ecosophy participating world rhetoric cosmology" \
#   --k 8 --overfetch 30

# R22. Reasoning-in-the-world — beyond abstract reason, embodied, ambient conditions
#      It Is All There: 5 chunks (Critical). FALLBACK (F2): reduce params, then F1 unscoped.
god-learn update \
  --query "Rickert reasoning-in-the-world beyond abstract reason embodied distributed ambient conditions" \
  --k 5 --overfetch 10 \
  --where '{"collection":"rhetorical_ontology"}'
# FALLBACK (F1 — unscoped):
# god-learn update \
#   --query "Rickert reasoning-in-the-world beyond abstract reason embodied distributed ambient conditions" \
#   --k 8 --overfetch 30
# FALLBACK (F3 — reweight if Ambient Rhetoric chunks dominate over It Is All There):
# god-learn update \
#   --query "reasoning-in-the-world distributed ambient conditions beyond abstract rationality embodied cognition situation" \
#   --k 5 --overfetch 10
```

---

# PART II: UEXKÜLL — 20 Queries Across 4 Tiers

## Tier U1 — Core Umwelt Framework (5 queries)

These establish the foundational Umwelt concept and its structural components.

```bash
# U1. Core Umwelt concept — species-specific closed perceptual world, not objective environment
god-learn update \
  --query "Uexküll Umwelt surrounding world species-specific closed perceptual world organism not objective environment" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U2. Umwelt vs Umgebung — the objective world does not exist for the organism
god-learn update \
  --query "Uexküll Umwelt versus Umgebung surroundings environment distinction objective world does not exist" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U3. Functional cycle — Funktionskreis, receptor, effector, connecting arc
god-learn update \
  --query "Uexküll functional cycle Funktionskreis perception organ receptor effector organ connecting arc subject" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U4. Soap-bubble metaphor — each animal surrounded by its own closed world
god-learn update \
  --query "Uexküll soap-bubble metaphor each animal surrounded own soap-bubble closed world perception effect" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U5. Anti-mechanistic biology — organism not machine, plan, conformity to plan
god-learn update \
  --query "Uexküll subject object biology anti-mechanistic organism not machine plan conformity Planmässigkeit design nature" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'
```

---

## Tier U2 — Perception World: Marks, Tones, Time (6 queries)

These cover the perceptual apparatus: marks, tones, temporal structure.

```bash
# U6. Perception marks — Merkmal, Merkzeichen, signs carrying properties of object
god-learn update \
  --query "Uexküll perception marks Merkmal Merkzeichen perception world Merkwelt signs carrier properties object" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U7. Effect marks — Wirkmal, Wirkzeichen, how organism stamps objects with action cues
god-learn update \
  --query "Uexküll effect marks Wirkmal Wirkzeichen effect world Wirkwelt action cues organism stamps object" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U8. Perception tone and effect tone — Ton, coloring objects with subject's meaning
god-learn update \
  --query "Uexküll perception tone effect tone Ton quality coloring objects meaning bestowed subject" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U9. Search tone and search image — Suchbild, Suchton, guided perception
god-learn update \
  --query "Uexküll search tone search image Suchbild Suchton looking for object specific image guides perception" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U10. Perception time and moment — eighteen per second, shorter/longer moments
god-learn update \
  --query "Uexküll time perception moment shorter longer moments motion processes quickly slowly eighteen per second" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U11. Specific energy of senses — Johannes Müller, external effects on optic nerve
god-learn update \
  --query "Uexküll Johannes Muller external effects optic nerve waves ether specific energy sense organs" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'
```

---

## Tier U3 — Theory of Meaning: Bedeutungslehre (5 queries)

These cover Part II of the *Foray*: the theory of meaning.

```bash
# U12. Bedeutungslehre — theory of meaning, meaning carriers, composition of nature
god-learn update \
  --query "Uexküll Bedeutungslehre theory meaning meaning carrier Bedeutungsträger meaning receiver composition nature" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U13. Counterworld — Gegenwelt, complementarity of organism and environment fitting together
god-learn update \
  --query "Uexküll counterworld Gegenwelt complementarity organism environment inner world outer world fitting together" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U14. Inner world — Innenwelt, receptor system, effector system, central organ
god-learn update \
  --query "Uexküll Innenwelt inner world subject receptor system effector system central organ connecting" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U15. Nature as musical score — Kompositionslehre, contrapuntal duet, harmony
god-learn update \
  --query "Uexküll musical score nature composition Kompositionslehre contrapuntal duet organism environment harmony" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U16. Meaning carrier example — acorn, oak, schema, unfolding plan, development
god-learn update \
  --query "Uexküll acorn oak composition schema question meaning carrier unfolds plan development" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'
```

---

## Tier U4 — Concrete Examples and Organism-Worlds (4 queries)

These ground the theoretical framework in Uexküll's signature examples.

```bash
# U17. The tick — three receptors, butyric acid, warmth, hair, minimal Umwelt
god-learn update \
  --query "Uexküll tick example three receptors butyric acid warmth hair minimal Umwelt poverty richness" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U18. The scallop — functional cycles, perception marks, surroundings
god-learn update \
  --query "Uexküll scallop functional cycles perception marks surroundings environment sea" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U19. Perceptual spaces — visual, tactile, different organisms, different spaces
god-learn update \
  --query "Uexküll animal worlds visual space tactile space perception space different organisms different spaces" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'

# U20. Familiar path — room, objects, perception images, changed tone, meaning
god-learn update \
  --query "Uexküll familiar path home room objects perception images changed tone meaning" \
  --k 8 --overfetch 30 \
  --where '{"collection":"rhetorical_ontology"}'
```

---

# PART III: POST-PROMOTION PIPELINE

## Step 1: Verify KU Counts

```bash
# Count KUs by domain after promotion
python3 -c "
import json
from collections import Counter
counts = Counter()
with open('god-learn/knowledge.jsonl') as f:
    for line in f:
        ku = json.loads(line)
        counts[ku.get('domain','unknown')] += 1
for domain, count in sorted(counts.items()):
    print(f'{domain}: {count}')
print(f'TOTAL: {sum(counts.values())}')
"
```

**Acceptance criteria**:
- rickert domain: >= 20 KUs
- uexkull domain: >= 15 KUs
- No index/bibliography fragments promoted (manual review)

## Step 2: Backfill Edge-KU Links

```bash
python3 scripts/backfill-edge-ku-links.py
```

This embeds each edge's `"source relation target"` string and matches to KU claims via cosine similarity (threshold >= 0.65). Reduces orphaned edges.

## Step 3: Backfill Chunk-ID Provenance

```bash
python3 scripts/backfill-ku-chunk-ids.py
```

Ensures all new KUs have non-null `chunk_id` for Phase 9 chunk-level overlap scoring.

## Step 4: Verify Phase 7 Auto-Derivation

```bash
# Run god-learn compile to trigger Phase 7 pairwise edge derivation
god-learn compile

# Count new edges by derivation type
python3 -c "
import json
from collections import Counter
counts = Counter()
with open('god-reason/reasoning.jsonl') as f:
    for line in f:
        edge = json.loads(line)
        counts[edge.get('derivation','unknown')] += 1
for deriv, count in sorted(counts.items()):
    print(f'{deriv}: {count}')
print(f'TOTAL: {sum(counts.values())}')
"
```

**Acceptance criteria**:
- Phase 7 auto-derived edges increase (new Rickert↔Aristotle, Uexküll↔Heidegger pairs)
- At least 20 new cross-domain edges involving rickert or uexkull domains

## Step 5: Re-run God-Write with Constrained 5-Section Prompt

After KU expansion and backfill, retry the original god-write command:

```bash
npx tsx src/god-agent/universal/cli.ts write \
  "Write a dissertation-style section (~3000 words) analyzing how environments are disclosed and structured for a situated subject, drawing on four traditions. Use exactly these five section headings (you may add sub-headings within them, but not new top-level sections):

Section 1: Aristotle on Phantasia as Environmental Disclosure
Section 2: Heidegger on Erschlossenheit, Mood, and Attunement
Section 3: Uexküll's Umwelt: Perception Tones and Effect Tones
Section 4: Rickert's Ambient Attunement and Rhetorical Ambiance
Section 5: Synthesis — How These Four Jointly Structure a Situated Environment

Each section after the first must explicitly compare its author's view to at least one of the others (e.g., phantasia vs Umwelt, Stimmung vs ambiance), and Section 5 must articulate a joint account that integrates all four frameworks rather than merely summarizing them sequentially." \
  --execute --json \
  --style academic \
  --word-target 3000 \
  --use-corpus \
  --corpus-collections "rhetorical_ontology" \
  --corpus-chunk-count 40 \
  --corpus-min-relevance 0.35 \
  --data-source-mode corpus \
  --multi-step \
  --use-inline-validation \
  --inline-validation-strictness strict \
  --citation-enforcement-mode strict \
  --citation-min-pass-rate 0.85 \
  --citation-max-hallucinations 0 \
  --verify-sources \
  --enable-endnotes \
  --max-revisions 3
```

**Success criteria**:
- Output respects the 5-section structure (not 10 Aristotle subsections)
- Rickert and Uexküll sections have substantive corpus-grounded content
- Each section after the first includes explicit cross-author comparison
- Section 5 integrates rather than summarizes
- Word count within 2500-3500 range

---

# Execution Order

```
Phase 1: KU Promotion (sequential within tiers, inspect after each query)
  Tier R1 (R1-R5)   — Rickert core thesis
  Tier R2 (R6-R10)  — Rickert dwelling/chōra/place
  Tier R3 (R11-R15) — Rickert materiality/technology
  Tier R4 (R16-R20) — Rickert attunement/Heidegger dialogue
  Tier R5 (R21-R22) — Rickert ecosophy (thin sources, reduced params)
  Tier U1 (U1-U5)   — Uexküll core Umwelt
  Tier U2 (U6-U11)  — Uexküll perception world
  Tier U3 (U12-U16) — Uexküll Bedeutungslehre
  Tier U4 (U17-U20) — Uexküll examples

Phase 2: Post-Promotion Pipeline
  Step 1: Verify KU counts (>= 20 rickert, >= 15 uexkull)
  Step 2: backfill-edge-ku-links.py
  Step 3: backfill-ku-chunk-ids.py
  Step 4: god-learn compile → verify Phase 7 cross-domain edges
  Step 5: Re-run god-write with constrained prompt

Phase 3: Assessment
  Compare god-write output before/after KU expansion
  Update god-write regression matrix
  Update writing-pipeline-v2-completion plan
```

---

# Metrics Dashboard

Track before and after:

| Metric | Before (2026-04-09) | Target | After |
|--------|---------------------|--------|-------|
| Rickert-domain KUs | 2 | >= 20 | |
| Uexküll-domain KUs | 0 | >= 15 | |
| Total KUs | ~54 | >= 89 | |
| Cross-domain edges (rickert↔*) | ~0 | >= 20 | |
| Cross-domain edges (uexkull↔*) | ~0 | >= 15 | |
| God-write section compliance | 0/5 | 5/5 | |
| God-write Rickert citations | 0 | >= 3 | |
| God-write Uexküll citations | 0 | >= 3 | |
