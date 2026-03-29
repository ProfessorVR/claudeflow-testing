# ADR-001: Router vs Routing Architectural Boundary

**Status**: Accepted
**Date**: 2026-03-28
**Deciders**: Audit Phase 8.3

## Context

Two routing subsystems exist in `src/god-agent/core/`:

- **`core/router/`** (~25K LOC) answers: "Which LLM backend handles this request?"
  Provider selection, circuit breaking, rate limiting, cost tracking, retry handling.
  Key components: `task-classifier.ts`, `outcome-tracker.ts`, `retry-handler.ts`,
  `circuit-breaker.ts`, `rate-limiter.ts`, `risk-classifier.ts`.

- **`core/routing/`** (~6K LOC) answers: "Which agent handles this task?"
  DAI-001 agent selection, capability indexing, pipeline generation, cold-start routing.
  Key components: `task-analyzer.ts`, `failure-classifier.ts`, `routing-learner.ts`,
  `capability-index.ts`, `pipeline-generator.ts`.

They share vocabulary (task classification, failure classification, outcome tracking)
but operate at genuinely different architectural layers.

## Decision

These subsystems remain **separate architectural layers**. `core/routing/` selects the
AGENT; `core/router/` selects the LLM BACKEND for that agent's API calls. Merging them
would conflate two distinct concerns.

However, shared concepts are deduplicated into `core/router/shared-types.ts`:

### Deduplication Targets

1. **Task Classification**
   - `router/router-types.ts` defines `TaskClassification` (type, complexity, risk)
   - `routing/routing-types.ts` defines `ITaskAnalysis` (domain, complexity, embedding)
   - **Resolution**: `shared-types.ts` re-exports `TaskClassification` from `router-types`.
     `routing/task-analyzer.ts` imports it for cross-layer type compatibility.

2. **Failure Classification**
   - `router/retry-handler.ts` classifies provider-level errors (`ErrorType`)
   - `routing/failure-classifier.ts` classifies routing-level failures (`FailureType`)
   - **Resolution**: `shared-types.ts` defines a unified `FailureTaxonomy` that maps
     both layers into a single failure category system. `PROVIDER_FAILURE` covers
     router-level errors; `ROUTING_FAILURE`/`AGENT_FAILURE`/etc. cover routing-level.

3. **Outcome Tracking**
   - `router/outcome-tracker.ts` records routing outcomes (`RoutingOutcome`)
   - `routing/routing-learner.ts` learns from feedback (`IRoutingFeedback`)
   - **Resolution**: `shared-types.ts` defines an `OutcomeEvent` interface.
     `routing-learner.ts` can subscribe to router outcome events via this interface,
     eliminating duplicated outcome tracking.

## Consequences

- Shared types live in `core/router/shared-types.ts` (the lower-level layer)
- `core/routing/` depends on `core/router/` (via shared types), not vice versa
- No new directories or tsconfig path aliases required
- Future work: wire `routing-learner.ts` to consume `OutcomeTracker` events in real time
