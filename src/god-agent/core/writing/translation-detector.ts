/**
 * Translation Detector
 *
 * Detects when a quotation appears to use a different translation
 * than the corpus source (e.g., "actuality" vs "fulfilment" for energeia).
 *
 * This is critical for academic writing where the same Greek, German, or Latin
 * term may be translated differently across scholarly editions.
 */

/**
 * Marker for a term that may have multiple translations
 */
interface TranslationMarker {
  /** Original term in source language */
  term: string;
  /** Common English translations */
  variations: string[];
  /** Source language */
  language: 'greek' | 'german' | 'latin' | 'french';
  /** Context notes for scholars */
  notes?: string;
}

/**
 * Known translation markers for philosophical terms
 */
const TRANSLATION_MARKERS: TranslationMarker[] = [
  // Greek Philosophical Terms
  {
    term: 'energeia',
    variations: ['actuality', 'fulfilment', 'fulfillment', 'activity', 'actualization', 'being-at-work'],
    language: 'greek',
    notes: 'Aristotle\'s term for being in act vs. potentiality'
  },
  {
    term: 'dunamis',
    variations: ['potentiality', 'potency', 'power', 'capacity', 'capability'],
    language: 'greek',
    notes: 'Aristotle\'s term for potential being'
  },
  {
    term: 'phantasia',
    variations: ['imagination', 'presentation', 'appearance', 'fancy', 'image-making'],
    language: 'greek',
    notes: 'Aristotle\'s faculty between perception and thought'
  },
  {
    term: 'aisthesis',
    variations: ['perception', 'sensation', 'sense', 'sense-perception', 'sensing'],
    language: 'greek',
    notes: 'Aristotle\'s term for sensory perception'
  },
  {
    term: 'nous',
    variations: ['intellect', 'mind', 'reason', 'intelligence', 'understanding'],
    language: 'greek',
    notes: 'Aristotle\'s term for the rational faculty'
  },
  {
    term: 'psyche',
    variations: ['soul', 'mind', 'life', 'spirit', 'life-principle'],
    language: 'greek',
    notes: 'Greek term for soul/animating principle'
  },
  {
    term: 'kinesis',
    variations: ['motion', 'movement', 'change', 'process'],
    language: 'greek',
    notes: 'Aristotle\'s term for motion/change'
  },
  {
    term: 'ousia',
    variations: ['substance', 'essence', 'being', 'reality', 'entity'],
    language: 'greek',
    notes: 'Aristotle\'s term for substance/essence'
  },
  {
    term: 'eidos',
    variations: ['form', 'species', 'idea', 'kind', 'type'],
    language: 'greek',
    notes: 'Aristotle/Plato\'s term for form'
  },
  {
    term: 'hyle',
    variations: ['matter', 'material', 'stuff'],
    language: 'greek',
    notes: 'Aristotle\'s term for matter'
  },
  {
    term: 'telos',
    variations: ['end', 'goal', 'purpose', 'aim', 'final cause'],
    language: 'greek',
    notes: 'Aristotle\'s term for final cause'
  },
  {
    term: 'pathos',
    variations: ['emotion', 'passion', 'affection', 'feeling', 'suffering'],
    language: 'greek',
    notes: 'Greek term for emotion/experience'
  },
  {
    term: 'hexis',
    variations: ['state', 'habit', 'disposition', 'condition'],
    language: 'greek',
    notes: 'Aristotle\'s term for stable state'
  },
  {
    term: 'ethos',
    variations: ['character', 'disposition', 'habit', 'custom'],
    language: 'greek',
    notes: 'Greek term for character'
  },
  {
    term: 'logos',
    variations: ['reason', 'word', 'account', 'speech', 'discourse', 'ratio', 'definition'],
    language: 'greek',
    notes: 'Multivalent Greek term'
  },
  {
    term: 'phronesis',
    variations: ['practical wisdom', 'prudence', 'practical intelligence'],
    language: 'greek',
    notes: 'Aristotle\'s intellectual virtue'
  },
  {
    term: 'eudaimonia',
    variations: ['happiness', 'flourishing', 'well-being', 'blessedness'],
    language: 'greek',
    notes: 'Aristotle\'s term for the good life'
  },
  {
    term: 'arete',
    variations: ['virtue', 'excellence', 'goodness'],
    language: 'greek',
    notes: 'Greek term for excellence'
  },
  {
    term: 'aletheia',
    variations: ['truth', 'unconcealment', 'disclosure', 'unhiddenness'],
    language: 'greek',
    notes: 'Greek term for truth (Heidegger emphasis)'
  },

  // German Philosophical Terms (Heidegger, Husserl, etc.)
  {
    term: 'Stimmung',
    variations: ['mood', 'attunement', 'disposition', 'tuning', 'state-of-mind', 'temper'],
    language: 'german',
    notes: 'Heidegger\'s existential structure'
  },
  {
    term: 'Dasein',
    variations: ['existence', 'being-there', 'human being', 'there-being', 'human existence'],
    language: 'german',
    notes: 'Heidegger\'s term for human existence'
  },
  {
    term: 'Sein',
    variations: ['being', 'Being', 'existence'],
    language: 'german',
    notes: 'German term for Being'
  },
  {
    term: 'Seiendes',
    variations: ['beings', 'entities', 'things that are', 'what-is'],
    language: 'german',
    notes: 'Heidegger\'s term for entities'
  },
  {
    term: 'Befindlichkeit',
    variations: ['state-of-mind', 'disposedness', 'affectedness', 'situatedness', 'findingness'],
    language: 'german',
    notes: 'Heidegger\'s existential structure'
  },
  {
    term: 'Verstehen',
    variations: ['understanding', 'comprehension'],
    language: 'german',
    notes: 'Heidegger\'s existential structure'
  },
  {
    term: 'Sorge',
    variations: ['care', 'concern', 'worry'],
    language: 'german',
    notes: 'Heidegger\'s fundamental structure of Dasein'
  },
  {
    term: 'Angst',
    variations: ['anxiety', 'dread', 'anguish'],
    language: 'german',
    notes: 'Heidegger\'s fundamental mood'
  },
  {
    term: 'Geworfenheit',
    variations: ['thrownness', 'facticity', 'thrown-being'],
    language: 'german',
    notes: 'Heidegger\'s existential structure'
  },
  {
    term: 'Entwurf',
    variations: ['projection', 'project', 'thrown-projection'],
    language: 'german',
    notes: 'Heidegger\'s existential structure'
  },
  {
    term: 'Erschlossenheit',
    variations: ['disclosedness', 'openedness', 'disclosure'],
    language: 'german',
    notes: 'Heidegger\'s term for Dasein\'s openness'
  },
  {
    term: 'Vorhandenheit',
    variations: ['presence-at-hand', 'occurrentness', 'objective presence'],
    language: 'german',
    notes: 'Heidegger\'s mode of being'
  },
  {
    term: 'Zuhandenheit',
    variations: ['readiness-to-hand', 'handiness', 'availability'],
    language: 'german',
    notes: 'Heidegger\'s mode of being for equipment'
  },
  {
    term: 'Mitsein',
    variations: ['being-with', 'being-with-others'],
    language: 'german',
    notes: 'Heidegger\'s social structure of Dasein'
  },
  {
    term: 'Zeug',
    variations: ['equipment', 'gear', 'tool', 'stuff'],
    language: 'german',
    notes: 'Heidegger\'s term for useful things'
  },
  {
    term: 'Lebenswelt',
    variations: ['lifeworld', 'life-world', 'lived world'],
    language: 'german',
    notes: 'Husserl\'s phenomenological concept'
  },
  {
    term: 'Intentionalität',
    variations: ['intentionality', 'directedness'],
    language: 'german',
    notes: 'Husserl\'s key phenomenological concept'
  },
  {
    term: 'Erlebnis',
    variations: ['experience', 'lived experience', 'mental process'],
    language: 'german',
    notes: 'Phenomenological term for lived experience'
  },
  {
    term: 'Geist',
    variations: ['spirit', 'mind', 'intellect'],
    language: 'german',
    notes: 'Hegel\'s key term'
  },

  // Latin Philosophical Terms
  {
    term: 'cogito',
    variations: ['I think', 'thinking', 'thought'],
    language: 'latin',
    notes: 'Descartes\' foundational term'
  },
  {
    term: 'res cogitans',
    variations: ['thinking thing', 'thinking substance', 'mind'],
    language: 'latin',
    notes: 'Descartes\' term for mind'
  },
  {
    term: 'res extensa',
    variations: ['extended thing', 'extended substance', 'body', 'matter'],
    language: 'latin',
    notes: 'Descartes\' term for body'
  },
  {
    term: 'a priori',
    variations: ['a priori', 'prior to experience', 'independent of experience'],
    language: 'latin',
    notes: 'Kant\'s epistemological category'
  },
  {
    term: 'a posteriori',
    variations: ['a posteriori', 'from experience', 'empirical'],
    language: 'latin',
    notes: 'Kant\'s epistemological category'
  },
];

