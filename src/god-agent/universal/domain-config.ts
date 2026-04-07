/**
 * DomainConfig — Externalized author/concept lists for the writing pipeline.
 *
 * Replaces hardcoded regex patterns scattered across the orchestrator.
 * Loads from .god-agent/domain-config.json with inline fallback.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface DomainConfig {
  primaryAuthors: string[];
  secondaryAuthors: string[];
  keyConcepts: string[];
  primaryTitles: string[];
  /** Maps prompt-level aliases → actual title_raw in ChromaDB.
   *  Each key is a case-insensitive alias; value is the exact title_raw string. */
  titleAliases: Record<string, string>;
}

const DEFAULT_DOMAIN_CONFIG: DomainConfig = {
  primaryAuthors: ['Aristotle', 'Heidegger', 'Plato'],
  secondaryAuthors: [
    'Frede', 'Caston', 'Papachristou', 'Nussbaum',
    "O'Gorman", 'Hawhee', 'Rickert', 'Burke',
    'White', 'Gonzalez', 'Bowin',
  ],
  keyConcepts: [
    'motion', 'kinesis', 'time', 'chronos',
    'perception', 'aisthesis', 'phantasia', 'imagination',
    'temporal', 'rhetoric', 'being',
    'stimmung', 'dasein', 'befindlichkeit', 'geworfenheit',
    'orexis', 'nous', 'pathos', 'logos', 'ethos', 'kairos',
    'energeia', 'dunamis', 'phronesis', 'eudaimonia',
    'entelecheia', 'soul', 'faculty', 'ontolog',
    'attunem', 'disclos', 'thrownness', 'mood', 'affect',
  ],
  primaryTitles: ['De Anima', 'Being and Time', 'Rhetoric', 'Physics'],
  titleAliases: {
    // Aristotle
    'de anima': 'On The Soul (De Anima)',
    'da': 'On The Soul (De Anima)',
    'on the soul': 'On The Soul (De Anima)',
    'peri psyches': 'On The Soul (De Anima)',
    'rhetoric': 'Rhetoric',
    'physics': 'Physics',
    'metaphysics': 'Metaphysics',
    'de motu': 'Movement Of Animals',
    'de motu animalium': 'Movement Of Animals',
    'movement of animals': 'Movement Of Animals',
    'de sensu': 'Sense And Sensibilia',
    'sense and sensibilia': 'Sense And Sensibilia',
    'de memoria': 'On Memory',
    'on memory': 'On Memory',
    // Heidegger
    'being and time': 'Being and Time',
    'sein und zeit': 'Being and Time',
    'basic concepts of aristotelian philosophy': 'Basic Concepts of Aristotelian Philosophy',
    'grundbegriffe': 'Basic Concepts of Aristotelian Philosophy',
    'ga 18': 'Basic Concepts of Aristotelian Philosophy',
    // Uexküll
    'foray': 'A Foray Into the Worlds of Animals and Humans with A Theory of Meaning',
    'a foray': 'A Foray Into the Worlds of Animals and Humans with A Theory of Meaning',
    'foray into the worlds': 'A Foray Into the Worlds of Animals and Humans with A Theory of Meaning',
    'streifzüge': 'A Foray Into the Worlds of Animals and Humans with A Theory of Meaning',
    'theory of meaning': 'A Foray Into the Worlds of Animals and Humans with A Theory of Meaning',
    'umwelt': 'A Foray Into the Worlds of Animals and Humans with A Theory of Meaning',
    // Rickert
    'ambient rhetoric': 'Ambient Rhetoric- The Attunements of Rhetorical Being',
    // Burke
    'grammar of motives': 'A Grammar of Motives',
    'rhetoric of motives': 'A Rhetoric of Motives',
    // Gibson
    'ecological approach': 'The Ecological Approach to Visual Perception.',
  },
};

let cachedConfig: DomainConfig | null = null;

/**
 * Load domain config from .god-agent/domain-config.json.
 * Falls back to DEFAULT_DOMAIN_CONFIG if file is missing or malformed.
 */
