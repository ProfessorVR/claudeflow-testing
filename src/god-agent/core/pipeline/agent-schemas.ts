/**
 * Agent Output Schemas for PhD Pipeline
 * PHASE-2-001 - Define Agent Output Schemas
 *
 * This module defines TypeScript interfaces for all 48 agent outputs,
 * along with validation functions to ensure agent outputs conform
 * to expected structures.
 *
 * Part of PhD Pipeline Effectiveness Improvement Plan
 * Implementation Plan Reference: phd-pipeline-implementation-plan.md
 */

// ============================================================================
// Common Types
// ============================================================================

/**
 * Validation result from schema check
 */
export interface SchemaValidationResult {
  /** Whether the output passed validation */
  valid: boolean;

  /** List of validation errors */
  errors: string[];

  /** Non-critical warnings */
  warnings: string[];
}

/**
 * Complexity level for various assessments
 */
export type ComplexityLevel = 'low' | 'medium' | 'high';

/**
 * Confidence level for assessments
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

// ============================================================================
// PHASE 1: FOUNDATION (Agents 1-4)
// ============================================================================

/**
 * Agent 1: Step-Back Analyzer Output
 */
export interface StepBackAnalyzerOutput {
  /** High-level problem framing */
  high_level_framing: string;

  /** Key questions to address */
  key_questions: string[];

  /** Success criteria for the solution */
  success_criteria: string[];
}

/**
 * Agent 2: Assumption Identifier Output
 */
export interface AssumptionIdentifierOutput {
  /** List of identified assumptions */
  assumptions_list: Array<{
    assumption: string;
    importance: ComplexityLevel;
    verifiable: boolean;
  }>;

  /** Preconditions that must hold */
  preconditions: string[];

  /** Boundary conditions for the solution */
  boundary_conditions: string[];
}

/**
 * Agent 3: Context Mapper Output
 */
export interface ContextMapperOutput {
  /** Map of the problem domain */
  domain_map: {
    core_domain: string;
    sub_domains: string[];
    boundaries: string[];
  };

  /** Related fields and disciplines */
  related_fields: string[];

  /** Key terminology definitions */
  terminology: Record<string, string>;
}

/**
 * Agent 4: Constraint Extractor Output
 */
export interface ConstraintExtractorOutput {
  /** All identified constraints */
  constraint_list: Array<{
    constraint: string;
    type: 'technical' | 'resource' | 'ethical' | 'temporal' | 'other';
    severity: ComplexityLevel;
  }>;

  /** Must-have requirements */
  must_haves: string[];

  /** Nice-to-have features */
  nice_to_haves: string[];
}

// ============================================================================
// PHASE 2: DISCOVERY (Agents 5-9)
// ============================================================================

/**
 * Agent 5: Literature Reviewer Output
 */
export interface LiteratureReviewerOutput {
  /** Summary of literature review */
  literature_summary: string;

  /** Key papers and references */
  key_papers: Array<{
    title: string;
    authors: string;
    year?: number;
    relevance: string;
  }>;

  /** Identified research gaps */
  research_gaps: string[];
}

/**
 * Agent 6: Parallel Path Explorer Output
 */
export interface ParallelPathExplorerOutput {
  /** Alternative solution paths */
  alternative_paths: Array<{
    id: string;
    description: string;
    approach: string;
    feasibility: ComplexityLevel;
  }>;

  /** Pros and cons for each path */
  path_pros_cons: Record<string, { pros: string[]; cons: string[] }>;
}

/**
 * Agent 7: Analogy Finder Output
 */
export interface AnalogyFinderOutput {
  /** Analogies from other domains */
  analogies: Array<{
    source_domain: string;
    analogy: string;
    applicability: string;
  }>;

  /** Cross-domain insights */
  cross_domain_insights: string[];
}

/**
 * Agent 8: Pattern Recognizer Output
 */
export interface PatternRecognizerOutput {
  /** Identified patterns */
  patterns: Array<{
    name: string;
    description: string;
    occurrences: number;
    significance: ComplexityLevel;
  }>;

  /** Recurring structures */
  recurring_structures: string[];
}

/**
 * Agent 9: Edge Case Hunter Output
 */
export interface EdgeCaseHunterOutput {
  /** Identified edge cases */
  edge_cases: Array<{
    case: string;
    trigger: string;
    severity: ComplexityLevel;
    handling_suggestion?: string;
  }>;

