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

/** Reset cached config (for testing). */
export function resetDomainConfigCache(): void {
  cachedConfig = null;
}
