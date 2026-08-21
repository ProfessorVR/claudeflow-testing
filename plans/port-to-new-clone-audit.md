# Port to New Clone — Audit Report

**Date**: 2026-03-23
**Fresh clone**: `/home/dalton/projects/claudeflow-new` (from `ste-bah/claudeflow-testing`, commit `84d5930`)
**This repo**: `/home/dalton/projects/claudeflow-testing` (branch `writing-pipeline-v2`)

---

## Summary

| Category | Count | Action |
|----------|------:|--------|
| TS source files — pure additions (no upstream equivalent) | 285 | Copy directly |
| TS source files — identical to upstream | 423 | Already there, skip |
| TS source files — modified from upstream | 62 | Merge your changes into upstream version |
| Test files — pure additions | 146 | Copy directly |
| Test files — modified from upstream | 49 | Merge your changes into upstream version |
| Dashboard files (JS/CSS/HTML) — unique | 1 | Copy (`icp-panel.js`) |
| Dashboard files — modified | 3 | Merge (upstream rewrote to 4-tab SPA) |
| Scripts — unique to this repo | ~215 | Copy relevant ones |
| `.claude/commands` — unique | 11 | Copy directly |
| `.god-agent/` runtime data | ~33 files | Copy selectively (config yes, stale DBs no) |

---

## Category 1: Pure Additions (285 TS files — direct copy)

These files exist only in this repo. Copy them directly to the new clone.

### By subsystem:

| Directory | Files | Purpose |
|-----------|------:|---------|
| `src/god-agent/core/router/` | 40 | Adaptive LLM router, cost optimization, circuit breaker, A/B testing, providers |
| `src/god-agent/cli/quality/` | 37 | Quality gauntlet stages, calibration, citation analysis, Toulmin, argument coherence |
| `src/god-agent/cli/composition/` | 36 | ICP composition passes, adversarial, SIR, generators, synthesis |
| `src/god-agent/core/writing/` | 25 | Citation enforcer, corpus constraints, entailment, claim classifier, validation rules |
| `src/god-agent/core/composition/` | 20 | ICP orchestrator, model router, prompt builder, quote ranker, claim binder |
| `src/god-agent/cli/dissertation/` | 18 | Section orchestrator, retrieval orchestrator, tool definitions |
| `src/god-agent/cli/retrieval/` | 12 | Cross-encoder reranker, hybrid retriever, semantic chunker, citation graph |
| `src/god-agent/cli/feedback/` | 11 | Feedback learning, satisfaction tracker, metrics |
| `src/god-agent/cli/context/` | 11 | Context health, tier manager, hybrid cold accessor, phase summarizer |
| `src/god-agent/cli/style/` | 10 | Style drift detector, register enforcer |
| `src/god-agent/universal/stages/` | 6 | Pipeline v2 stages |
| `src/god-agent/retrieval/` | 6 | Smart retrieval layer, faceted retrieval, types |
| `src/god-agent/__experimental__/` | 7 | Experimental features |
| `src/god-agent/core/providers/` | 4 | LLM provider implementations |
| `src/god-agent/core/universal-validation/` | 3 | Universal validation framework |
| `src/god-agent/pipelines/` | 5 | Pipeline definitions |
| `src/god-agent/core/config/` | 2 | Config manager |
| `src/god-agent/core/gpu/` | 2 | GPU server manager |
| `src/god-agent/core/abort/` | 2 | Pipeline abort controller |
| `src/god-agent/core/resilience/` | 2 | Error recovery |
| Other | 6 | Misc (statistics, testing, commands) |

### Full file list:

