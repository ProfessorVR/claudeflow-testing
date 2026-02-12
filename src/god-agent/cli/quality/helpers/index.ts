/**
 * Quality Enhancement Helpers
 *
 * Phase 2 enhancements for reducing false positives in quality validation
 * Priority 2 additions: Location tracking for granular quality reporting
 */

export { CitationRefiner } from './citation-refiner.js';
export type {
  Location,
  TermInfo,
  IssueRecommendation,
  CitationRefinerConfig,
} from './citation-refiner.js';

export { ClaimStrengthAnalyzer } from './claim-strength-analyzer.js';
export type {
  ArgumentContext,
  Premise,
  Evidence,
  Conclusion,
  ArgumentChain,
  SupportScore,
  ClaimStrengthEvaluation,
  ClaimStrengthConfig,
  ParagraphAnalysis as ClaimParagraphAnalysis,
} from './claim-strength-analyzer.js';

export { PhilosophicalConceptTracker } from './philosophical-concept-tracker.js';
export type {
  ConceptLocation,
  ConceptDefinition,
  ConceptUsage,
  PhilosophicalConcept,
  GroundworkCheck,
  SynthesisValidation,
  ConceptMilestone,
  ConceptTimeline,
  ConsistencyCheck,
  ConceptTrackerConfig,
} from './philosophical-concept-tracker.js';

// Priority 2: Location Tracking
export {
  LocationTracker,
  IssueBuilder,
  createLocationTracker,
  createIssueBuilder,
  upgradeIssues,
  findSectionAtPosition,
} from './location-tracker.js';
