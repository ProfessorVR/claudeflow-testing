# Section 5 — Soul-Motion Sweep (deferred TODO)

**Created:** 2026-06-06 · **Source:** `Section 5_Live.md` (line numbers as of the 303-line version — **RE-LOCATE before applying**, they shift with every edit; use content anchors / the grep at the bottom).

## Context
§A's opening thesis was changed from "emotion is a *kinēsis* **of** the soul" to "**emotion is a *kinēsis* originated by and terminating in the soul**" — per **Corcilius & Gregoric** (*De Anima* I.4, 408b5–18): the soul is only the *origin and terminus* of motions that take place *in the body*, not the subject that itself undergoes them. The peer phrasings that still make the soul the **moved subject** (or locate the motion *in* the soul) need reconciling with that thesis. This sweep was deferred "to the end"; this note preserves the inventory for when we return.

## Inventory (classified)
| Line | Phrasing | Read |
|---|---|---|
| L129 | "*kinēsis* originated by and terminates in the soul" | ✅ already fixed |
| L129 | "the process through which **the soul is set into motion**" | in-tension (soul as moved subject) — optional |
| L129 | "a **being-moved of the soul** toward/away from goods and evils" | in-tension — optional |
| L129 | "the soul's *being-moved* by what appears significant" | borderline (receptive pole — defensible) |
| L171 | "*kinēseis* of the soul (*DA* I.4 408b5–7)" | Aristotle-attributed — judgment (origin/terminus reading comes from the *next* lines, 408b13–14) |
| L176, L182 | "affections of the soul" / "part of the soul" | QUOTES — leave |
| L204 | "a state of the soul" | locus, not motion — likely leave |
| **L242** (§G) | "the form in which **the soul's being-moved becomes the body's being-moved**" | **CORE restatement — fix** |
| L247 | "being-affected of the soul, in the broadest sense" | broad *pathos* — judgment |
| L287 | "a being-moved keyed to the appearance" | adjacent (no "of the soul") — likely leave |
| L295 | "the *phantasma* does and **the soul moves**" | active = origin — likely leave |
| **L297** (final line) | "the way **the soul's self-movement** discloses significance" | **CORE restatement — fix?** |

## Recommendation
The two phrasings that re-assert "emotion is a motion *of* the soul" in the author's own voice are **L242** and **L297** — the real consistency targets. The two L129 etymology peers are optional (lexical register, describing the *word* "emotion"). Everything else is a quotation, a locus claim, or an active/receptive phrasing already defensible under origin/terminus.

## Proposed rewrite directions (for when we return)
- **L242**: → e.g. "the form in which **the movement that originates in the soul becomes the body's being-moved**."
- **L297**: either **keep** ("self-movement" = the moved-mover's self-origination, defensible) or recast to "the way **the movement the soul originates and in which it terminates** discloses significance."
- **L129 peers (optional)**: "the soul is set into motion" → "the animal is set into motion"; "a being-moved of the soul" → "a being-moved originating in the soul."

## Status
**EXECUTED 2026-06-07** in `Section 5_Live.md`:
- **L242** (§G) recast → "the **movement that originates in the soul** becomes the body's being-moved."
- **L129** peer → "the **animal** is set into motion."
- **L129** peer → "a being-moved **originating in** the soul toward or away from perceived goods and evils."
- **KEPT L293** "self-movement" — already consistent: the soul moving itself = origin *and* terminus of its own motion.
- **LEFT** as defensible: quotes (L171/L176/L182), the receptive-pole "soul's being-moved by what appears significant" (L129), "a state of the soul" (L204), "being-affected of the soul" (L247), "the soul moves" = active origin (L291).

Original re-grep (for reference):
```
python3 -c "import re; [print(i, l[max(0,m.start()-50):m.end()+46].strip()) for i,l in enumerate(open('Section 5_Live.md',encoding='utf-8'),1) for m in re.finditer(r'of the soul|being-moved|the soul moves|self-movement|set into motion', l)]"
```