```
src/god-agent/__experimental__/enhanced-quality-integration.ts
src/god-agent/__experimental__/feedback-learning.ts
src/god-agent/__experimental__/human-verification.ts
src/god-agent/__experimental__/satisfaction-tracker.ts
src/god-agent/__experimental__/style-drift-detector.ts
src/god-agent/__experimental__/tiered-validation.ts
src/god-agent/__experimental__/universal-validation-bridge.ts
src/god-agent/cli/composition/adversarial/adversarial-draft-reviewer.ts
src/god-agent/cli/composition/adversarial/adversarial-improvement-engine.ts
src/god-agent/cli/composition/adversarial/adversarial-types.ts
src/god-agent/cli/composition/adversarial/draft-weakness-analyzer.ts
src/god-agent/cli/composition/adversarial/evidence-gap-detector.ts
src/god-agent/cli/composition/adversarial/improvement-prioritizer.ts
src/god-agent/cli/composition/citation-enhancer.ts
src/god-agent/cli/composition/hallucination-prevention-pipeline.ts
src/god-agent/cli/composition/interfaces/composition-flow-types.ts
src/god-agent/cli/composition/interfaces/composition-interfaces.ts
src/god-agent/cli/composition/interfaces/composition-section-types.ts
src/god-agent/cli/composition/interfaces/composition-status-types.ts
src/god-agent/cli/composition/interfaces/composition-types.ts
src/god-agent/cli/composition/interfaces/index.ts
src/god-agent/cli/composition/passes/citation-pass.ts
src/god-agent/cli/composition/passes/integration-pass.ts
src/god-agent/cli/composition/passes/polish-pass.ts
src/god-agent/cli/composition/passes/quote-pass.ts
src/god-agent/cli/composition/passes/structure-pass.ts
src/god-agent/cli/composition/passes/types.ts
src/god-agent/cli/composition/prose-sanitizer.ts
src/god-agent/cli/composition/sir/index.ts
src/god-agent/cli/composition/sir/sir-orchestrator.ts
src/god-agent/cli/composition/sir/sir-schemas.ts
src/god-agent/cli/composition/sir/sir-types.ts
src/god-agent/cli/composition/synthesis/argument-weaver.ts
src/god-agent/cli/composition/synthesis/composition-orchestrator.ts
src/god-agent/cli/composition/synthesis/cross-section-integrator.ts
src/god-agent/cli/composition/synthesis/scholarly-voice-synthesizer.ts
src/god-agent/cli/composition/synthesis/thematic-synthesizer.ts
src/god-agent/cli/composition/generators/section-generator.ts
src/god-agent/cli/composition/generators/structured-section-generator.ts
src/god-agent/cli/composition/generators/dialectical-generator.ts
src/god-agent/cli/composition/generators/generator-types.ts
src/god-agent/cli/context/context-health-monitor.ts
src/god-agent/cli/context/context-manager.ts
src/god-agent/cli/context/context-tier-manager.ts
src/god-agent/cli/context/context-types.ts
src/god-agent/cli/context/context-window-manager.ts
src/god-agent/cli/context/enhanced-context-manager.ts
src/god-agent/cli/context/hot-cache.ts
src/god-agent/cli/context/hybrid-cold-accessor.ts
src/god-agent/cli/context/index.ts
src/god-agent/cli/context/phase-summarizer.ts
src/god-agent/cli/context/provenance-ledger.ts
src/god-agent/cli/dissertation/chapter-structure-loader.ts
src/god-agent/cli/dissertation/dissertation-orchestrator.ts
src/god-agent/cli/dissertation/dissertation-types.ts
src/god-agent/cli/dissertation/index-dissertation.ts
src/god-agent/cli/dissertation/orchestrator-types.ts
src/god-agent/cli/dissertation/rolling-context-manager.ts
src/god-agent/cli/dissertation/rolling-context-types.ts
src/god-agent/cli/dissertation/section-orchestrator.ts
src/god-agent/cli/dissertation/section-types.ts
src/god-agent/cli/dissertation/tools/llm-clients.ts
src/god-agent/cli/dissertation/tools/retrieval-orchestrator.ts
src/god-agent/cli/dissertation/tools/section-tools.ts
src/god-agent/cli/dissertation/tools/tool-definitions.ts
src/god-agent/cli/dissertation/tools/tool-executor.ts
src/god-agent/cli/dissertation/tools/tool-registry.ts
src/god-agent/cli/feedback/adaptive-learning-engine.ts
src/god-agent/cli/feedback/feedback-aggregator.ts
src/god-agent/cli/feedback/feedback-collector.ts
src/god-agent/cli/feedback/feedback-consumer.ts
src/god-agent/cli/feedback/feedback-metrics.ts
src/god-agent/cli/feedback/feedback-types.ts
src/god-agent/cli/feedback/human-feedback-loop.ts
src/god-agent/cli/feedback/index.ts
src/god-agent/cli/feedback/knowledge-distiller.ts
src/god-agent/cli/feedback/real-time-feedback.ts
src/god-agent/cli/feedback/revision-memory.ts
src/god-agent/cli/pipeline-daemon-service.ts
src/god-agent/cli/quality/argument-coherence-dialectical.ts
src/god-agent/cli/quality/calibration/calibration-analyzer.ts
src/god-agent/cli/quality/calibration/calibration-types.ts
src/god-agent/cli/quality/calibration/index.ts
src/god-agent/cli/quality/calibration/rating-protocol.ts
src/god-agent/cli/quality/calibration/rating-store.ts
src/god-agent/cli/quality/citation-refiner.ts
src/god-agent/cli/quality/claim-strength-analyzer.ts
src/god-agent/cli/quality/dissertation-style-drift-detector.ts
src/god-agent/cli/quality/endnote-generator.ts
src/god-agent/cli/quality/enhanced-types.ts
src/god-agent/cli/quality/helpers/citation-density-helpers.ts
src/god-agent/cli/quality/helpers/citation-verifier-helpers.ts
src/god-agent/cli/quality/helpers/claim-verification-helpers.ts
src/god-agent/cli/quality/helpers/index.ts
src/god-agent/cli/quality/helpers/toulmin-helpers.ts
src/god-agent/cli/quality/index.ts
src/god-agent/cli/quality/performance-optimizations.ts
src/god-agent/cli/quality/philosophical-concept-tracker.ts
src/god-agent/cli/quality/quality-gauntlet.ts
src/god-agent/cli/quality/quality-types.ts
src/god-agent/cli/quality/revision-orchestrator.ts
src/god-agent/cli/quality/stages/argument-coherence-stage.ts
src/god-agent/cli/quality/stages/citation-completeness-checker.ts
src/god-agent/cli/quality/stages/citation-density-checker.ts
src/god-agent/cli/quality/stages/citation-verifier.ts
src/god-agent/cli/quality/stages/claim-verification-stage.ts
src/god-agent/cli/quality/stages/factual-accuracy-stage.ts
src/god-agent/cli/quality/stages/index.ts
src/god-agent/cli/quality/stages/style-consistency-stage.ts
src/god-agent/cli/quality/stages/stage-types.ts
src/god-agent/cli/quality/stages/types.ts
src/god-agent/cli/quality/stages/toulmin-enforcer.ts
src/god-agent/cli/retrieval/chunk-processor.ts
src/god-agent/cli/retrieval/citation-expander.ts
src/god-agent/cli/retrieval/citation-extractor.ts
src/god-agent/cli/retrieval/citation-graph.ts
src/god-agent/cli/retrieval/cross-encoder-reranker.ts
src/god-agent/cli/retrieval/enhanced-hybrid-retriever.ts
src/god-agent/cli/retrieval/hybrid-retrieval.ts
src/god-agent/cli/retrieval/hybrid-retriever.ts
src/god-agent/cli/retrieval/index.ts
src/god-agent/cli/retrieval/retrieval-types.ts
src/god-agent/cli/retrieval/semantic-chunker.ts
src/god-agent/cli/retrieval/source-diversifier.ts
src/god-agent/cli/statistics/index.ts
src/god-agent/cli/statistics/progress-tracker.ts
src/god-agent/cli/style/enhanced-style-drift-detector.ts
src/god-agent/cli/style/index.ts
src/god-agent/cli/style/register-enforcer.ts
src/god-agent/cli/style/style-analysis-types.ts
src/god-agent/cli/style/style-consistency-scorer.ts
src/god-agent/cli/style/style-feature-extractor.ts
src/god-agent/cli/style/style-profile-manager.ts
src/god-agent/cli/style/style-target-config.ts
src/god-agent/cli/style/types.ts
src/god-agent/cli/style/voice-signature-matcher.ts
src/god-agent/cli/testing/ab-test-framework.ts
src/god-agent/cli/testing/feedback-loop-test.ts
src/god-agent/core/abort/pipeline-abort-controller.ts
src/god-agent/core/abort/types.ts
src/god-agent/core/composition/auto-verifier.ts
src/god-agent/core/composition/claim-atom-binder.ts
src/god-agent/core/composition/claim-locked-polish.ts
src/god-agent/core/composition/claim-stress-tester.ts
src/god-agent/core/composition/constrained-generator.ts
src/god-agent/core/composition/icp-orchestrator.ts
src/god-agent/core/composition/icp-provider-factory.ts
src/god-agent/core/composition/icp-types.ts
src/god-agent/core/composition/inline-validation-orchestrator.ts
src/god-agent/core/composition/llm-claim-provider.ts
src/god-agent/core/composition/llm-decomposition-provider.ts
src/god-agent/core/composition/llm-generation-provider.ts
src/god-agent/core/composition/model-router.ts
src/god-agent/core/composition/ocr-patch-store.ts
src/god-agent/core/composition/prompt-builder-engine.ts
src/god-agent/core/composition/prompt-decomposer.ts
src/god-agent/core/composition/proposition-extractor.ts
src/god-agent/core/composition/quote-ranker.ts
src/god-agent/core/composition/run-manifest.ts
src/god-agent/core/composition/writing-contract-builder.ts
src/god-agent/core/config/config-manager.ts
src/god-agent/core/config/types.ts
src/god-agent/core/gpu/gpu-server-manager.ts
src/god-agent/core/gpu/types.ts
src/god-agent/core/pipeline/pipeline-quality-calculator.ts
src/god-agent/core/pipeline/v2-pipeline-config.ts
src/god-agent/core/providers/anthropic-direct-provider.ts
src/god-agent/core/providers/index.ts
src/god-agent/core/providers/provider-registry.ts
src/god-agent/core/providers/types.ts
src/god-agent/core/resilience/error-recovery.ts
src/god-agent/core/resilience/index.ts
src/god-agent/core/router/ab-testing/experiment-manager.ts
src/god-agent/core/router/ab-testing/statistical-analyzer.ts
src/god-agent/core/router/adaptive-router.ts
src/god-agent/core/router/analytics/analytics-engine.ts
src/god-agent/core/router/analytics/metrics-store.ts
src/god-agent/core/router/analytics/query-analyzer.ts
src/god-agent/core/router/analytics/types.ts
src/god-agent/core/router/audit-logger.ts
src/god-agent/core/router/budget-enforcer.ts
src/god-agent/core/router/capability-router.ts
src/god-agent/core/router/circuit-breaker.ts
src/god-agent/core/router/cost-optimizer.ts
src/god-agent/core/router/cost-tracker.ts
src/god-agent/core/router/diff-reviewer.ts
src/god-agent/core/router/graceful-degradation.ts
src/god-agent/core/router/index.ts
src/god-agent/core/router/local-first-executor.ts
src/god-agent/core/router/local-first-routing.ts
src/god-agent/core/router/monitoring.ts
src/god-agent/core/router/outcome-tracker.ts
src/god-agent/core/router/providers/anthropic-provider.ts
src/god-agent/core/router/providers/index.ts
src/god-agent/core/router/providers/ollama-provider.ts
src/god-agent/core/router/providers/openai-provider.ts
src/god-agent/core/router/providers/provider-factory.ts
src/god-agent/core/router/providers/vllm-provider.ts
src/god-agent/core/router/quality-scorer.ts
src/god-agent/core/router/rate-limiter.ts
src/god-agent/core/router/retry-handler.ts
src/god-agent/core/router/review-queue.ts
src/god-agent/core/router/risk-classifier.ts
src/god-agent/core/router/router-commands.ts
src/god-agent/core/router/routing-metrics.ts
src/god-agent/core/router/routing-optimizer.ts
src/god-agent/core/router/task-classifier.ts
src/god-agent/core/router/test-runner.ts
src/god-agent/core/router/types.ts
src/god-agent/core/universal-validation/index.ts
src/god-agent/core/universal-validation/types.ts
src/god-agent/core/universal-validation/universal-validator.ts
src/god-agent/core/writing/anthropic-writing-generator.ts
src/god-agent/core/writing/attribution-inheritance-engine.ts
src/god-agent/core/writing/ccv-activation-checker.ts
src/god-agent/core/writing/citation-budget-allocator.ts
src/god-agent/core/writing/citation-enforcer.ts
src/god-agent/core/writing/citation-repair-utils.ts
src/god-agent/core/writing/citation-validator.ts
src/god-agent/core/writing/claim-classifier.ts
src/god-agent/core/writing/claim-profile.ts
src/god-agent/core/writing/corpus-constraint-builder.ts
src/god-agent/core/writing/decontextualization-engine.ts
src/god-agent/core/writing/entailment/entailment-classifier.ts
src/god-agent/core/writing/entailment/entailment-integration.ts
src/god-agent/core/writing/entailment/entailment-rules.ts
src/god-agent/core/writing/entailment/entailment-types.ts
src/god-agent/core/writing/entailment/index.ts
src/god-agent/core/writing/entailment/nli-verifier.ts
src/god-agent/core/writing/inline-validation-orchestrator.ts
src/god-agent/core/writing/layout-regression-detector.ts
src/god-agent/core/writing/types.ts
src/god-agent/core/writing/validation-rule-engine.ts
src/god-agent/core/writing/writing-types.ts
src/god-agent/observability/icp-api-routes.ts
src/god-agent/observability/routing-metrics-dashboard.ts
src/god-agent/pipelines/default-coding-pipeline.ts
src/god-agent/pipelines/minimal-coding-pipeline.ts
src/god-agent/pipelines/pdf-cli.ts
src/god-agent/pipelines/pipeline-registry.ts
src/god-agent/pipelines/research-pipeline.ts
src/god-agent/retrieval/faceted-retrieval.ts
src/god-agent/retrieval/retrieval-utils.ts
src/god-agent/retrieval/smart-retrieval-layer.ts
src/god-agent/retrieval/types.ts
src/god-agent/retrieval/vector-store-adapter.ts
src/god-agent/retrieval/write-retrieval-orchestrator.ts
src/god-agent/universal/author-scrubber.ts
src/god-agent/universal/commands/section-complete-handler.ts
src/god-agent/universal/domain-config.ts
src/god-agent/universal/gold-standard-config.ts
src/god-agent/universal/gold-standard-prompt-builder.ts
src/god-agent/universal/knowledge-manager.ts
src/god-agent/universal/quality-integration.ts
src/god-agent/universal/stages/correction-stage.ts
src/god-agent/universal/stages/index.ts
src/god-agent/universal/stages/planning-stage.ts
src/god-agent/universal/stages/retrieval-stage.ts
src/god-agent/universal/stages/stage-types.ts
src/god-agent/universal/stages/validation-stage.ts
src/god-agent/universal/stages/writing-stage.ts
src/god-agent/universal/write-pipeline-orchestrator.ts
```