/**
 * Result of detecting a translation mismatch
 */
export interface TranslationMismatch {
  /** Term as used in the quotation */
  quotedTerm: string;
  /** Term as it appears in the corpus */
  corpusTerm: string;
  /** Original non-English term */
  originalTerm: string;
  /** Source language */
  language: string;
  /** Human-readable message */
  message: string;
  /** Severity: 'warning' for likely mismatch, 'info' for possible */
  severity: 'warning' | 'info';
  /** Scholarly notes about the term */
  notes?: string;
}

/**
 * Detect translation mismatches between quoted text and corpus text
 *
 * @param quotedText - The text as quoted in the generated content
 * @param corpusText - The actual text from the corpus
 * @returns Array of detected translation mismatches
 */
export function detectTranslationMismatch(
  quotedText: string,
  corpusText: string
): TranslationMismatch[] {
  const mismatches: TranslationMismatch[] = [];
  const quotedLower = quotedText.toLowerCase();
  const corpusLower = corpusText.toLowerCase();

  for (const marker of TRANSLATION_MARKERS) {
    // Find which variation is in the quote
    const quotedVariation = marker.variations.find(v =>
      quotedLower.includes(v.toLowerCase())
    );

    // Find which variation is in the corpus
    const corpusVariation = marker.variations.find(v =>
      corpusLower.includes(v.toLowerCase())
    );

    // If both have a variation but they differ, that's a mismatch
    if (quotedVariation && corpusVariation &&
        quotedVariation.toLowerCase() !== corpusVariation.toLowerCase()) {
      mismatches.push({
        quotedTerm: quotedVariation,
        corpusTerm: corpusVariation,
        originalTerm: marker.term,
        language: marker.language,
        message: `Different translations of "${marker.term}" (${marker.language}): quote uses "${quotedVariation}", corpus uses "${corpusVariation}"`,
        severity: 'warning',
        notes: marker.notes,
      });
    }
  }

  return mismatches;
}

