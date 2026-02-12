/**
 * Dependency Graph - Paragraph dependency tracking
 *
 * This module provides data structures for tracking dependencies between
 * paragraphs, ensuring proper ordering, and preventing forward references.
 *
 * @module dependency-graph
 */

/**
 * ParagraphNode - Single paragraph with dependencies
 */
export interface ParagraphNode {
  /** Unique paragraph ID (e.g., "P1.1.2" for section 1, subsection 1, paragraph 2) */
  id: string;

  /** Location in document */
  location: ParagraphLocation;

  /** Topic sentence / purpose of paragraph */
  purpose: string;

  /** Input assumptions (what must be established before) */
  inputAssumptions: InputAssumptions;

  /** Output contributions (what this paragraph adds) */
  outputContributions: OutputContributions;

  /** Open questions/tensions (intentionally unresolved) */
  openTensions: string[];

  /** Conceptual work performed by this paragraph */
  conceptualWork: ConceptualWork;

  /** Paragraph metadata */
  metadata: ParagraphMetadata;
}

/**
 * Paragraph location
 */
export interface ParagraphLocation {
  /** Section identifier */
  sectionId: string;

  /** Subsection identifier (optional) */
  subsectionId?: string;

  /** Paragraph index within subsection/section */
  paragraphIndex: number;

  /** Word count */
  wordCount: number;
}

/**
 * Input assumptions - what paragraph requires
 */
export interface InputAssumptions {
  /** Claims this paragraph assumes */
  requiredClaims: string[]; // Claim IDs (e.g., ["C1", "C2"])

  /** Concepts that must be defined */
  requiredConcepts: string[]; // Concept terms

  /** Narrative threads continued */
  requiredThreads: string[]; // Thread IDs

  /** Reader knowledge required */
  requiredKnowledge: string[];
}

/**
 * Output contributions - what paragraph adds
 */
export interface OutputContributions {
  /** New claims established */
  claimsEstablished: string[]; // Claim IDs

  /** Concepts introduced or refined */
  conceptsIntroduced: string[]; // Concept terms

  /** Narrative threads advanced */
  threadsAdvanced: string[]; // Thread IDs

  /** Reader knowledge added */
  knowledgeAdded: string[];
}

/**
 * Type of conceptual work paragraph performs
 */
export type ConceptualWork =
  | 'claim-establishment'    // Establishes a new claim
  | 'evidence-presentation'  // Presents supporting evidence
  | 'counter-argument'       // Addresses objections
  | 'synthesis'             // Synthesizes multiple claims
  | 'transition'            // Bridges sections
  | 'example'               // Provides illustrative example
  | 'definition'            // Defines a concept
  | 'clarification';        // Clarifies previous content

/**
 * Paragraph metadata
 */
export interface ParagraphMetadata {
  /** Whether paragraph satisfies its purpose */
  purposeFulfilled: boolean;

  /** Quality of transitions (0-1) */
  transitionQuality: number;

  /** Dependency satisfaction rate (0-1) */
  dependencySatisfaction: number;

  /** Conceptual clarity (0-1) */
  clarity: number;
}

/**
 * DependencyGraph - Complete paragraph dependency structure
 */
export interface DependencyGraph {
  /** All paragraph nodes */
  nodes: Map<string, ParagraphNode>;

  /** Dependency edges (paragraphId -> [prerequisite paragraphIds]) */
  edges: Map<string, string[]>;

  /** Topological sort (reading order respecting dependencies) */
  topologicalOrder: string[];

  /** Detected violations */
  violations: DependencyViolation[];

  /** Graph metadata */
  metadata: GraphMetadata;
}

/**
 * Dependency violation
 */
export interface DependencyViolation {
  /** Violation type */
  type: 'forward-reference' | 'circular' | 'missing-prerequisite' | 'orphan-paragraph';

  /** Paragraph ID with violation */
  paragraphId: string;

  /** Description of violation */
  issue: string;

  /** Severity */
  severity: 'critical' | 'major' | 'minor';

  /** Suggested fix */
  suggestedFix: string;

  /** Related paragraphs */
  relatedParagraphs?: string[];
}

/**
 * Graph metadata
 */
export interface GraphMetadata {
  /** Total paragraphs */
  totalParagraphs: number;

  /** Paragraphs with dependencies */
  paragraphsWithDependencies: number;

  /** Average dependencies per paragraph */
  averageDependencies: number;

  /** Maximum dependency chain length */
  maxChainLength: number;

  /** Whether graph is acyclic */
  isAcyclic: boolean;

  /** Validation status */
  validationStatus: GraphValidationStatus;
}

/**
 * Graph validation status
 */
export interface GraphValidationStatus {
  /** Whether validation passed */
  passed: boolean;

  /** Overall validation score (0-1) */
  score: number;

  /** Validation issues */
  issues: DependencyViolation[];
}

/**
 * Build dependency edges from paragraph nodes
 *
 * @param nodes - Map of paragraph nodes
 * @returns Dependency edges
 */