  /** Special conditions */
  special_conditions: string[];
}

// ============================================================================
// PHASE 3: ARCHITECTURE (Agents 10-15)
// ============================================================================

/**
 * Agent 10: Framework Builder Output
 */
export interface FrameworkBuilderOutput {
  /** High-level framework design */
  framework_design: {
    name: string;
    layers: string[];
    principles: string[];
  };

  /** Architectural principles */
  architectural_principles: string[];
}

/**
 * Agent 11: Component Designer Output
 */
export interface ComponentDesignerOutput {
  /** Component specifications */
  component_specs: Array<{
    id: string;
    name: string;
    responsibility: string;
    inputs: string[];
    outputs: string[];
  }>;

  /** Module descriptions */
  module_descriptions: Record<string, string>;
}

/**
 * Agent 12: Dependency Mapper Output
 */
export interface DependencyMapperOutput {
  /** Dependency graph representation */
  dependency_graph: {
    nodes: string[];
    edges: Array<{ from: string; to: string; type: string }>;
  };

  /** Interaction patterns */
  interaction_patterns: string[];
}

/**
 * Agent 13: Interface Definer Output
 */
export interface InterfaceDefinerOutput {
  /** Interface definitions */
  interface_definitions: Array<{
    name: string;
    methods: Array<{
      name: string;
      parameters: string[];
      returns: string;
    }>;
  }>;

  /** API contracts */
  api_contracts: Record<string, string>;
}

/**
 * Agent 14: Contradiction Analyzer Output
 */
export interface ContradictionAnalyzerOutput {
  /** Identified contradictions */
  contradictions: Array<{
    element_a: string;
    element_b: string;
    nature: string;
    severity: ComplexityLevel;
  }>;

  /** Inconsistencies found */
  inconsistencies: string[];

  /** Suggested resolutions */
  resolution_suggestions: string[];
}

/**
 * Agent 15: Scalability Planner Output
 */
export interface ScalabilityPlannerOutput {
  /** Scalability plan */
  scalability_plan: {
    dimensions: string[];
    strategies: string[];
    bottlenecks: string[];
  };

  /** Growth considerations */
  growth_considerations: string[];
}

// ============================================================================
// PHASE 4: SYNTHESIS (Agents 16-20)
// ============================================================================

/**
 * Agent 16: Cross Validator Output
 */
export interface CrossValidatorOutput {
  /** Validation report */
  validation_report: {
    status: 'passed' | 'failed' | 'partial';
    checks_passed: number;
    checks_failed: number;
    issues: string[];
  };

  /** Cross-check results */
  cross_checks: string[];
}

/**
 * Agent 17: Unification Agent Output
 */
export interface UnificationAgentOutput {
  /** Unified approach */
  unified_approach: {
    selected_path: string;
    integrated_elements: string[];
    trade_offs_accepted: string[];
  };

  /** Rationale for synthesis */
  synthesis_rationale: string;
}

/**
 * Agent 18: Consistency Checker Output
 */
export interface ConsistencyCheckerOutput {
  /** Consistency report */
  consistency_report: {
    overall_coherence: boolean;
    inconsistencies: string[];
    recommendations: string[];
  };

  /** Coherence score (0-1) */
  coherence_score: number;
}

/**
 * Agent 19: Optimization Suggester Output
 */
export interface OptimizationSuggesterOutput {
  /** Suggested optimizations */
  optimizations: Array<{
    area: string;
    suggestion: string;
    impact: ComplexityLevel;
    effort: ComplexityLevel;
  }>;

  /** Expected efficiency gains */
  efficiency_gains: string[];
}

/**
 * Agent 20: Trade-off Analyzer Output
 */
export interface TradeOffAnalyzerOutput {
  /** Identified trade-offs */
  trade_offs: Array<{
    dimension_a: string;
    dimension_b: string;
    trade_off: string;
    recommended_balance: string;
  }>;

  /** Decision matrix */
  decision_matrix: Record<string, Record<string, number>>;
}

// ============================================================================
// PHASE 5: DESIGN (Agents 21-25)
// ============================================================================

/**
 * Agent 21: Algorithm Designer Output
 */
export interface AlgorithmDesignerOutput {
  /** Designed algorithms */
  algorithms: Array<{
    name: string;
    purpose: string;
    complexity: string;
    description: string;
  }>;