/**
 * Get all known translation variations for a term
 */
export function getTranslationVariations(term: string): string[] {
  const normalizedTerm = term.toLowerCase();

  // Check if it's an original term
  const marker = TRANSLATION_MARKERS.find(m =>
    m.term.toLowerCase() === normalizedTerm
  );
  if (marker) {
    return marker.variations;
  }

  // Check if it's a variation
  for (const m of TRANSLATION_MARKERS) {
    if (m.variations.some(v => v.toLowerCase() === normalizedTerm)) {
      return m.variations;
    }
  }

  return [];
}

/**
 * Get the original term for a translation
 */
export function getOriginalTerm(translation: string): string | undefined {
  const normalizedTranslation = translation.toLowerCase();

  for (const marker of TRANSLATION_MARKERS) {
    if (marker.variations.some(v => v.toLowerCase() === normalizedTranslation)) {
      return marker.term;
    }
  }

  return undefined;
}

/**
 * Check if two terms are translation equivalents
 */
export function areTranslationEquivalents(term1: string, term2: string): boolean {
  const norm1 = term1.toLowerCase();
  const norm2 = term2.toLowerCase();

  if (norm1 === norm2) return true;

  for (const marker of TRANSLATION_MARKERS) {
    const hasFirst = marker.variations.some(v => v.toLowerCase() === norm1);
    const hasSecond = marker.variations.some(v => v.toLowerCase() === norm2);

    if (hasFirst && hasSecond) {
      return true;
    }
  }

  return false;
}

/**
 * Export the markers for testing and extension
 */
export { TRANSLATION_MARKERS };