export function buildDependencyEdges(
  nodes: Map<string, ParagraphNode>
): Map<string, string[]> {
  const edges = new Map<string, string[]>();

  for (const [paragraphId, node] of nodes) {
    const prerequisites: string[] = [];

    // Find paragraphs that provide required claims
    for (const requiredClaim of node.inputAssumptions.requiredClaims) {
      for (const [otherId, otherNode] of nodes) {
        if (otherNode.outputContributions.claimsEstablished.includes(requiredClaim)) {
          if (!prerequisites.includes(otherId)) {
            prerequisites.push(otherId);
          }
        }
      }
    }

    // Find paragraphs that provide required concepts
    for (const requiredConcept of node.inputAssumptions.requiredConcepts) {
      for (const [otherId, otherNode] of nodes) {
        if (otherNode.outputContributions.conceptsIntroduced.includes(requiredConcept)) {
          if (!prerequisites.includes(otherId)) {
            prerequisites.push(otherId);
          }
        }
      }
    }

    // Find paragraphs that initiated required threads
    for (const requiredThread of node.inputAssumptions.requiredThreads) {
      for (const [otherId, otherNode] of nodes) {
        if (otherNode.outputContributions.threadsAdvanced.includes(requiredThread)) {
          if (!prerequisites.includes(otherId)) {
            prerequisites.push(otherId);
          }
        }
      }
    }

    if (prerequisites.length > 0) {
      edges.set(paragraphId, prerequisites);
    }
  }

  return edges;
}

/**
 * Perform topological sort on dependency graph
 *
 * @param nodes - Paragraph nodes
 * @param edges - Dependency edges
 * @returns Topological order (or empty if cycle detected)
 */
export function topologicalSort(
  nodes: Map<string, ParagraphNode>,
  edges: Map<string, string[]>
): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(nodeId: string): boolean {
    if (visited.has(nodeId)) return true;
    if (visiting.has(nodeId)) return false; // Cycle detected

    visiting.add(nodeId);

    const prerequisites = edges.get(nodeId) || [];
    for (const prereq of prerequisites) {
      if (!visit(prereq)) return false; // Cycle in prerequisite
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    sorted.push(nodeId);

    return true;
  }

  for (const nodeId of nodes.keys()) {
    if (!visited.has(nodeId)) {
      if (!visit(nodeId)) {
        // Cycle detected - return empty array
        return [];
      }
    }
  }

  return sorted;
}

/**
 * Detect forward references
 *
 * @param nodes - Paragraph nodes
 * @param edges - Dependency edges
 * @returns Forward reference violations
 */
export function detectForwardReferences(
  nodes: Map<string, ParagraphNode>,
  edges: Map<string, string[]>
): DependencyViolation[] {
  const violations: DependencyViolation[] = [];

  for (const [paragraphId, prerequisites] of edges) {
    const paraNode = nodes.get(paragraphId)!;

    for (const prereqId of prerequisites) {
      const prereqNode = nodes.get(prereqId);
      if (!prereqNode) {
        violations.push({
          type: 'missing-prerequisite',
          paragraphId,
          issue: `Required paragraph ${prereqId} not found`,
          severity: 'critical',
          suggestedFix: `Ensure paragraph ${prereqId} exists or remove dependency`,
          relatedParagraphs: [prereqId]
        });
        continue;
      }

      // Check if prerequisite comes after current paragraph
      const paraIndex = getParagraphIndex(paraNode.location);
      const prereqIndex = getParagraphIndex(prereqNode.location);

      if (prereqIndex > paraIndex) {
        violations.push({
          type: 'forward-reference',
          paragraphId,
          issue: `Paragraph depends on ${prereqId} which appears later in document`,
          severity: 'major',
          suggestedFix: `Reorder paragraphs or remove forward dependency`,
          relatedParagraphs: [prereqId]
        });
      }
    }
  }

  return violations;
}

/**
 * Get linear index for paragraph location
 */
function getParagraphIndex(location: ParagraphLocation): number {
  // Simple heuristic: section * 1000 + subsection * 100 + paragraph
  const sectionNum = parseInt(location.sectionId) || 0;
  const subsectionNum = location.subsectionId ? parseInt(location.subsectionId.split('.').pop()!) : 0;
  return sectionNum * 1000 + subsectionNum * 100 + location.paragraphIndex;
}

/**
 * Detect circular dependencies
 *
 * @param nodes - Paragraph nodes
 * @param edges - Dependency edges
 * @returns Circular dependency violations
 */