  /** Pseudocode representations */
  pseudocode: Record<string, string>;
}

/**
 * Agent 22: Data Structure Architect Output
 */
export interface DataStructureArchitectOutput {
  /** Designed data structures */
  data_structures: Array<{
    name: string;
    type: string;
    purpose: string;
    operations: string[];
  }>;

  /** Storage schemas */
  storage_schemas: Record<string, unknown>;
}

/**
 * Agent 23: Protocol Designer Output
 */
export interface ProtocolDesignerOutput {
  /** Communication protocols */
  protocols: Array<{
    name: string;
    type: string;
    steps: string[];
    error_handling: string;
  }>;

  /** Message formats */
  message_formats: Record<string, unknown>;
}

/**
 * Agent 24: Error Handler Designer Output
 */
export interface ErrorHandlerDesignerOutput {
  /** Error handling strategies */
  error_handling: Array<{
    error_type: string;
    handler: string;
    recovery: string;
  }>;

  /** Recovery strategies */
  recovery_strategies: string[];
}

/**
 * Agent 25: Performance Estimator Output
 */
export interface PerformanceEstimatorOutput {
  /** Complexity analysis */
  complexity_analysis: {
    time_complexity: string;
    space_complexity: string;
    best_case: string;
    worst_case: string;
    average_case: string;
  };

  /** Performance estimates */
  performance_estimates: Record<string, string>;
}

// ============================================================================
// PHASE 6: WRITING (Agents 26-32)
// ============================================================================

/**
 * Agent 26: Technical Writer Output
 */
export interface TechnicalWriterOutput {
  /** Main technical document */
  technical_document: string;

  /** Methodology section */
  methodology_section: string;
}

/**
 * Agent 27: Proof Writer Output
 */
export interface ProofWriterOutput {
  /** Formal proofs */
  proofs: Array<{
    theorem: string;
    proof: string;
    assumptions: string[];
  }>;

  /** Correctness arguments */
  correctness_arguments: string[];
}

/**
 * Agent 28: Example Generator Output
 */
export interface ExampleGeneratorOutput {
  /** Generated examples */
  examples: Array<{
    title: string;
    description: string;
    code?: string;
  }>;

  /** Use cases */
  use_cases: string[];

  /** Worked examples with solutions */
  worked_examples: string[];
}

/**
 * Agent 29: Diagram Creator Output
 */
export interface DiagramCreatorOutput {
  /** Diagrams in various formats */
  diagrams: Array<{
    title: string;
    type: 'flowchart' | 'sequence' | 'class' | 'architecture' | 'other';
    content: string;
  }>;

  /** Flowcharts */
  flowcharts: string[];

  /** Architecture visuals */
  architecture_visuals: string[];
}

/**
 * Agent 30: Notation Standardizer Output
 */
export interface NotationStandardizerOutput {
  /** Notation guide */
  notation_guide: {
    conventions: string[];
    rules: string[];
  };

  /** Symbol definitions */
  symbol_definitions: Record<string, string>;
}

/**
 * Agent 31: Citation Manager Output
 */
export interface CitationManagerOutput {
  /** Bibliography entries */
  bibliography: Array<{
    id: string;
    citation: string;
    type: string;
  }>;

  /** Citation map (where each citation is used) */
  citation_map: Record<string, string[]>;
}

/**
 * Agent 32: Abstract Writer Output
 */
export interface AbstractWriterOutput {
  /** Abstract text */
  abstract: string;

  /** Executive summary */
  executive_summary: string;
}

// ============================================================================
// PHASE 7: QA (Agents 33-48)
// ============================================================================

/**
 * Agent 33: Adversarial Reviewer Output
 */
export interface AdversarialReviewerOutput {
  /** Attack vectors identified */
  attack_vectors: Array<{
    vector: string;
    severity: ComplexityLevel;
    mitigation: string;
  }>;

  /** Weaknesses found */
  weaknesses: string[];

  /** Counterarguments to claims */
  counterarguments: string[];
}

/**
 * Agent 34: Completeness Checker Output
 */
export interface CompletenessCheckerOutput {
  /** Completeness report */
  completeness_report: {
    coverage_percentage: number;
    covered_areas: string[];
    missing_areas: string[];
  };

  /** Missing elements */
  missing_elements: string[];
}

