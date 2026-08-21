# Plan — Wire the trained Lanham prose-style into the research pipeline

**Status:** DRAFT for review · **Scope:** archon-cli (`feat/marker-server-parallel-ingest`)
**Goal:** make Archon's multi-agent `research` pipeline draft its long-form
documents in a *trained Lanham voice*, so the trained style reaches structured
multi-section output — not just the interactive one-shot path.

---

## 0. Correction to the original framing (read first)

The PR's limitations note called out `research/final_stage/style_applier.rs` as a
"stub to finish." Deeper mapping shows that is the wrong target:

1. **`research/final_stage/` is DEAD CODE on the live path.**
   `FinalStageOrchestrator::run` (`research/final_stage/mod.rs:173`) never calls
   `writer::synthesize_chapter` or `style_applier::apply_style`; the only callers
   are `crates/archon-pipeline/tests/final_stage.rs`. Do **not** build on it.
2. **The live research assembler already injects a style string.** Real chapter
   drafting is `final_assembly.rs::chapter_prompt` (`:205`), which interpolates
   `style` at `:219` / `:227`; the combiner (`combiner_prompt`, `:247/:260`) and
   non-final writing agents (`prompt_builder.rs:92-97` via
   `StyleInjector::build_styled_prompt`, `research/style.rs:254`) do the same. The
   style string is threaded end-to-end as `ResearchFacade.style_prompt:
   Option<String>` (`research/facade.rs:59`, 4th ctor arg).
3. **But it is never fed.** All four construction sites pass `None`
   (`src/command/pipeline.rs:326`, `pipeline_bundle.rs:97`, `pipeline_bundle.rs:380`,
   `session/interactive_agent.rs:200`). When `None`, `chapter_prompt` falls back to
   a hardcoded `"Use UK English, formal academic prose, APA 7 citations, and no
   contractions."` (`final_assembly.rs:219`).
4. **A trained-style → prompt loader already exists** and is used by the
   interactive session only: `output_style_prompt(cli, config)`
   (`src/session/build_prompt.rs:234-268`) loads `~/.archon/output-styles/*.md`
   via `OutputStyleRegistry` + `load_styles_from_dir`, resolves a name from
   `cli.output_style` → `config.output_style`, and returns
   `registry.get_or_default(name).prompt.clone()`. Trained styles are produced by
   `archon style train` (`archon_lanham::train_to_output_style` → `render_output_style`).

**Therefore "finishing it" = supply `ResearchFacade.style_prompt` from the
existing trained-style loader.** It is a wiring + composition job, not a new
feature. Estimated effort: ~1 focused day for the research pipeline.

---

## 1. Chosen approach

**Approach A — inject the trained style into the section-writer prompts.**
Rejected Approach B (a post-hoc LLM rewrite pass) for the same reason the
interactive path already proved: draft-in-style beats rewrite-after, the writers
are already LLM agents that accept a style string, and B in game-theory would
require threading `&dyn LlmClient` through a currently-pure assembler
(`assemble_report`) plus its replay caller — much more surface for less quality.

**Primary target: the `research` pipeline.** Game-theory is an optional stretch
(§7) — it's harder (closed 3-value preset enum; pure assembler) and lower value.

---

## 2. Design

### 2.1 Selection + precedence
Mirror the interactive path exactly:
`--style/--output-style <name>` (CLI) **overrides** `ArchonConfig.output_style`
(config key). Resolve the name to a prompt body with the *same loader* the
session uses, so a profile trained by `archon style train` "just works" in the
pipeline.

### 2.2 Compose, don't replace (key decision)
The hardcoded default at `final_assembly.rs:219` carries **mechanical
conventions** (UK English, APA 7, no contractions). The Lanham `.md` carries
**prose voice** (register, sentence architecture, connection, tacit figures) — it
says nothing about citation format. These are complementary, so feeding the
Lanham style must **not silently drop the mechanical conventions.**

Decision: change the writer/combiner prompt assembly so the style block is
`<mechanical-conventions base> + "\n\n" + <trained Lanham voice, if any>`, i.e.
keep a always-on conventions base and *append* the trained voice, rather than the
current all-or-nothing `unwrap_or`. (Concretely: introduce a small
`compose_style(base_conventions, trained: Option<&str>) -> String` used by both
`chapter_prompt` and `combiner_prompt`.)

### 2.3 Do NOT broaden the phase-6/8 injection guard
`prompt_builder.rs:92` injects style only for writing/assembly agents
(`phase == 6 || phase == 8`). That restriction is correct — the other ~40 agents
are research/analysis, and pushing a prose-voice directive into a
literature-search or outline agent is noise that can degrade their task. Leave the
guard as-is; document why.

### 2.4 Reuse surface (no new rendering code)
From `archon-core` (already a `path` dep of `archon-pipeline`):
- `archon_core::output_style_loader::load_styles_from_dir(&Path) -> Vec<OutputStyleConfig>`
- `archon_core::output_style::{OutputStyleConfig (field `prompt: Option<String>`), OutputStyleRegistry::{new, register, get_or_default}}`
The Lanham renderer/trainer (`archon-lanham`) is **not** a pipeline-runtime dep —
training is the offline `archon style train` step; the pipeline only reads the
`.md`.

---

## 3. Phased tasks