---

## Category 2: Modified Shared Files (62 TS source + 49 tests)

These exist in both repos but have diverged. Your changes need to be merged into the upstream version.

### Heavy modifications (>100 changed lines) — need careful manual merge:

| File | Lines Changed | What you changed |
|------|:---:|---|
| `observability/express-server.ts` | 3,553 | ICP API routes, dashboard endpoints, routing metrics |
| `universal/universal-agent.ts` | 3,252 | Write pipeline, gold standard, multi-step drafting, investigation |
| `cli/phd-cli.ts` | 3,076 | Write commands, dissertation mode, multi-step, NLI flags |
| `cli/session-manager.ts` | 930 | Session persistence changes |
| `core/pipeline/pipeline-memory-coordinator.ts` | 736 | Pipeline memory integration |
| `cli/coding-pipeline-cli.ts` | 736 | Coding pipeline modifications |
| `core/pipeline/phd-pipeline-orchestrator.ts` | 724 | PhD pipeline changes |
| `universal/cli.ts` | 691 | CLI commands, .env loading, flag parsing |
| `universal/style-analyzer.ts` | 356 | Style profile analysis |
| `cli/cli-types.ts` | 340 | Type definitions for CLI flags |
| `observability/socket-server.ts` | 327 | WebSocket endpoints |
| `core/writing/anthropic-writing-generator.ts` | 277 | Direct Anthropic writing provider |
| `observability/agent-tracker.ts` | 252 | Agent tracking metrics |
| `core/writing/index.ts` | 243 | Writing module exports |
| `core/executor/claude-task-executor.ts` | 187 | Task executor modifications |
| `cli/final-stage/paper-combiner.ts` | 186 | Paper combining logic |
| `cli/style-injector.ts` | 164 | Style injection into prompts |
| `core/memory/embedding-provider.ts` | 146 | Embedding provider changes |
| `observability/types.ts` | 140 | Observable types |
| `core/vector-db/backend-selector.ts` | 128 | Vector DB backend selection |
| `core/database/dao/trajectory-metadata-dao.ts` | 108 | Trajectory metadata schema |

