# Changes to port into the Overleaf master

Running log of edits made in the **local working copies** that still need to be applied to the
Overleaf document. Apply by searching the Overleaf source for the **anchor text**, then replacing
OLD → NEW. (Local line numbers do not match Overleaf — use the anchors.)

---

## 1. Part I — roadmap "Section 7" preview sentence (sync to Seven-Causes reframe) — ✅ APPLIED 2026-06-23

- **Local file:** `Working tex versions/Part I - Rhetorical Phantasia (Moss revision 2026-06-05).md`
- **Made:** 2026-06-20
- **✅ APPLIED:** 2026-06-23 — to `Working tex versions/Part I - Complete.md` (the Overleaf copy-paste master). Roadmap sentence replaced verbatim (binary edit, CRLF preserved). Verified: roadmap ↔ §7 heading ↔ body all read "The Seven Causes of Action"; full doc compiles (XeLaTeX, 82pp).
- **Where in Overleaf:** the paragraph that begins *"Accordingly, Part I of my dissertation proceeds as follows."* (the section-by-section roadmap). It is the **last sentence** of that paragraph — the one previewing **Section 7**.
- **Anchor to search for:** `Four Types of Action and the Affective Architecture`
- **Why:** the A₄ section was reframed from "Four Types of Action" to "**The Seven Causes of Action**" (with the four voluntary desire-types now nested inside the seven-causes frame, and *prohairetic* recategorized as the deliberative completion of the bouletic, not a fourth *orexis*-species). The roadmap still promised the old title/framing, so the preview no longer matched the section. This also fixes a grammar slip ("proceed, constitute" → "proceed, constituting").

### OLD (remove)

```latex
Section 7 (``$A_4$: Four Types of Action and the Affective Architecture of \textit{Being-in-the-world}'') articulates the \textit{orektikon} motion $M_3 \rightarrow A_4$ as a four-type taxonomy keyed to the species of \textit{orexis} that mobilizes the bodily motion---\textit{epithymetic}, \textit{thymotic}, \textit{boulētic}, and \textit{prohairetic}---and traces how each completed action recursively reshapes the dispositional ground (the \textit{hexeis}) from which subsequent actualizations of the chain proceed, constitute the affective architecture of \textit{being-in-the-world}.
```

### NEW (paste)

```latex
Section 7 (``$A_4$: The Seven Causes of Action and the Affective Architecture of \textit{Being-in-the-world}'') articulates the \textit{orektikon} motion $M_3 \rightarrow A_4$ through the \textit{Rhetorica}'s seven causes of all human action, sorted by the voluntary/involuntary cut; within the voluntary, desire-sourced branch it gives dedicated treatment to the types keyed to the species of \textit{orexis}---\textit{epithymetic}, \textit{thymotic}, and \textit{boulētic}, with the \textit{prohairetic} as the deliberative completion of the rational wish---and traces how each completed action recursively reshapes the dispositional ground (the \textit{hexeis}) from which subsequent actualizations of the chain proceed, constituting the affective architecture of \textit{being-in-the-world}.
```

### Diff in words
1. Title in the parenthetical: **"Four Types of Action" → "The Seven Causes of Action."**
2. "as a four-type taxonomy keyed to the species of *orexis*… epithymetic, thymotic, boulētic, and prohairetic" → "**through the *Rhetorica*'s seven causes… sorted by the voluntary/involuntary cut; within the voluntary, desire-sourced branch** it gives dedicated treatment to the types keyed to *orexis* — epithymetic, thymotic, and boulētic, **with the prohairetic as the deliberative completion of the rational wish**."
3. Grammar: "proceed, **constitute** the affective architecture" → "proceed, **constituting** the affective architecture."

> NB if your Overleaf section is numbered differently: the local file's roadmap calls this "Section 7," but the section file is named "Section 6." Confirm the correct section number in Overleaf and keep the roadmap's number consistent with it. (Title text is the part that matters.)

---

## Related (section-side) — only if Section 6/7 is also maintained in Overleaf

> **✅ PORTED 2026-06-23:** the full seven-causes reframe from `Section 6 Live.md` was also ported into `Part I - Complete.md` (replacing the old four-types §7; document-level works-cited stash + `\end{document}` preserved). So for the combined Part I copy-paste master, this is **done** — no separate section port needed. The `[sub ROT]` placeholders mentioned below are now **resolved/absent** in `Section 6 Live.md`.

The corresponding section itself (`Working tex versions/Section 6 Live.md`) gained, the same day, a new
`\subsubsection{The Four Voluntary Types of Action}` (nested in the seven-causes frame; 3 *orexis*-species
+ prohairetic-as-completion + a Heidegger non-compartmental reconciliation), a trimmed seven-causes
hand-off paragraph, a corrected "two cross-cutting distinctions" paragraph, and removal of a stale TODO
note. If that section also lives in Overleaf, those changes need porting too — but they are **not** part
of the Part I edit above. (Note: the new subsection's NE III.2 / III.3 quotes carry `[sub ROT]`
placeholders pending your Ross→ROT swap.)