/**
 * Agent 35: Clarity Evaluator Output
 */
export interface ClarityEvaluatorOutput {
  /** Clarity score (0-100) */
  clarity_score: number;

  /** Readability suggestions */
  readability_suggestions: Array<{
    section: string;
    issue: string;
    suggestion: string;
  }>;
}

/**
 * Agent 36: Novelty Assessor Output
 */
export interface NoveltyAssessorOutput {
  /** Novelty score (0-100) */
  novelty_score: number;

  /** Key contributions */
  contributions: string[];
}

/**
 * Agent 37: Reproducibility Validator Output
 */
export interface ReproducibilityValidatorOutput {
  /** Reproducibility checklist */
  reproducibility_checklist: Array<{
    item: string;
    status: 'met' | 'partial' | 'not_met';
    notes?: string;
  }>;

  /** Replication steps */
  replication_steps: string[];
}

/**
 * Agent 38: Ethics Reviewer Output
 */
export interface EthicsReviewerOutput {
  /** Ethics report */
  ethics_report: {
    overall_assessment: 'approved' | 'concerns' | 'rejected';
    concerns: string[];
    recommendations: string[];
  };

  /** Impact assessment */
  impact_assessment: string;
}

/**
 * Agent 39: Security Analyzer Output
 */
export interface SecurityAnalyzerOutput {
  /** Security report */
  security_report: {
    risk_level: ComplexityLevel;
    vulnerabilities: string[];
    mitigations: string[];
  };

  /** Vulnerability assessment */
  vulnerability_assessment: Array<{
    vulnerability: string;
    severity: ComplexityLevel;
    exploitability: ComplexityLevel;
  }>;
}

/**
 * Agent 40: Performance Validator Output
 */
export interface PerformanceValidatorOutput {
  /** Performance validation results */
  performance_validation: {
    claims_validated: number;
    claims_failed: number;
    details: string[];
  };

  /** Benchmark plan */
  benchmark_plan: string[];
}

/**
 * Agent 41: Scalability Verifier Output
 */
export interface ScalabilityVerifierOutput {
  /** Scalability verification */
  scalability_verification: {
    verified: boolean;
    tested_dimensions: string[];
    issues: string[];
  };

  /** Growth limits */
  growth_limits: Record<string, string>;
}

/**
 * Agent 42: Usability Assessor Output
 */
export interface UsabilityAssessorOutput {
  /** Usability report */
  usability_report: {
    score: number;
    strengths: string[];
    weaknesses: string[];
  };

  /** Adoption barriers */
  adoption_barriers: string[];
}

/**
 * Agent 43: Documentation Reviewer Output
 */
export interface DocumentationReviewerOutput {
  /** Documentation quality assessment */
  documentation_quality: {
    score: number;
    completeness: number;
    clarity: number;
    consistency: number;
  };

  /** Improvement suggestions */
  improvement_suggestions: string[];
}

/**
 * Agent 44: Test Coverage Analyst Output
 */
export interface TestCoverageAnalystOutput {
  /** Test coverage report */
  test_coverage_report: {
    coverage_percentage: number;
    covered_scenarios: string[];
    uncovered_scenarios: string[];
  };

  /** Test gaps */
  test_gaps: string[];
}

/**
 * Agent 45: Edge Case Verifier Output
 */
export interface EdgeCaseVerifierOutput {
  /** Edge case verification */
  edge_case_verification: {
    total_cases: number;
    verified_cases: number;
    failed_cases: number;
  };

  /** Unhandled cases */
  unhandled_cases: string[];
}

/**
 * Agent 46: Compliance Checker Output
 */
export interface ComplianceCheckerOutput {
  /** Compliance report */
  compliance_report: {
    compliant: boolean;
    standards_checked: string[];
    violations: string[];
  };

  /** Standards alignment */
  standards_alignment: Record<string, boolean>;
}

/**
 * Agent 47: Final Synthesizer Output
 */
export interface FinalSynthesizerOutput {
  /** QA synthesis */
  qa_synthesis: {
    overall_quality: number;
    critical_issues: string[];
    warnings: string[];
    passed_checks: number;
    failed_checks: number;
  };

  /** Final recommendations */
  final_recommendations: string[];

  /** Go/no-go decision */
  go_no_go_decision: 'go' | 'no_go' | 'conditional';
}

/**
 * Agent 48: Sign-off Approver Output
 */