### Light modifications (<100 changed lines) — straightforward merge:

| File | Lines Changed |
|------|:---:|
| `core/database/dao/pattern-dao.ts` | 67 |
| `core/observability/logger.ts` | 53 |
| `core/ucm/daemon/context-service.ts` | 51 |
| `orchestration/orchestration-memory-manager.ts` | 48 |
| `core/memory-server/memory-daemon.ts` | 44 |
| `core/ucm/daemon/ucm-cli.ts` | 41 |
| `core/learning/sona-engine.ts` | 40 |
| `cli/final-stage/final-stage-orchestrator.ts` | 40 |
| `cli/coding-quality-calculator.ts` | 39 |
| `core/daemon/daemon-cli.ts` | 39 |
| `core/writing/writing-generator.ts` | 33 |
| `core/pipeline/coding-pipeline-orchestrator.ts` | 32 |
| `observability/activity-stream.ts` | 26 |
| `universal/index.ts` | 25 |
| `core/reasoning/index.ts` | 23 |
| `core/executor/executor-types.ts` | 21 |
| `core/learning/index.ts` | 17 |
| `core/vector-db/vector-db.ts` | 14 |
| `universal/trajectory-bridge.ts` | 13 |
| `observability/daemon-server.ts` | 12 |
| `core/services/agent-execution-service.ts` | 12 |
| `core/search/index.ts` | 12 |
| `core/orchestration/relay-race-orchestrator.ts` | 12 |
| `cli/phd-pipeline-config.ts` | 11 |
| `core/memory-server/memory-server.ts` | 10 |
| `core/vector-db/index.ts` | 9 |
| `core/vector-db/types.ts` | 8 |
| `core/search/adapters/index.ts` | 8 |
| `core/reasoning/pattern-store.ts` | 7 |
| `cli/core-daemon-client.ts` | 7 |
| `core/reasoning/causal-memory.ts` | 6 |
| `cli/ucm-daemon-client.ts` | 6 |
| `core/routing/pipeline-generator.ts` | 5 |
| `core/routing/capability-index.ts` | 3 |
| `core/pipeline/coding-agent-executor.ts` | 3 |
| `core/executor/claude-code-executor.ts` | 3 |
| `core/agents/agent-definition-loader.ts` | 3 |
| `universal/interaction-store.ts` | 1 |
| `core/agents/task-executor.ts` | 1 |

