/**
 * Deep Style Fingerprinting Module
 * Exports all style extraction and analysis components for dissertation-quality output
 */

// Rhetorical Move Extractor (CARS Model)
export {
  RhetoricalMoveExtractor,
  type RhetoricalMovePatterns,
  type EstablishingTerritoryPatterns,
  type EstablishingNichePatterns,
  type OccupyingNichePatterns,
} from './rhetorical-move-extractor.js';

// Citation Integration Analyzer
export {
  CitationIntegrationAnalyzer,
  type CitationIntegrationStyle,
  type CitationIntroductionPatterns,
  type QuotationStyle,
  type SynthesisPatterns,
} from './citation-integration-analyzer.js';

// Argument Pattern Extractor
export {
  ArgumentPatternExtractor,
  type ArgumentPatterns,
  type ClaimStructure,
  type EvidenceIntegration,
  type WarrantConnection,
  type CounterargumentHandling,
  type ArgumentBlock,
} from './argument-pattern-extractor.js';

// Transition Pattern Mapper
export {
  TransitionPatternMapper,
  type TransitionPatterns,
  type SectionTransitions,
  type ParagraphTransitions,
  type ChapterTransitions,
} from './transition-pattern-mapper.js';

// Phenomenological Marker Extractor (MEDIUM #1)
export {
  PhenomenologicalMarkerExtractor,
  type PhenomenologicalMarkerPatterns,
  type HeideggerianaVocabulary,
  type AristotelianVocabulary,
  type GreekTermPatterns,
  type MatchedTerm,
  type GreekTermInstance,
} from './phenomenological-marker-extractor.js';

// Citation Template Generator (MEDIUM #3)
export {
  CitationTemplateGenerator,
  type CitationTemplate,
  type CitationTemplateSet,
  getPhilosophicalTemplates,
  getEmpiricalTemplates,
} from './citation-template-generator.js';

// Deep Style Analyzer - combines all extractors
export {
  DeepStyleAnalyzer,
  type DeepStyleCharacteristics,
} from './deep-style-analyzer.js';

// Lanham Prose Analysis (7-axis framework)
export { LanhamProseAnalyzer } from './lanham-prose-analyzer.js';
export type { ILanhamAnalyzer } from './lanham-analyzer-interface.js';
export {
  GENRE_THRESHOLDS,
  GENRE_DEFAULTS,
  type LanhamThresholdConfig,
  type Genre,
} from './lanham-style-policy.js';

// Advanced Lanham Analyzer (Tier 2 deep analysis)
export { AdvancedLanhamAnalyzer } from './advanced-lanham-analyzer.js';