export interface SignOffApproverOutput {
  /** Approval status */
  approval_status: 'approved' | 'rejected' | 'revision_required';

  /** Sign-off certificate */
  sign_off_certificate: {
    approved: boolean;
    approver: string;
    date: string;
    conditions?: string[];
  };

  /** Release notes */
  release_notes: string;
}

// ============================================================================
// Schema Registry
// ============================================================================

/**
 * Map of agent keys to their output types
 */
export type AgentOutputMap = {
  // Phase 1
  'step-back-analyzer': StepBackAnalyzerOutput;
  'assumption-identifier': AssumptionIdentifierOutput;
  'context-mapper': ContextMapperOutput;
  'constraint-extractor': ConstraintExtractorOutput;
  // Phase 2
  'literature-reviewer': LiteratureReviewerOutput;
  'parallel-path-explorer': ParallelPathExplorerOutput;
  'analogy-finder': AnalogyFinderOutput;
  'pattern-recognizer': PatternRecognizerOutput;
  'edge-case-hunter': EdgeCaseHunterOutput;
  // Phase 3
  'framework-builder': FrameworkBuilderOutput;
  'component-designer': ComponentDesignerOutput;
  'dependency-mapper': DependencyMapperOutput;
  'interface-definer': InterfaceDefinerOutput;
  'contradiction-analyzer': ContradictionAnalyzerOutput;
  'scalability-planner': ScalabilityPlannerOutput;
  // Phase 4
  'cross-validator': CrossValidatorOutput;
  'unification-agent': UnificationAgentOutput;
  'consistency-checker': ConsistencyCheckerOutput;
  'optimization-suggester': OptimizationSuggesterOutput;
  'trade-off-analyzer': TradeOffAnalyzerOutput;
  // Phase 5
  'algorithm-designer': AlgorithmDesignerOutput;
  'data-structure-architect': DataStructureArchitectOutput;
  'protocol-designer': ProtocolDesignerOutput;
  'error-handler-designer': ErrorHandlerDesignerOutput;
  'performance-estimator': PerformanceEstimatorOutput;
  // Phase 6
  'technical-writer': TechnicalWriterOutput;
  'proof-writer': ProofWriterOutput;
  'example-generator': ExampleGeneratorOutput;
  'diagram-creator': DiagramCreatorOutput;
  'notation-standardizer': NotationStandardizerOutput;
  'citation-manager': CitationManagerOutput;
  'abstract-writer': AbstractWriterOutput;
  // Phase 7
  'adversarial-reviewer': AdversarialReviewerOutput;
  'completeness-checker': CompletenessCheckerOutput;
  'clarity-evaluator': ClarityEvaluatorOutput;
  'novelty-assessor': NoveltyAssessorOutput;
  'reproducibility-validator': ReproducibilityValidatorOutput;
  'ethics-reviewer': EthicsReviewerOutput;
  'security-analyzer': SecurityAnalyzerOutput;
  'performance-validator': PerformanceValidatorOutput;
  'scalability-verifier': ScalabilityVerifierOutput;
  'usability-assessor': UsabilityAssessorOutput;
  'documentation-reviewer': DocumentationReviewerOutput;
  'test-coverage-analyst': TestCoverageAnalystOutput;
  'edge-case-verifier': EdgeCaseVerifierOutput;
  'compliance-checker': ComplianceCheckerOutput;
  'final-synthesizer': FinalSynthesizerOutput;
  'sign-off-approver': SignOffApproverOutput;
};

/**
 * All valid agent keys
 */
export type AgentKey = keyof AgentOutputMap;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is an array with at least one element
 */
function isNonEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Check if a value is a valid complexity level
 */
function isValidComplexity(value: unknown): value is ComplexityLevel {
  return value === 'low' || value === 'medium' || value === 'high';
}

/**
 * Create a validation result
 */