export function detectCircularDependencies(
  nodes: Map<string, ParagraphNode>,
  edges: Map<string, string[]>
): DependencyViolation[] {
  const violations: DependencyViolation[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const cycles: string[][] = [];

  function detectCycle(nodeId: string, path: string[]): void {
    if (visited.has(nodeId)) return;
    if (visiting.has(nodeId)) {
      // Cycle detected
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart).concat(nodeId);
      cycles.push(cycle);
      return;
    }

    visiting.add(nodeId);
    path.push(nodeId);

    const prerequisites = edges.get(nodeId) || [];
    for (const prereq of prerequisites) {
      detectCycle(prereq, [...path]);
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  for (const nodeId of nodes.keys()) {
    if (!visited.has(nodeId)) {
      detectCycle(nodeId, []);
    }
  }

  for (const cycle of cycles) {
    violations.push({
      type: 'circular',
      paragraphId: cycle[0],
      issue: `Circular dependency detected: ${cycle.join(' → ')}`,
      severity: 'critical',
      suggestedFix: 'Break circular dependency by reordering or removing dependencies',
      relatedParagraphs: cycle
    });
  }

  return violations;
}

/**
 * Detect orphan paragraphs (no inputs, no outputs)
 *
 * @param nodes - Paragraph nodes
 * @returns Orphan paragraph violations
 */
export function detectOrphanParagraphs(
  nodes: Map<string, ParagraphNode>
): DependencyViolation[] {
  const violations: DependencyViolation[] = [];

  for (const [paragraphId, node] of nodes) {
    const hasInputs = (
      node.inputAssumptions.requiredClaims.length > 0 ||
      node.inputAssumptions.requiredConcepts.length > 0 ||
      node.inputAssumptions.requiredThreads.length > 0
    );

    const hasOutputs = (
      node.outputContributions.claimsEstablished.length > 0 ||
      node.outputContributions.conceptsIntroduced.length > 0 ||
      node.outputContributions.threadsAdvanced.length > 0
    );

    if (!hasInputs && !hasOutputs) {
      violations.push({
        type: 'orphan-paragraph',
        paragraphId,
        issue: 'Paragraph has no dependencies or contributions',
        severity: 'minor',
        suggestedFix: 'Clarify paragraph purpose or integrate into argument flow'
      });
    }
  }

  return violations;
}

/**
 * Validate dependency graph
 *
 * @param graph - The dependency graph to validate
 * @returns Validation status
 */
export function validateDependencyGraph(graph: DependencyGraph): GraphValidationStatus {
  const issues: DependencyViolation[] = [];

  // Detect all violation types
  issues.push(...detectForwardReferences(graph.nodes, graph.edges));
  issues.push(...detectCircularDependencies(graph.nodes, graph.edges));
  issues.push(...detectOrphanParagraphs(graph.nodes));

  // Check topological sort
  const sorted = topologicalSort(graph.nodes, graph.edges);
  if (sorted.length === 0 && graph.nodes.size > 0) {
    issues.push({
      type: 'circular',
      paragraphId: 'graph',
      issue: 'Graph contains cycles - cannot establish valid reading order',
      severity: 'critical',
      suggestedFix: 'Remove circular dependencies'
    });
  }

  // Calculate validation score
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const majorIssues = issues.filter(i => i.severity === 'major').length;
  const minorIssues = issues.filter(i => i.severity === 'minor').length;

  const score = Math.max(0, 1.0 - (
    criticalIssues * 0.30 +
    majorIssues * 0.15 +
    minorIssues * 0.05
  ));

  const passed = score >= 0.80 && criticalIssues === 0;

  return {
    passed,
    score,
    issues
  };
}

/**
 * Calculate graph metadata
 *
 * @param graph - The dependency graph
 * @returns Graph metadata
 */
export function calculateGraphMetadata(graph: DependencyGraph): GraphMetadata {
  const totalParagraphs = graph.nodes.size;
  const paragraphsWithDependencies = graph.edges.size;

  let totalDependencies = 0;
  for (const deps of graph.edges.values()) {
    totalDependencies += deps.length;
  }

  const averageDependencies = totalParagraphs > 0
    ? totalDependencies / totalParagraphs
    : 0;

  // Calculate maximum chain length
  const maxChainLength = calculateMaxChainLength(graph.nodes, graph.edges);

  // Check if graph is acyclic
  const sorted = topologicalSort(graph.nodes, graph.edges);
  const isAcyclic = sorted.length > 0 || graph.nodes.size === 0;

  const validationStatus = validateDependencyGraph(graph);

  return {
    totalParagraphs,
    paragraphsWithDependencies,
    averageDependencies,
    maxChainLength,
    isAcyclic,
    validationStatus
  };
}

/**
 * Calculate maximum dependency chain length
 */
function calculateMaxChainLength(
  nodes: Map<string, ParagraphNode>,
  edges: Map<string, string[]>
): number {
  const memo = new Map<string, number>();

  function getChainLength(nodeId: string, visited: Set<string>): number {
    if (memo.has(nodeId)) return memo.get(nodeId)!;
    if (visited.has(nodeId)) return 0; // Cycle

    visited.add(nodeId);

    const prerequisites = edges.get(nodeId) || [];
    if (prerequisites.length === 0) {
      memo.set(nodeId, 1);
      visited.delete(nodeId);
      return 1;
    }

    const maxPrereqLength = Math.max(
      ...prerequisites.map(prereq => getChainLength(prereq, new Set(visited)))
    );

    const chainLength = 1 + maxPrereqLength;
    memo.set(nodeId, chainLength);
    visited.delete(nodeId);

    return chainLength;
  }

  let maxLength = 0;
  for (const nodeId of nodes.keys()) {
    const length = getChainLength(nodeId, new Set());
    maxLength = Math.max(maxLength, length);
  }

  return maxLength;
}
