# Citation Network: Aristotelian Phantasia Secondary Cluster (1985-2017)

**Cluster**: 8 units spanning 28 years, from Nussbaum's and White's contemporaneous 1985 essays through Papachristou's 2013 tripartite reconstruction. This synthesis maps intra-cluster citation flow only — citations to non-cluster secondary figures are aggregated in the companion `phx-secondary-literature-network.md`.

**Method**: Each unit-JSON's `cluster_citations` array was traversed; multi-anchor citations were split into discrete directed edges (e.g., Frede's three Nussbaum footnotes count as three edges, not one). Citations to Nussbaum's 1978 *De Motu Animalium* are treated as flowing to PHX-01 when the unit-JSON explicitly maps them to that cluster slot. Total: 31 directed citations and 9 documented citation gaps.

## 1. Hub Analysis: Nussbaum as Cluster Sun

The hub-score distribution is starkly unequal:

| Unit | Inbound | Outbound |
|---|---|---|
| PHX-01-NUSSBAUM-1985 | **7** | 0 |
| PHX-03-FREDE-1992 | 4 | 1 |
| PHX-02-WHITE-1985 | 3 | 1 |
| PHX-04-CASTON-1996 | 3 | 1 |
| PHX-05-OGORMAN-2005 | 1 | 4 |
| PHX-06-GONZALEZ-2006 | 1 | 2 |
| PHX-07-HAWHEE-2011 | 0 | 6 |
| PHX-08-PAPACHRISTOU-2013 | 0 | 4 |

Nussbaum 1985 (PHX-01) is cited by **every other unit** in the cluster — universal hub status. The asymmetry is partly mechanical (PHX-01 is the earliest unit and could not cite forward) but the magnitude exceeds chronology: Frede cites her three times, González twice (once as primary foil at pp. 113-114, once as translation source for *De motu* 700b17-21), O'Gorman twice, Hawhee at six different pages of the article. No other unit attracts more than four inbound edges, and four of those go to Frede 1992 — the cluster's secondary hub.

Why Nussbaum's centrality? Three structural reasons emerge:

1. **The Freudenthal-popularizer position**. González (PHX-06) names Nussbaum 1978:254 explicitly as "the modern popularizer of Freudenthal's 'mere show' reading of phantasia at *DA* 428a1-4 and *Rh.* 1404a11." Every later cluster author working on the appearance/truth dichotomy must therefore route through Nussbaum to access the underlying Freudenthal genealogy. Frede's three-edge engagement registers the same fact in negative: Frede cannot let Nussbaum's broadening pass without contestation precisely because Nussbaum has popularized the reading.

2. **The action-theory thesis**. PHX-01's signature claim — that phantasia is essential to animal action and supplies the desire-relevant interpretive content — sits at the intersection of philosophy of mind, ancient ethics, and rhetoric. O'Gorman (PHX-05), Hawhee (PHX-07), and Gonzalez (PHX-06) need Nussbaum's action-theory to extend phantasia outward into rhetorical and epideictic contexts. Caston (PHX-04) and Frede (PHX-03), working closer to *De Anima*, route their engagement through the *De Motu* 1978 commentary rather than the 1985 second-edition essay — a citational asymmetry that itself signals analytic vs. action-theory disciplinary cultures.

3. **The De Motu translation**. González's edge-pattern is diagnostic: he polemically opposes Nussbaum on the "mere show" reading while methodologically adopting her *De motu* translation at 700b17-21. This dual edge (foil + tool) is unusual in the cluster and reflects Nussbaum's institutional dominance over the 1978 *De Motu* edition — a dominance no subsequent author has dislodged.

Frede 1992 (PHX-03) is the cluster's secondary hub (4 inbound: from O'Gorman twice, González, Hawhee, Papachristou). Frede's centrality is owed to two assets: the supervenience/cognitive-role framework that rhetoric-cluster authors deploy as a conceptual handle, and the "after-image" gloss that O'Gorman appropriated at pp. 28 and that Hawhee inherits via O'Gorman at p. 144. Frede is the cluster's most influential analytical reading among the rhetoric-cluster authors — more cited than Caston, despite Caston's higher visibility in analytic ancient philosophy.