function createResult(errors: string[], warnings: string[] = []): SchemaValidationResult {
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Step-Back Analyzer output
 */
function validateStepBackAnalyzer(output: unknown): SchemaValidationResult {
  const errors: string[] = [];

  if (!output || typeof output !== 'object') {
    return createResult(['Output must be an object']);
  }

  const o = output as Record<string, unknown>;

  if (!isNonEmptyString(o.high_level_framing)) {
    errors.push('high_level_framing must be a non-empty string');
  }

  if (!isNonEmptyArray(o.key_questions)) {
    errors.push('key_questions must be a non-empty array');
  }

  if (!isNonEmptyArray(o.success_criteria)) {
    errors.push('success_criteria must be a non-empty array');
  }

  return createResult(errors);
}

/**
 * Validate Technical Writer output
 */
function validateTechnicalWriter(output: unknown): SchemaValidationResult {
  const errors: string[] = [];

  if (!output || typeof output !== 'object') {
    return createResult(['Output must be an object']);
  }

  const o = output as Record<string, unknown>;

  if (!isNonEmptyString(o.technical_document)) {
    errors.push('technical_document must be a non-empty string');
  }

  if (!isNonEmptyString(o.methodology_section)) {
    errors.push('methodology_section must be a non-empty string');
  }

  return createResult(errors);
}

/**
 * Validate Adversarial Reviewer output
 */
function validateAdversarialReviewer(output: unknown): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!output || typeof output !== 'object') {
    return createResult(['Output must be an object']);
  }

  const o = output as Record<string, unknown>;

  if (!Array.isArray(o.attack_vectors)) {
    errors.push('attack_vectors must be an array');
  }

  if (!Array.isArray(o.weaknesses)) {
    errors.push('weaknesses must be an array');
  }

  if (!Array.isArray(o.counterarguments)) {
    errors.push('counterarguments must be an array');
  }

  // Warning if no attack vectors found
  if (Array.isArray(o.attack_vectors) && o.attack_vectors.length === 0) {
    warnings.push('No attack vectors identified - consider if this is complete');
  }

  return createResult(errors, warnings);
}

/**
 * Validate Final Synthesizer output
 */
function validateFinalSynthesizer(output: unknown): SchemaValidationResult {
  const errors: string[] = [];

  if (!output || typeof output !== 'object') {
    return createResult(['Output must be an object']);
  }

  const o = output as Record<string, unknown>;

  if (!o.qa_synthesis || typeof o.qa_synthesis !== 'object') {
    errors.push('qa_synthesis must be an object');
  }

  if (!Array.isArray(o.final_recommendations)) {
    errors.push('final_recommendations must be an array');
  }

  const validDecisions = ['go', 'no_go', 'conditional'];
  if (!validDecisions.includes(o.go_no_go_decision as string)) {
    errors.push(`go_no_go_decision must be one of: ${validDecisions.join(', ')}`);
  }

  return createResult(errors);
}

/**
 * Generic validation for agents without specific validators
 * Checks that output is a non-empty object with expected structure
 */
function validateGenericOutput(
  output: unknown,
  expectedFields: string[]
): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!output || typeof output !== 'object') {
    return createResult(['Output must be an object']);
  }

  const o = output as Record<string, unknown>;

  for (const field of expectedFields) {
    if (!(field in o)) {
      warnings.push(`Expected field '${field}' is missing`);
    } else if (o[field] === null || o[field] === undefined) {
      warnings.push(`Field '${field}' is null or undefined`);
    }
  }

  return createResult(errors, warnings);
}

// ============================================================================
// Validator Registry
// ============================================================================

/**
 * Expected fields for each agent (for generic validation)
 */