**Phase 1 — Shared resolver (small refactor).**
Extract the name→prompt resolution out of `src/session/build_prompt.rs:234` into a
reusable helper so both the session and the pipeline command call one code path.
Options: (a) a free fn `resolve_output_style_prompt(name: Option<&str>, config: &ArchonConfig) -> Option<String>` in `archon-core` (loads the dir, registry,
fallback), or (b) keep it in the binary and have the pipeline command call it.
Prefer (a) for testability. Unit-test: a `.md` in a temp dir resolves; a missing
name → `None`/default; cli-name beats config-name.

**Phase 2 — Feed the research facade.**
- Add a `--style`/`--output-style <name>` flag to the research CLI subcommand
  (`src/cli_args` + `src/command/pipeline.rs`). The facade field is already
  documented as "provided via `--style`."
- At `src/command/pipeline.rs:326` (and `pipeline_bundle.rs:97`,
  `pipeline_bundle.rs:380`, `session/interactive_agent.rs:200`), replace the
  `None` 4th arg with `resolve_output_style_prompt(cli_or_config_name, &config)`.
- Precedence: flag → `config.output_style`.

**Phase 3 — Compose with mechanical conventions.**
Implement `compose_style(...)` (§2.2) and use it in `final_assembly.rs:219` and
`:260` so the trained voice augments (not replaces) the UK-English/APA base.

**Phase 4 — Tests.**
Mirror the established patterns:
- `research/facade.rs:797 style_prompt_passed_to_phase6` and
  `research/prompt_builder.rs:356/398` — assert a resolved trained style reaches
  the chapter-writer + combiner prompts (`prompt.contains("## STYLE GUIDELINES")`
  + a Lanham directive substring, e.g. "high, formal academic register").
- Add a resolver unit test (Phase 1).
- One capturing-LLM-client test (`CapturingLlmClient`, `gametheory/facade/tests/mod.rs:56`
  pattern) asserting the chapter-writer's outgoing prompt carries the voice — no
  real API spend.

**Phase 5 — Dead-code cleanup (optional, honest).**
Remove or clearly `#[deprecated]`-annotate `research/final_stage/{style_applier.rs,
writer.rs}` and its `tests/final_stage.rs`, since they mislead (the PR doc called
them out). Low risk; keeps the map truthful. If removal ripples, annotate instead.

**Phase 6 — Voice validation (one small real run).**
The research pipeline is ~47 LLM agents = real cost, so validate wiring with fakes
(Phases 4) and do exactly ONE small real run with/without `--style
dalton-philosophical` on a short topic; eyeball the chapter prose voice (the same
mimicry check used for the interactive path). Optionally run the offline Lanham
analyzer on the styled vs unstyled chapter to confirm the axes move toward target.

**Phase 7 — Game-theory (OPTIONAL stretch, separate follow-up).**
Only if you also want `archon gametheory` reports in the trained voice:
- Inject style into the specialist prompts: `gametheory/facade/specialists.rs:168-171`
  (system) and `:296` (`build_specialist_prompt_with_template`), extending
  `gametheory/prompt_builder.rs:53` to accept a style param.
- Relax the closed preset validation `archon-tools/src/gametheory.rs:293`
  (`executive|academic|technical`) to also accept a trained-profile name.
- Leave the deterministic `final_stage/apply_style` as-is (draft-in-style makes it
  redundant) or retire it. Avoid Approach B's `LlmClient`-into-`assemble_report`
  threading.

---

## 4. Files touched (research / Approach A)

| File | Change |
|---|---|
| `crates/archon-core/src/output_style_loader.rs` / `output_style.rs` | (reuse only; maybe host the shared resolver) |
| `crates/archon-core/src/config.rs` | already has `output_style` (no change) |
| `src/session/build_prompt.rs:234` | extract `output_style_prompt` core into the shared resolver |
| `src/cli_args/*` (research subcommand) | add `--style/--output-style` flag |
| `src/command/pipeline.rs:326`; `pipeline_bundle.rs:97,380`; `session/interactive_agent.rs:200` | feed resolved style into `ResearchFacade` (was `None`) |
| `crates/archon-pipeline/src/research/final_assembly.rs:219,260` | `compose_style` (augment, not replace) |
| `crates/archon-pipeline/src/research/{facade.rs,prompt_builder.rs}` | no logic change; new tests |
| `crates/archon-pipeline/src/research/final_stage/*` | optional dead-code cleanup |

No new crate dependencies (`archon-pipeline` already depends on `archon-core`).

---

## 5. Risks & decisions to confirm

- **Compose vs replace** (§2.2): recommend compose so APA/UK-English survives. CONFIRM.
- **Scope**: research-only now; game-theory as a later, opt-in follow-up. CONFIRM.
- **Cost**: keep real validation to a single short run; everything else fakes the LLM.
- **Expectation-setting**: the Lanham `.md` governs *voice*, not citation format —
  it will not enforce APA; that's the mechanical base's job (hence compose).
- **StyleInjector validators** (`research/style.rs:259-274`) look for a
  `## STYLE GUIDELINES` marker; a Lanham `.md` won't contain it. They're advisory
  and don't gate output, but confirm nothing asserts on them before shipping.

---

## 6. Is it worth doing? (same lens as the video-arbiter call)

Worth it **only if you'll actually use `archon research` to generate prose you
care about the voice of.** Your dissertation drafting currently runs through
god-write + the interactive Lanham output-style, which already works. If you don't
plan to make Archon's multi-agent pipeline your long-form generator, this stays a
documented no-op and should not be built. If you *do* want that — e.g. to generate
full chaptered drafts in your trained voice from one command — this is the single
change that delivers it, and because the injection seam already exists end-to-end,
it is a ~1-day wiring job (Phases 1-4 + 6), not a feature build.