export function loadDomainConfig(projectRoot?: string): DomainConfig {
  if (cachedConfig) return cachedConfig;

  const root = projectRoot || process.cwd();
  const configPath = path.join(root, '.god-agent', 'domain-config.json');

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);

    // Validate required fields
    if (!Array.isArray(parsed.primaryAuthors) || !Array.isArray(parsed.keyConcepts)) {
      process.stderr.write(`[WARN] domain-config.json missing required arrays — using defaults\n`);
      cachedConfig = DEFAULT_DOMAIN_CONFIG;
      return cachedConfig;
    }

    cachedConfig = {
      primaryAuthors: parsed.primaryAuthors,
      secondaryAuthors: parsed.secondaryAuthors || DEFAULT_DOMAIN_CONFIG.secondaryAuthors,
      keyConcepts: parsed.keyConcepts,
      primaryTitles: parsed.primaryTitles || DEFAULT_DOMAIN_CONFIG.primaryTitles,
      titleAliases: { ...DEFAULT_DOMAIN_CONFIG.titleAliases, ...(parsed.titleAliases || {}) },
    };
    return cachedConfig;
  } catch {
    // File missing or malformed — degrade gracefully
    process.stderr.write(`[WARN] Could not load ${configPath} — using default domain config\n`);
    cachedConfig = DEFAULT_DOMAIN_CONFIG;
    return cachedConfig;
  }
}

/** Build a regex that matches any author (primary + secondary). */
export function buildAuthorPattern(config: DomainConfig): RegExp {
  const allAuthors = [...config.primaryAuthors, ...config.secondaryAuthors];
  const escaped = allAuthors.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(?:${escaped.join('|')})`, 'gi');
}

/** Build a regex that matches any key concept. */
export function buildConceptPattern(config: DomainConfig): RegExp {
  const escaped = config.keyConcepts.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(?:${escaped.join('|')})`, 'gi');
}

/** Check if a source is a primary source by author name or title. */
export function isPrimarySource(author: string, title: string, config: DomainConfig): boolean {
  const authorLower = author.toLowerCase();
  const titleLower = title.toLowerCase();
  return (
    config.primaryAuthors.some(a => authorLower.includes(a.toLowerCase())) ||
    config.primaryTitles.some(t => titleLower.includes(t.toLowerCase()))
  );
}

/** Get all authors + concepts as a flat keyword list (lowercase). */
export function getDomainKeywords(config: DomainConfig): string[] {
  return [
    ...config.primaryAuthors.map(a => a.toLowerCase()),
    ...config.keyConcepts,
  ];
}

/**
 * Extract referenced works from a prompt, mapped to their ChromaDB title_raw values.
 * Returns an array of { titleRaw, mentions } sorted by mention count (descending).
 * More mentions = higher priority for retrieval.
 */
export function extractWorkReferences(
  topic: string,
  config: DomainConfig,
): { titleRaw: string; mentions: number }[] {
  const topicLower = topic.toLowerCase();
  const titleCounts = new Map<string, number>();

  // Sort aliases longest-first to avoid partial matches (e.g., "de anima" before "da")
  const sortedAliases = Object.entries(config.titleAliases)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [alias, titleRaw] of sortedAliases) {
    // Count non-overlapping occurrences of this alias in the topic
    const aliasLower = alias.toLowerCase();
    let count = 0;
    let searchFrom = 0;
    while (true) {
      const idx = topicLower.indexOf(aliasLower, searchFrom);
      if (idx === -1) break;
      // Check word boundary (not mid-word match)
      const before = idx > 0 ? topicLower[idx - 1] : ' ';
      const after = idx + aliasLower.length < topicLower.length
        ? topicLower[idx + aliasLower.length] : ' ';
      if (/[\s.,;:!?'"()\-–—/]/.test(before) && /[\s.,;:!?'"()\-–—/]/.test(after)) {
        count++;
      }
      searchFrom = idx + aliasLower.length;
    }

    if (count > 0) {
      const existing = titleCounts.get(titleRaw) || 0;
      titleCounts.set(titleRaw, existing + count);
    }
  }

  return Array.from(titleCounts.entries())
    .map(([titleRaw, mentions]) => ({ titleRaw, mentions }))
    .sort((a, b) => b.mentions - a.mentions);
}

/** Reset cached config (for testing). */
export function resetDomainConfigCache(): void {
  cachedConfig = null;
}