const AGENT_EXPECTED_FIELDS: Record<AgentKey, string[]> = {
  'step-back-analyzer': ['high_level_framing', 'key_questions', 'success_criteria'],
  'assumption-identifier': ['assumptions_list', 'preconditions', 'boundary_conditions'],
  'context-mapper': ['domain_map', 'related_fields', 'terminology'],
  'constraint-extractor': ['constraint_list', 'must_haves', 'nice_to_haves'],
  'literature-reviewer': ['literature_summary', 'key_papers', 'research_gaps'],
  'parallel-path-explorer': ['alternative_paths', 'path_pros_cons'],
  'analogy-finder': ['analogies', 'cross_domain_insights'],
  'pattern-recognizer': ['patterns', 'recurring_structures'],
  'edge-case-hunter': ['edge_cases', 'special_conditions'],
  'framework-builder': ['framework_design', 'architectural_principles'],
  'component-designer': ['component_specs', 'module_descriptions'],
  'dependency-mapper': ['dependency_graph', 'interaction_patterns'],
  'interface-definer': ['interface_definitions', 'api_contracts'],
  'contradiction-analyzer': ['contradictions', 'inconsistencies', 'resolution_suggestions'],
  'scalability-planner': ['scalability_plan', 'growth_considerations'],
  'cross-validator': ['validation_report', 'cross_checks'],
  'unification-agent': ['unified_approach', 'synthesis_rationale'],
  'consistency-checker': ['consistency_report', 'coherence_score'],
  'optimization-suggester': ['optimizations', 'efficiency_gains'],
  'trade-off-analyzer': ['trade_offs', 'decision_matrix'],
  'algorithm-designer': ['algorithms', 'pseudocode'],
  'data-structure-architect': ['data_structures', 'storage_schemas'],
  'protocol-designer': ['protocols', 'message_formats'],
  'error-handler-designer': ['error_handling', 'recovery_strategies'],
  'performance-estimator': ['complexity_analysis', 'performance_estimates'],
  'technical-writer': ['technical_document', 'methodology_section'],
  'proof-writer': ['proofs', 'correctness_arguments'],
  'example-generator': ['examples', 'use_cases', 'worked_examples'],
  'diagram-creator': ['diagrams', 'flowcharts', 'architecture_visuals'],
  'notation-standardizer': ['notation_guide', 'symbol_definitions'],
  'citation-manager': ['bibliography', 'citation_map'],
  'abstract-writer': ['abstract', 'executive_summary'],
  'adversarial-reviewer': ['attack_vectors', 'weaknesses', 'counterarguments'],
  'completeness-checker': ['completeness_report', 'missing_elements'],
  'clarity-evaluator': ['clarity_score', 'readability_suggestions'],
  'novelty-assessor': ['novelty_score', 'contributions'],
  'reproducibility-validator': ['reproducibility_checklist', 'replication_steps'],
  'ethics-reviewer': ['ethics_report', 'impact_assessment'],
  'security-analyzer': ['security_report', 'vulnerability_assessment'],
  'performance-validator': ['performance_validation', 'benchmark_plan'],
  'scalability-verifier': ['scalability_verification', 'growth_limits'],
  'usability-assessor': ['usability_report', 'adoption_barriers'],
  'documentation-reviewer': ['documentation_quality', 'improvement_suggestions'],
  'test-coverage-analyst': ['test_coverage_report', 'test_gaps'],
  'edge-case-verifier': ['edge_case_verification', 'unhandled_cases'],
  'compliance-checker': ['compliance_report', 'standards_alignment'],
  'final-synthesizer': ['qa_synthesis', 'final_recommendations', 'go_no_go_decision'],
  'sign-off-approver': ['approval_status', 'sign_off_certificate', 'release_notes'],
};

/**
 * Custom validators for critical agents
 */
const CUSTOM_VALIDATORS: Partial<Record<AgentKey, (output: unknown) => SchemaValidationResult>> = {
  'step-back-analyzer': validateStepBackAnalyzer,
  'technical-writer': validateTechnicalWriter,
  'adversarial-reviewer': validateAdversarialReviewer,
  'final-synthesizer': validateFinalSynthesizer,
};

/**
 * Validate agent output against schema
 *
 * @param agentKey - The agent's key identifier
 * @param output - The output to validate
 * @returns Validation result with errors and warnings
 */
export function validateAgentOutput(
  agentKey: string,
  output: unknown
): SchemaValidationResult {
  // Check if this is a known agent
  if (!(agentKey in AGENT_EXPECTED_FIELDS)) {
    return createResult([], [`Unknown agent key: ${agentKey}`]);
  }

  const key = agentKey as AgentKey;

  // Use custom validator if available
  if (key in CUSTOM_VALIDATORS) {
    return CUSTOM_VALIDATORS[key]!(output);
  }

  // Fall back to generic validation
  return validateGenericOutput(output, AGENT_EXPECTED_FIELDS[key]);
}

/**
 * Check if an agent key is valid
 */
export function isValidAgentKey(key: string): key is AgentKey {
  return key in AGENT_EXPECTED_FIELDS;
}

/**
 * Get expected output fields for an agent
 */
export function getExpectedFields(agentKey: AgentKey): string[] {
  return AGENT_EXPECTED_FIELDS[agentKey] || [];
}

/**
 * Get all agent keys
 */
export function getAllAgentKeys(): AgentKey[] {
  return Object.keys(AGENT_EXPECTED_FIELDS) as AgentKey[];
}