---

## Category 3: Non-TS Unique Assets

### `.claude/commands/` (11 unique commands):
```
god-complete-section.md
god-launch.md
god-learn-compile.md
god-learn-update.md
god-learn-verify.md
god-pdf-analyze.md
god-research-grounded.md
god-research-hybrid.md
god-research-local.md
god-synthesize-chapters.md
CORPUS-ONLY-CONSTRAINT.md
```

### `scripts/` (~215 unique files):
Key subdirectories to port:
- `scripts/assemble/` — Phase 8 longform assembly
- `scripts/audit/` — Quality audit CLI
- `scripts/god_learn/` — Knowledge learning system
- `scripts/reason/` — Reasoning edge system
- `scripts/interaction/` — Interaction reporting
- `scripts/ingest/` — Corpus ingestion (including `manifest.jsonl`)
- `scripts/explore/` — Knowledge exploration
- `scripts/retrieval/` — Retrieval utilities
- Individual scripts: `build-prompt.ts`, `icp-run.ts`, `icp-ab-compare.ts`, `icp-gauntlet-compare.ts`, `icp-dashboard-simulation.ts`, `backfill-*.py`, `compute-corroboration.py`, `graph-visualize.py`, `knowledge-prune.py`, `llm-edge-derivation.py`, `merge-reasoning-edges.py`, `migrate-bridge-edges.py`, `normalize-edges.py`, `sync-ku-to-memory.py`

