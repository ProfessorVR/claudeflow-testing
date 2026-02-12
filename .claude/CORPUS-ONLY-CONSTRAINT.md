# CORPUS-ONLY CITATION CONSTRAINT

**THIS IS A MANDATORY SYSTEM-WIDE CONSTRAINT**

## Rule

**BY DEFAULT, all academic writing agents MUST cite ONLY sources that exist in the ingested corpus.**

Do NOT fabricate, hallucinate, or reference sources that are not in the corpus.

## When External Sources Are Allowed

External sources may ONLY be used when the user **explicitly requests** them with phrases like:
- "include external sources"
- "use web search"
- "find additional sources"
- "--allow-external" flag
- "--use-web" flag

## Corpus Sources (Updated 2026-01-30)

The following sources are available in the corpus and MAY be cited:

### Primary Aristotelian Sources
- Aristotle. *De Anima* (On the Soul)
- Aristotle. *Rhetoric*
- Aristotle. *De Motu Animalium* (Movement of Animals)
- Aristotle. *De Sensu et Sensibilibus* (Sense and Sensibilia)
- Aristotle. *De Memoria* (On Memory)
- Aristotle. *De Coloribus* (On Colours)
- Aristotle. *De Audibilibus* (On Things Heard)

### Primary Heideggerian Sources
- Heidegger, Martin. *Being and Time* (Sein und Zeit)
- Heidegger, Martin. *Basic Concepts of Aristotelian Philosophy*

### Secondary Scholarship - Phantasia
- Bowin, John. "Aristotle on the Perception and Cognition of Time"
- Caston, Victor. "Why Aristotle Needs Imagination"
- Frede, Dorothea. "The Cognitive Role of Phantasia in Aristotle"
- Gonzalez, Jose M. "The Meaning and Function of Phantasia in Aristotle's Rhetoric III.1"
- Nussbaum, Martha. "The Role of Phantasia in Aristotle's Explanation of Action"
- O'Gorman, Ned. "Aristotle's Phantasia in the Rhetoric: Lexis, Appearance, and the Epideictic Function of Discourse"
- Papachristou, Christina. "Three Kinds or Grades of Phantasia in Aristotle's De Anima"
- White, Kevin. "The Meaning of Phantasia in Aristotle's De Anima III, 3-8"

### Secondary Scholarship - Rhetoric & Heidegger
- Gross, Daniel M. *Uncomfortable Situations*
- Hawhee, Debra. "Looking Into Aristotle's Eyes: Toward a Theory of Rhetorical Vision"
- Multiple Authors. *Heidegger and Rhetoric*
- Rickert, Thomas. "Towards Ecosophy in a Participating World: Rhetoric and Cosmology in Heidegger's Fourfold and Empedocles' Four Roots"

### Dissertation
- Salvo, Dalton. "Rhetorical Phantasia: The Soul's Temporal Medium" (dissertation in progress)

## Citation Format

Use MLA 9th Edition inline parenthetical citations:
- Primary texts: `(*De Anima* 427b15-21)` or `(*Rhetoric* 1404a10)`
- Secondary sources: `(Frede 285)` or `(Nussbaum 234-235)`

## Enforcement

This constraint applies to:
- god-write
- god-complete-section
- academic-writer
- literature-review-writer
- discussion-writer
- introduction-writer
- chapter-synthesizer
- All PhD research agents

**If a claim requires a source not in the corpus, either:**
1. Reframe the argument using available sources
2. Note the claim as requiring additional sourcing
3. Ask the user if external sources should be used
