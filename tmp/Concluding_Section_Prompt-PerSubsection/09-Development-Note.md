================================================================
SUBSECTION 9 of 9 — Development Note
================================================================

(The CLI invocation passes the LaTeX heading `\subsection*{Development Note}` — NOTE THIS IS `\subsection*`, NOT `\subsubsection*` — word target ~400, quotation count 0, and output format via subsection-mode flags. The heading is at a higher structural level than §§1–8 because the Development Note marks the close of the section. This delta supplies the topical content + dissertation-specific deployment guidance.)

**Subsection role.** A short development note that flags forward-pointing questions and ties the section's analyses to the larger chapter-and-dissertation arc. Distinct from the Heidegger deferral footnote (which is internal to §8); the Development Note is its own structural close.

Five forward-pointing items to flag (in order; ~80 words per item):

**(i) The *technē*-hexis / *praxis*-hexis question for a single agent.** Whether *technē*-hexis and *praxis*-hexis are mutually exclusive in a single agent or whether the same agent can hold both for different domains (the carpenter who is also a parent; the orator who is also a friend). This bears on the wider question of how the diachronic chain layers across an agent's life. The current section's bivalence-mapping operates per-action-type rather than per-agent; the per-agent question is deferred.

**(ii) The *Stimmung*-saturation deferral.** Whether the *Stimmung*-saturation mechanism at A_1 is genuinely a direct effect of the perceptual *hexis*-state or whether it reduces to derivative biasing via A_2 *phantasma*-content. The architectural follow-up flagged in §1.4 at L135 is left open for V1 capstone synthesis. The two diachronic mechanisms (*Stimmung*-saturation; corrective-faculty impairment) may or may not be reducible to one another; the present chapter treats them as distinct and the reduction-question is deferred.

**(iii) The rhetoric chapter and external situation modulation.** The relationship between the *pathetic* loop's diachronic recursion and the subsequent rhetoric chapter's analysis of how external rhetorical situations modulate the loop from without. The rhetoric chapter brings Aristotelian *pisteis*, Heideggerian *Mitsein*, Rickert's ambient *Stimmung*, Burke's symbolic action, and Gross's affordance-theoretic articulation into conversation; the modulation question — how external rhetoric reaches into the agent's loop — is the chapter's central architectural question.

**(iv) The *De Anima* I.4, 408b5–7 deployment across cognitive and *pathic* motions.** The textual warrant for the direct application of the three-factor schema (not analogical extension) to cognitive and *pathic* motions, fully developed in §8 above but bearing also on §1.3 (the cognitive-actuality chapter) and §1.4 (the emotion-actuality chapter), where it warrants the direct rather than analogical application of the schema. The cross-section warrant-deployment is consistent.

**(v) Eventual integration with the rhetoric chapter's treatment of *enargeia*.** The operation by which a rhetor moves an audience between action-types — toward Type 3 affective engagement via evaluatively complex *phantasma* induction, or toward Type 2 routine via *phantasma* de-evaluation. The doxa-gate's content-conditionality (§5) and the rhetor's *enargeia*-induction capacity (Hawhee, O'Gorman) jointly specify the mechanism; the full development belongs to the rhetoric chapter.

**Required deployments.** This subsection runs primarily on cross-references to other sections; no new textual warrants are required.

**Optional light references.**

- Hawhee or O'Gorman on *enargeia* (light cite if naturally arising in item (v))
- *De Anima* I.4, 408b5–7 (light cite reinforcing the cross-section warrant in item (iv))

**Forbidden for this subsection.**

- Do NOT use `\subsubsection*{}` markup. The heading MUST be `\subsection*{Development Note}` (higher-level structural marker to indicate the chapter-and-section close). This is enforced by the CLI's `--subsection-heading` flag value.
- Do NOT attach the Heidegger deferral footnote here. That footnote belongs at the end of §8's prose.
- Do NOT redevelop any of the chapter's claims; the Development Note is forward-pointing, not consolidating.
- Do NOT redeploy any of the section's main block-quotes or anchor passages.
- Do NOT introduce new substantive claims; this is a forward-pointing note, not a new development.

**Opening pattern.** Open with a brief framing sentence that names the five forward-pointing items. Example pattern (do not use verbatim): *Five questions raised by the foregoing remain open for development in subsequent chapters.* Then enumerate the five items (using `\begin{enumerate}` or as five short paragraphs; either is acceptable per the dissertation's existing convention).

**Closing pattern.** Close with a single sentence pointing forward to the next chapter (rhetoric / attunement / ambient persuasion) without using forbidden meta-discourse. Example: *Each of these questions belongs to the rhetoric chapter's central concern: how external rhetorical situations reach into the agent's loop, modulating which type of action becomes likely.*

**Pre-output self-audit (subsection-specific).**

- The heading uses `\subsection*{Development Note}` (NOT `\subsubsection*{}`)
- Five forward-pointing items are present (numbered or paragraphed)
- No new substantive claims are introduced; all five items are forward-pointing or deferral-flagging
- No redeployment of main block-quotes or anchor passages
- The Heidegger deferral footnote is NOT here (it belongs in §8)