### Dashboard (observability):
- `icp-panel.js` — unique to this repo (copy)
- `app.js`, `index.html`, `styles.css` — modified, but upstream rewrote to 4-tab SPA. **Decision needed**: port ICP panel into new SPA tab structure, or keep old monolith.

### Runtime config to port:
- `.god-agent/domain-config.json` — domain configuration (port)
- `.god-agent/routing-metrics.json` — can regenerate, optional
- `.claude/settings.local.json` — local settings overrides (port)
- `.claude/hooks/feedback-queue.json` — feedback queue state (optional)

### Data directories (not in git, but needed):
- `corpus/` — scholarly corpus and style analysis
- `god-learn/` — knowledge.jsonl, reasoning edges
- `god-reason/` — reasoning.jsonl (832 edges)
- `phantasia-analysis/`, `phantasia-structured/` — text analysis outputs
- `.agentdb/` — style profiles

---

## Category 4: Modified Tests (49 files)

These test files exist in both repos but have diverged. Most are test updates matching source changes above. Port alongside their corresponding source files.

---

## Porting Strategy (Recommended Order)

### Phase 1: Pure Additions (lowest risk, no conflicts)
1. Copy all 285 unique TS source files
2. Copy all 146 unique test files
3. Copy 11 unique `.claude/commands/`
4. Copy unique scripts
5. Copy `icp-panel.js` and `icp-api-routes.ts`

### Phase 2: Light Merges (41 files, <100 lines each)
- Apply diffs to upstream versions
- Most are small exports/imports additions

### Phase 3: Heavy Merges (21 files, >100 lines each)
- `universal-agent.ts` — largest and most critical
- `express-server.ts` — dashboard integration
- `phd-cli.ts` — write CLI commands
- `cli.ts` — .env loading, flag parsing
- Prioritize by dependency order

### Phase 4: Dashboard Decision
- Option A: Port ICP panel into new 4-tab SPA (recommended)
- Option B: Revert to old monolith dashboard

### Phase 5: Data & Config
- Copy corpus, KU, reasoning edges, style profiles
- Copy domain-config.json
- Merge settings.local.json

### Phase 6: Verification
- Run `npx vitest run`
- Start services via `god-launch`
- Test write pipeline end-to-end