Caston 1996 (PHX-04) and White 1985 (PHX-02) tie for tertiary hub at 3 inbound each, but the qualitative profile differs sharply. Caston is cited by O'Gorman, Hawhee, and Papachristou — all later-cluster authors. White is cited by O'Gorman, Hawhee, and Papachristou — also later-cluster, but never substantively engaged: in all three cases, White appears as a name-checked member of the "visual reading" camp (O'Gorman n. 6), a Galenic-genealogy reference (Hawhee n. 12), or an "indicative reading" footnote (Papachristou fn. 34). White's three inbound edges are gestural rather than argumentative.

## 2. Citation-Gap Analysis: What's NOT Cited

Nine gaps are documented in the JSON. The pattern is not random:

**Gap 1: Frede → White.** The most consequential omission. Frede 1992 and White 1985 produced substantively convergent readings (phantasia as parasitic on perception) in mutual independence. Likely causes: (a) White appeared in *Dialogue* (Canadian Philosophical Review), outside the Anglo-American Aristotle-revival main channels; (b) the Nussbaum-Rorty volume circulated drafts 1985-1990; White may simply not have crossed Frede's desk in time. The omission means the analytic phantasia-as-supervenience tradition (Frede→Wedin→Caston-adjacent) never absorbed White's parallel Thomistic-philological case.

**Gap 2: Caston → White.** Same disciplinary mismatch as gap 1, here in the analytic-philosophy-of-mind register. Caston's published apparatus carries no trace of White anywhere. The Phronesis vs. *Dialogue* venue split is the proximate explanation; the deeper explanation is that Caston's analytic phantasia-as-intentionality program does not need White's Thomistic interior-landscape culmination.

**Gap 3: Caston → Nussbaum 1985 essay.** Caston cites only Nussbaum 1978 *De Motu*, not the 1985 expanded essay. Given that Caston's central thesis (phantasia as paradigmatic locus of animal intentionality) bears directly on Nussbaum's phantasia-in-action thesis, this is a more substantive lacuna than the disciplinary explanation alone can cover. One plausible motive: Caston's Brown-trained analytic register is less hospitable to Nussbaum's Heideggerianized "envisaging the good" idiom; engaging the 1985 essay would have required engaging that idiom.

**Gap 4: González → White.** González's classical-philology bibliography did not absorb the *Dialogue* venue. The gap is significant because both authors share a Thomistic-scholastic background and Aristotle-Rhetoric concern; an actual engagement would have been illuminating.

**Gap 5: González → Caston.** TAPA 136 went to press Spring 2006, so Caston 1996 (Phronesis 41.1) had been available a decade. Discipline-culture explanation: González works in classics/philology, Caston in analytic philosophy of mind. The gap is symmetric: Caston has not cited González back in subsequent work.

**Gap 6: González → O'Gorman.** Publication-timing close (O'Gorman P&R 2005; González TAPA 2006); plausibly González's manuscript was complete before O'Gorman's article reached him through P&R subscriptions. Less culturally explained than the other González gaps because both work on Aristotle's Rhetoric and phantasia.

**Gaps 7-9: Papachristou → O'Gorman, González, Hawhee.** Papachristou's analytic-Thomistic phantasia program targets *De Anima* and ignores the rhetorical-tradition phantasia scholarship entirely. The triple gap is the strongest in the cluster and demonstrates the analytic-DA / rhetorical-Rhetoric split: even by 2013, the two subclusters do not exchange citations across the boundary in this direction.

## 3. Discipline-Culture Map

Citation flow tracks four disciplinary cultures:

- **Analytic-anglophone philosophy of mind**: Frede 1992 (PHX-03), Caston 1996 (PHX-04). Internal density: low (Frede does not cite Caston, who appeared three years later). Outbound: both cite Nussbaum 1978; neither cites White.
- **Thomistic-philological**: White 1985 (PHX-02), Papachristou 2013 (PHX-08). Internal density: 1 edge (Papachristou cites White in fn. 34). Outbound: Papachristou cites all four analytic-DA siblings as "indicative reading."
- **Rhetoric-classical**: O'Gorman 2005 (PHX-05), González 2006 (PHX-06), Hawhee 2011 (PHX-07). Internal density: 2 edges (Hawhee cites O'Gorman twice, Hawhee cites González; González does NOT cite O'Gorman). Outbound: heavy use of Nussbaum, Frede, Caston, White.
- **Ancient-philosophy-action-theory**: Nussbaum 1985 (PHX-01). Sui generis position — receives 7 inbound, produces 0 outbound.

The rhetoric-cluster is the only subcluster that systematically reads across to the analytic-DA subcluster (O'Gorman cites Frede, Caston, White; Hawhee cites all four). The reverse traffic is sparse: only Papachristou's gestural fn. 34 acknowledges the rhetoric subcluster, and only by listing rhetoric-adjacent figures (Nussbaum's *De Motu*) — not the actual rhetoric papers.

Hawhee is the cluster's unique citation-omnivore: she cites all six prior cluster siblings, the only unit to do so. This reflects Hawhee's institutional position at the intersection of classical rhetoric (Penn State Rhetoric program) and ancient philosophy. She is the cluster's most reliable bridging node — a fact that may explain why Hawhee 2011 attracts no inbound cluster citations (no later cluster unit exists except Papachristou 2013, which sits in a different subcluster).

## 4. Provenance & Open Questions

- **Caston dating ambiguity**. The cluster header records Caston 1995 (year of acceptance); the published article is Phronesis 41 (1996). Hawhee, O'Gorman, González, Papachristou all cite "Caston 1996." The directed_citations record both forms; the canonical unit_id is PHX-04-CASTON-1996.
- **Nussbaum 1978 vs. 1985 mapping**. Per unit-JSON convention, Frede's, Caston's, González's, and Papachristou's "Nussbaum 1978" citations are routed to PHX-01 because the unit-JSONs explicitly map them there. The substantive overlap is genuine (the 1985 essay reprints the 1978 De Motu Essay 5 with revisions) but the mapping should be treated as a connectivity heuristic, not a literal citation match.
- **Open: González → Nussbaum 1996.** González also engages Nussbaum 1996 ("Aristotle on Emotions and Rational Persuasion" in Rorty's Essays on Aristotle's Rhetoric) at p. 100 n. 6. This is recorded as a second edge to PHX-01 in the JSON because the Rorty-volume Nussbaum essay continues the action-theory program of PHX-01; it could alternatively be split off as a "Nussbaum-corpus" pseudo-node.
- **PHX-08 fn. 34 atomicity**. Papachristou's four cluster citations all occur at a single footnote (fn. 34, PDF p. 12) listing Nussbaum, White, Frede, Caston as "indicative readings." Treated here as four discrete edges with shared anchor; could alternatively be modeled as a single grouped citation event.
