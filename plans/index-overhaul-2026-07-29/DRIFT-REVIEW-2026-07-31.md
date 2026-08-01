# Drift Review — 405 quotations needing your judgment
**Date:** 2026-07-31 · **Source:** `archon-cli/.archon/corpus-import/drift-review.jsonl`

Each row: the quotation as STORED in the index vs. what the verifier found in the
document (DOC). Similarity is the fuzzy score — **treat it with suspicion: the DOC
text can be a DIFFERENT passage than the one you quoted** (the matcher grabs the
closest region, which is sometimes just topically similar text). Three decisions
per row:

- **ACCEPT-DOC** — the DOC text is your passage; the stored quote picked up damage
  (header contamination, glued footnotes, line-break junk). Store gets the DOC text.
- **KEEP-COMPOSITE** — your quote is a deliberate ellipsis-composite or compressed
  citation; keep it as-is, annotated non-verbatim (it will not carry an exact anchor).
- **RECLASSIFY** — it was never a quotation (paraphrase); drops the verbatim contract.

Mark decisions inline (e.g. `→ ACCEPT-DOC`) or dictate them to the session; the
apply tooling reads either. Part 1 = core index clauses (dissertation-relevant
first); Part 2 = Phase-F prose extractions.

---

## Part 1 — Core index clauses (162)


#### Source: cited:Agosta-2010 (1)

### diss-verbatim-Q-AGO-07  ·  sim 0.758  ·  cited:Agosta-2010
- page 4, doc `doc-77d2ab6b-ca15-4a`
- **STORED:** the pathē are not merely an annex of psychical processes, but are rather the ground out of which speaking arises, and which what is expressed grows back into … The primary being-oriented … is not a knowing, but rather a finding-oneself.
- **DOC:** . . . Aristotle discusses the pathe\ as those phenomena in which it is shown that the concrete being of human beings can only be understood if one takes it in its fullness. . . . It is, above all, decisive that we lose our composure, as in the case of fearing without encountering something in the environing world that could be the direct occasion of fear. (1924: 139–40) In particular, the example in the last sentence points to the understanding of affects as disclosive of a whole way of being-in-theworld, not just particular things. We are discomforted or de-composed in fear without a particul
- **DECISION:** 


#### Source: cited:Bowin-2017 (2)

### diss-verbatim-B-7  ·  sim 0.897  ·  cited:Bowin-2017
- page 11, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** perceiving time does not presuppose grasping it intellectually, but grasping time intellectually … has an effect on how one perceives time for those beings who have intellect.
- **DOC:** 4. The effect of intellect on the perception of time So according to Aristotle, perceiving time does not presuppose grasping it intellectually, but grasping time intellectually, I will now argue, has an effect on how one perceives time for those beings who have intellect. This idea, I think, is behind the following passage from Pseudo-Philoponus: By "time" Aristotle means determinate (ὡρισμένον) time, not indeterminate (ἀόριστον). In this way, at least, he says in the de Interpretatione "some simply, some in time", &lt;sup&gt;33&lt;/sup&gt; meaning by "simply" indeterminate time, and by "in ti
- **DECISION:** 

### diss-verbatim-B-5  ·  sim 0.882  ·  cited:Bowin-2017
- page 11, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** Perceiving time in those texts amounts to perceiving an ordered series of past or present events. Here, perceiving time is perceiving the future. Strictly speaking, though, one does not perceive the future … But we can perceive φαντάσματα
- **DOC:** 4. The effect of intellect on the perception of time So according to Aristotle, perceiving time does not presuppose grasping it intellectually, but grasping time intellectually, I will now argue, has an effect on how one perceives time for those beings who have intellect. This idea, I think, is behind the following passage from Pseudo-Philoponus: By "time" Aristotle means determinate (ὡρισμένον) time, not indeterminate (ἀόριστον). In this way, at least, he says in the de Interpretatione "some simply, some in time", &lt;sup&gt;33&lt;/sup&gt; meaning by "simply" indeterminate time, and by "in ti
- **DECISION:** 


#### Source: cited:Caston (Cartesian Theatre)-2021 (1)

### diss-verbatim-Q-CST-04  ·  sim 0.759  ·  cited:Caston (Cartesian Theatre)-2021
- page 4, doc `doc-f6ca2758-5e1a-46`
- **STORED:** The change (κίνησις) that constitutes phantasia is distinct from both the experience of visualization and the objects that seem to appear in such experiences. These individual changes … occur in the peripheral sense organs and travel through the blood to the central sense organ
- **DOC:** The general idea might be clearer from two more familiar examples. The image files on your computer can, in conjunction with the right software, produce visible representations of objects on a monitor screen. But you would look in vain to find anything inside the computer, in the circuits and storage devices where the files reside, that looked like those objects. These image files, moreover, consist of information that can be accessed and further manipulated, even when nothing is projected on the monitor screen. The image files thus possess representational content without themselves looking l
- **DECISION:** 


#### Source: cited:Caston-1995 (1)

### diss-verbatim-Q-CAS-08  ·  sim 0.883  ·  cited:Caston-1995
- page 0, doc `doc-2ecb2d4c-b8b1-46`
- **STORED:** Phantasia will consequently be about what a sensation is about (De an. 3.3, 428b 12), even if the object is not in view.
- **DOC:** Like an echo, the phantasma is only an indirect effect of the object of perception: the phantasma is directly caused by the sensory stimulation (atcfoOra), which in turn is directly caused by the object (actor0T6Tv).59 But even with regard to the sensory stimulation, the phantasma is only a side effect: the primary effect, of course, is to produce the experience of sensa tion by acting on the central organ. Like an echo, too, the manner in which the phantasma is produced ensures that it will be a similar sort of change and, importantly, can have similar sorts of effects: in particular, it can 
- **DECISION:** 


#### Source: cited:Christensen-2016 (1)

### diss-verbatim-Q-CHR-07  ·  sim 0.835  ·  cited:Christensen-2016
- page 32, doc `doc-2c109ca4-136d-47`
- **STORED:** Aristotle defines the virtue of magnanimity, the virtue concerned with honour, as knowing one's worth (EN 1123b2-5, EE 1232b31-1233a2). … this correct valuation of his own worth … informs the magnanimous man's attitude to dishonour
- **DOC:** Aristotle here makes it clear that he thinks slights from people who are "of no account" do cause anger, and indeed are more prone to cause anger.27 But if this is the case, and if anger essentially involves self-doubt, it follows that slights from inferiors do cause loss of selfesteem. It would, however, be thoroughly puzzling were Aristotle to unqualifiedly endorse a necessary connection between loss of status and a lessened sense of self-worth. It is true, of course, that he does connect honour to self-esteem. Thus, Aristotle tells us, honour is pleasant because it reassures us that we are 
- **DECISION:** 


#### Source: cited:Corcilius-2013 (1)

### diss-verbatim-Q-COR-09  ·  sim 0.792  ·  cited:Corcilius-2013
- page 26, doc `doc-ea3fdd54-1e6a-4d`
- **STORED:** the alteration in the heart … is not a mere alteration, but an alteration with intentional dimension.
- **DOC:** We propose to make as much sense as possible of Aristotle's text by assuming that the unextended internal supporting point of animal motion is not the soul conceived as an organized set of capacities, but as the activity of perceiving (or having an appearance of) a pleasant or painful object. That is, the unextended and unmoved internal supporting point of animal motion is the inner representation of the goal of the animal's motion, what the animal 'has in mind', as it were, when moving towards a pleasant object it craves for, or moving away from a painful object it loathes. In other words, th
- **DECISION:** 


#### Source: cited:Dow-2011 (1)

### diss-verbatim-Q-DOW-07  ·  sim 0.861  ·  cited:Dow-2011
- page 157, doc `doc-fa5d5266-bf37-4a`
- **STORED:** 1. To have an emotion is to experience pain, pleasure or both. 2. The pain and pleasure involved in having an emotion is … intentional and representational: it is pain/pleasure at the emotion's object or 'target' and involves that target being represented in ways that give 'grounds' for the particular emotion experienced.
- **DOC:** Claim 1: To have an emotion is to experience (some kind of ) pain, pleasure or both. Claim 2: The pain and pleasure involved in having an emotion is pain/pleasure that is intentional and representational: it is pain/pleasure at the emotion's object or 'target' and involves that target being represented in ways that give 'grounds' for the particular emotion experienced. Thus, being afraid of the bear is to experience pain, and this is pain at the bear, at the bear's being a source of future harm (i.e. fearsome). In section 9.2 below, I defend the view that these claims represent Aristotle's und
- **DECISION:** 


#### Source: cited:Frede-1992 (2)

### diss-verbatim-Q-FRD-08  ·  sim 0.776  ·  cited:Frede-1992
- page 9, doc `doc-6adbb9a6-9a6b-4d`
- **STORED:** phantasiai … remain phenomena in their own right.
- **DOC:** The relationship between phantasia (or aisthēsis in the wider sense) and nous has recently been likened to that between matter and form. As a metaphor this is perhaps not unacceptable since the senses do deliver the material that reason works on. The metaphor has its dangers, however, since it suggests a necessary relationship between them. In opposition, however, to matter in its usual sense, phantasiai can and do exist by themselves; they need not be 'informed' by thought. And, more importantly, phantasiai are sometimes quite recalcitrant and resist 'information'. As Aristotle asserts in Ins
- **DECISION:** 

### diss-verbatim-Q-FRD-07  ·  sim 0.763  ·  cited:Frede-1992
- page 8, doc `doc-6adbb9a6-9a6b-4d`
- **STORED:** phantasia plays a crucial cognitive role both in practical and in theoretical thinking in Aristotle by supplying the necessary link between the sensible and the intelligible. … our thinking cannot be entirely abstract but always needs a kind of Gestalt.
- **DOC:** work without such phantasiai; there must be a 'collection' of sensory impressions that presents the mind with the phenomena that are to be explained and preserved.&lt;sup&gt;42&lt;/sup&gt; The tocus classicus discussing the connection between the sensual and the intellectual in the formation of science, APo. 2. 19, does not make any mention of phantasia, but it is clear that the kind of aisthēsis that leads to memory, experience and, finally, to nous of the first principles really consists in phantasiai. Only retained perceptions (for those animals which have a monē of their perceptions) lead 
- **DECISION:** 


#### Source: cited:Gonzalez-2006 (3)

### diss-verbatim-Q-GON-02  ·  sim 0.866  ·  cited:Gonzalez-2006
- page 4, doc `doc-e8086619-600e-44`
- **STORED:** the goal of rhetorical practice is phantasia with pistis, but pistis cannot exist without doxa … in the Rhetoric Aristotle elides the possibility of phantasia without doxa, and this sufficiently accounts for what seems superficially like emotion without belief.
- **DOC:** THE MODERN CONSENSUS AND ITS RATIONALE Since the views scholars hold about phantasia in Rhetoric III. l depend partly on how they construe the relationship between lexis and hypokrisis, it is here that we must start our analysis of the modern consensus and its rationale. Many believe the Aristotle marginalizes hypokrisis as morally objectionable in favor of a view of lexis that precludes it, associating phantasia closely and exclusively with the undesirable hypokrisis. This suggests that phantasia must be something that should itself be censured, "mere show" or "ostentatiousness:' But I believ
- **DECISION:** 

### diss-verbatim-Q-GON-04  ·  sim 0.857  ·  cited:Gonzalez-2006
- page 8, doc `doc-e8086619-600e-44`
- **STORED:** phantasia … is said to be 'a kind of weak perception' (αἴσθησις), connected not only with sense perception but also with the mental faculties of memory and hope.
- **DOC:** According to Aristotle, attention to style has a small, but necessary place in every \delta\iota\delta\alpha\sigma\kappa\alpha\lambda(\alpha), for it makes a difference to clarity (\pi\rho\delta\varsigma\tau\delta\delta\eta\lambda\hat{\omega}\sigma\alpha\iota), yet not so much (\tau\sigma\sigma\circ\hat{\upsilon}\tau\sigma)—i.e., its importance should not be overstated—but all this is phantasia directed towards the hearer. ^{19} πρ\dot{\delta}\varsigma τ\dot{\delta} δηλ\dot{\omega}σ\dot{\delta} must not be overly restricted to conceptual clarity: Aristotle has in view such a presentation befor
- **DECISION:** 

### diss-verbatim-Q-GON-10  ·  sim 0.843  ·  cited:Gonzalez-2006
- page 30, doc `doc-e8086619-600e-44`
- **STORED:** Through carefully designed sensory phantasmata … he attempts to place before his listeners a particular [re]presentation of the facts; this [re]presentation, successfully brought before his mind's eye, becomes the hearer's own phantasia
- **DOC:** and humbly of pitiable things (Rh. 1408al6-19). All these, being matters of style and delivery, will imply an appropriate register for the orator's voice-a careful choice of intonation, loudness, and prose rhythm-and a fitting countenance that does not raise the suspicion of speciousness (1408b4-7). These are all visual and aural phantasmata that render style effective in expressing ethos and pathos (l 408al0-l l ), and whose goal is a "community of feeling" between hearer and speaker that creates plausibility and persuasion: "The proper lexis also makes the matter credible: the mind [ of the 
- **DECISION:** 


#### Source: cited:Gross-2017 (1)

### diss-verbatim-Q-GRO-02  ·  sim 0.815  ·  cited:Gross-2017
- page 19, doc `doc-a9cd2cc2-7b1a-4d`
- **STORED:** Debating 'Emotions: hardwired or socially constructed?' is distracting because it collapses the phenomenology that is where we in fact spend most of our time. So to replace this binary debate I offer the following phenomenology of emotion … which … we can also call this … a 'rhetoric of emotion.'
- **DOC:** Now after Sterne we can return to the beginning with some notes on methodology- specifically what my home field in the humanities brings to bear. A sign of the times, our opening thought experiment and the initial anger-or-fear alternative is plucked out of an important 2011 Neuropsychologia study, "Grounding Emotion in Situated Conceptualization," published by senior researchers Lawrence Barsalou, Lisa Feldman Barrett, and colleagues. In that study the researchers set out to critique and provide laboratory evidence refuting the "basic emotion program" attributed prominently to Paul Ekman, rep
- **DECISION:** 


#### Source: cited:Hawhee-2011 (1)

### diss-verbatim-Q-HAW-07  ·  sim 0.841  ·  cited:Hawhee-2011
- page 13, doc `doc-d7c81ced-4c7c-4a`
- **STORED:** shame is phantasia about a loss of reputation … no one cares about reputation [in the abstract] but on account of those who hold an opinion of him, necessarily a person feels shame toward those whose opinion he takes account of
- **DOC:** This passage presents the extra-logical aspects of rhetoric as a layering of dispositions on dispositions, echontes on echontes, a meeting of appearances. The first chapter of book II is replete with various forms of the verb phainein: to show, to disclose, to bring to light, to appear. It is one of the verbs from which the verbal noun phantasia is derived, and its various forms in turn locate the action of appearing with rhetoric, audience, and judge alike. As the final line of this passage suggests, such appearances, created through a combination of words and actions, are frequently filtered
- **DECISION:** 


#### Source: cited:Papachristou-2013 (2)

### diss-verbatim-P-1  ·  sim 0.818  ·  cited:Papachristou-2013
- page 1, doc `doc-8e65df48-30a7-42`
- **STORED:** I shall try to demonstrate that when we study in depth the notion of phantasia (φαντασία), as it is described in Book III of De Anima, we can realize that Aristotle speaks about three and not two kinds or grades of phantasia.
- **DOC:** Three Kinds or Grades of Phantasia in Aristotle's De Anima* Christina S. Papachristou Phantasia/imagination (φαντασία) in Aristotle is one of the parts (μόρια) or faculties/powers (δυνάμεις) of the soul that cannot exist apart from sensation (αἴσθησις) and thought (διάνοια). The function of phantasia and its connection with phantasmata (φαντάσματα), the products of this faculty, plays a significant role in the psychological treatises of the Aristotelian Corpus. The purpose of this paper is to examine the concept of phantasia in Book III, Chapter 3 of De Anima, and to show that the Stageirite p
- **DECISION:** 

### diss-verbatim-P-5  ·  sim 0.763  ·  cited:Papachristou-2013
- page 17, doc `doc-8e65df48-30a7-42`
- **STORED:** in animals other than indefinite creatures … the product of phantasia or phantasma remains in them even after the sense object is gone.
- **DOC:** Imperfect Animals (zoophytes, molluscs etc.) \downarrow \downarrow Only the Contact Sense = they can sense only objects in contact with them and in this way they can discriminate which objects are pleasant or unpleasant to them \bigcup Indefinite/Indeterminate Phantasia \bigcup Phantasmata (Representations of Touch or Tactile Representations) = diffuse and indefinite and do not remain in imperfect animals after the sense object is gone Table 2 (b) Sensitive Phantasia (Αἰσθητική Φαντασία) Regarding the next kind or grade of phantasia, we should remark the following: Aristotle says that sensitiv
- **DECISION:** 


#### Source: cited:Rickert-2019 (1)

### diss-verbatim-Q-RIC-10  ·  sim 0.820  ·  cited:Rickert-2019
- page 8, doc `doc-66ab1fd0-63d5-47`
- **STORED:** argument and debate are ambient. It takes a world—the 'it is all there'—to have a debate.
- **DOC:** An example can bring these points home. In his book Post-Truth, philosopher Lee McIntyre quotes from a 2017 interview between CNN reporter Alisyn Camerota and former Speaker of the House Newt Gingrich. The occasion was Trump's then recent remarks that crime was on the rise; Gingrich was defending Trump's claims. Camerota points out to Gingrich that the claim is flatly wrong, and cites FBI crime statistics to prove that crime is down. Gingrich counters that these "facts" bump up against another fact, which is that people feel more threatened, and therefore, "as a political candidate, I'll go wi
- **DECISION:** 


#### Source: cited:White-1985 (1)

### diss-verbatim-W-12  ·  sim 0.793  ·  cited:White-1985
- page 22, doc `doc-562ea6b9-9bb8-4a`
- **STORED:** By internalizing and preserving such features, the power of phantasia provides man with a familiar interior landscape … he may consult with confidence in its permanence.
- **DOC:** Conclusion The role of phantasia in human life, according to Aristotle, goes far beyond its contribution to the activity of noein, and is, in fact, pervasive. That the discussion of the noetic soul occurs in the De anima just after the treatment of phantasia, on which it depends, seems to underline the human importance of this activity, which is apparently both incessant in man and at the heart of his deepest concerns. As we have just seen, the activity of thought, man's highest endeavour, is impossible without the concurrent activity of phantasia; moreover, when the power of thought is eclips
- **DECISION:** 


#### Source: cited:Withy-2023 (1)

### diss-verbatim-Q-WIT-06  ·  sim 0.890  ·  cited:Withy-2023
- page 3, doc `doc-68a2e07c-c1c2-4a`
- **STORED:** To find ourselves so moved is to experience a pathos or what Heidegger calls a Stimmung (attunement). And being open to finding ourselves so attuned or disposed is what Heidegger calls Befindlichkeit (finding).
- **DOC:** Heidegger on Being Aûected 3 Entities that are in the world can be impacted by things in such a way that they are moved or touched (cf. SZ: 54–5). They experience things as affecting them and themselves as affected by things. It is presumably by experiencing oneself as thus affected that one counts as hurt, or the opposite. The effect can be either positive or negative. When things impact me negatively, I am pained. When things impact me positively, I experience pleasure. The corresponding path can thus be sorted into, most immediately, the pleasant (hdu) and the painful (lupron), and also the
- **DECISION:** 


#### Source: sandbox:audi-2012 (3)

### cl-claim-audi-2012-164  ·  sim 0.888  ·  sandbox:audi-2012
- page 20, doc `doc-9c23c096-a671-41`
- **STORED:** to [q], then [q] grounds [p].31 According to this principle, if the fact that some item, x, is a square reduces to the fact that x is an equilateral right quadrilateral, hence- forth ERQ, then it is also true that the fact that x is a
- **DOC:** v. against the grounding-reduction link I noted above that my ethical example presupposes a nonreductive view of wrongness because if wrongness should reduce to some natural property, then the relation between the natural fact and the normative fact would be identity rather than grounding. This assumes that grounding and reduction are incompatible, which is by no means obvious, though I shall now argue that it is the case. Let us begin with Gideon Rosen's contrary claim that reduction in fact implies grounding, which he calls the grounding-reduction link: According to this principle, if the fa
- **DECISION:** 

### cl-claim-audi-2012-213  ·  sim 0.826  ·  sandbox:audi-2012
- page 23, doc `doc-9c23c096-a671-41`
- **STORED:** clarity. Suppose what it is to be prime is to have exactly one proper factor grounding 707 [PDF-p24] (this is at once a real definition an
- **DOC:** If I am correct, then, Rosen is committed to the conceptual view of facts. But there is a powerful reason not to regard grounding as a relation between facts so construed. Grounding is supposed to be among the relations that constitute the objective structure of the world, the structure that it would have no matter how we conceive its inhabitants (if we conceive them at all). Now, I do not mean to suggest that treating grounding as a relation between facts conceptually construed makes grounding entirely conceptually relative, that is, such that what grounds what is a variable matter that depen
- **DECISION:** 

### cl-claim-audi-2012-163  ·  sim 0.752  ·  sandbox:audi-2012
- page 20, doc `doc-9c23c096-a671-41`
- **STORED:** Let us begin with Gideon Rosen’s contrary claim that reduction in fact implies grounding, which he calls the grounding-reduction link: (GRL) For any p and q, if [p] reduces to [q], then [q] grounds [p].
- **DOC:** v. against the grounding-reduction link I noted above that my ethical example presupposes a nonreductive view of wrongness because if wrongness should reduce to some natural property, then the relation between the natural fact and the normative fact would be identity rather than grounding. This assumes that grounding and reduction are incompatible, which is by no means obvious, though I shall now argue that it is the case. Let us begin with Gideon Rosen's contrary claim that reduction in fact implies grounding, which he calls the grounding-reduction link: According to this principle, if the fa
- **DECISION:** 


#### Source: sandbox:barnes-2012 (1)

### cl-claim-barnes-2012-062  ·  sim 0.835  ·  sandbox:barnes-2012
- page 4, doc `doc-0ac55635-08b8-40`
- **STORED:** 30 December 2018 [PDF-p6] There are different ways to characterize the existence of the deriva- tive entities — the picture can be either deﬂ
- **DOC:** So, for example, if God decides that she wants a world with a single complex object composed of two mereological simples, she would simply have to create the two mereological simples.6 She would not have to engage in a further act of creation: 'let there be a complex object'. By setting the composition relation and what simples exist, she gets the (derivative) complex object for free.7 Alternatively, fundamentality can be cashed out in terms of truthmakers. Entities which are fundamental are those which truthmake their own existence, and which are capable of serving as truthmakers 5 See especi
- **DECISION:** 


#### Source: sandbox:bowin-2017 (19)

### cl-claim-bowin-2017-141  ·  sim 0.895  ·  sandbox:bowin-2017
- page 14, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** t the measur- ability of time, that is, that in the absence of beings with νο ῦ ς, time would not be measurable (or countable in the extended sense of time being countable by means of some det
- **DOC:** Still, there are other texts that would seem to favor the existence of non-conceptual ἐμπειρία. Aristotle claims at Nicomachean Ethics 7.3.1147b5, that animals "have no universal beliefs (καθόλου ὑπόληψιν) but only imagination (φαντασία) and memory (μνήμη) of particulars". And then in Metaphysics A 1, he credits all animals with sensation and only some with memory and ἐμπειρία (980b25–7). So the animals that have experience must have non-universal, which I take to be non-conceptual, ἐμπειρία. And Aristotle seems to say that experience, which some animals possess, does not involve universal con
- **DECISION:** 

### cl-claim-bowin-2017-018  ·  sim 0.891  ·  sandbox:bowin-2017
- page 1, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** eing] perceives (αἰσθάνεσθαι) time [as time is] in itself, but the other [animals perceive it] incidentally, since they [perceive] not time but [only] the way that they were affected at an earlier time. . . . Only a human
- **DOC:** ARISTOTLE ON THE PERCEPTION AND COGNITION OF TIME John Bowin Aristotle claims that time can be perceived. In Physics 4.11 he says we perceive motion and time together and he says that we can perceive instants, or "nows" as he calls them (219a3–4; 219a30–b1). At various places in De Memoria 1, he also says that the perception of time is involved in remembering (Mem.1.449b29, 450a19, 451a17). Aristotle thinks that by measuring time we can grasp it intellectually as well. He talks of "apprehending time by a measure" in De Memoria 2 (452b7), and I shall argue that this is a way of grasping time in
- **DECISION:** 

### cl-claim-bowin-2017-155  ·  sim 0.877  ·  sandbox:bowin-2017
- page 14, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** would it be countable in the extended sense of time being countable by means of some determinate time. Not
- **DOC:** Still, there are other texts that would seem to favor the existence of non-conceptual ἐμπειρία. Aristotle claims at Nicomachean Ethics 7.3.1147b5, that animals "have no universal beliefs (καθόλου ὑπόληψιν) but only imagination (φαντασία) and memory (μνήμη) of particulars". And then in Metaphysics A 1, he credits all animals with sensation and only some with memory and ἐμπειρία (980b25–7). So the animals that have experience must have non-universal, which I take to be non-conceptual, ἐμπειρία. And Aristotle seems to say that experience, which some animals possess, does not involve universal con
- **DECISION:** 

### cl-claim-bowin-2017-071  ·  sim 0.875  ·  sandbox:bowin-2017
- page 7, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** is an activity that Aristotle denies beings lacking intellect. 24 Appreh
- **DOC:** Here, Aristotle says that we measure time by counting units of time (e.g., days) which are determinate because they are marked out by motions that are determinate in time (e.g., celestial motions). The reason that the use of ἀριθμεῖν is extended, here, is that strictly speaking, counting is a type of measurement for Aristotle, not vice versa. Counting is the type of measurement that is most exact because the measure that it involves is absolutely indivisible, rather than "indivisible in relation to perception" (Metaph.I.1.1053a1, 23). So strictly speaking, nows may be counted, because they are
- **DECISION:** 

### cl-claim-bowin-2017-111  ·  sim 0.862  ·  sandbox:bowin-2017
- page 12, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** αντασία] is up to us when we wish (for it is possible to produce something before our eyes, as those do who set things out in mnemonic systems 38 and form images of th
- **DOC:** When Aristotle says, "one must measure (μετρεῖν) by a single standard; for one pursues what is greater (τὸ μεῖζον)", what springs to mind is something like Socrates' ή μετρητική τέχνη at Plato's Protagoras 356d-e, that is, a measure of value. We reckon by some measure of value which of two contemplated actions will result in more, for example, pleasure, wealth, or happiness. But the text is more general than this. It says only that deliberation or calculation about a choice of actions requires a measure with which to calculate what is greater (τὸ μεῖζον); a single unified measure that is synth
- **DECISION:** 

### cl-claim-bowin-2017-145  ·  sim 0.861  ·  sandbox:bowin-2017
- page 15, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** riptions. Categories 7 tells us that the correct way of talking about the measurable in relation to the measure is not to say that the measurable is [PDF-p16] J O H N B O W I N 190 measurable of the measure, but that the measurable
- **DOC:** In Metaphysics \Delta 15, Aristotle says that what are measurable, or knowable, or thinkable, or visible are called relatives, not because they are called just what they are of something else but because something else, that is, a measure or knowledge or thought or sight, is called just what it is of them. I take it that the difference is that a measure is definitionally and intrinsically related to the measurable, while the measurable is not similarly related to the measure, and as a consequence, while the measure cannot be but described as a measure, the measurable admits of other descriptio
- **DECISION:** 

### cl-claim-bowin-2017-133  ·  sim 0.857  ·  sandbox:bowin-2017
- page 14, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** ses its existence, if nows were brought into existence by the act of counting, 42 this would seem to have some plausibility, since acts of perception would depen
- **DOC:** Still, there are other texts that would seem to favor the existence of non-conceptual ἐμπειρία. Aristotle claims at Nicomachean Ethics 7.3.1147b5, that animals "have no universal beliefs (καθόλου ὑπόληψιν) but only imagination (φαντασία) and memory (μνήμη) of particulars". And then in Metaphysics A 1, he credits all animals with sensation and only some with memory and ἐμπειρία (980b25–7). So the animals that have experience must have non-universal, which I take to be non-conceptual, ἐμπειρία. And Aristotle seems to say that experience, which some animals possess, does not involve universal con
- **DECISION:** 

### cl-claim-bowin-2017-063  ·  sim 0.846  ·  sandbox:bowin-2017
- page 7, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** grasp of time. The best evidence for this is in De Memoria 2, where, [PDF-p8] J O H N B O W I N 182 in language very similar to the passage quoted from Physics 4.14, Aristotle claims that measuring tim
- **DOC:** Here, Aristotle says that we measure time by counting units of time (e.g., days) which are determinate because they are marked out by motions that are determinate in time (e.g., celestial motions). The reason that the use of ἀριθμεῖν is extended, here, is that strictly speaking, counting is a type of measurement for Aristotle, not vice versa. Counting is the type of measurement that is most exact because the measure that it involves is absolutely indivisible, rather than "indivisible in relation to perception" (Metaph.I.1.1053a1, 23). So strictly speaking, nows may be counted, because they are
- **DECISION:** 

### cl-claim-bowin-2017-044  ·  sim 0.844  ·  sandbox:bowin-2017
- page 6, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** number is perceived directly (καθ’ αὑτά) by the common sense in De Anima 3.1 (425a16, cf. 2.6.418a7–11), soon after saying
- **DOC:** I suggest, rather, that when Aristotle says "the mind pronounces that the 'nows' are two" at Physics 4.11.219a27–8, this need only imply that the mind perceives the number of (countable) nows, not that it counts them. Aristotle says that number is perceived directly (\kappa\alpha\theta' αὐτά) by the common sense in De Anima 3.1 (425a16, cf. 2.6.418a7–11), soon after saying that "all the senses are possessed by those animals that are neither imperfect nor maimed" (425a9–10). So the direct perception of number is not limited to beings with intellect. The common sense, in both animals and humans,
- **DECISION:** 

### cl-claim-bowin-2017-024  ·  sim 0.833  ·  sandbox:bowin-2017
- page 2, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** Aristotle thinks this is true of mathematical objects in general is controversial. 7 It is clear that,
- **DOC:** Must, then, time be grasped intellectually because it is a mathematical object? This would clearly be the case if numbers were ontologically constituted by the mind of the mathematician. The extent to which Aristotle thinks this is true of mathematical objects in general is controversial.&lt;sup&gt;7&lt;/sup&gt; It is clear that, in Aristotle's view, mathematical objects are sensible objects studied qua having certain properties. But it is not clear if or to what extent these properties are actually present in the sensible world independently of the mind of the mathematician. For it is not cle
- **DECISION:** 

### cl-claim-bowin-2017-153  ·  sim 0.809  ·  sandbox:bowin-2017
- page 15, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** ining” since we know from De Memoria 2 that the measure by which we have a determinate cognition of the time as being, for example, this or that many days, is an “inner movement” or a φαντάσμα; a nor- malized φαντάσμα of a day synthesized from
- **DOC:** In Metaphysics \Delta 15, Aristotle says that what are measurable, or knowable, or thinkable, or visible are called relatives, not because they are called just what they are of something else but because something else, that is, a measure or knowledge or thought or sight, is called just what it is of them. I take it that the difference is that a measure is definitionally and intrinsically related to the measurable, while the measurable is not similarly related to the measure, and as a consequence, while the measure cannot be but described as a measure, the measurable admits of other descriptio
- **DECISION:** 

### cl-claim-bowin-2017-081  ·  sim 0.807  ·  sandbox:bowin-2017
- page 11, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** ion of the indeterminate. 34 The distinction, here, is different from the one Aristotle makes at Mem .2.452b8–9 and 452b30–453a4 because it is a distinction between types of perception (αἴσθησις), not a
- **DOC:** 4. The effect of intellect on the perception of time So according to Aristotle, perceiving time does not presuppose grasping it intellectually, but grasping time intellectually, I will now argue, has an effect on how one perceives time for those beings who have intellect. This idea, I think, is behind the following passage from Pseudo-Philoponus: By "time" Aristotle means determinate (ὡρισμένον) time, not indeterminate (ἀόριστον). In this way, at least, he says in the de Interpretatione "some simply, some in time", &lt;sup&gt;33&lt;/sup&gt; meaning by "simply" indeterminate time, and by "in ti
- **DECISION:** 

### cl-claim-bowin-2017-022  ·  sim 0.802  ·  sandbox:bowin-2017
- page 1, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** sping it intellectually. Themistius’ thought appears to be that perceiving time in itself requires νο ῦ ς 5 because it requires counting and, accord- ing to Aristotle, only beings with νο ῦ ς are able to count
- **DOC:** ARISTOTLE ON THE PERCEPTION AND COGNITION OF TIME John Bowin Aristotle claims that time can be perceived. In Physics 4.11 he says we perceive motion and time together and he says that we can perceive instants, or "nows" as he calls them (219a3–4; 219a30–b1). At various places in De Memoria 1, he also says that the perception of time is involved in remembering (Mem.1.449b29, 450a19, 451a17). Aristotle thinks that by measuring time we can grasp it intellectually as well. He talks of "apprehending time by a measure" in De Memoria 2 (452b7), and I shall argue that this is a way of grasping time in
- **DECISION:** 

### cl-claim-bowin-2017-119  ·  sim 0.797  ·  sandbox:bowin-2017
- page 12, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** k it is reasonable to take the view that while intellect has a role in deter- mining the content of the images produced by deliberative φαντασία, the content itself remains non-concept
- **DOC:** When Aristotle says, "one must measure (μετρεῖν) by a single standard; for one pursues what is greater (τὸ μεῖζον)", what springs to mind is something like Socrates' ή μετρητική τέχνη at Plato's Protagoras 356d-e, that is, a measure of value. We reckon by some measure of value which of two contemplated actions will result in more, for example, pleasure, wealth, or happiness. But the text is more general than this. It says only that deliberation or calculation about a choice of actions requires a measure with which to calculate what is greater (τὸ μεῖζον); a single unified measure that is synth
- **DECISION:** 

### cl-claim-bowin-2017-033  ·  sim 0.781  ·  sandbox:bowin-2017
- page 5, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** is that Aristotle appears to talk of perceiving individual φαντάσματα 17 of both objects and events in th
- **DOC:** to mark off nows in order for them to exist, the third assumption seems unwarranted, since it seems entirely possible to mark off nows by merely perceiving them. Aristotle says that nows can be perceived at Physics 4.11.219a30–219b1 and he says that perception is capable of discriminating (Post. An. 2.19.99b35; Top. 2.4.111a14-20; DA.2.11.424a6; 3.2.426b8-21). And if marking off nows means discriminating them as individuals, there is circumstantial though convincing evidence that Aristotelian perception is perfectly able to do this by itself, without the help of intellect. First, incidental pe
- **DECISION:** 

### cl-claim-bowin-2017-065  ·  sim 0.777  ·  sandbox:bowin-2017
- page 7, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** we measure time by counting determinate units of time like days, we apprehend (γνωρίζειν) time and the amount of time determinately. Otherwise, we apprehend time and the amount of time indeterminately (ἀορίστως). Γνωρίζε
- **DOC:** Here, Aristotle says that we measure time by counting units of time (e.g., days) which are determinate because they are marked out by motions that are determinate in time (e.g., celestial motions). The reason that the use of ἀριθμεῖν is extended, here, is that strictly speaking, counting is a type of measurement for Aristotle, not vice versa. Counting is the type of measurement that is most exact because the measure that it involves is absolutely indivisible, rather than "indivisible in relation to perception" (Metaph.I.1.1053a1, 23). So strictly speaking, nows may be counted, because they are
- **DECISION:** 

### cl-claim-bowin-2017-117  ·  sim 0.773  ·  sandbox:bowin-2017
- page 12, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** vements” representing determinate time are a product of the active manipulation of images by deliberative φαντασία in beings who can deliberate. A wor
- **DOC:** When Aristotle says, "one must measure (μετρεῖν) by a single standard; for one pursues what is greater (τὸ μεῖζον)", what springs to mind is something like Socrates' ή μετρητική τέχνη at Plato's Protagoras 356d-e, that is, a measure of value. We reckon by some measure of value which of two contemplated actions will result in more, for example, pleasure, wealth, or happiness. But the text is more general than this. It says only that deliberation or calculation about a choice of actions requires a measure with which to calculate what is greater (τὸ μεῖζον); a single unified measure that is synth
- **DECISION:** 

### cl-claim-bowin-2017-057  ·  sim 0.772  ·  sandbox:bowin-2017
- page 7, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** e by this motion. ( Physics 4.14.223b13–24) Here, Aristotle says that we measure time by counting units of time (e.g., days) which are determinate because they are marked out by motions that ar
- **DOC:** Here, Aristotle says that we measure time by counting units of time (e.g., days) which are determinate because they are marked out by motions that are determinate in time (e.g., celestial motions). The reason that the use of ἀριθμεῖν is extended, here, is that strictly speaking, counting is a type of measurement for Aristotle, not vice versa. Counting is the type of measurement that is most exact because the measure that it involves is absolutely indivisible, rather than "indivisible in relation to perception" (Metaph.I.1.1053a1, 23). So strictly speaking, nows may be counted, because they are
- **DECISION:** 

### cl-claim-bowin-2017-019  ·  sim 0.768  ·  sandbox:bowin-2017
- page 1, doc `doc-8f8c5a53-86e5-4e`
- **STORED:** me. . . . Only a human being is “at once turned front and back”, for it alone has an intellect (νο ῦ ς) by which to count (ἀριθμεῖν) what is before and after, and this number is
- **DOC:** ARISTOTLE ON THE PERCEPTION AND COGNITION OF TIME John Bowin Aristotle claims that time can be perceived. In Physics 4.11 he says we perceive motion and time together and he says that we can perceive instants, or "nows" as he calls them (219a3–4; 219a30–b1). At various places in De Memoria 1, he also says that the perception of time is involved in remembering (Mem.1.449b29, 450a19, 451a17). Aristotle thinks that by measuring time we can grasp it intellectually as well. He talks of "apprehending time by a measure" in De Memoria 2 (452b7), and I shall argue that this is a way of grasping time in
- **DECISION:** 


#### Source: sandbox:chalmers-2016 (6)

### cl-claim-chalmers-2016-167  ·  sim 0.899  ·  sandbox:chalmers-2016
- page 12, doc `doc-a3e6af39-9f4e-47`
- **STORED:** J. Chalmers 322 Red roses are red, then, because they produce reddish experi- ences in the conditions that are normal for
- **DOC:** 4 Virtual properties and virtual events I suspect that the real sticking point for many fictionalists involves events and properties in virtual worlds. In a virtual world, a virtual dragon flies through the air. In the real world, the correspond- ing digital object does not fly through the air. No real object flies through the air as the virtual dragon does. If so, then either the virtual dragon is not real, or it is real but it does not really fly through the air. Either way, the event of the virtual dragon flying through the air is fictional. This conclusion seems to follow whether virtual o
- **DECISION:** 

### cl-claim-chalmers-2016-184  ·  sim 0.876  ·  sandbox:chalmers-2016
- page 14, doc `doc-a3e6af39-9f4e-47`
- **STORED:** PDF-p15] 323 The Virtual and the Real redness itself might be construed as a disjunction of all of these prop- erties across different VR environments, or simply as the higher- order property of having some property that normally causes reddish e
- **DOC:** brings about reddish experiences (or a disjunction of such properties). Another holds that redness is the higher-order property of having a physical property that normally brings about reddish experiences. These views arguably handle certain cases better, such as cases of systematic illusion in which a white object normally looks red. These views can also be seen as functionalist in a broad sense (the physical-property view is sometimes called realizer functionalism, while the other two are versions of role functionalism). One can straightforwardly generalize all these views to the virtual cas
- **DECISION:** 

### cl-claim-chalmers-2016-211  ·  sim 0.875  ·  sandbox:chalmers-2016
- page 18, doc `doc-a3e6af39-9f4e-47`
- **STORED:** Virtual and the Real (2) Virtual objects do not have the ordinary (non-virtual) colors, lo- cations, and shapes that a correspondi
- **DOC:** 5 Is perception of virtual reality illusory? What about perception in virtual reality? If virtual objects are not real, then perception of them is a sort of hallucination, akin to perceiving a pink elephant. But even if virtual objects are real, as I have argued, perception of them might still be illusory, because we perceive virtual objects as having non-virtual properties that they do not really have. Correspondingly, an opponent might accept everything I have said so far, while holding that virtual worlds are nevertheless illusory. The reason is that we undergo illusions when we perceive vi
- **DECISION:** 

### cl-claim-chalmers-2016-207  ·  sim 0.859  ·  sandbox:chalmers-2016
- page 14, doc `doc-a3e6af39-9f4e-47`
- **STORED:** onalism to understand virtual space 8 What if different users use different headsets generating different color ex- periences? Here the issues parallel familiar issu
- **DOC:** brings about reddish experiences (or a disjunction of such properties). Another holds that redness is the higher-order property of having a physical property that normally brings about reddish experiences. These views arguably handle certain cases better, such as cases of systematic illusion in which a white object normally looks red. These views can also be seen as functionalist in a broad sense (the physical-property view is sometimes called realizer functionalism, while the other two are versions of role functionalism). One can straightforwardly generalize all these views to the virtual cas
- **DECISION:** 

### cl-claim-chalmers-2016-492  ·  sim 0.850  ·  sandbox:chalmers-2016
- page 40, doc `doc-a3e6af39-9f4e-47`
- **STORED:** ew is a sort of structuralism.17 Physical reality can be characterized by its causal structure: the patterns of interaction between physical objects, and
- **DOC:** Fictions. What about events that take place in the worlds described in novels. Do these really take place, perhaps in the head of the author or the reader? I think not. The head of the reader is much too limited to properly ground the events of a fictional world. The head of an author may be richer, involving a detailed model of the fictional world, and certain components of these models may be causally responsible for a reader's experience of fictional events. But there remain strong obstacles to identifying fictional events with brain events. First, the brain events will typically not stand 
- **DECISION:** 

### cl-claim-chalmers-2016-435  ·  sim 0.846  ·  sandbox:chalmers-2016
- page 36, doc `doc-a3e6af39-9f4e-47`
- **STORED:** r-generated and partly not.15 The best-known case here is that of augmented reality, where VR technology is used to add vir- tual objects to standard p
- **DOC:** 8 Other realities It is natural to ask how much of what I have said generalizes to other "realities" that are like virtual realities at least in some respects: mixed realities, dreams, delusions, fictions, and other cases, Mixed reality. A mixed reality is an environment that is partly computer-generated and partly not.&lt;sup&gt;15&lt;/sup&gt; The best-known case here is that of augmented reality, where VR technology is used to add virtual objects to standard perception of a physical world. There are also cases of so-called "augmented virtuality", where physical objects are added to our perce
- **DECISION:** 


#### Source: sandbox:fodor-1974 (10)

### cl-claim-fodor-1974-186  ·  sim 0.891  ·  sandbox:fodor-1974
- page 14, doc `doc-128ad16c-7112-4b`
- **STORED:** r -» S2 is exceptionless and false otherwise. What does the work of expressing the physical mechanisms whereby //-tuples of events conform, or fail to conform, to -> S2 is not (6) but the laws which severally relate elements of the disjunction P^ v P2 v ... v P„to elements o
- **DOC:** The upshot seems to be this. If we do not require that bridge statements must be laws, then either some of the generalizations to which the laws of special sciences reduce are not themselves lawlike, or some laws are not formulable in terms of natural kinds. Whichever way one takes (5), the important point is that it is weaker than standard reductivism: it does not require correspondences between the natural kinds of the reduced and the reducing science. Yet it is physicalistic on the same assumption that makes standard reductivism physicalistic (namely, that the bridge statements express true
- **DECISION:** 

### cl-claim-fodor-1974-163  ·  sim 0.887  ·  sandbox:fodor-1974
- page 14, doc `doc-128ad16c-7112-4b`
- **STORED:** ernative might be like. The upshot seems to be this. If we do not require that bridge state¬ ments must be laws, then either some of the generalizations to which the laws of special sciences reduce are not themselves lawlike, or so
- **DOC:** The upshot seems to be this. If we do not require that bridge statements must be laws, then either some of the generalizations to which the laws of special sciences reduce are not themselves lawlike, or some laws are not formulable in terms of natural kinds. Whichever way one takes (5), the important point is that it is weaker than standard reductivism: it does not require correspondences between the natural kinds of the reduced and the reducing science. Yet it is physicalistic on the same assumption that makes standard reductivism physicalistic (namely, that the bridge statements express true
- **DECISION:** 

### cl-claim-fodor-1974-089  ·  sim 0.882  ·  sandbox:fodor-1974
- page 6, doc `doc-128ad16c-7112-4b`
- **STORED:** y: bridge laws are laws. So, if Gresham’s law is true, it follows that there is a (bridge) law of nature such that‘x is a monetary exchange x is P’, where P is a term for
- **DOC:** I now want to suggest some reasons for believing that this consequence of reductivism is intolerable. These are not supposed to be knock-down reasons; they couldn't be, given that the question whether reductivism is too strong is finally an empirical question. (The world could turn out to be such that every natural kind corresponds to a physical natural kind, just as it could turn out to be such that the property is transported to a distance of less than three miles from the Eiffel Tower determines a natural kind in, say, hydrodynamics. It's just that, as things stand, it seems very unlikely t
- **DECISION:** 

### cl-claim-fodor-1974-169  ·  sim 0.866  ·  sandbox:fodor-1974
- page 14, doc `doc-128ad16c-7112-4b`
- **STORED:** a painful dilemma. Since expresses a rela¬ tion (or relations) which must be transitive, (1) can have exceptions only i
- **DOC:** The upshot seems to be this. If we do not require that bridge statements must be laws, then either some of the generalizations to which the laws of special sciences reduce are not themselves lawlike, or some laws are not formulable in terms of natural kinds. Whichever way one takes (5), the important point is that it is weaker than standard reductivism: it does not require correspondences between the natural kinds of the reduced and the reducing science. Yet it is physicalistic on the same assumption that makes standard reductivism physicalistic (namely, that the bridge statements express true
- **DECISION:** 

### cl-claim-fodor-1974-065  ·  sim 0.848  ·  sandbox:fodor-1974
- page 5, doc `doc-128ad16c-7112-4b`
- **STORED:** P is a natural kind predicate relative to S iff S contains proper laws of the form Px ÿ ÿ ax or ax -> Px,
- **DOC:** is a sufficient, but not a necessary, condition for token physicalism. In what follows, I shall assume a reading of reductivism which entails token physicalism. Bridge laws thus state nomologically necessary contingent event identities, and a reduction of psychology to neurology would entail that any event which consists of the instantiation of a psychological property is identical with some event which consists of the instantiation of some neurological property. Where we have got to is this: reductivism entails the generality of physics in at least the sense that any event which falls within 
- **DECISION:** 

### cl-claim-fodor-1974-211  ·  sim 0.829  ·  sandbox:fodor-1974
- page 17, doc `doc-128ad16c-7112-4b`
- **STORED:** eir properties. Why should there not be, among those con¬ vergent properties, some whose lawful inter-relations support the [PDF-p18] 114 J. A. FODOR ge
- **DOC:** I am suggesting, roughly, that there are special sciences not because of the nature of our epistemic relation to the world, but because of the way the world is put together: not all natural kinds (not all the classes of things and events about which there are important, counterfactual sup porting generalizations to make) are, or correspond to, physical natural kinds. A way of stating the classical reductionist view is that things which belong to different physical kinds ipso facto can have no projectible de scriptionsin common; that if x and y differ in those descriptions by virtue of which th
- **DECISION:** 

### cl-claim-fodor-1974-173  ·  sim 0.788  ·  sandbox:fodor-1974
- page 12, doc `doc-128ad16c-7112-4b`
- **STORED:** it follows that each disjunct of ‘Pÿ v Pÿ v...v P’ is a natural kind predicate, as is each disjunct
- **DOC:** The problem all along has been that there is an open empirical possibility that what corresponds to the natural kind predicates of a reduced science may be a heterogeneous and unsystematic disjunction of predicates in the reducing science, and we do not want the unity of science to be prejudiced by this possibility. Suppose, then, that we allow that bridge statements may be of the form where P_1 \vee P_2 \vee ... \vee P_n is not a natural kind predicate in the reducing science. I take it that this is tantamount to allowing that at least some 'bridge laws' may, in fact, not turn out to be laws,
- **DECISION:** 

### cl-claim-fodor-1974-038  ·  sim 0.781  ·  sandbox:fodor-1974
- page 3, doc `doc-128ad16c-7112-4b`
- **STORED:** many philosophers have held that [PDF-p4] 100 J. A. FODOR bridge laws like (2) ought to be taken to express contin
- **DOC:** There are, however, quite serious open questions about the interpreta tions of in bridge laws. What turns on these questions is the respect in which reductivism is taken to be a physicalist thesis. To begin with, if we read as 'brings about' or 'causes' in proper laws, we will have to have some other connective for bridge laws, since bringing about and causing are presumably asymmetric, while bridge laws express symmetric relations. Moreover, if in bridge laws is interpreted as any relation other than identity, the truth of reductivism will only guaranty the truth of a weak version of physical
- **DECISION:** 

### cl-claim-fodor-1974-085  ·  sim 0.771  ·  sandbox:fodor-1974
- page 6, doc `doc-128ad16c-7112-4b`
- **STORED:** is interesting about monetary exchanges is [PDF-p8] 104 J. A. FODOR surely not their commonalities under phys
- **DOC:** I now want to suggest some reasons for believing that this consequence of reductivism is intolerable. These are not supposed to be knock-down reasons; they couldn't be, given that the question whether reductivism is too strong is finally an empirical question. (The world could turn out to be such that every natural kind corresponds to a physical natural kind, just as it could turn out to be such that the property is transported to a distance of less than three miles from the Eiffel Tower determines a natural kind in, say, hydrodynamics. It's just that, as things stand, it seems very unlikely t
- **DECISION:** 

### cl-claim-fodor-1974-154  ·  sim 0.767  ·  sandbox:fodor-1974
- page 12, doc `doc-128ad16c-7112-4b`
- **STORED:** ÿ P*x,P2x ÿ P*x, etc., and the argument from a premise of the form (P => P) and (Q => S) to a con¬ clusion of the form (
- **DOC:** The problem all along has been that there is an open empirical possibility that what corresponds to the natural kind predicates of a reduced science may be a heterogeneous and unsystematic disjunction of predicates in the reducing science, and we do not want the unity of science to be prejudiced by this possibility. Suppose, then, that we allow that bridge statements may be of the form where P_1 \vee P_2 \vee ... \vee P_n is not a natural kind predicate in the reducing science. I take it that this is tantamount to allowing that at least some 'bridge laws' may, in fact, not turn out to be laws,
- **DECISION:** 


#### Source: sandbox:frede-1992 (8)

### cl-claim-frede-1992-010  ·  sim 0.897  ·  sandbox:frede-1992
- page 1, doc `doc-6adbb9a6-9a6b-4d`
- **STORED:** s confusing, at least at first sight. On the one hand, phantasia is regarded as a necessary condition of thought (‘there is no supposition without it’, 427bi5); on the other hand its definition suggests that phantasiai are mere afte
- **DOC:** THE COGNITIVE ROLE OF PHANTASIA IN ARISTOTLE DOROTHEA FREDE I. Problems with a Unified Concept of Phantasia THE difficulties with the concept of phantasia start with the translation. One problem is that phantasia does triple duty. It designates the capacity, the activity or process, and the product or result. It is, of course, not alone in having so many chores. 'Sight', for example, in English has as many functions: it signifies the capacity to see, the seeing, and what is seen. This multiplicity need not by itself create any confusions. We usually know quite well whether we mean the capacity
- **DECISION:** 

### cl-claim-frede-1992-077  ·  sim 0.885  ·  sandbox:frede-1992
- page 5, doc `doc-6adbb9a6-9a6b-4d`
- **STORED:** nous is nothing but those objects, since it has no nature of its own but is like a clean slate (429ÿ21-3; 430’1).
- **DOC:** But if phantasiai are not per se diagnostic what is their relationship to the intellect? In 3. 3 Aristotle only mentions that without phantasia there could be no suppositions, but shortly afterwards he specifies the different kinds of suppositions as epistēmē kai doxa kai phronēsis kai tanantia toutōn (427b25), in other words any kind of thinking that assumes a state of affairs. Given this broad range of intellectual activities, it is surprising to see that the intellect (nous) itself is defined in 3. 4 quite narrowly and confined to the intelligible forms: the intellect is related to the inte
- **DECISION:** 

### cl-claim-frede-1992-143  ·  sim 0.882  ·  sandbox:frede-1992
- page 9, doc `doc-6adbb9a6-9a6b-4d`
- **STORED:** he defines dreams as phantasmata in sleep (459’19).
- **DOC:** The relationship between phantasia (or aisthēsis in the wider sense) and nous has recently been likened to that between matter and form. As a metaphor this is perhaps not unacceptable since the senses do deliver the material that reason works on. The metaphor has its dangers, however, since it suggests a necessary relationship between them. In opposition, however, to matter in its usual sense, phantasiai can and do exist by themselves; they need not be 'informed' by thought. And, more importantly, phantasiai are sometimes quite recalcitrant and resist 'information'. As Aristotle asserts in Ins
- **DECISION:** 

### cl-claim-frede-1992-079  ·  sim 0.880  ·  sandbox:frede-1992
- page 5, doc `doc-6adbb9a6-9a6b-4d`
- **STORED:** the function of the intellect in the De Anima is not limited to the contemplation of essences, whatever that may mean. It thinks about quite different subject-matters as well (cf. 429’23 ‘what it thinks and assumes’). As we can conclude from Aristotle’s own example, the intellect’s activity includes discursive thinking about concrete sensible items (430’31 ff. ‘e.g. Cleon is pale or was or will be’,
- **DOC:** But if phantasiai are not per se diagnostic what is their relationship to the intellect? In 3. 3 Aristotle only mentions that without phantasia there could be no suppositions, but shortly afterwards he specifies the different kinds of suppositions as epistēmē kai doxa kai phronēsis kai tanantia toutōn (427b25), in other words any kind of thinking that assumes a state of affairs. Given this broad range of intellectual activities, it is surprising to see that the intellect (nous) itself is defined in 3. 4 quite narrowly and confined to the intelligible forms: the intellect is related to the inte
- **DECISION:** 

### cl-claim-frede-1992-078  ·  sim 0.878  ·  sandbox:frede-1992
- page 5, doc `doc-6adbb9a6-9a6b-4d`
- **STORED:** the body and the senses, is not complete. Aristotle later concedes (432’3 ff.) that we only get to know the intelligible forms of all material entities (which means virtually everything except the
- **DOC:** But if phantasiai are not per se diagnostic what is their relationship to the intellect? In 3. 3 Aristotle only mentions that without phantasia there could be no suppositions, but shortly afterwards he specifies the different kinds of suppositions as epistēmē kai doxa kai phronēsis kai tanantia toutōn (427b25), in other words any kind of thinking that assumes a state of affairs. Given this broad range of intellectual activities, it is surprising to see that the intellect (nous) itself is defined in 3. 4 quite narrowly and confined to the intelligible forms: the intellect is related to the inte
- **DECISION:** 

### cl-claim-frede-1992-024  ·  sim 0.871  ·  sandbox:frede-1992
- page 2, doc `doc-6adbb9a6-9a6b-4d`
- **STORED:** fident on this much debated question, my suspicion is that this active use of imagination, the eidolopoiein in 427ÿ20(that is up to us and is neither true nor false) is the sense of phantasia that is r
- **DOC:** &amp;lt;sup&gt;3&lt;/sup&gt; Without wanting to be over-confident on this much debated question, my suspicion is that this active use of imagination, the eidōlopoiein in 427&lt;sup&gt;b&lt;/sup&gt;20 (that is up to us and is neither true nor false) is the sense of phantasia that is ruled out in 428&lt;sup&gt;th&lt;/sup&gt;2 as kata metaphoran, since it never recurs in De Anima and does not suit the cognitive use which Aristotle wants to ascribe to phantasia: i.e. as a capacity according to which we judge and are right or wrong (kath' has krinomen kai alētheuomen ē pseudometha, 428&lt;sup&gt;th
- **DECISION:** 

### cl-claim-frede-1992-125  ·  sim 0.856  ·  sandbox:frede-1992
- page 8, doc `doc-6adbb9a6-9a6b-4d`
- **STORED:** he may not have wanted to give up the link between the best part in us and the only divinity that he recognizes: the pure active mind (cf. 4o8bi8-2g; Metaph. 983’6-7).
- **DOC:** But even apart from the question of a continuous path from what is better known to us to what is better known as such, there are indications that Aristotle himself quite consciously wanted to preserve the separation of the sensible and the intelligible, of aisthēta and noēta, in spite of the mediation by phantasia. This separation would forbid us to assume anything like a unified concept of consciousness based on perception for Aristotle's psychology. The reasons cannot be fully discussed or documented here; a few reminders have to suffice. The definition of memory as well as of dreams assigns
- **DECISION:** 

### cl-claim-frede-1992-117  ·  sim 0.778  ·  sandbox:frede-1992
- page 8, doc `doc-6adbb9a6-9a6b-4d`
- **STORED:** ahn (cf. n. 17 above), to the inn'er sense. The Cognitive Role of Phantasia 293 suggests that this is only to be expected: ‘And when many such things (i.e. perceptions) come about, then a difference (diaphora) comes about, so that some come to have an account from the r
- **DOC:** work without such phantasiai; there must be a 'collection' of sensory impressions that presents the mind with the phenomena that are to be explained and preserved.&lt;sup&gt;42&lt;/sup&gt; The tocus classicus discussing the connection between the sensual and the intellectual in the formation of science, APo. 2. 19, does not make any mention of phantasia, but it is clear that the kind of aisthēsis that leads to memory, experience and, finally, to nous of the first principles really consists in phantasiai. Only retained perceptions (for those animals which have a monē of their perceptions) lead 
- **DECISION:** 


#### Source: sandbox:heidegger-bcap-4-5 (3)

### cl-claim-heidegger-bcap-086  ·  sim 0.875  ·  sandbox:heidegger-bcap-4-5
- page 29, doc `doc-f1ab2b58-344b-45`
- **STORED:** ermination lies before such distinctions. Ζωή is
- **DOC:** What is this \lambda \acute{o}\gamma o \varsigma? It is the fundamental determination of the being of the human being as such. The human being is seen by the Greeks as \zeta \~{o}ov \lambda \acute{o}\gamma o v \~{e}\chi o v, not only philosophically but in concrete living: "a living thing that (as living) has language." This definition should not be thought in biological, psychological, social-scientific, or any such terms. This determination lies before such distinctions. Zw\'{n} is a concept of being; "life" refers to a mode of being, indeed a mode of being-in-a-world. A living thing is not 
- **DECISION:** 

### cl-claim-heidegger-bcap-002  ·  sim 0.844  ·  sandbox:heidegger-bcap-4-5
- page 20, doc `doc-f1ab2b58-344b-45`
- **STORED:** entatio singularis.4 The concept, howev­ er, is also a representatio, a “self-presenting,” but, in this case, a representat
- **DOC:** Aristotle makes a distinction in Metaphysics Book 4, Chapter 2 between διαλεκτική, σοφιστική, and φιλοσοφία. He says: "σοφιστική and διαλεκτική are concerned with the same issues as is φιλοσοφία," but φιλοσοφία distinguishes itself from both of them in its way of approaching these issues, namely, in the way it deals with the same object. It differs from διαλεκτική "in the mode of the possibility" to which it lays claim. "Διαλεκτική makes a mere attempt" to ascertain that which could be meant by the λόγοι, a διαπορεύεσθαι 5. Met. Γ 2, 1004 b 17 sqq. 6. Μετ. Γ 2, 1004 b 22 sq.: περὶ μὲν γὰρ τὸ α
- **DECISION:** 

### cl-claim-heidegger-bcap-093  ·  sim 0.823  ·  sandbox:heidegger-bcap-4-5
- page 29, doc `doc-f1ab2b58-344b-45`
- **STORED:** the human being determined precisely through the λόγος, and in
- **DOC:** What is this \lambda \acute{o}\gamma o \varsigma? It is the fundamental determination of the being of the human being as such. The human being is seen by the Greeks as \zeta \~{o}ov \lambda \acute{o}\gamma o v \~{e}\chi o v, not only philosophically but in concrete living: "a living thing that (as living) has language." This definition should not be thought in biological, psychological, social-scientific, or any such terms. This determination lies before such distinctions. Zw\'{n} is a concept of being; "life" refers to a mode of being, indeed a mode of being-in-a-world. A living thing is not 
- **DECISION:** 


#### Source: sandbox:horgan-1993 (9)

### cl-claim-horgan-1993-082  ·  sim 0.896  ·  sandbox:horgan-1993
- page 7, doc `doc-7729bf51-a904-4f`
- **STORED:** ion commonly called non-cognitiv- 8 This passage from Mackie is sometimes interpreted (e.g., in Brink 1984) as presup- posing ethical "internalism", the view that if there were objective, non-natural, moral properties or facts, then they would have to be intrinsi
- **DOC:** 3. Hare and meta-ethical non-cognitivism Although supervenience is typically regarded nowadays as an inter-level relation between properties or facts, it was not so regarded by the analytic philosopher who first used the term in print, Professor Hare. Hare was one of the principal advocates in this century of the meta-ethical position commonly called non-cognitiv- &amp;lt;sup&gt;8&lt;/sup&gt; This passage from Mackie is sometimes interpreted (e.g., in Brink 1984) as presupposing ethical "internalism", the view that if there were objective, non-natural, moral properties or facts, then they woul
- **DECISION:** 

### cl-claim-horgan-1993-217  ·  sim 0.895  ·  sandbox:horgan-1993
- page 17, doc `doc-7729bf51-a904-4f`
- **STORED:** f they are) what such efficacy might consist in.19 17 Horgan (1982) is often cited as one source of the idea of global physical superven- ience. But for some reason the notion of regional supervenience, which was also broached in that paper, has gone virtually
- **DOC:** &amp;lt;sup&gt;16&lt;/sup&gt; For instance, we could let G be a triply conjunctive property G^*, constructed as follows. Given some physically possible world w^* in which some individual i^* instantiates property F at time t, let the first conjunct of property G^* be some physical property instantiated by i* in w* at t (and not instantiated, in w* at t, by any individual that is distinct from i* but coincides spatially with i*). Let the second conjunct of G* be the property being at spatio-temporal location L, where L is the specific spatio-temporal location of i^* in w^* at t. And let the thi
- **DECISION:** 

### cl-claim-horgan-1993-198  ·  sim 0.895  ·  sandbox:horgan-1993
- page 15, doc `doc-7729bf51-a904-4f`
- **STORED:** room under discussion. (Compare: When one claims that water could not have failed to be H20, one is talking modally about water under the actual-world meaning of "water", even though "water" may not have that meaning in
- **DOC:** &lt;sup&gt;14&lt;/sup&gt; Simon Blackburn (1971, 1984, 1985) has given an argument against moral realism that goes roughly as follows. A certain supervenience claim, connecting the moral realm to the natural, is true; another stronger claim is false; the moral realist cannot explain why the weaker connection should hold, given that the stronger one does not, whereas the irrealist can easily explain this; so realism accrues an explanatory debt it cannot discharge. Blackburn's argument is sometimes construed as involving weak and strong supervenience, in Kim's sense. But James Dreier (1992) argu
- **DECISION:** 

### cl-claim-horgan-1993-175  ·  sim 0.881  ·  sandbox:horgan-1993
- page 14, doc `doc-7729bf51-a904-4f`
- **STORED:** e to Superdupervenience 569 tions like those of Moore and Hare really express strong supervenience, n
- **DOC:** Supervenience means that there could be no difference of one sort without difference of the other sort .... What we want is modality, but not the sentential modal operator .... [T]he real effect of the "could" seems to be to unrestrict quantifiers which would normally range over this-worldly things. Among all the worlds, or among all the things in all the worlds (or less than all, if there is some restriction), there is no difference of the one sort without differences of the other sort. Whether the things that differ are part of the same world is neither here nor there. (Lewis 1986, pp. 15-17
- **DECISION:** 

### cl-claim-horgan-1993-176  ·  sim 0.881  ·  sandbox:horgan-1993
- page 14, doc `doc-7729bf51-a904-4f`
- **STORED:** weak supervenience.14 The charge that these formulations need replacing by stronger ones is mistaken, because the necessitation relation they express i
- **DOC:** Supervenience means that there could be no difference of one sort without difference of the other sort .... What we want is modality, but not the sentential modal operator .... [T]he real effect of the "could" seems to be to unrestrict quantifiers which would normally range over this-worldly things. Among all the worlds, or among all the things in all the worlds (or less than all, if there is some restriction), there is no difference of the one sort without differences of the other sort. Whether the things that differ are part of the same world is neither here nor there. (Lewis 1986, pp. 15-17
- **DECISION:** 

### cl-claim-horgan-1993-219  ·  sim 0.877  ·  sandbox:horgan-1993
- page 17, doc `doc-7729bf51-a904-4f`
- **STORED:** ve brand of materialism.18 Since Davidson's anomalous monism asserts that every token mental event is identical to a token physical event, his view obvi- ously allows token mental events to
- **DOC:** &amp;lt;sup&gt;16&lt;/sup&gt; For instance, we could let G be a triply conjunctive property G^*, constructed as follows. Given some physically possible world w^* in which some individual i^* instantiates property F at time t, let the first conjunct of property G^* be some physical property instantiated by i* in w* at t (and not instantiated, in w* at t, by any individual that is distinct from i* but coincides spatially with i*). Let the second conjunct of G* be the property being at spatio-temporal location L, where L is the specific spatio-temporal location of i^* in w^* at t. And let the thi
- **DECISION:** 

### cl-claim-horgan-1993-169  ·  sim 0.850  ·  sandbox:horgan-1993
- page 14, doc `doc-7729bf51-a904-4f`
- **STORED:** r from Hare, Moore, and Davidson.13 The upshot is that so- called weak supervenience, despite all the attention it has received in the recent literature, is essen
- **DOC:** Supervenience means that there could be no difference of one sort without difference of the other sort .... What we want is modality, but not the sentential modal operator .... [T]he real effect of the "could" seems to be to unrestrict quantifiers which would normally range over this-worldly things. Among all the worlds, or among all the things in all the worlds (or less than all, if there is some restriction), there is no difference of the one sort without differences of the other sort. Whether the things that differ are part of the same world is neither here nor there. (Lewis 1986, pp. 15-17
- **DECISION:** 

### cl-claim-horgan-1993-098  ·  sim 0.826  ·  sandbox:horgan-1993
- page 6, doc `doc-7729bf51-a904-4f`
- **STORED:** nience to Superdupervenience 561 is consistent with—and indeed, incorporated—the thesis that moral properties and facts are supervenient on natural p
- **DOC:** (L2) All properties and facts could be supervenient on physical properties and facts even if certain supervenience facts are metaphysically sui generis, unexplainable in more fundamental terms. Yet a materialistic metaphysical position should assert that all supervenience facts are explainable—indeed, explainable in some materialistically acceptable way. I take it that any supervenient properties whose supervenience is materialistically explainable would not be causally basic properties in the sense of (L1). On the other hand, a metaphysical position affirming that there are supervenient prope
- **DECISION:** 

### cl-claim-horgan-1993-209  ·  sim 0.791  ·  sandbox:horgan-1993
- page 17, doc `doc-7729bf51-a904-4f`
- **STORED:** pervenience (which says that physically possible worlds 16 For instance, we could let G be a triply conjunctive property G*, constructed as fol- lows. Given some physically possible world w* in which some individual i* instantiates property F at time t, let the first co
- **DOC:** &amp;lt;sup&gt;16&lt;/sup&gt; For instance, we could let G be a triply conjunctive property G^*, constructed as follows. Given some physically possible world w^* in which some individual i^* instantiates property F at time t, let the first conjunct of property G^* be some physical property instantiated by i* in w* at t (and not instantiated, in w* at t, by any individual that is distinct from i* but coincides spatially with i*). Let the second conjunct of G* be the property being at spatio-temporal location L, where L is the specific spatio-temporal location of i^* in w^* at t. And let the thi
- **DECISION:** 


#### Source: sandbox:kim-1988 (10)

### cl-claim-kim-1988-069  ·  sim 0.898  ·  sandbox:kim-1988
- page 5, doc `doc-79eec9c8-a8e7-43`
- **STORED:** ittgenstein said, "Belief in causal nexus is superstition."Is The positivist-inspired suspicion of modalities, coun- terfactuals, and the like, which characterized much of analytic philosophy during the first two-thirds of this century, is of a piece with Hume's cau
- **DOC:** But though this be the only reasonable account we can give of necessity, the contrary notion is so riveted in the mind from the principles above-mentioned, that I doubt not but my sentiments will be treated by many as extravagant and ridiculous. What! the efficacy of causes lie in the determination of mind! As if causes did not operate entirely independent of the mind, and would not continue their operation, even though there was no mind existent to contemplate them, or reason concerning them. Thought may well depend on causes for its operation, but not causes on thought. This is to reverse th
- **DECISION:** 

### cl-claim-kim-1988-036  ·  sim 0.895  ·  sandbox:kim-1988
- page 2, doc `doc-79eec9c8-a8e7-43`
- **STORED:** ausal explanation, there is nothing realist about [PDF-p4] 228 JAEGWON KIM the position that causal explanations hold just in case the causal relation holds. For causal relations, on such an approach, depend on inferential-explanatory conn
- **DOC:** What could such an R be in virtue of which an event is correctly cited in the explanation of another? The obvious first thought is this: R is the causal relation. Perhaps there are noncausal explanations of individual events; however, few will deny that the causal relation is at least one important special case of R. And there are those who hold that the causal relation is the only explanatory relation—at least the principal one.&lt;sup&gt;2&lt;/sup&gt; Explanatory irrealism, on the other hand, would be the view that the relation of being an explanans for, as it relates C and E within our epis
- **DECISION:** 

### cl-claim-kim-1988-037  ·  sim 0.870  ·  sandbox:kim-1988
- page 4, doc `doc-79eec9c8-a8e7-43`
- **STORED:** ary and more basic. More generally, if one wants to analyze causation itself in terms of explana- tion,6 one would be rejecting explanatory realism-unless one could identify an ob- jective relation other than
- **DOC:** More generally, if one wants to analyze causation itself in terms of explanation, one would be rejecting explanatory realism – unless one could identify an objective relation other than causation as the explanatory relation. But what could such a relation be? One might wish to propose the nomological relation as a candidate. The idea is this: that two events, c and e, are "subsumed under," or "instantiate," an appropriate law is the objective correlate of the explanans relation for C and E. Giving an account of "subsumption under a law" without presupposing causal notions is not an easy task, 
- **DECISION:** 

### cl-claim-kim-1988-140  ·  sim 0.851  ·  sandbox:kim-1988
- page 11, doc `doc-79eec9c8-a8e7-43`
- **STORED:** xplanation that conforms to the D-N model is, therefore, au- [PDF-p12] 236 JAEGWON KIM tomatically complete in this sense; and a partial explanation as we have charac- terized it always falls short of b
- **DOC:** Here he seems simply to affirm that, as an explanation of why the rod lengthened, "each of the two arguments conclusively does that." But why does he say this? The use of the term "conclusively" suggests that he was moved by the consideration that each DN argument provides a premise-set that is deductively conclusive for the truth of the explanandum statement. This is not surprising. For, fundamental to the DN conception of explanation is the idea that explanations are inferences or arguments of a certain form. Given this assumption, a natural sense of "completeness" or "sufficiency" emerges f
- **DECISION:** 

### cl-claim-kim-1988-119  ·  sim 0.835  ·  sandbox:kim-1988
- page 10, doc `doc-79eec9c8-a8e7-43`
- **STORED:** ns that they represent. (3) CI and cz are only partial causes, being constituents in a single sufficient set of causal conditions. Example: You push the stalled car and I
- **DOC:** (3) c_1 and c_2 are only partial causes, being constituents in a single sufficient set of causal conditions. Example: You push the stalled car and I pull it, and the car moves. In this case, neither explanation is complete: each gives only a partial picture of the causal conditions that made up a sufficient cause of the effect. This sense of explanatory completeness, understood in terms of sufficient cause, is again entirely natural within the realist picture. For, according to the realist view, the causal relation between events constitutes the objective correlate, or content, of the explanan
- **DECISION:** 

### cl-claim-kim-1988-072  ·  sim 0.833  ·  sandbox:kim-1988
- page 5, doc `doc-79eec9c8-a8e7-43`
- **STORED:** ation" as a physically real relation." I think it is more difficult than one might at first suppose to find philoso- phers who have consciously advocated in an unambigu
- **DOC:** But though this be the only reasonable account we can give of necessity, the contrary notion is so riveted in the mind from the principles above-mentioned, that I doubt not but my sentiments will be treated by many as extravagant and ridiculous. What! the efficacy of causes lie in the determination of mind! As if causes did not operate entirely independent of the mind, and would not continue their operation, even though there was no mind existent to contemplate them, or reason concerning them. Thought may well depend on causes for its operation, but not causes on thought. This is to reverse th
- **DECISION:** 

### cl-claim-kim-1988-009  ·  sim 0.828  ·  sandbox:kim-1988
- page 1, doc `doc-79eec9c8-a8e7-43`
- **STORED:** it 225 [PDF-p2] 226 JAEGWON KIM is not to be taken to imply that an explanation is an argument or inference, with the explanans as premise and th
- **DOC:** Explanatory Realism, Causal Realism, and Explanatory Exclusion [AEGWON KIM] ĭ Explaining is an epistemological activity, and "having" an explanation is, like knowing, an epistemological accomplishment. To be in need of an explanation is to be in an epistemologically imperfect state, and we look for an explanation in an attempt to remove that imperfection and thereby improve our epistemic situation. If we think in terms of the traditional divide between knowledge and reality known, explanations lie on the side of knowledge—on the side of the "subjective" rather than that of the "objective," on 
- **DECISION:** 

### cl-claim-kim-1988-129  ·  sim 0.818  ·  sandbox:kim-1988
- page 8, doc `doc-79eec9c8-a8e7-43`
- **STORED:** PDF-p9] REALISM AND EXPLANATORY EXCLUSION 233 incongruity, as we saw, in combining explanatory irrealism and causal realism, so that an explanatory irrealist may in effect have no real choice but to
- **DOC:** We have also seen that explanatory realism entails the propositional account of explanatory knowledge, whereas explanatory irrealism, again, seems consistent with each of the two alternatives, the propositional view and the nonpropositional, pattern view. I think that the issue of causal realism versus irrealism and that concerning the nature of explanatory knowledge are significant issues, both interesting in themselves and important in what they imply for other philosophical problems. Problems about what explanatory knowledge consists in - that is, what "understanding" something amounts to -
- **DECISION:** 

### cl-claim-kim-1988-173  ·  sim 0.815  ·  sandbox:kim-1988
- page 13, doc `doc-79eec9c8-a8e7-43`
- **STORED:** lear-cut reso- [PDF-p14] 238 JAEGWON KIM l ~ t i o n . ~ ~ I believe it is more difficult, though not impossible, to interpret and argue for explanatory exclusion if by embracing explanatory irre
- **DOC:** The explanatory realist who wants to save explanatory exclusion might deny that the rising temperature and the stress were each a sufficient cause of the event to be explained, and deny, more generally, that genuine instances of causal overdetermination exist. Peter Unger has claimed that each event has a single unique cause (at most),33 and if this is right, then not both the heating and the stress can be a cause of the lengthening. Therefore, there could be at most one causal explanation here. But Unger's thesis is a radical one, too strong to be plausible: he construes it to entail the deni
- **DECISION:** 

### cl-claim-kim-1988-064  ·  sim 0.790  ·  sandbox:kim-1988
- page 5, doc `doc-79eec9c8-a8e7-43`
- **STORED:** necessitation, too, was an essential element in our [PDF-p6] 230 JAEGWON KIM philosophically unenlightened (by his ligh
- **DOC:** But though this be the only reasonable account we can give of necessity, the contrary notion is so riveted in the mind from the principles above-mentioned, that I doubt not but my sentiments will be treated by many as extravagant and ridiculous. What! the efficacy of causes lie in the determination of mind! As if causes did not operate entirely independent of the mind, and would not continue their operation, even though there was no mind existent to contemplate them, or reason concerning them. Thought may well depend on causes for its operation, but not causes on thought. This is to reverse th
- **DECISION:** 


#### Source: sandbox:kim-1990 (6)

### cl-claim-kim-1990-041  ·  sim 0.875  ·  sandbox:kim-1990
- page 4, doc `doc-db7c0095-75c6-49`
- **STORED:** e supervenience concept current today.’ The emergence debate, however, has by and large been forgotten, and appears to have had negligible effects on the current debates in metaphysics, philos
- **DOC:** G. H. Lewes, Samuel Alexander, C. Lloyd Morgan, C. D. Broad) and the emergence debate was robust and active in the 1930s and '40s. The doctrine of emergence, in brief, is the claim that when basic physicochemical processes achieve a certain level of complexity of an appropriate kind, genuinely novel characteristics, such as mentality, appear as "emergent" qualities. Lloyd Morgan, a central theoretician of the emergence school, appears to have used "supervenient" as an occasional stylistic variant of "emergent", although the latter remained the official term associated with the philosophical po
- **DECISION:** 

### cl-claim-kim-1990-306  ·  sim 0.871  ·  sandbox:kim-1990
- page 23, doc `doc-db7c0095-75c6-49`
- **STORED:** ience. And we also have Blackburn, a “projectivist” moral antirealist, who professes belief in moral supervenience, not to mention John Post4 who is an objectivist
- **DOC:** VI. Grounds of Supervenience It has been argued that supervenience is a mysterious and unexplained relation, and hence that any philosophical argument couched in the vocabulary of supervenience is a retrogressive and obfuscating maneuver incapable of yielding any illumination for the issue on hand. For 46 &amp;quot;'Strong' and 'Global' Supervenience Revisited". example, Stephen Schiffer takes a dim view of those who appeal to supervenience: How could being told that non-natural moral properties stood in the supervenience relation to physical properties make them any more palatable? On the con
- **DECISION:** 

### cl-claim-kim-1990-234  ·  sim 0.852  ·  sandbox:kim-1990
- page 19, doc `doc-db7c0095-75c6-49`
- **STORED:** ~onnectibility.~~ To begin, weak covariance obviously does not entail strong connect- ibility. Weak covariance lacks an appropriate mod
- **DOC:** To begin, weak covariance obviously does not entail strong connectibility. Weak covariance lacks an appropriate modal force to generate laws; as noted, the correlations entailed by weak covariance between supervenient and subvenient properties have no modal force, being restricted to particular worlds. What then of strong covariance? Here the situation is different; for consider strong covariance II: it says that whenever a supervening &lt;sup&gt;37&lt;/sup&gt; This is the model of derivational reduction developed by Ernest Nagel in The Structure of Science (Harcourt, Brace &amp; World, 1961).
- **DECISION:** 

### cl-claim-kim-1990-153  ·  sim 0.851  ·  sandbox:kim-1990
- page 12, doc `doc-db7c0095-75c6-49`
- **STORED:** ls to be asymmetric: think of a domain of perfect spheres.2s The surface area of each sphere strongly covaries with its volume, and conversely, the volume
- **DOC:** Not so with strong covariance: property-to-property connections between supervenient and subvenient properties carry over to other worlds. That is obvious from both versions of strong covariance. Consider version II: when applied to the psychophysical case, it says that if anything has a mental property M, then there is some physical property P such that the "P \rightarrow M" conditional holds across all possible worlds. This supports in a straightforward way the assertion that the psychological character of a thing is entailed, or necessitated, by its physical nature. The strength of entailme
- **DECISION:** 

### cl-claim-kim-1990-076  ·  sim 0.841  ·  sandbox:kim-1990
- page 6, doc `doc-db7c0095-75c6-49`
- **STORED:** e making of ethical judgments. l5 Hare spoke of ethical and other evaluative predicates as “supervenient predicates”, apparently taking superveni
- **DOC:** It is clear that both Moore and Hare, like Sidgwick, focuses on the characteristic of moral properties or ethical predicates that has to do their necessary covariation with descriptive – nonmoral and nonevaluative – properties or predicates. The attribution of moral properties, or the ascription of ethical predicates, to an object is necessarily constrained, in a specific way, by the nonethical properties attributed to that object. &amp;lt;sup&gt;11&lt;/sup&gt; The Method of Ethics, pp. 208-209. Quoted by Michael DePaul in his "Supervenience and Moral Dependence", Philosophical Studies 51 (198
- **DECISION:** 

### cl-claim-kim-1990-127  ·  sim 0.769  ·  sandbox:kim-1990
- page 11, doc `doc-db7c0095-75c6-49`
- **STORED:** iance 11, of the unit set consisting of p on the set s. Hare and Davidson are not alone in their preference for weak covariance. Simon Blackburn, who has used normative supervenience as a premise in his argument gainst moral realism, opts for
- **DOC:** Hare and Davidson are not alone in their preference for weak covariance. Simon Blackburn, who has used normative supervenience as a premise in his argument gainst moral realism, opts for weak covariance as his favored form of supervenience, at least for the case of moral properties.&lt;sup&gt;24&lt;/sup&gt; On his account, if property F supervenes on a set G of properties, the following holds, in every possible world: if something has F, its total or maximal G-property, G*, is such that anything with G* has F. Blackburn stresses that this last universal conditional, "Everything with G* has F",
- **DECISION:** 


#### Source: sandbox:kim-2006 (1)

### cl-claim-kim-2006-046  ·  sim 0.875  ·  sandbox:kim-2006
- page 3, doc `doc-83c4d429-1c50-4d`
- **STORED:** at are alike in respect of basal conditions, N1, . . . , Nn must be alike in respect of their emergent properties. 2 Emergence a
- **DOC:** Van Gulick defines "radical kind emergence" as follows: "1. (the emergent property is) different in kind from those had by its parts, and 2. (it is) of a kind whose nature and existence is not necessitated by the features of its parts, their mode of combination and the law-like regularities governing the features of its parts" (Van Gulick 2001, p 17, emphasis added). The second condition, which is what distinguishes this kind of emergence from its weaker siblings, asserts that an emergent property of a whole is not determined by the properties and relations characterizing its parts, or, to put
- **DECISION:** 


#### Source: sandbox:mcdonnell-wildman-2019 (6)

### cl-claim-mcdonnell-wildman-2019-171  ·  sim 0.888  ·  sandbox:mcdonnell-wildman-2019
- page 20, doc `doc-27507555-ef53-45`
- **STORED:** ng or clarifying 20 Note that props can ‘stand-in’ for themselves—a particular person might serve as a “prop” for themselves (e.g., Nathan migh
- **DOC:** &amp;lt;sup&gt;20&lt;/sup&gt; Note that props can 'stand-in' for themselves—a particular person might serve as a "prop" for themselves (e.g., Nathan might be a prop for Nathan himself). Additionally, props are not restricted to objects—for example, Nathan's running away from a tree stump can serve as a prop, indicating that, within the relevant game of make-believe, Nathan is running away from a bear. other principles—e.g., 'if we are prescribed to imagine a goblin on the table, then imagine that it is wearing a red hat'. In this way, according to Walton, our engagement with fictions is both i
- **DECISION:** 

### cl-claim-mcdonnell-wildman-2019-181  ·  sim 0.887  ·  sandbox:mcdonnell-wildman-2019
- page 20, doc `doc-27507555-ef53-45`
- **STORED:** be imagined’ (Walton 2013: 9).21 5.2 Stating the view The central claim of virtual walt-fictionalism (VWF) is that virtual reality is a kind of walt-fiction, and our engagement with VR is not dif­ ferent in kind fr
- **DOC:** &amp;lt;sup&gt;20&lt;/sup&gt; Note that props can 'stand-in' for themselves—a particular person might serve as a "prop" for themselves (e.g., Nathan might be a prop for Nathan himself). Additionally, props are not restricted to objects—for example, Nathan's running away from a tree stump can serve as a prop, indicating that, within the relevant game of make-believe, Nathan is running away from a bear. other principles—e.g., 'if we are prescribed to imagine a goblin on the table, then imagine that it is wearing a red hat'. In this way, according to Walton, our engagement with fictions is both i
- **DECISION:** 

### cl-claim-mcdonnell-wildman-2019-011  ·  sim 0.872  ·  sandbox:mcdonnell-wildman-2019
- page 1, doc `doc-27507555-ef53-45`
- **STORED:** something like) illusions. Finally, one area of rising interest concerns the (virtual) theft of virtual ob­ jects.3 On its face, these require adopting virtual realism; after all, you can’
- **DOC:** Virtual Reality: Digital or Fictional? Neil McDonnell University of Glasgow Nathan Wildman Tilburg University DOI: 10.2478/disp-2019-0004 Abstract Are the objects and events that take place in Virtual Reality genuinely real? Those who answer this question in the affirmative are realists, and those who answer in the negative are irrealists. In this paper we argue against the realist position, as given by Chalmers (2017), and present our own preferred irrealist account of the virtual. We start by disambiguating two potential versions of the realist position—weak and strong—and then go on to argu
- **DECISION:** 

### cl-claim-mcdonnell-wildman-2019-191  ·  sim 0.854  ·  sandbox:mcdonnell-wildman-2019
- page 20, doc `doc-27507555-ef53-45`
- **STORED:** uthorized manner.22 Similarly, the reality of said props does not entail the reality of dis­ tinct virtual objects that depend upon
- **DOC:** &amp;lt;sup&gt;20&lt;/sup&gt; Note that props can 'stand-in' for themselves—a particular person might serve as a "prop" for themselves (e.g., Nathan might be a prop for Nathan himself). Additionally, props are not restricted to objects—for example, Nathan's running away from a tree stump can serve as a prop, indicating that, within the relevant game of make-believe, Nathan is running away from a bear. other principles—e.g., 'if we are prescribed to imagine a goblin on the table, then imagine that it is wearing a red hat'. In this way, according to Walton, our engagement with fictions is both i
- **DECISION:** 

### cl-claim-mcdonnell-wildman-2019-216  ·  sim 0.833  ·  sandbox:mcdonnell-wildman-2019
- page 24, doc `doc-27507555-ef53-45`
- **STORED:** her instance of a familiar occurrence. VWF also avoids the various problems we raised against WVD. By denying that virtual events really occur (instead, they fictionally occur), the VWFist avoids postulating any sort of genuine causal re­ l
- **DOC:** VWF also avoids the various problems we raised against WVD. By denying that virtual events really occur (instead, they fictionally occur), the VWFist avoids postulating any sort of genuine causal relation between the virtual objects/events. Consequently, they need not worry about distinguishing genuine from pseudo-causation, nor about overdetermination. Finally, it is worth discussing what VWF has to say about the phenomenology of virtuality. Naïve VR users, on this view, are engaged in an imaginative activity—they are playing a (rich, prop-driven) game of make-believe. Of course, because they
- **DECISION:** 

### cl-claim-mcdonnell-wildman-2019-097  ·  sim 0.800  ·  sandbox:mcdonnell-wildman-2019
- page 13, doc `doc-27507555-ef53-45`
- **STORED:** ts of WVD. The argument appears to be valid15 and so th
- **DOC:** execution of bits of code that decide which frames to render, not between the rendered frames themselves. VR and traditional animation are on a par in this respect. More importantly, one characteristic feature of VR is interactivity—users can fire a gun, kill a zombie, and thereby feel relieved through VR. This kind of causal interaction is not possible with traditional animation which is drawn in advance, and represented in a pre-determined way. The causal chain between the user, a virtual gun, a virtual zombie, and the user again would seem to entail that the virtual causal steps were indeed
- **DECISION:** 


#### Source: sandbox:metzinger-2018 (2)

### cl-claim-metzinger-2018-186  ·  sim 0.853  ·  sandbox:metzinger-2018
- page 13, doc `doc-1fd8af61-1a40-43`
- **STORED:** Metzinger Why Is Virtual Reality Interesting for Philosophers? of such intelligent virtual agents using personoid avatars as their interface or “outward appearance” would instantiate a new property—“virtual intersubjectivity”—by drawing on and mimicking algorithms and neural mechanisms which ﬁrst appeared
- **DOC:** For empirical researchers in the field of social cognition, this will be of great interest, because it allows for highly innovative and precisely controllable forms of experimental design. The maximal model would be one in which the user's other-mind illusion can be created by every virtual entity she encounters during her VR experience. For philosophers, the impact will extend beyond obviously relevant classical topics like the otherminds problem, social ontology, or political philosophy. The combination of social VR and AI will also touch many issues in applied ethics, including: What is the
- **DECISION:** 

### cl-claim-metzinger-2018-170  ·  sim 0.851  ·  sandbox:metzinger-2018
- page 12, doc `doc-1fd8af61-1a40-43`
- **STORED:** tual Reality Interesting for Philosophers? The interactive experiences of virtual worlds, together with their characteristic combinatorial and procedural processes, can in fact be seen as both • facilitating and encouraging indi
- **DOC:** 3Consider the following thought experiment adapted from Metzinger (2013a). Imagine you are lying in a scanner, controlling a robot at a distance, seeing through its eyes and even feeling motor feedback when its arms and legs move. Experientially, you completely identify with the robot, while at the same time you are moving freely in a situation in which also other human beings are present. Suddenly the new husband of your ex-wife enters the room. He is the person who, a few months ago, destroyed all your plans and your entire personal life. You again feel the mortification, deep hurt, sense of
- **DECISION:** 


#### Source: sandbox:ney-2019 (4)

### cl-claim-ney-2019-129  ·  sim 0.876  ·  sandbox:ney-2019
- page 10, doc `doc-1c954339-7698-46`
- **STORED:** l Functionalism features of virtual reality video games in which there are fictions em­ be
- **DOC:** body underneath the bulky red shirt or to use a skinny digital object to realize your avatar? Again, there are facts about what is true in the virtual reality that trump any structural features of the objects in it. It is easy enough as well to extend this case to one in which there are facts about the colors of virtual objects determined by bits of dialogue that again trump facts about what normal perceivers will experience in viewing settings that are normal for the virtual reality, or indeed (were one to be skeptical about phenomenal functionalism about colors) that trump facts about the in
- **DECISION:** 

### cl-claim-ney-2019-058  ·  sim 0.875  ·  sandbox:ney-2019
- page 5, doc `doc-1c954339-7698-46`
- **STORED:** color and spa­ tial properties.2 This is the phenomenon of metamerism, that ob­ jects with quite diverse surface structures and spectral reflectance profiles may all cause the same kind of color experie
- **DOC:** shirt; maybe the former looks red only in the way virtual objects do. And it is fine if the same is so for the roundness of my virtual belly. But these virtual objects do appear to at least have shapes and sizes, where this isn't a matter of mere polysemy. And so whether virtual realism is true and experiences in virtual reality are generally non-illusory depends on there being a sense in which virtual colors and shapes and non-virtual colors and shapes are in a sense the same or similar kinds of features. But is this so? 3 A challenge for phenomenal spatial functionalism I will start by notin
- **DECISION:** 

### cl-claim-ney-2019-032  ·  sim 0.862  ·  sandbox:ney-2019
- page 3, doc `doc-1c954339-7698-46`
- **STORED:** ences at all. Chalmers’s response to this puzzle is to concede that my avatar’s [PDF-p4] Alyssa Ney 4 shirt is not red in the way non-virtual objects like ripe
- **DOC:** 2 Phenomenal functionalism and the case for virtual realism. As Chalmers notes, an orthodox view about color properties is that red things are what cause red experiences in normal perceivers in normal circumstances. In this and other work (e.g. Chalmers 2012), he proposes we extend this view to spatial properties as well, such as shapes, sizes, and lengths. This implies round things are what cause round experiences, six feet tall things are what cause six feet tall experiences, and so on. This immediately leads to a puzzle for his virtual realism and the view that our experiences of virtual ob
- **DECISION:** 

### cl-claim-ney-2019-078  ·  sim 0.846  ·  sandbox:ney-2019
- page 6, doc `doc-1c954339-7698-46`
- **STORED:** sory. He can use the argument in his paper [PDF-p8] Alyssa Ney 8 to motivate the claim that virtual objects have some of the properties they ap
- **DOC:** These considerations do not apply to space and spatial features. To begin, our best science of space is not a science of what objects and their surfaces may cause in perceivers but of what objective structures there are in reality. Our best science of space is general relativity, a theory standardly interpreted as describing a spacetime manifold characterized by certain objective symmetries. One might try to push on this a little in the following way to motivate phenomenal functionalism. One might note that relativity shows us that objects actually don't have their spatial features absolutely.
- **DECISION:** 


#### Source: sandbox:oconnor-wong-2005 (1)

### cl-claim-oconnor-wong-2005-182  ·  sim 0.806  ·  sandbox:oconnor-wong-2005
- page 15, doc `doc-0bed57a7-842c-42`
- **STORED:** ollows: 672 NOUˆS [PDF-p16] E2 E1 H1 R1 P H2 R2 P The prior causes, H1 and H2, manifest their difference solely at the emer- gent level, and the different emergent features, in the presence of the common state P, accou
- **DOC:** In conversation, we find that many philosophers are skeptical about our contention that theoretical simplicity alone would favor the holistic emergence approach over the microdispositional approach as an interpretation of appropriate dynamical discontinuity. (The implications for theoretical simplicity of differences in the complexity of dispositions, or in the number of dispositions of a given type, is not clear cut.) Here is an alternative route to the same destination.18 Suppose two scenarios in which systems in identical physical states, P, and local environments gives rise to two very dif
- **DECISION:** 


#### Source: sandbox:ogorman-2005 (12)

### cl-claim-ogorman-2005-014  ·  sim 0.898  ·  sandbox:ogorman-2005
- page 17, doc `doc-9f4906fb-7c42-40`
- **STORED:** in Aristotle is often translated "imagination" (and phantasma, "image"), and sometimes "impressions," "outward show," or "appearance." In fact, as I will explain below, it seems to travel each of [PDF-p2] 18 NED O'GORMAN these semantic trajectori
- **DOC:** Quintilian's invocations of phantasia and enargeia can be traced to Aristotle's discussion of rhetorical style in book 3 of the Rhetoric, where Aristotle addresses phantasia and energeia.&lt;sup&gt;4&lt;/sup&gt; The word phantasia in Aristotle is often translated "imagination" (and phantasma, "image"), and sometimes "impressions," "outward show," or "appearance." In fact, as I will explain below, it seems to travel each of these semantic trajectories. It is a critical concept in De Anima, directly implicated in Aristotle's theories of perception, knowledge, and memory. Although the word phanta
- **DECISION:** 

### cl-claim-ogorman-2005-015  ·  sim 0.896  ·  sandbox:ogorman-2005
- page 17, doc `doc-9f4906fb-7c42-40`
- **STORED:** ars only nine times in the Rhetoric, its cognates are used throughout and its importance to Aristotle's conception of rhetorical affect and style is evident upon a close reading of the text. 5 An understanding of phantasia
- **DOC:** Quintilian's invocations of phantasia and enargeia can be traced to Aristotle's discussion of rhetorical style in book 3 of the Rhetoric, where Aristotle addresses phantasia and energeia.&lt;sup&gt;4&lt;/sup&gt; The word phantasia in Aristotle is often translated "imagination" (and phantasma, "image"), and sometimes "impressions," "outward show," or "appearance." In fact, as I will explain below, it seems to travel each of these semantic trajectories. It is a critical concept in De Anima, directly implicated in Aristotle's theories of perception, knowledge, and memory. Although the word phanta
- **DECISION:** 

### cl-claim-ogorman-2005-013  ·  sim 0.876  ·  sandbox:ogorman-2005
- page 17, doc `doc-9f4906fb-7c42-40`
- **STORED:** asia and enargeia can be traced to Aristotle's discussion of rhetorical style in book 3 of the Rhetoric, where Aristotle addresses phantasia and energeia.4 The word phantasia in Aristotl
- **DOC:** Quintilian's invocations of phantasia and enargeia can be traced to Aristotle's discussion of rhetorical style in book 3 of the Rhetoric, where Aristotle addresses phantasia and energeia.&lt;sup&gt;4&lt;/sup&gt; The word phantasia in Aristotle is often translated "imagination" (and phantasma, "image"), and sometimes "impressions," "outward show," or "appearance." In fact, as I will explain below, it seems to travel each of these semantic trajectories. It is a critical concept in De Anima, directly implicated in Aristotle's theories of perception, knowledge, and memory. Although the word phanta
- **DECISION:** 

### cl-claim-ogorman-2005-096  ·  sim 0.874  ·  sandbox:ogorman-2005
- page 0, doc `doc-9f4906fb-7c42-40`
- **STORED:** PDF-p7] 28 NED O'GC~i\,i:AN The means by which amplification "dresses up" a subject is through com- parison or contrast: analogy (1363b), arguments for relative superiority (13
- **DOC:** Epideictic as visual and primal That phantasia is shared with brute beasts, whereas mind (nous) is not, suggests an order in the human psychê, where phantasia is "lower" and mind "higher." However, phantasia is integral and essential to the operations of the mind. Although phantasia may be "lower" or "primal," it is nevertheless the basis for the full range of functions of the psychê, not the least deliberation (bouleutikê). In this section, I show how the notion of phantasia as "primal" suggests a corresponding rhetorical order, where epideictic rhetoric, the most overtly lexical of rhetoric 
- **DECISION:** 

### cl-claim-ogorman-2005-144  ·  sim 0.870  ·  sandbox:ogorman-2005
- page 33, doc `doc-9f4906fb-7c42-40`
- **STORED:** pe~~d shaJ:)ing their sense 0~1s- course displays an epideictic function when 1t offers. v1s10ns t~at are rhetorically "foundational"-that is, these visions underhe both belief and desire, and the remainder of
- **DOC:** Conclusion Epideictic-like discourses have significant power. Walker argues that epideictic has generic priority. "Epideictic" appears as that which shapes and cultivates the basic codes of value and belief by which a society or culture lives; it shapes the ideologies and imageries with which, and by which, the individual members of a community identify themselves; and, perhaps most significantly, it shapes the fundamental grounds, the "deep" commitments and presuppositions, that will underlie and ultimately determine decision and debates in particular pragmatic forums. (2000, 9) 21 When infle
- **DECISION:** 

### cl-claim-ogorman-2005-092  ·  sim 0.825  ·  sandbox:ogorman-2005
- page 25, doc `doc-9f4906fb-7c42-40`
- **STORED:** might miti- r ; i p f. ; ! I. ARISTOTLE'S PHANTASIA 27 gate the historical and generic trouble that Aristotle's account presents if we note the fluidity of his conception of epideictic and understand his ac- count as describing a .particular function of di
- **DOC:** Rhetoric is for Aristotle an art that may shape opinion and direct the affections through the creation of images. For example, he writes, "Let fear [phobos] be [defined as] a sort of pain or agitation derived from the imagination [phantasias] of a future destructive or painful or evil" (Rhetoric 1382a). Similarly, "shame is imagination [phantasia] about a loss of reputation" (1384a) and "honor and reputation are among the pleasantest things, through each person's imagining [phantasian] that he has the qualities of an important person" (1371a). Here, emotional appeals depend on the ability of t
- **DECISION:** 

### cl-claim-ogorman-2005-115  ·  sim 0.821  ·  sandbox:ogorman-2005
- page 30, doc `doc-9f4906fb-7c42-40`
- **STORED:** en- 1,tally sees the subject take shape. Epideictic's phantasmatic quality "demotes" the rhetorical species ~ to the everyday world of appearances (rather than elevating it to the wit- nessing of Being) and to a life among the founda
- **DOC:** Epideictic's phantasmatic quality "demotes" the rhetorical species to the everyday world of appearances (rather than elevating it to the witnessing of Being) and to a life among the foundational, basic, and "base" spheres of psychê. As a phantasmatic phenomenon, epideictic operates at the "primal" levels of desire and/or emotion. Desire and emotion underlie the assent, commitment, and judgment based on deliberation, but they do not constitute such convictions. 17 As De Anima asserts, the capacity for imaging is among the most primal of animal capacities, and the most universal. It underlies al
- **DECISION:** 

### cl-claim-ogorman-2005-137  ·  sim 0.821  ·  sandbox:ogorman-2005
- page 32, doc `doc-9f4906fb-7c42-40`
- **STORED:** daries of Aristotle's epideictic are perforated; epideictic stands in various relationships to other ' r _, ! ARISTOTLE'S PHANTASIA 33
- **DOC:** And inasmuch as the great-souled man (megalopsychon) deserves most, he must be the best of men. . . . Therefore the truly great-souled man must be a good man. Indeed greatness in each of the virtues would seem to go with greatness of soul. For instance, one cannot imagine the great-souled man running at full speed when retreating in battle, or acting dishonestly; since what motive for base conduct has a man to whom nothing is great? Considering all the virtues in turn, we shall feel it quite ridiculous to picture [phainoit'] the great-souled man as other than a good man. (1123b) If phantasia, 
- **DECISION:** 

### cl-claim-ogorman-2005-052  ·  sim 0.817  ·  sandbox:ogorman-2005
- page 20, doc `doc-9f4906fb-7c42-40`
- **STORED:** nce. ( 431 b) In~~ Aristotle describes this sort of ~hantasrnatic mental activity as l~<:1:!_[.f!..utik~~ designating deliberation as entailing the combination of mental
- **DOC:** De Anima itself approaches an analytic definition of phantasia as capacity, process, and product. Aristotle writes, "If imagination [phantasia] is... the process by which we say that an image [phantasma] is presented to us, it is one of those faculties [dunamis] or states of the mind [hexis] by which we judge and are either right or wrong" (428a). In describing phantasia as a power by which we judge, Aristotle gives it an epistemological function. Elsewhere in De Anima, phantasia is described as the basis for thinking. rather than a form of thinking, in that phantasia provides for the mind (no
- **DECISION:** 

### cl-claim-ogorman-2005-074  ·  sim 0.813  ·  sandbox:ogorman-2005
- page 24, doc `doc-9f4906fb-7c42-40`
- **STORED:** motions. In the Rhetoric, lexis is associ- r ! ! ! ! ! r f I I ' ARISTOTLE'S PHANTASIA 25 ated with emotional appeals (1404a). In fact, much of Aristotle's ambiva- lence toward lexis in the beginning of book 3 is due to its power to stir strong emotions in
- **DOC:** Aristotle's discussion of the rhetorical phenomenon of "bringing before the eyes" (tô pro ommatôn poien) in the Rhetoric corresponds with De Memoria's and the Poetics's descriptions of "putting [tithêmi] before the eyes." In De Memoria, "putting before the eyes" is used to describe phantasia in private mental deliberation: "the man who is thinking... puts a finite magnitude before his eyes [tithetai pro ommatôn]" (450a). In the Poetics, Aristotle advises, "In constructing plots and completing the effect by the help of dialogue the poet should, as far as possible, keep the scene before his eyes
- **DECISION:** 

### cl-claim-ogorman-2005-104  ·  sim 0.806  ·  sandbox:ogorman-2005
- page 1, doc `doc-9f4906fb-7c42-40`
- **STORED:** may be. ARISTOTLE'S PHANTASIA 29 Meg ethos is paired with kalos in Aristotle's explanation of amplifi- cation quoted above. The end (telos) of Aristotelian epideictic is to con- v
- **DOC:** Megethos is paired with kalos in Aristotle's explanation of amplification quoted above. The end (telos) of Aristotelian epideictic is to convincingly display kalos or aischros; respectively, these can be rendered "noble/fine/beautiful" and "shameful/disgraceful/ugly." Although these terms denote qualities of character or being and as such might seem inherently abstract and invisible, they have concrete visual connotations. For example, Aristotle couples kalos with virtuous action, "an ability for doing good [dynamis euergetikê]" (Rhetoric 1366b),14 evoking the Homeric notion of kalos, which re
- **DECISION:** 

### cl-claim-ogorman-2005-146  ·  sim 0.799  ·  sandbox:ogorman-2005
- page 33, doc `doc-9f4906fb-7c42-40`
- **STORED:** s, •~_iber~~- sire" (bouleutik€ orexis) (I 113a),22 Phantasia, Aristotle argues in De Anima, is indispensable to desire, in that images of a good or desirable object move even the most brute animals. It is indispensable to deliberative desire es- [PDF-p10] 34 NED O'GORMAN pecially, in that humans must often del;oerate a
- **DOC:** Conclusion Epideictic-like discourses have significant power. Walker argues that epideictic has generic priority. "Epideictic" appears as that which shapes and cultivates the basic codes of value and belief by which a society or culture lives; it shapes the ideologies and imageries with which, and by which, the individual members of a community identify themselves; and, perhaps most significantly, it shapes the fundamental grounds, the "deep" commitments and presuppositions, that will underlie and ultimately determine decision and debates in particular pragmatic forums. (2000, 9) 21 When infle
- **DECISION:** 


#### Source: sandbox:papachristou-2013 (25)

### cl-claim-papachristou-2013-288  ·  sim 0.894  ·  sandbox:papachristou-2013
- page 24, doc `doc-8e65df48-30a7-42`
- **STORED:** ve or Deliberative Phantasia ⇓ Phantasmata (Mental Images/Mental Representations of Taste, Touch, Smell, Sight and Hearing either pictorial or quasi – pictorial or propositional content) = these anim
- **DOC:** (a) propositional content animals use in order to pursue whichever is superior [see Aristotle, De Anima, II-III, text, translation and notes by Andreas Papatheodorou (in Greek) (Athens: «Papyrus» Publications, no date), p. 92]. &amp;lt;sup&gt;90&lt;/sup&gt; Ibid., III, 11, 434 a 5-12: « Sensitive phantasia, then, as it has been said, exists also in the other animals, but deliberative phantasia in those that are calculative; for the decision whether it will do this or that, is already a work of calculation; and there must be a single standard to measure by; for one pursues what is superior. Hen
- **DECISION:** 

### cl-claim-papachristou-2013-033  ·  sim 0.889  ·  sandbox:papachristou-2013
- page 2, doc `doc-8e65df48-30a7-42`
- **STORED:** ἰ δὲ τρία ἡ ψυχή»1
- **DOC:** I. Parts (Μόρια) or Faculties/Powers (Δυνάμεις) of the Soul In Book II, Chapter 1 of De Anima Aristotle describes the soul as «ἐντελέχεια ἡ πρώτη σώματος φυσικοῦ ὀργανικοῦ» («the first actuality of a natural organic &amp;lt;sup&gt;1&lt;/sup&gt; Aristotle, Aristotle's De Anima in Focus, edited by Michael Durrant (London and New York: Routledge, 1993), p. 3. &amp;lt;sup&gt;2&lt;/sup&gt; Aristotle, De Anima, III, 3, 428 a 1-2. &amp;lt;sup&gt;3&lt;/sup&gt; Ibid., III, 3, 429 a 1-2. body»)&lt;sup&gt;4&lt;/sup&gt;. The soul is organically connected with the body. The soul is the form (μορφή or εἶδος
- **DECISION:** 

### cl-claim-papachristou-2013-289  ·  sim 0.869  ·  sandbox:papachristou-2013
- page 24, doc `doc-8e65df48-30a7-42`
- **STORED:** s have the ability to retain and to combine phantasmata after the sense object is gone ⇑ Nous Table 5 IV. C
- **DOC:** (a) propositional content animals use in order to pursue whichever is superior [see Aristotle, De Anima, II-III, text, translation and notes by Andreas Papatheodorou (in Greek) (Athens: «Papyrus» Publications, no date), p. 92]. &amp;lt;sup&gt;90&lt;/sup&gt; Ibid., III, 11, 434 a 5-12: « Sensitive phantasia, then, as it has been said, exists also in the other animals, but deliberative phantasia in those that are calculative; for the decision whether it will do this or that, is already a work of calculation; and there must be a single standard to measure by; for one pursues what is superior. Hen
- **DECISION:** 

### cl-claim-papachristou-2013-229  ·  sim 0.864  ·  sandbox:papachristou-2013
- page 19, doc `doc-8e65df48-30a7-42`
- **STORED:** ει δ᾽ ὅσα πρὸς τῇ μνήμῃ καὶ ταύτην ἔχει τὴν αἴσθησιν»73. 69
- **DOC:** Irrational Animals \bigcup Senses of Taste, Touch, Smell, Sight and Hearing = they can sense: (a) objects in contact with them, and (b) objects at a non contact-distance with them \prod Sensitive Phantasia \prod Phantasmata (Images/Representations of Taste, Touch, Smell, Sight and Hearing) = these animals have the ability to retain phantasmata after the sense object is gone Table 3 Finally there is a passage in De Anima that has puzzled many ancient commentators and contemporary scholars. Aristotle in Book III, Chapter 3, says that the ant, the bee and the scolex do not have phantasia: «εἶτα α
- **DECISION:** 

### cl-claim-papachristou-2013-054  ·  sim 0.864  ·  sandbox:papachristou-2013
- page 5, doc `doc-8e65df48-30a7-42`
- **STORED:** he ancient Aristotelian commentator, Philoponus, explains «διανοητικόν»17, namely the discursive faculty/power of the soul, as «δυνάμει νοῦς», namely as the «potential mind»: «
- **DOC:** &amp;lt;sup&gt;15&lt;/sup&gt; See Aristotle, De Anima, II, 3, 414 a 32-414 b 1: «ὑπάρχει δὲ τοῖς μὲν φυτοῖς τὸ θρεπτικὸν μόνον, ἑτέροις δὲ τοῦτὸ τε καὶ τὸ αἰσθητικόν», «plants have only the nutritive part, while other [living beings] have this and in addition the sensitive part». Ibid., II, 3, 415 a 1-3: «ἄνευ μὲν γὰρ τοῦ θρεπτικοῦ τὸ αἰσθητικὸν οὐκ ἔστιν τοῦ δ΄ αἰσθητικοῦ χωρίζεται τὸ θρεπτικὸν ἐν τοῖς φυτοῖς», «the sensitive part does not exist without the nutritive; but in plants the nutritive part exists without the sensitive». Ibid., II, 5, 417 a 6-7: «δῆλον οὖν ὅτι τὸ αἰσθητικὸν οὐκ ἔστι
- **DECISION:** 

### cl-claim-papachristou-2013-257  ·  sim 0.863  ·  sandbox:papachristou-2013
- page 21, doc `doc-8e65df48-30a7-42`
- **STORED:** William Forbes stresses that the word σκώληξ in the Aristotelian texts «is not a ‘grub’ in general as usually translated, and never a ‘worm’ (vermis or vermiculus)», but it corresponds in a way with the «earthworm» and «the maggot-like larvae of the wasps»
- **DOC:** Furthermore, as David Ross points out, Aristotle «says none of these things about grubs [scolexes]»&lt;sup&gt;75&lt;/sup&gt;, except that: (a) «a scolex is that out of which in its entirety an animal is produce whole, by differentiation and growth of the foetus» («σκώληξ δ' ἐστὶν ἐξ οὖ ὅλου ὅλον γίνεται τὸ ζῷον, διαρθρουμένου καὶ αὐξανομένου τοῦ κυήματος»)&lt;sup&gt;76&lt;/sup&gt;, (b) «just as the animal is perfect but the scolex and the egg are imperfect» («ὤσπερ δὲ τὸ μὲν ζῷον τέλειον, ὁ σκώληξ καὶ τὸ δ' ἀὸν ἀτελές»)&lt;sup&gt;77&lt;/sup&gt; etc. So, according to the American entomologist W
- **DECISION:** 

### cl-claim-papachristou-2013-114  ·  sim 0.859  ·  sandbox:papachristou-2013
- page 10, doc `doc-8e65df48-30a7-42`
- **STORED:** arlier version of this topic was presented at the 35th Annual Conference of the Panhellenic Association of Philologist: Aristotle: Leading Teacher and Thinker (Oct
- **DOC:** Table 1 II. Phantasia (Φαντασία) and Phantasma (Φάντασμα) in De Anima III, 3^{31} It is generally agreed that Aristotle analyses the function of phantasia (\phi \alpha \nu \tau \alpha \sigma(\alpha)^{32}) and its relation to phantasmata (\phi \alpha \nu \tau \alpha \sigma(\alpha)^{32}) in his psychological treatises&lt;sup&gt;33&lt;/sup&gt;. Phantasia (\phi \alpha \nu \tau \alpha \sigma(\alpha)^{34}) is the main subject of discussion in De Anima III, 3^{35}. Geschichte des Bewussteinsproblems in der Antike (München: Zetemata, Heft 29, C. H. Beck, 1962), pp. 131-244. &amp;lt;sup&gt;31&lt;/sup&g
- **DECISION:** 

### cl-claim-papachristou-2013-166  ·  sim 0.848  ·  sandbox:papachristou-2013
- page 14, doc `doc-8e65df48-30a7-42`
- **STORED:** άντασμά τι ἡμῖν γίγνεσθαι»)51, and (b) as «mental representation» or «mental image», when «φάντασμα» is described by the philosopher as the substratum upon which the mind works (
- **DOC:** ability to form mental images, or to 'see with the mind's eye'. For example, if someone asks us to describe in detail a lion that is not physically present, we will probably find ourselves 'looking at' or 'visualizing' lions with 'our mind's eye'. Moreover, I would like to note that we should be very careful about how we interpret the product of the faculty of phantasia, \phiάντασμα, in the Aristotelian texts. My suggestion is that the word «\phiάντασμα», which is mentioned twelve times in De Anima^{50}, may conveniently and aptly be translated as: (a) «representation» or «image» in contexts w
- **DECISION:** 

### cl-claim-papachristou-2013-201  ·  sim 0.845  ·  sandbox:papachristou-2013
- page 17, doc `doc-8e65df48-30a7-42`
- **STORED:** βούλησις ὄρεξις·...ἡ γὰρ ἐπιθυμία ὄρεξίς τίς ἐστιν»64. The
- **DOC:** Imperfect Animals (zoophytes, molluscs etc.) \downarrow \downarrow Only the Contact Sense = they can sense only objects in contact with them and in this way they can discriminate which objects are pleasant or unpleasant to them \bigcup Indefinite/Indeterminate Phantasia \bigcup Phantasmata (Representations of Touch or Tactile Representations) = diffuse and indefinite and do not remain in imperfect animals after the sense object is gone Table 2 (b) Sensitive Phantasia (Αἰσθητική Φαντασία) Regarding the next kind or grade of phantasia, we should remark the following: Aristotle says that sensitiv
- **DECISION:** 

### cl-claim-papachristou-2013-230  ·  sim 0.845  ·  sandbox:papachristou-2013
- page 19, doc `doc-8e65df48-30a7-42`
- **STORED:** [PDF-p20] remark and I argue that it is not possible for Aristotle to deny some kind of phantasia to the ants and the bees, since:70 (a) in Historia Animalium I, 1 488 a 7-10 he includes ants and bees among
- **DOC:** Irrational Animals \bigcup Senses of Taste, Touch, Smell, Sight and Hearing = they can sense: (a) objects in contact with them, and (b) objects at a non contact-distance with them \prod Sensitive Phantasia \prod Phantasmata (Images/Representations of Taste, Touch, Smell, Sight and Hearing) = these animals have the ability to retain phantasmata after the sense object is gone Table 3 Finally there is a passage in De Anima that has puzzled many ancient commentators and contemporary scholars. Aristotle in Book III, Chapter 3, says that the ant, the bee and the scolex do not have phantasia: «εἶτα α
- **DECISION:** 

### cl-claim-papachristou-2013-171  ·  sim 0.838  ·  sandbox:papachristou-2013
- page 14, doc `doc-8e65df48-30a7-42`
- **STORED:** διάρθωτον δὲ καὶ συγκεχυμένην»54. Philoponus says that zoophytes (animals that resemble plants)55 have an indefinite kind of phantasia, because the movements of
- **DOC:** ability to form mental images, or to 'see with the mind's eye'. For example, if someone asks us to describe in detail a lion that is not physically present, we will probably find ourselves 'looking at' or 'visualizing' lions with 'our mind's eye'. Moreover, I would like to note that we should be very careful about how we interpret the product of the faculty of phantasia, \phiάντασμα, in the Aristotelian texts. My suggestion is that the word «\phiάντασμα», which is mentioned twelve times in De Anima^{50}, may conveniently and aptly be translated as: (a) «representation» or «image» in contexts w
- **DECISION:** 

### cl-claim-papachristou-2013-209  ·  sim 0.833  ·  sandbox:papachristou-2013
- page 17, doc `doc-8e65df48-30a7-42`
- **STORED:** inas says «the motion of 63 Si
- **DOC:** Imperfect Animals (zoophytes, molluscs etc.) \downarrow \downarrow Only the Contact Sense = they can sense only objects in contact with them and in this way they can discriminate which objects are pleasant or unpleasant to them \bigcup Indefinite/Indeterminate Phantasia \bigcup Phantasmata (Representations of Touch or Tactile Representations) = diffuse and indefinite and do not remain in imperfect animals after the sense object is gone Table 2 (b) Sensitive Phantasia (Αἰσθητική Φαντασία) Regarding the next kind or grade of phantasia, we should remark the following: Aristotle says that sensitiv
- **DECISION:** 

### cl-claim-papachristou-2013-140  ·  sim 0.832  ·  sandbox:papachristou-2013
- page 12, doc `doc-8e65df48-30a7-42`
- **STORED:** the phrase «πρὸ ὀμμάτων γὰρ ἔστι τι ποιήσασθαι»49, which means our ability to voluntarily («ὅταν βουλώμεθα») set before our eyes mental images,
- **DOC:** &amp;lt;sup&gt;43&lt;/sup&gt; Aristotle, De Anima, III, 3, 428 b 11-13: «ἡ δὲ φαντασία κίνησίς τις δοκεῖ εἶναι καὶ οὐκ ἄνευ αἰσθήσεως γίγνεσθαι ἀλλὶ αἰσθανομένοις καὶ ὧν αἴσθησίς ἐστιν». Ibid., III, 3, 429 a 1-2. Phantasia is a type of motion that arises by actual sensation. Sensation is activated by the presence of the external object. &amp;lt;sup&gt;44&lt;/sup&gt; Ioannes Philoponus, Aristotelis de Anima, 15, 492, 12. &amp;lt;sup&gt;45&lt;/sup&gt; The term «ὑπόληψις» has puzzled many Aristotelian scholars. For example Philoponus, as we have already noticed, says that «ὑπόληψις κατ᾽ ἐπιστήμης
- **DECISION:** 

### cl-claim-papachristou-2013-190  ·  sim 0.828  ·  sandbox:papachristou-2013
- page 17, doc `doc-8e65df48-30a7-42`
- **STORED:** Imperfect Animals (zoophytes, molluscs etc.) ⇓ Only the Contact Sense = they can sense only objects in contact with them a
- **DOC:** Imperfect Animals (zoophytes, molluscs etc.) \downarrow \downarrow Only the Contact Sense = they can sense only objects in contact with them and in this way they can discriminate which objects are pleasant or unpleasant to them \bigcup Indefinite/Indeterminate Phantasia \bigcup Phantasmata (Representations of Touch or Tactile Representations) = diffuse and indefinite and do not remain in imperfect animals after the sense object is gone Table 2 (b) Sensitive Phantasia (Αἰσθητική Φαντασία) Regarding the next kind or grade of phantasia, we should remark the following: Aristotle says that sensitiv
- **DECISION:** 

### cl-claim-papachristou-2013-102  ·  sim 0.828  ·  sandbox:papachristou-2013
- page 8, doc `doc-8e65df48-30a7-42`
- **STORED:** ve (Φανταστικόν) 6. (a) Rational (Νοητικόν) or Discursive (Διανοητικόν)30 ⇒ Passive Min
- **DOC:** &amp;lt;sup&gt;27&lt;/sup&gt; See Aristotle, De Insomniis et De Divinatione per Somnun, I, 458 b 29-31: «ἀλλὶ εἴτε δὴ ταὐτὸν εἴθὶ ἔτερον τὸ φανταστικὸν τῆς ψυχῆς καὶ τὸ αἰσθητικόν, οὐδὲν ῆττον οὐ γίνεται ἄνευ τοῦ όρᾶν καὶ αἰσθάνεσθαί τι», «But whether the imaginative faculty of the soul and the sensitive are the same or different, nevertheless the affection does not occur without our seeing or perceiving something». Ibid., I, 459 a 14-22: «ἐπεὶ δὲ περὶ φαντασίας ἐν τοῖς περὶ ψυχῆς εἴρηται, καὶ ἔστι μὲν τὸ αὐτὸ τῷ αἰσθητικῷ τὸ φανταστικόν, τὸ δὶ εἶναι φανταστικῷ καὶ αἰσθητικῷ ἔτερον, ἔστι δὲ φα
- **DECISION:** 

### cl-claim-papachristou-2013-194  ·  sim 0.825  ·  sandbox:papachristou-2013
- page 17, doc `doc-8e65df48-30a7-42`
- **STORED:** ς μὲν οὖν καὶ τὰ ἄλλα ζῷα μετέχει»61. «ἡ
- **DOC:** Imperfect Animals (zoophytes, molluscs etc.) \downarrow \downarrow Only the Contact Sense = they can sense only objects in contact with them and in this way they can discriminate which objects are pleasant or unpleasant to them \bigcup Indefinite/Indeterminate Phantasia \bigcup Phantasmata (Representations of Touch or Tactile Representations) = diffuse and indefinite and do not remain in imperfect animals after the sense object is gone Table 2 (b) Sensitive Phantasia (Αἰσθητική Φαντασία) Regarding the next kind or grade of phantasia, we should remark the following: Aristotle says that sensitiv
- **DECISION:** 

### cl-claim-papachristou-2013-097  ·  sim 0.811  ·  sandbox:papachristou-2013
- page 8, doc `doc-8e65df48-30a7-42`
- **STORED:** the parts (μόρια) or faculties (δυνάμεις) of the soul—«with an order of succession within…living beings…going from the most widely shared to the less widely shared capacities»
- **DOC:** &amp;lt;sup&gt;27&lt;/sup&gt; See Aristotle, De Insomniis et De Divinatione per Somnun, I, 458 b 29-31: «ἀλλὶ εἴτε δὴ ταὐτὸν εἴθὶ ἔτερον τὸ φανταστικὸν τῆς ψυχῆς καὶ τὸ αἰσθητικόν, οὐδὲν ῆττον οὐ γίνεται ἄνευ τοῦ όρᾶν καὶ αἰσθάνεσθαί τι», «But whether the imaginative faculty of the soul and the sensitive are the same or different, nevertheless the affection does not occur without our seeing or perceiving something». Ibid., I, 459 a 14-22: «ἐπεὶ δὲ περὶ φαντασίας ἐν τοῖς περὶ ψυχῆς εἴρηται, καὶ ἔστι μὲν τὸ αὐτὸ τῷ αἰσθητικῷ τὸ φανταστικόν, τὸ δὶ εἶναι φανταστικῷ καὶ αἰσθητικῷ ἔτερον, ἔστι δὲ φα
- **DECISION:** 

### cl-claim-papachristou-2013-075  ·  sim 0.811  ·  sandbox:papachristou-2013
- page 7, doc `doc-8e65df48-30a7-42`
- **STORED:** i1p19-48 25 [PDF-p8] «εἰ δὲ τὸ αἰσθητικόν, καὶ τὸ ὀρεκτικὸν· ὄρεξις μὲν γὰρ ἐπιθυμία καὶ θ
- **DOC:** In lines 414 a 31-32 Aristotle adds another faculty of the soul, the appetitive (ὀοεκτικόν): «δυνάμεις δ' εἴπομεν θοεπτικόν, ὀρεκτικόν²³, αἰσθητικόν, κινητικὸν κατὰ τόπον, διανοητικόν»²⁴. And in lines 414 b 1-2 he says that: division is related to the duality of a single mind, and I put forward the view that this distinction could find its parallel in the distinction between the physical brain (the physical and biological matter contained within the skull) and the energetic function of thought [Charalambos S. Ierodiakonou, Psychological Issues in the Writings of Aristotle (in Greek) (Thessalon
- **DECISION:** 

### cl-claim-papachristou-2013-309  ·  sim 0.801  ·  sandbox:papachristou-2013
- page 26, doc `doc-8e65df48-30a7-42`
- **STORED:** otelians»95. Indeed, Aristotle’s treatment of phantasia in De Anima exerted an important influence on Hellenistic philosophy96 and Western thought
- **DOC:** IV. Conclusion On the basis of the analysis undertaken above it appears that Aristotle's treatment of phantasial imagination is a complicated subject. Phantasia is a faculty of the soul, the imaginative (φανταστικόν), that is placed between sensation (αἴσθησις) and thought (διάνοια). On the one hand it depends on sensation, is a kind of affection (πάθος), and on the other is a necessary condition for memory, motion, desire, dreaming, thinking etc. In other words it is connected with a wide variety of psychological phenomena. Furthermore, it has been noted that phantasmata, are the products of 
- **DECISION:** 

### cl-claim-papachristou-2013-196  ·  sim 0.801  ·  sandbox:papachristou-2013
- page 17, doc `doc-8e65df48-30a7-42`
- **STORED:** ch kind of phantasia is shared by all animals, even the ‘imperfect’ ones, then, what will be the difference between the indefinite (ἀόριστος) and sensitive (αἰσθητική) kind of phantasia? We s
- **DOC:** Imperfect Animals (zoophytes, molluscs etc.) \downarrow \downarrow Only the Contact Sense = they can sense only objects in contact with them and in this way they can discriminate which objects are pleasant or unpleasant to them \bigcup Indefinite/Indeterminate Phantasia \bigcup Phantasmata (Representations of Touch or Tactile Representations) = diffuse and indefinite and do not remain in imperfect animals after the sense object is gone Table 2 (b) Sensitive Phantasia (Αἰσθητική Φαντασία) Regarding the next kind or grade of phantasia, we should remark the following: Aristotle says that sensitiv
- **DECISION:** 

### cl-claim-papachristou-2013-293  ·  sim 0.798  ·  sandbox:papachristou-2013
- page 26, doc `doc-8e65df48-30a7-42`
- **STORED:** re the products of the function of phantasia, resulting from sense perception (αἰσθάνεσθαι). Phantasmata
- **DOC:** IV. Conclusion On the basis of the analysis undertaken above it appears that Aristotle's treatment of phantasial imagination is a complicated subject. Phantasia is a faculty of the soul, the imaginative (φανταστικόν), that is placed between sensation (αἴσθησις) and thought (διάνοια). On the one hand it depends on sensation, is a kind of affection (πάθος), and on the other is a necessary condition for memory, motion, desire, dreaming, thinking etc. In other words it is connected with a wide variety of psychological phenomena. Furthermore, it has been noted that phantasmata, are the products of 
- **DECISION:** 

### cl-claim-papachristou-2013-103  ·  sim 0.797  ·  sandbox:papachristou-2013
- page 8, doc `doc-8e65df48-30a7-42`
- **STORED:** ind (Νοῦς) ⇒ the Active Mind (Ποιητικὸς Νοῦς) acts on the Passive Mind Tab
- **DOC:** &amp;lt;sup&gt;27&lt;/sup&gt; See Aristotle, De Insomniis et De Divinatione per Somnun, I, 458 b 29-31: «ἀλλὶ εἴτε δὴ ταὐτὸν εἴθὶ ἔτερον τὸ φανταστικὸν τῆς ψυχῆς καὶ τὸ αἰσθητικόν, οὐδὲν ῆττον οὐ γίνεται ἄνευ τοῦ όρᾶν καὶ αἰσθάνεσθαί τι», «But whether the imaginative faculty of the soul and the sensitive are the same or different, nevertheless the affection does not occur without our seeing or perceiving something». Ibid., I, 459 a 14-22: «ἐπεὶ δὲ περὶ φαντασίας ἐν τοῖς περὶ ψυχῆς εἴρηται, καὶ ἔστι μὲν τὸ αὐτὸ τῷ αἰσθητικῷ τὸ φανταστικόν, τὸ δὶ εἶναι φανταστικῷ καὶ αἰσθητικῷ ἔτερον, ἔστι δὲ φα
- **DECISION:** 

### cl-claim-papachristou-2013-178  ·  sim 0.787  ·  sandbox:papachristou-2013
- page 15, doc `doc-8e65df48-30a7-42`
- **STORED:** nate kind of phantasia. Representations of touch59 (phantasmata) or tactile representations are the products
- **DOC:** &amp;lt;sup&gt;55&lt;/sup&gt; Zoophytes or animal plants, such as corals, sea anemones and sponges, molluscs etc. are the lowest forms of animals. &amp;lt;sup&gt;56&lt;/sup&gt; Philoponus, Aristotelis de Anima, 15, 592, 26-29. Thomas Aquinas explains that imperfect animals (animalia imperfecta) possess an indeterminate phantasia (phantasia indeterminata). This phantasia is indeterminate because the motion of phantasia (motus phantasiae) does not remain in this kind of creatures after the sense object is gone: «Videtur tamen hoc esse contrarium ei quod supra dixerat: quia si pars decisa habet s
- **DECISION:** 

### cl-claim-papachristou-2013-014  ·  sim 0.772  ·  sandbox:papachristou-2013
- page 1, doc `doc-8e65df48-30a7-42`
- **STORED:** we study in depth the notion of phantasia (φαντασία), as it is described in Book III of De Anima, we can realize that Aristotle speaks about three and not two kinds or grades of phantasia. I. P
- **DOC:** Three Kinds or Grades of Phantasia in Aristotle's De Anima* Christina S. Papachristou Phantasia/imagination (φαντασία) in Aristotle is one of the parts (μόρια) or faculties/powers (δυνάμεις) of the soul that cannot exist apart from sensation (αἴσθησις) and thought (διάνοια). The function of phantasia and its connection with phantasmata (φαντάσματα), the products of this faculty, plays a significant role in the psychological treatises of the Aristotelian Corpus. The purpose of this paper is to examine the concept of phantasia in Book III, Chapter 3 of De Anima, and to show that the Stageirite p
- **DECISION:** 

### cl-claim-papachristou-2013-177  ·  sim 0.757  ·  sandbox:papachristou-2013
- page 15, doc `doc-8e65df48-30a7-42`
- **STORED:** mur per intellectum»57. From the above analysis we conclude that imperfect or indefinite creatures, which have no sense except that of touch58, possess an indefinite/indeter
- **DOC:** &amp;lt;sup&gt;55&lt;/sup&gt; Zoophytes or animal plants, such as corals, sea anemones and sponges, molluscs etc. are the lowest forms of animals. &amp;lt;sup&gt;56&lt;/sup&gt; Philoponus, Aristotelis de Anima, 15, 592, 26-29. Thomas Aquinas explains that imperfect animals (animalia imperfecta) possess an indeterminate phantasia (phantasia indeterminata). This phantasia is indeterminate because the motion of phantasia (motus phantasiae) does not remain in this kind of creatures after the sense object is gone: «Videtur tamen hoc esse contrarium ei quod supra dixerat: quia si pars decisa habet s
- **DECISION:** 


#### Source: sandbox:raven-2016 (2)

### cl-claim-raven-2016-146  ·  sim 0.876  ·  sandbox:raven-2016
- page 12, doc `doc-8fc7bedf-7ce3-41`
- **STORED:** AMENTALISM (9) So, MONISM is true. (1), (8) The four premises (1)–(4) on which the argument rely are each contro- versial and in need of justiﬁcation. Schaffer (2010) has already defended each, and I am happy to
- **DOC:** 3.3 Resolving the Puzzle Ultimately, my interest in these scenarios is as a means to the end of exploring fundamentality without foundations. I don't wish to claim that these are the only (or even the best) scenarios for that purpose. They are exotic and it is hard to imagine less exotic scenarios. Perhaps our imaginations are stunted by the unfamiliarity of fundamentality without foundations and will improve with greater familiarity. 14 This example will also show the ineliminability of the parthood relation, unless parthood is ultimately shown to disappear from the facts about it. But let us
- **DECISION:** 

### cl-claim-raven-2016-032  ·  sim 0.771  ·  sandbox:raven-2016
- page 2, doc `doc-8fc7bedf-7ce3-41`
- **STORED:** ight be supposed that some are more fundamental than others. To illus- trate, consider the facts: (E) Electron e– is negatively charged. (F) F
- **DOC:** 1 The Puzzle The puzzle arises from three individually plausible but jointly inconsistent claims. I will first state the puzzle informally before elaborating on the claims generating it (§§1.1–1.3). It is commonly supposed that, however reality turns out to be, there must be a fundamental account of it. A (or even the) central aim of metaphysics is to give this account. Given this aim, we have reason to accept the fundamentalist working hypothesis that: FUNDAMENTALISM Necessarily, something is fundamental. But we also seem able to imagine reality being a foundationless abyss: each entity depen
- **DECISION:** 


#### Source: sandbox:silcox-2019 (5)

### cl-claim-silcox-2019-107  ·  sim 0.894  ·  sandbox:silcox-2019
- page 11, doc `doc-8e45ff81-493d-49`
- **STORED:** ne’s experience of VR.20 This type of incentive at­ tached to choosing the EM strikes me as differing only in degree from the desire of temporary users of VR and fans of video games to have as immersive and absorbing a
- **DOC:** 3 Experience machines and ubiquitous virtuality Near the end of his paper Chalmers discusses Robert Nozick's famous "experience machine" argument, and argues that many of the best reasons for not plugging in to the experience machine (hereafter EM) should not also be taken as reasons against using VR. The chief axi- &amp;lt;sup&gt;15&lt;/sup&gt; Chalmers cleverly remarks that such virtual Xs might still qualify as "toy" ordinary Xs (Chalmers 2017: 14). But it is hard not to read this remark as merely placing them somewhere or other along a continuum between being Xs and being non-Xs. 16 Chalme
- **DECISION:** 

### cl-claim-silcox-2019-045  ·  sim 0.883  ·  sandbox:silcox-2019
- page 4, doc `doc-8e45ff81-493d-49`
- **STORED:** PDF-p5] 5 The Transition into Virtual Reality been said, the decision that one makes when one chooses to play a highly immersive video game seems to me to possess some teleologi­ cal features that make gameplay a useful paradigm to consider when trying to figure out the epistemic, metaphysic
- **DOC:** 2 Games as paradigms of VR Chalmers very sensibly observes that our tendency to think of VR environments as video games can be a source of unwarranted prejudice. As VR technologies continue to develop and are integrated more firmly into the cultural mainstream of first-world societies, we will probably see them being used increasingly as media of communication, social intercourse, and experimental science. That having been said, the decision that one makes when one chooses to play a highly immersive video game seems to me to possess some teleological features that make gameplay a useful paradi
- **DECISION:** 

### cl-claim-silcox-2019-087  ·  sim 0.877  ·  sandbox:silcox-2019
- page 8, doc `doc-8e45ff81-493d-49`
- **STORED:** vival horror games 13 The widespread use of VR in educational contexts (e.g. to train surgeons or cure phobias) occupies an interesting middle ground betw
- **DOC:** A couple in what would ordinarily be the background crosses the street. But there is no background. I am there. My attention is caught, and I want to follow that couple and see what their story is. Instead, the camera relentlessly drags me into a bar on the corner with the young boy...I am uncomfortable at these moments because the three-dimensional photography has put me in a virtual space and as thereby awakened my desire to move through it autonomously, to walk away from the camera and discover the world on my own.&lt;sup&gt;12&lt;/sup&gt; Some well-regarded but eccentric indie video games 
- **DECISION:** 

### cl-claim-silcox-2019-115  ·  sim 0.827  ·  sandbox:silcox-2019
- page 11, doc `doc-8e45ff81-493d-49`
- **STORED:** ith a grain of salt, given how difficult it is (as I have argued elsewhere) 23 to bring before one’s mind what it would actually be l
- **DOC:** 3 Experience machines and ubiquitous virtuality Near the end of his paper Chalmers discusses Robert Nozick's famous "experience machine" argument, and argues that many of the best reasons for not plugging in to the experience machine (hereafter EM) should not also be taken as reasons against using VR. The chief axi- &amp;lt;sup&gt;15&lt;/sup&gt; Chalmers cleverly remarks that such virtual Xs might still qualify as "toy" ordinary Xs (Chalmers 2017: 14). But it is hard not to read this remark as merely placing them somewhere or other along a continuum between being Xs and being non-Xs. 16 Chalme
- **DECISION:** 

### cl-claim-silcox-2019-033  ·  sim 0.797  ·  sandbox:silcox-2019
- page 3, doc `doc-8e45ff81-493d-49`
- **STORED:** 329. [PDF-p4] Mark Silcox 4 the image of the oar underneath the water as refracted requires a sig­ nificantly richer co
- **DOC:** 1 Naïve and sophisticated perceivers A crucial feature of Chalmers' defense of digitalism is the distinction he draws between naïve and sophisticated users of VR. He argues that when one is first beginning to accustom oneself to certain sorts of virtual environments, one might well develop the false belief that one is interacting with non-virtual objects. The attractive flowerpot or the rampaging security guard one sees whilst gazing into an Oculus Rift might well strike one ("viscerally" and pre-cognitively, at least) as being type-identical to the flowerpot on one's kitchen table, or the sec
- **DECISION:** 


#### Source: sandbox:white-1985 (9)

### cl-claim-white-1985-109  ·  sim 0.891  ·  sandbox:white-1985
- page 9, doc `doc-562ea6b9-9bb8-4a`
- **STORED:** on to soul and body.37 His repeated suggestions that nous is what he means by the first of these38 seem to indicate that the entire treatise is directed towards the discussion
- **DOC:** Yet a third way of approaching the latter part of the treatise might be based on Aristotle's division, in his introduction, between powers which are peculiar to the soul and those which are common to soul and body.&lt;sup&gt;37&lt;/sup&gt; His repeated suggestions that nous is what he means by the first of these38 seem to indicate that the entire treatise is directed towards the discussion of the power of thought. This would not be surprising, since the distinctively Aristotelian theme of nous provides the culmination and climax of the De anima, as likewise of the Posterior Analytics, the Meta
- **DECISION:** 

### cl-claim-white-1985-078  ·  sim 0.888  ·  sandbox:white-1985
- page 5, doc `doc-562ea6b9-9bb8-4a`
- **STORED:** he attributes, powers or “parts” of the soul,22 and Aristotle seems to be following the general plan sketched in the introduction according to which first the essence of the soul, and then the properties of which th
- **DOC:** Aristotle says that phantasia is that in virtue of which we say that any phantasma comes to be in us: kath'hên legomen phantasma ti hêmin gignesthai.&lt;sup&gt;17&lt;/sup&gt; This terse, almost tautologous definition contains some interesting features. Note, first of all, that Aristotle is describing phantasia according to what seems to be the ordinary way of speaking: it is that by which we say a phantasma comes to be in us. Note, too, that phantasia is made to account for the genesis of the phantasma. But what is this phantasma within us which is recognized in ordinary discourse? Like its co
- **DECISION:** 

### cl-claim-white-1985-123  ·  sim 0.886  ·  sandbox:white-1985
- page 9, doc `doc-562ea6b9-9bb8-4a`
- **STORED:** elongs only to those who possess logos.40 Thus appealing to an immediate recognition of the absence both of practical wisdom and of logos in many animals who possess sensation, Aristotle is quickly able
- **DOC:** Yet a third way of approaching the latter part of the treatise might be based on Aristotle's division, in his introduction, between powers which are peculiar to the soul and those which are common to soul and body.&lt;sup&gt;37&lt;/sup&gt; His repeated suggestions that nous is what he means by the first of these38 seem to indicate that the entire treatise is directed towards the discussion of the power of thought. This would not be surprising, since the distinctively Aristotelian theme of nous provides the culmination and climax of the De anima, as likewise of the Posterior Analytics, the Meta
- **DECISION:** 

### cl-claim-white-1985-168  ·  sim 0.884  ·  sandbox:white-1985
- page 13, doc `doc-562ea6b9-9bb8-4a`
- **STORED:** s aistheseos tes kat’energeian gigno- menes).55Such a secondary movement necessarily resembles sensation, which in turn is an assimilation to the sensible object; moreover, the movement of phantasia evidently continues in the absence of the sensi¬ ble
- **DOC:** Sensation, according to Aristotle, is the distinctive power of animals, one which may be generally described as a passive "being moved" (kineisthai) or "altered" (alloiousthai) or "acted upon" (paschein). More specifically, it is a process of actualization (energein) in which the passive sense-power is impinged upon by its object, somewhat in the way that fuel is kindled by fire; in an interpretation of the saying that "like is known by like", Aristotle explains this actualization as an assimilation (homoiôtai) in which the sense-power begins as unlike its object, and is transformed into a lik
- **DECISION:** 

### cl-claim-white-1985-010  ·  sim 0.876  ·  sandbox:white-1985
- page 1, doc `doc-562ea6b9-9bb8-4a`
- **STORED:** sis of it for his understanding of man in general. And, despite his warning against an exclusive concern with man in the study of the soul,3it is clear that he shares with Platoa particular interest in
- **DOC:** The Meaning of Phantasia in Aristotle's De Anima, III, 3-8 KEVIN WHITE University of Ottawa Introduction Aristotle's account of phantasia in De anima, III, 3, occurs at a critical juncture of his inquiry into the nature and properties of the soul. Having just completed a long discussion of sensation (II, 5-III, 2), and wishing now to turn to a consideration of the power of thought (nous), which he regards both as distinct from and as analogous to sensation, he suggests that an explanation of phantasia is necessary at this point, since there is no thought without phantasia, just as there is no 
- **DECISION:** 

### cl-claim-white-1985-051  ·  sim 0.870  ·  sandbox:white-1985
- page 4, doc `doc-562ea6b9-9bb8-4a`
- **STORED:** to the “objective” sense just mentioned16— history of German philosophyseems toreverse this progression, beginning with Kant’s distinction between the phenomena and the noumena, and ending with phenomen¬ ology’s exc
- **DOC:** The English word "appearance" connotes an interesting polarity, since an appearance is always both of something and for someone, and itself seems to be engendered in a unique coming-together of something and someone: an appearance of one thing is not like that of another, while, on the other hand, the appearance of something to one person may differ from its appearance to another.&lt;sup&gt;12&lt;/sup&gt; This duality parallels a similar polarity in the word phantasia which is reflected in two basic uses which Aristotle makes of the word, uses described by Bonitz as speciem rei obiectae ... si
- **DECISION:** 

### cl-claim-white-1985-200  ·  sim 0.866  ·  sandbox:white-1985
- page 16, doc `doc-562ea6b9-9bb8-4a`
- **STORED:** things.67 4. Phantasia and Nous It remains to show how Aristotle’s discussion of phantasia subserves the analysis of noein which it introduces. What is the role of the persist¬ ing inner appeara
- **DOC:** 4. Phantasia and Nous 68 429a13-18. It remains to show how Aristotle's discussion of phantasia subserves the analysis of noein which it introduces. What is the role of the persisting inner appearances in the activity of thinking? Taking up the delicate task of explaining the origin of thinking (noein) in De anima, III, 4, Aristotle once again, as he had at the beginning of chapter three, initiates the discussion with a comparison between thinking and sensation. However, having been freed of the danger of confusing thinking with sensing, or with its offspring phantasia, the comparison can now p
- **DECISION:** 

### cl-claim-white-1985-213  ·  sim 0.864  ·  sandbox:white-1985
- page 16, doc `doc-562ea6b9-9bb8-4a`
- **STORED:** inctive and not merely superfluous? Within the context of the De anima, the answer to this question must be in terms of the object of noein.72 If nous and aisthesis are to be di
- **DOC:** 4. Phantasia and Nous 68 429a13-18. It remains to show how Aristotle's discussion of phantasia subserves the analysis of noein which it introduces. What is the role of the persisting inner appearances in the activity of thinking? Taking up the delicate task of explaining the origin of thinking (noein) in De anima, III, 4, Aristotle once again, as he had at the beginning of chapter three, initiates the discussion with a comparison between thinking and sensation. However, having been freed of the danger of confusing thinking with sensing, or with its offspring phantasia, the comparison can now p
- **DECISION:** 

### cl-claim-white-1985-079  ·  sim 0.803  ·  sandbox:white-1985
- page 5, doc `doc-562ea6b9-9bb8-4a`
- **STORED:** cause, areto be treated in turn:23after the definition of the soul’sessence is determined in II, 1-2, the treatise turns to the character
- **DOC:** Aristotle says that phantasia is that in virtue of which we say that any phantasma comes to be in us: kath'hên legomen phantasma ti hêmin gignesthai.&lt;sup&gt;17&lt;/sup&gt; This terse, almost tautologous definition contains some interesting features. Note, first of all, that Aristotle is describing phantasia according to what seems to be the ordinary way of speaking: it is that by which we say a phantasma comes to be in us. Note, too, that phantasia is made to account for the genesis of the phantasma. But what is this phantasma within us which is recognized in ordinary discourse? Like its co
- **DECISION:** 


## Part 2 — Phase-F prose extractions (243)


#### Source: prose:bcap (64)

### phf-bcap-0355  ·  sim 0.897  ·  prose:bcap
- page 156, doc `doc-f1ab2b58-344b-45`
- **STORED:** For logos is, in the domain of beings, what exists, what is there, in like manner within the orbit of beings of production, as within the beings that are there as phuseia on, the arche
- **DOC:** b) The Decisive παιδεία for Investigating the φύσει γινόμενα: The οὖ ἕνεκα as λόγος in the Primary Respect What is the decisive παιδεία for the investigation of φύσις? τοιοῦτον γὰρ δὴ τινα καὶ τὸν ὅλως πεπαιδευμένον οἰόμεθ' εἶναι, καὶ τὸ πεπαιδεῦσθαι τὸ δύνασθαι ποιεῖν τὸ εἰρημένον. &lt;sup&gt;273&lt;/sup&gt; As to the πεπαιδευμένος, we are to distinguish one who is ὅλως πεπαιδευμένος, who "simply" has instinct and is so far in παιδεία that he notices, even without concrete knowledge of the issue, whether the speaker repeats something or whether he stands in relation to the matter; and alongsi
- **DECISION:** 

### phf-bcap-0211  ·  sim 0.894  ·  prose:bcap
- page 139, doc `doc-f1ab2b58-344b-45`
- **STORED:** Hexis is nothing other than a how of pathos, being-out-of-composure, in relation to being-composed-as-to
- **DOC:** β. Άρετή as μεσότης The relation of \xi \xi \zeta and \dot{\alpha} \rho \epsilon \tau \dot{\eta} will be made clearer in order to understand, on that basis, how \xi \xi \zeta itself can be the how of our comportment toward the 210. Rhet. B 4, 1382 a 21. 211. Eth. Nic. B 3, 1105 b 1: οὐ συναριθμεῖται. 212. Eth. Nic. B 3, 1105 b 1 sq. 213. Eth. Nic. B 3, 1105 b 5 sqq.: τὰ μὲν οὖν πράγματα δίκαια σώφρονα λέγεται, ὅταν ἦ τοιαῦτα οἶα ἄν ὁ δίκαιος ἢ ὁ σώφρων πράξειεν δίκαιος δὲ καὶ σώφρων ἐστὶν οὐχ ὁ τοῦτα πράττων, ἀλλὰ καὶ ὁ οὕτως πράττων ὡς οἱ δίκαιοι καὶ σώφρονες πράττουσιν. 214. Eth. Nic. B 3, 1
- **DECISION:** 

### phf-bcap-0324  ·  sim 0.894  ·  prose:bcap
- page 171, doc `doc-f1ab2b58-344b-45`
- **STORED:** then there would be no philosophy beside this science, the phusike
- **DOC:** We will finish and then return to the πάθη. If the πάθη are to be the object of investigation, then it appears that with the πάθη, as disposition of living things, in which corporeality is at the same time a concern, the εἶδος must first be kept in view. Genuine being-there must be set forth, in order, if possible, to study even what is "physiological," the "bodily conditions." Thus in the consideration of the somatic, orientation is given by the εἶδος of human living, characterized as ζωὴ πρακτικὴ μετὰ λόγου. d) The Dual Proof of the Restricted Scope of the φυσικός We have seen how Aristotle 
- **DECISION:** 

### phf-bcap-0249  ·  sim 0.894  ·  prose:bcap
- page 130, doc `doc-f1ab2b58-344b-45`
- **STORED:** already has within itself the relation to hexis
- **DOC:** The first determination: ἔστι δὲ τὰ πάθη δι' ὅσα μεταβάλλοντες διαφέρουσι πρὸς τὰς κρίσεις. ^{179} (1) Μεταβάλλοντες: something along the way with respect to which "a change sets in for us," through which "we change" from one disposition to another. (2) Combined with this change, διαφέρουσι πρὸς τὰς κρίσεις, we "differentiate ourselves" from ourselves before the change in that which is the hearer's task: "to take a position," "to form a view." The formation of a view involves the manner and mode in which we change. (3) οἶς ἕπεται λύπη καὶ ἡδονή: ^{180} not "following," but rather "co-given" in
- **DECISION:** 

### phf-bcap-0337  ·  sim 0.893  ·  prose:bcap
- page 180, doc `doc-f1ab2b58-344b-45`
- **STORED:** Hairesis and phuge are the characteristics that characterize the basic possibility of living as a way of being with itself
- **DOC:** The genuine being of human beings, the highest being-possibility, lies in θεωρεῖν—the possibility of being there in the most radical sense.&lt;sup&gt;340&lt;/sup&gt; Ἡδονή is, put succinctly, nothing other than the determination of the presentness of being-in-the-world, which is there in finding-oneself as such. In connection with this determination of ἡδονή, I will briefly discuss how what is said about θεωρεῖν is to be understood. One must give up the definition of traditional psychology, which apprehends λύπη and ἡδονή as annexed to psychological processes. Ήδονή is always aimed at living a
- **DECISION:** 

### phf-bcap-0264  ·  sim 0.890  ·  prose:bcap
- page 151, doc `doc-f1ab2b58-344b-45`
- **STORED:** all being-angry about..., being-kind to..., fear for..., and so on, in a certain sense also concerns the body
- **DOC:** By way of introduction, Aristotle poses this concrete question: to what extent does vous belong or not belong to the concrete being of human beings? He asks whether there is an ἴδιον πάθος τῆς ψυχῆς; whether νοῦς constitutes the being of living things, such that this determination characterizes the being of living things as proper to such a being; whether νοῦς is as μέρος ψυχῆς χωριστόν.&lt;sup&gt;252&lt;/sup&gt; Aristotle answers this question on the basis of the evidence. The evidence says that a living thing as a being in the world, insofar as it is encountered by the world, is also encount
- **DECISION:** 

### phf-bcap-0111  ·  sim 0.886  ·  prose:bcap
- page 80, doc `doc-f1ab2b58-344b-45`
- **STORED:** This definition is, at the same time, the ontological condition of the possibility of the *categorical imperative*
- **DOC:** With respect to the \kappa\alpha\theta' \alpha\dot{\nu}\tau\dot{o}, that \tau\epsilon\lambda\epsilon\dot{\iota}\dot{o}\tau\epsilon\rho\sigma\nu which \mu\eta\delta\dot{\epsilon}\pi\sigma\tau\epsilon \delta\iota' \alpha\dot{\lambda}\lambda\sigma^{101} and αἰεὶ καθ' αὐτὸ αἰρετόν, 102 is such a δι' αὐτό that "constantly," "always," is what it is. The τέλη καθ αὐτά: ἡδονή, τιμή, ἀρετή, "can in the end and for the most part be appropriated for the sake of εὐδαιμονία": τιμὴν δὲ καὶ ἡδονὴν καὶ [ . . . ] ἀρετὴν αἰρούμεθα μὲν καὶ δι' αὐτά [ . . . ], αἰρούμεθα δὲ καὶ τῆς εὐδαιμονίας χάριν. 103 These τέλ
- **DECISION:** 

### phf-bcap-0196  ·  sim 0.886  ·  prose:bcap
- page 131, doc `doc-f1ab2b58-344b-45`
- **STORED:** holding off another being, hindering it from being as it would like to be according to its genuine horme.
- **DOC:** a) ἔχειν and ἕξις We are beginning with ἕξις and ἔχειν. Aristotle treats them in Chapter 23 of Book 5 of the Metaphysics. He says, by way of introduction, that τὸ ἔχειν λέγεται πολλαχῶς, 182 that is, the expression in question is addressed to various beings, and with various meanings, such that it is not an arbitrary jumble, but rather relates to a basic meaning, which comes into view by showing the individual meanings. We must see where there is a point of agreement among the manifold meanings of ἔχειν, to what extent ἔχειν expresses being. 1. τὸ ἄγειν κατὰ τὴν αύτοῦ φύσιν ἢ κατὰ τὴν αύτοῦ ὁρ
- **DECISION:** 

### phf-bcap-0072  ·  sim 0.885  ·  prose:bcap
- page 43, doc `doc-f1ab2b58-344b-45`
- **STORED:** Conceptuality is no arbitrary matter, but rather an issue of being-there in a decisive sense, insofar as it has resolved radically to speak to the world -- to question and to research
- **DOC:** 57. Met. Δ 17, 1022 a 4 sq.: το ἔσχατον ἐκάστου καὶ οὖ ἔξω μηδὲν ἔστι λαβεῖν πρώτου, καὶ οὖ ἔσω πάντα πρώτου. 58. Met. Δ 17, 1022 a 6: εἶδος [ . . . ]ἔχοντος μέγεθος. 59. Ibid 60. Met. Δ 17, 1022 a 7: ἐφ' ὃ ἡ κίνησις καὶ ἡ πρᾶξις. 61. Met. Δ 17, 1022 a 8. 62. Met. Δ 17, 1022 a 9 sq.: τῆς γνώσεως γὰρ τοῦτο πέρας εἰ δὲ τῆς γνώσεως, καὶ τοῦ πράγματος. 63. Phys. Θ 5, 256 a 29. avoid a regressus ad infinitum has a definite sense and weight for the Greeks, and it is not to be carried over into current investigations, because it exhibits a completely different sense of being-there. In order to use th
- **DECISION:** 

### phf-bcap-0165  ·  sim 0.885  ·  prose:bcap
- page 127, doc `doc-f1ab2b58-344b-45`
- **STORED:** the manner and mode in which we are in such a pathos
- **DOC:** 2. Certainly, the first aspect can belong to the speaker, for he can have the right φρόνησις; the speaker can appear as one who looks around, but nonetheless as one who is not willing to say&lt;sup&gt;169&lt;/sup&gt; what appears to him to be the case, about which he has this or that view. The hearer can notice, in the course of the discourse, that the speaker is well-versed but does not say everything; the speaker screens his own position and view of the matter. He is not properly serious in what he says to his audience, as he knows still more. As soon as the hearer notices this, he withdraws
- **DECISION:** 

### phf-bcap-0157  ·  sim 0.884  ·  prose:bcap
- page 119, doc `doc-f1ab2b58-344b-45`
- **STORED:** Is the definition of the human being a bipedal living thing, the definition of the human being?
- **DOC:** They are distinguished by the τρόπος, the "manner and mode." We will see what that means by an example. Πρότασις: "to put beforehand," "what is given in advance." Πρόβλημα, from προβάλλω, "to project": "projection" insofar as it concerns the raising of an opinion, raising it for a discussion, such that it contrasts with the dominant opinion; such that the uncertainty, the "problematic" character that is found in it, is shown, such that one has not yet reached a resolution with regard to it. In πρότασις is found the character of διαλέγεσθαι, that which is given in advance in the sense that διαλ
- **DECISION:** 

### phf-bcap-0223  ·  sim 0.879  ·  prose:bcap
- page 144, doc `doc-f1ab2b58-344b-45`
- **STORED:** ; they characterize the entire human being in its *disposition in the world* (p. 129). The entire human being is the primary object of the Aristotelian psychology of De Anima, Book 1. The entire human being must be understood with regard to its being as zoe, as being-in-a-world --
- **DOC:** §18. Πάθος. Its General Meanings and Its Role in Human Being-There (Metaphysics Δ21, De Anima A1) a) Έξις as Clue to the Conception of the Being-Structure of πάθος For the understanding of ἕξις itself and the understanding of its γένεσις, we infer that it cannot be understood as completedness in the sense of routine. From there, we already see something more clearly, which now comes into question along with the \pi \dot{\alpha} \theta \eta themselves. The \pi \dot{\alpha} \theta \eta are also characters that, in their way, more proximally determine being-in-the-world, being-in-the-moment. It d
- **DECISION:** 

### phf-bcap-0024  ·  sim 0.878  ·  prose:bcap
- page 19, doc `doc-f1ab2b58-344b-45`
- **STORED:** to bring the *reading* of philosophers...
- **DOC:** We must see the ground out of which these basic concepts have arisen, as well as how they have so arisen. That is, the basic concepts will be considered in their specific conceptuality so that we may ask how the matters themselves meant by these basic concepts are viewed, in what context they are addressed, in which particular mode they are determined. If we approach the matter from this point of view, we will arrive at the realm of what is meant by concept and conceptuality. The basic concepts are to be understood with regard to their conceptuality, specifically, with the purpose of gaining i
- **DECISION:** 

### phf-bcap-0075  ·  sim 0.877  ·  prose:bcap
- page 41, doc `doc-f1ab2b58-344b-45`
- **STORED:** in its history, coming from out of its history into being
- **DOC:** for Aristotle, \epsilon \tilde{t}\delta o \zeta has "species" as its meaning. Why it means "species," and why \gamma \acute{\epsilon} vo \zeta means "genus," is not understood if one does not know that \epsilon \tilde{t}\delta o \zeta is an entirely determinate being-character. Initially, it means the being that is there in its "appearing." As a master-builder builds a house, so he lives and operates initially in the \epsilon \tilde{t}\delta o \zeta of the house, in the way it looks. The τὸ τί ην εἶναι has in itself the determination of the ην: the being-there of a being, and indeed with an ey
- **DECISION:** 

### phf-bcap-0239  ·  sim 0.873  ·  prose:bcap
- page 151, doc `doc-f1ab2b58-344b-45`
- **STORED:** that as kineseis tou somatos they look the way that they do, they are a kind of occurring to a living thing, and so an occurring that also lays claim to corporeality
- **DOC:** By way of introduction, Aristotle poses this concrete question: to what extent does vous belong or not belong to the concrete being of human beings? He asks whether there is an ἴδιον πάθος τῆς ψυχῆς; whether νοῦς constitutes the being of living things, such that this determination characterizes the being of living things as proper to such a being; whether νοῦς is as μέρος ψυχῆς χωριστόν.&lt;sup&gt;252&lt;/sup&gt; Aristotle answers this question on the basis of the evidence. The evidence says that a living thing as a being in the world, insofar as it is encountered by the world, is also encount
- **DECISION:** 

### phf-bcap-0408  ·  sim 0.870  ·  prose:bcap
- page 20, doc `doc-f1ab2b58-344b-45`
- **STORED:** is geared toward the laying out of that which is meant
- **DOC:** Aristotle makes a distinction in Metaphysics Book 4, Chapter 2 between διαλεκτική, σοφιστική, and φιλοσοφία. He says: "σοφιστική and διαλεκτική are concerned with the same issues as is φιλοσοφία," but φιλοσοφία distinguishes itself from both of them in its way of approaching these issues, namely, in the way it deals with the same object. It differs from διαλεκτική "in the mode of the possibility" to which it lays claim. "Διαλεκτική makes a mere attempt" to ascertain that which could be meant by the λόγοι, a διαπορεύεσθαι 5. Met. Γ 2, 1004 b 17 sqq. 6. Μετ. Γ 2, 1004 b 22 sq.: περὶ μὲν γὰρ τὸ α
- **DECISION:** 

### phf-bcap-0234  ·  sim 0.870  ·  prose:bcap
- page 148, doc `doc-f1ab2b58-344b-45`
- **STORED:** to say that the soul gets angry is the same as to say that the soul builds a house. It would be better to say not that the soul has pity or learns or believes, but that the human being does the psyche
- **DOC:** being-there itself—from without, but from without in the sense of the world as the wherein of my being. The possibilities and ways of its being-taken follow from being-there itself. Thus, this being-taken of being-there as being-in-itsworld does not involve anything like what we could designate as the "spiritual," which invites the conception of \pi \acute{\alpha} \theta o \varsigma as affect. Instead, it is always a being-taken of beings as living things as such. Speaking precisely, I cannot say that the soul hopes, has fears, has pity; instead, I can only say that the human being hopes, is b
- **DECISION:** 

### phf-bcap-0287  ·  sim 0.863  ·  prose:bcap
- page 144, doc `doc-f1ab2b58-344b-45`
- **STORED:** The pathe are also characters that, in their way, more proximately determine being-in-the-world, being-in-the-moment. It does not concern 'spiritual states' with 'bodily symptoms'; instead, the pathe characterize the entire human being in its *disposition in the world*.
- **DOC:** §18. Πάθος. Its General Meanings and Its Role in Human Being-There (Metaphysics Δ21, De Anima A1) a) Έξις as Clue to the Conception of the Being-Structure of πάθος For the understanding of ἕξις itself and the understanding of its γένεσις, we infer that it cannot be understood as completedness in the sense of routine. From there, we already see something more clearly, which now comes into question along with the \pi \dot{\alpha} \theta \eta themselves. The \pi \dot{\alpha} \theta \eta are also characters that, in their way, more proximally determine being-in-the-world, being-in-the-moment. It d
- **DECISION:** 

### phf-bcap-0159  ·  sim 0.862  ·  prose:bcap
- page 121, doc `doc-f1ab2b58-344b-45`
- **STORED:** that which can, in general, be a possible *topic* for negotiation
- **DOC:** 142. Top. A 11, 104 b 1 sq. 143. Top. A 11, 104 b 3 sqq. 144. Top. A 11, 104 b 19 sq. 145. Top. A 11, 104 b 21 sq. 146. Top. A 11, 104 b 23 sq. β. Inability-to-Get-Through (ἀπορία) as the Topic of Theoretical Negotiating (Metaphysics B1) On the basis of the characterization of that from where and that about which διαλέγεσθαι speaks, we are to infer what can, in general, be a possible topic for negotiation. It allows its distinction from the discourse of rhetoric to stand out more precisely. Aristotle characterizes discourse, the topic of rhetoric, as \tau \alpha ἥδη βουλεύεσθαι εἰωθότα; 147 th
- **DECISION:** 

### phf-bcap-0131  ·  sim 0.856  ·  prose:bcap
- page 100, doc `doc-f1ab2b58-344b-45`
- **STORED:** that which speaks for a matter that we know our way around, which we have appropriated and have at our disposal
- **DOC:** the ἕντεχνοι: that which speaks for something about which we know our way around, which we have appropriated and have at our disposal. These πίστεις touch upon λόγος insofar as λέγειν is that which is in our power. The correctness of this speaking is determined on the basis of that wherein this speaking itself operates. In relation to λόγος, the πίστεις ἕντεχνοι are to be called forth. Speaking is (1) to anyone, with someone; (2) about something, "exhibitive," δεικνύναι; (3) fulfilled by a speaker. That a person speaks to anyone about something is the phenomenal state of affairs. From this, th
- **DECISION:** 

### phf-bcap-0303  ·  sim 0.853  ·  prose:bcap
- page 159, doc `doc-f1ab2b58-344b-45`
- **STORED:** Telos = peras. These are clues for the basic sense of Greek ontology
- **DOC:** goods"—as they lie at the basis of the fundamental discussions. Meaning of being as being present; being: being-there in the present. In the context of the fundamental discussion, the meaning of being as being-present receives a more precise elucidation, insofar as we manage to show what the there means for the Greeks: having-come-into-the-there, and specifically through pro-duction; pro: there, pro is toward a determinate there; pro-ducing, bringing into the there, into the present. That is the genuine sense of \pi \circ (\eta \sigma) \subset Being-there is, in the genuine sense, being-pro-du
- **DECISION:** 

### phf-bcap-0216  ·  sim 0.851  ·  prose:bcap
- page 144, doc `doc-f1ab2b58-344b-45`
- **STORED:** with regard to the possibility itself that carries it in itself, with regard to the eu, it is akrotes
- **DOC:** §18. Πάθος. Its General Meanings and Its Role in Human Being-There (Metaphysics Δ21, De Anima A1) a) Έξις as Clue to the Conception of the Being-Structure of πάθος For the understanding of ἕξις itself and the understanding of its γένεσις, we infer that it cannot be understood as completedness in the sense of routine. From there, we already see something more clearly, which now comes into question along with the \pi \dot{\alpha} \theta \eta themselves. The \pi \dot{\alpha} \theta \eta are also characters that, in their way, more proximally determine being-in-the-world, being-in-the-moment. It d
- **DECISION:** 

### phf-bcap-0227  ·  sim 0.848  ·  prose:bcap
- page 145, doc `doc-f1ab2b58-344b-45`
- **STORED:** being-constituted, regarding which something underlies alteration.
- **DOC:** Άρετή, which goes toward ἦθος, ἀρετή ἠθική, has a fully specific γένεσις corresponding to its being-character, which Aristotle characterizes, at the beginning of Book 2 of the Nicomachean Ethics, separately from ἀρετή διανοητική, the ability-to-be-composed in the world, as further clarified in relation to looking-around-oneself in the world. Άρετή is related to πρᾶξις, άρετή ήθική is related to ἔθος. Its γένεσις is "habituating-oneself" in the sense of frequent working-through. 235 Insofar as one considers the other ἀρετή, ἀρετή διανοητική, in its γένεσις, perhaps science as possessing a deter
- **DECISION:** 

### phf-bcap-0016  ·  sim 0.845  ·  prose:bcap
- page 19, doc `doc-f1ab2b58-344b-45`
- **STORED:** how they have arisen, as well as *how* they have so arisen
- **DOC:** We must see the ground out of which these basic concepts have arisen, as well as how they have so arisen. That is, the basic concepts will be considered in their specific conceptuality so that we may ask how the matters themselves meant by these basic concepts are viewed, in what context they are addressed, in which particular mode they are determined. If we approach the matter from this point of view, we will arrive at the realm of what is meant by concept and conceptuality. The basic concepts are to be understood with regard to their conceptuality, specifically, with the purpose of gaining i
- **DECISION:** 

### phf-bcap-0025  ·  sim 0.844  ·  prose:bcap
- page 28, doc `doc-f1ab2b58-344b-45`
- **STORED:** With respect to what belongs to what they are
- **DOC:** §5. Return to the Ground of Definition By going back to what definition originally was, we might also learn what it originally was that one today designates as concept. a) The Predicables Genus and species are characteristics that determine every definition. However, they are not the only determining factors. These factors include the further moment of proprium and of differentia specifica as such. These aspects, which guide concept-formation, are called predicables or κατηγορήματα. These κατηγορήματα were systematically treated for the first time by Porphyry in his introduction to Aristotle's
- **DECISION:** 

### phf-bcap-0051  ·  sim 0.843  ·  prose:bcap
- page 43, doc `doc-f1ab2b58-344b-45`
- **STORED:** an issue of being-there in a decisive sense, insofar as it has resolved radically to speak to the world -- to question and to research
- **DOC:** 57. Met. Δ 17, 1022 a 4 sq.: το ἔσχατον ἐκάστου καὶ οὖ ἔξω μηδὲν ἔστι λαβεῖν πρώτου, καὶ οὖ ἔσω πάντα πρώτου. 58. Met. Δ 17, 1022 a 6: εἶδος [ . . . ]ἔχοντος μέγεθος. 59. Ibid 60. Met. Δ 17, 1022 a 7: ἐφ' ὃ ἡ κίνησις καὶ ἡ πρᾶξις. 61. Met. Δ 17, 1022 a 8. 62. Met. Δ 17, 1022 a 9 sq.: τῆς γνώσεως γὰρ τοῦτο πέρας εἰ δὲ τῆς γνώσεως, καὶ τοῦ πράγματος. 63. Phys. Θ 5, 256 a 29. avoid a regressus ad infinitum has a definite sense and weight for the Greeks, and it is not to be carried over into current investigations, because it exhibits a completely different sense of being-there. In order to use th
- **DECISION:** 

### phf-bcap-0353  ·  sim 0.842  ·  prose:bcap
- page 154, doc `doc-f1ab2b58-344b-45`
- **STORED:** show *the extent to which the phusikos must draw the psuche into consideration within certain limits*
- **DOC:** For the being-determination of the \pi \acute{a}\theta \eta, it is important that they be understood in themselves only when they are taken as the \pi \acute{a}\theta \eta of \sigma \~{\omega}\mu \alpha; their \~{\epsilon}i\~{\delta}o\varsigma is primarily determined as determination of living things in relation to being-in in the world. Θυμός and φόβος are suited to an altogether determinately constituted body; they are "not separable." There is nothing like a pure fear in the sense of an abstract comporting-oneself toward something. In itself, it is a comporting of the full human being in it
- **DECISION:** 

### phf-bcap-0276  ·  sim 0.841  ·  prose:bcap
- page 135, doc `doc-f1ab2b58-344b-45`
- **STORED:** being-there as concern is itself the concern of the being-there which is concerned
- **DOC:** The \pi \alpha \theta \eta, in an entirely general way, are characteristic of a disposition of human beings, a how of being-in-the-world. Accordingly, Aristotle provides, 195. W. Dilthey, Weltanschauung und Analyse des Menschen seit Renaissance und Reformation, in Wilhelm Dilthey's Gesammelte Schriften, edited by G. Misch, Volume 2, Leipzig &amp; Berlin 1914. Cf. p. 416 ff. ("Die Function der Anthropologie in der Kultur des 16. und 17. Jahrhunderts"). beforehand, a guide for the analysis that he carries through in Book 2 of the Rhetoric. He considers the affectus in three respects: 1. In relat
- **DECISION:** 

### phf-bcap-0092  ·  sim 0.831  ·  prose:bcap
- page 74, doc `doc-f1ab2b58-344b-45`
- **STORED:** (p. 58). Having a being-possibility at one's disposal means
- **DOC:** 80. Met. Δ 16, 1021 b 15–17. 81. Met. Δ 16, 1021 b 17–20. posal, the determination of τέλος or τέλειον is already implict. The ability to have a being-possibility at one's disposal means that a being that has an ἀρετή already has its end in this ἀρετή in a definite manner. The ἀρετή is a definite way of being, which in itself is directed to the τέλος, an ability to have at one's disposal, an ability which need not explicitly reach its τέλος. 82 5. The further determination is already indicated in this concept of ἀρετή as τελείωσις, insofar as there is a being which has its τέλος in the genuine
- **DECISION:** 

### phf-bcap-0081  ·  sim 0.830  ·  prose:bcap
- page 65, doc `doc-f1ab2b58-344b-45`
- **STORED:** If our expression 'actuality' were not so worn out, it would be an excellent translation
- **DOC:** being, a how of being in an entirely distinctive sense. He means the 'being-atwork' itself. If our expression 'actuality (Wirklichkeit)' were not so worn out, it would be an excellent translation. Ἐνέργεια, a how of being, such a way of being that has the being-character of \pi \rho \tilde{\alpha} \xi \iota \zeta, thus the how of concern], the other τέλη are παρ' αὐτάς, along with the concerns, specifically ἔργα, works." These τέλη are the sort that come about from a concern. Along with the completing of the shoe, the shoe comes about. The \pi\alpha\rho\dot{\alpha} is meant to suggest that the
- **DECISION:** 

### phf-bcap-0304  ·  sim 0.830  ·  prose:bcap
- page 171, doc `doc-f1ab2b58-344b-45`
- **STORED:** appears as a *being-able*, which determines the being of hule, what we designate as soul
- **DOC:** We will finish and then return to the πάθη. If the πάθη are to be the object of investigation, then it appears that with the πάθη, as disposition of living things, in which corporeality is at the same time a concern, the εἶδος must first be kept in view. Genuine being-there must be set forth, in order, if possible, to study even what is "physiological," the "bodily conditions." Thus in the consideration of the somatic, orientation is given by the εἶδος of human living, characterized as ζωὴ πρακτικὴ μετὰ λόγου. d) The Dual Proof of the Restricted Scope of the φυσικός We have seen how Aristotle 
- **DECISION:** 

### phf-bcap-0374  ·  sim 0.828  ·  prose:bcap
- page 190, doc `doc-f1ab2b58-344b-45`
- **STORED:** It is a question of *taking hold of* courage ... of *being afraid in the right manner*, and thereby coming to resoluteness
- **DOC:** g) Fear as πίστις: Courage as the Possibility of Being-Composed in Relation to It: The πάθη as Ground of λόγος Aristotle says that insofar as human beings come into this disquiet, which is determined by οἴεσθαι and ελπίς, they become ready to deliberate.&lt;sup&gt;379&lt;/sup&gt; Human beings who are brought into fear run to another in order to confer, to get counsel. If I allow people to be brought into fear, if I make out political events as dangerous, I thereby make people ready for, and inclined toward, conferring. I make them into those who contribute to the realization of an intended dec
- **DECISION:** 

### phf-bcap-0042  ·  sim 0.828  ·  prose:bcap
- page 29, doc `doc-f1ab2b58-344b-45`
- **STORED:** being-in-a-world determined in its ground through speaking
- **DOC:** What is this \lambda \acute{o}\gamma o \varsigma? It is the fundamental determination of the being of the human being as such. The human being is seen by the Greeks as \zeta \~{o}ov \lambda \acute{o}\gamma o v \~{e}\chi o v, not only philosophically but in concrete living: "a living thing that (as living) has language." This definition should not be thought in biological, psychological, social-scientific, or any such terms. This determination lies before such distinctions. Zw\'{n} is a concept of being; "life" refers to a mode of being, indeed a mode of being-in-a-world. A living thing is not 
- **DECISION:** 

### phf-bcap-0190  ·  sim 0.827  ·  prose:bcap
- page 108, doc `doc-f1ab2b58-344b-45`
- **STORED:** being-directed toward aletheia is constitutive of doxa, and therefore the possibility of pseudos belongs to it
- **DOC:** §15. Δόξα (Nicomachean Ethics, Z10 and Γ4) In order to make intelligible the basic phenomenon of everydayness, the phenomenon that underlies this speaking itself, it is necessary that we come to understand beforehand the sense of \delta \delta \delta \xi \alpha. \delta \delta \xi \alpha designates, first of all, the "view of something," but at the same time it means, for the most part, "to have a view." a) Demarcation of δόξα in Contrast with Seeking (ζήτησις), Knowing (ἐπιστήμη), and Presenting-Itself (φαντασία) 1. According to Aristotle, δόξα is οὐ ζήτησις, "not a seeking," but rather φάσις 
- **DECISION:** 

### phf-bcap-0280  ·  sim 0.821  ·  prose:bcap
- page 147, doc `doc-f1ab2b58-344b-45`
- **STORED:** Hegel took the phenomenon of sozein from Aristotle in the expression Aufhebung
- **DOC:** sense, then, \pi \alpha \theta o \zeta designates the "size," the "measure," of that which happens to me, that which occurs to me in a harmful way. We have a corresponding expression for that: "that is a blow to me." From these four meanings, the genuine relatedness of \pi \acute{\alpha} \theta o \varsigma becomes visible; it is related to the being of living things, which is characterized by a thus-finding-oneself-again-and-again. The occurring to one befalls and strikes one in this disposition. This occurring has in itself the character of the harmful. The occurring itself, as happening, doe
- **DECISION:** 

### phf-bcap-0176  ·  sim 0.818  ·  prose:bcap
- page 117, doc `doc-f1ab2b58-344b-45`
- **STORED:** (p. 101). Doxa is the basis, source, and motive for discoursing-with-one-another; it has
- **DOC:** Thus \delta\delta\xi\alpha is simultaneously set forth as the basis and the motive of discoursing-with-one-another, of negotiating-with-one-another. For although \delta\delta\xi\alpha possesses a kind of stability, that about which one has a view can indeed always still be discussed. It could also be otherwise. Its sense is to leave a discussion open. \Lambda\delta\gamma\sigma, negotiating something, is constantly latent; in \delta\delta\xi\alpha, bringing-to-language is constantly on the alert. \Delta\delta\xi\alpha is precisely that from which speaking-with-one-another arises, by which it is
- **DECISION:** 

### phf-bcap-0433  ·  sim 0.817  ·  prose:bcap
- page 202, doc `doc-f1ab2b58-344b-45`
- **STORED:** what is expressed. In expression it is communicated, and through communication comes into circulation --
- **DOC:** That which is thus already possessed at the outset—the world and living, and together with them, that which is already set in this definite fore-sight and is explicated under its guidance—is at the same time expressed for the most part and in an average way: \grave{\alpha}\pi\omega\alphaive\varpi\theta\alphai—"exhibited," articulated. Under the guidance of the respect, the look is now explicated more precisely, that is, to the extent that the claim to intelligibility governs, a definite idea of a proof and of conduciveness is guiding. If we recall the sixteenth and seventeenth centuries, we kn
- **DECISION:** 

### phf-bcap-0109  ·  sim 0.817  ·  prose:bcap
- page 74, doc `doc-f1ab2b58-344b-45`
- **STORED:** The matter about which I am serious need not be something extraordinary. Indeed, the less extraordinary is, the less possibility there is for deception about one's seriousness
- **DOC:** 80. Met. Δ 16, 1021 b 15–17. 81. Met. Δ 16, 1021 b 17–20. posal, the determination of τέλος or τέλειον is already implict. The ability to have a being-possibility at one's disposal means that a being that has an ἀρετή already has its end in this ἀρετή in a definite manner. The ἀρετή is a definite way of being, which in itself is directed to the τέλος, an ability to have at one's disposal, an ability which need not explicitly reach its τέλος. 82 5. The further determination is already indicated in this concept of ἀρετή as τελείωσις, insofar as there is a being which has its τέλος in the genuine
- **DECISION:** 

### phf-bcap-0133  ·  sim 0.812  ·  prose:bcap
- page 97, doc `doc-f1ab2b58-344b-45`
- **STORED:** in the bringing-into-a-disposition of the hearer
- **DOC:** 2. ἐν τῷ τὸν ἀκροατὴν διαθεῖναί πως, 42 "in the bringing-into-a-disposition," "in the manner by which the hearer is brought into a definite disposition," the hearer who also belongs to λέγειν. How the hearer is thereby positioned toward the matter, which position he is in, the manner and mode of bringing-the-hearer-into-a-disposition. In this there lies a πίστις—something that can speak for the matter. The διάθεσις of the hearer determines his κρίσις, his "view," which he ultimately cultivates as he apprehends the matter. 3. ἐν αὐτῷ τῷ λόγῳ: ^{43} λέγειν itself is πίστις as the basic function 
- **DECISION:** 

### phf-bcap-0278  ·  sim 0.811  ·  prose:bcap
- page 137, doc `doc-f1ab2b58-344b-45`
- **STORED:** entirely different from those in the case of a techne
- **DOC:** α. The γένεσις of ἀρετή As to the connection between ἕξις and ἀρετή: we will begin with the γένεσις of ἀρετή. We are treating ἕξις only in order to see the πάθη themselves more precisely. Άρετή as ἕξις is not a property, not a possession brought to beingthere from without, but is rather a mode of being-there itself. We are encountering once again, as always, the peculiar category of the how. Άρετή is a how of being-there, not as a fixed property, but rather as the how of being-there determined by its being, characterized by temporality, by the stretching across time. For this reason, ἀρετή is 
- **DECISION:** 

### phf-bcap-0057  ·  sim 0.809  ·  prose:bcap
- page 49, doc `doc-f1ab2b58-344b-45`
- **STORED:** ). One of the two fundamental characters of the
- **DOC:** 1. In φωνή, just as in λόγος, a definiteness of being-in-the-world appears, a definite manner in which the world encounters life. This occurs, first, in the character of \dot{\eta}\delta\dot{\nu} and of \lambda\nu\pi\eta\rho\dot{\nu}, and in the second case in the character of the "beneficial and harmful" (συμφέρον, βλαβερὸν). These are fundamental determinations: the world in natural being-there is not a fact that I take notice of; it is not an actuality or a reality. Rather, the world is there for the most part in the mode of the beneficial and the harmful, of that which uplifts or upsets be
- **DECISION:** 

### phf-bcap-0260  ·  sim 0.808  ·  prose:bcap
- page 144, doc `doc-f1ab2b58-344b-45`
- **STORED:** It does not concern 'spiritual states' with 'bodily symptoms'; instead, the pathe characterize the entire human being in its *disposition in the world*
- **DOC:** §18. Πάθος. Its General Meanings and Its Role in Human Being-There (Metaphysics Δ21, De Anima A1) a) Έξις as Clue to the Conception of the Being-Structure of πάθος For the understanding of ἕξις itself and the understanding of its γένεσις, we infer that it cannot be understood as completedness in the sense of routine. From there, we already see something more clearly, which now comes into question along with the \pi \dot{\alpha} \theta \eta themselves. The \pi \dot{\alpha} \theta \eta are also characters that, in their way, more proximally determine being-in-the-world, being-in-the-moment. It d
- **DECISION:** 

### phf-bcap-0230  ·  sim 0.804  ·  prose:bcap
- page 147, doc `doc-f1ab2b58-344b-45`
- **STORED:** the measure of that which occurs to me in a harmful way:
- **DOC:** sense, then, \pi \alpha \theta o \zeta designates the "size," the "measure," of that which happens to me, that which occurs to me in a harmful way. We have a corresponding expression for that: "that is a blow to me." From these four meanings, the genuine relatedness of \pi \acute{\alpha} \theta o \varsigma becomes visible; it is related to the being of living things, which is characterized by a thus-finding-oneself-again-and-again. The occurring to one befalls and strikes one in this disposition. This occurring has in itself the character of the harmful. The occurring itself, as happening, doe
- **DECISION:** 

### phf-bcap-0079  ·  sim 0.803  ·  prose:bcap
- page 56, doc `doc-f1ab2b58-344b-45`
- **STORED:** if such and such is the end, then such and such must be undertaken
- **DOC:** Ad 3. The συμφέρον is σκοπὸς. Aristotle characterizes the συμβουλεύεσθαι in Book 6, Chapter 10 of the Nicomachean Ethics as ζητεῖν τι καὶ λογίζεσθαι, ^{23} a "searching for something in the mode [καί is explicative here] of deliberating"—λογίζεσθαι. It is in this way that I "bring to language" that which I look toward in deliberating, that which is conducive to the end of concern. In πρᾶξις there is an end, that which is conducive is brought to its end, in every concern an end is fixed in advance. The \lambdaογίζεσθαι is the genuine mode of the fulfillment 17. Pol. A 2, 1253 a 16 sqq. 18. Pol.
- **DECISION:** 

### phf-bcap-0333  ·  sim 0.803  ·  prose:bcap
- page 177, doc `doc-f1ab2b58-344b-45`
- **STORED:** a being-possibility, ti phusikon, even in what is inferior, which belongs to their being, that is better than they are in themselves
- **DOC:** We now summarize the results of the overall consideration of the \pi \dot{\alpha}\theta\eta. The \pi \dot{\alpha}\theta\eta are the sort of thing that occurs in the soul, the sort of thing that is in living-being, and that means more precisely being-taken, losing-composure, κινεῖσθαι, which aims at the genuine being of living things, being-in-a-world. Πάθη are modes of being-taken with respect to being-in-the-world; through the \pi \dot{\alpha}\theta\eta, the possibilities of orienting oneself in the world are determined essentially. Being-out-of-composure is in itself related to being compose
- **DECISION:** 

### phf-bcap-0235  ·  sim 0.802  ·  prose:bcap
- page 149, doc `doc-f1ab2b58-344b-45`
- **STORED:** of the world, in which what is made present is not actually there but instead is in memory or in a merely faint making-present. Phantasia is the ground for noein.
- **DOC:** be the sort of thing in which the body does not take part.] If, however, even voe [voe [the thorough deliberating of a matter, when I do not have it perceptually present] is something like a \varphi \alpha v \tau \alpha \sigma i \alpha or cannot be without \varphi \alpha v \tau \alpha \sigma i \alpha, then thinking too could not be without standing in the context of the entire life of a human being." Thinking: this is not an appeal to a brain process, but to \varphi \alpha v \tau \alpha \sigma i \alpha, the "making-present-to-itself" of the world, in which what is made present is not actually 
- **DECISION:** 

### phf-bcap-0162  ·  sim 0.797  ·  prose:bcap
- page 127, doc `doc-f1ab2b58-344b-45`
- **STORED:** will thus have real trust -- he will himself be a pistis in his logos
- **DOC:** 2. Certainly, the first aspect can belong to the speaker, for he can have the right φρόνησις; the speaker can appear as one who looks around, but nonetheless as one who is not willing to say&lt;sup&gt;169&lt;/sup&gt; what appears to him to be the case, about which he has this or that view. The hearer can notice, in the course of the discourse, that the speaker is well-versed but does not say everything; the speaker screens his own position and view of the matter. He is not properly serious in what he says to his audience, as he knows still more. As soon as the hearer notices this, he withdraws
- **DECISION:** 

### phf-bcap-0069  ·  sim 0.789  ·  prose:bcap
- page 41, doc `doc-f1ab2b58-344b-45`
- **STORED:** a particular organizing, a particular opening of the eyes
- **DOC:** for Aristotle, \epsilon \tilde{t}\delta o \zeta has "species" as its meaning. Why it means "species," and why \gamma \acute{\epsilon} vo \zeta means "genus," is not understood if one does not know that \epsilon \tilde{t}\delta o \zeta is an entirely determinate being-character. Initially, it means the being that is there in its "appearing." As a master-builder builds a house, so he lives and operates initially in the \epsilon \tilde{t}\delta o \zeta of the house, in the way it looks. The τὸ τί ην εἶναι has in itself the determination of the ην: the being-there of a being, and indeed with an ey
- **DECISION:** 

### phf-bcap-0240  ·  sim 0.789  ·  prose:bcap
- page 152, doc `doc-f1ab2b58-344b-45`
- **STORED:** must proceed toward that on the basis of which the pathe are, that wherein they are found.
- **DOC:** The addressing of this phenomenon, which should hit upon the \pi \acute{\alpha}\theta \eta as to what they are, must proceed toward that on the basis of which the \pi \acute{a}\theta \eta are, that wherein they are found. Their \tilde{v}\lambda\eta is nothing other than \sigma\tilde{\omega}\mu\alpha, the corporeality of the human being. Therefore, since the investigation of the \pi \alpha \theta \eta is of this sort, the opoi that circumscribe in themselves the phenomenon at each moment must, accordingly, fall out.&lt;sup&gt;258&lt;/sup&gt; Thus the ὄροι is of the ὀργή. "Being-angry is somethi
- **DECISION:** 

### phf-bcap-0231  ·  sim 0.783  ·  prose:bcap
- page 147, doc `doc-f1ab2b58-344b-45`
- **STORED:** Hegel took the phenomenon of sozein from Aristotle in the expression *Aufhebung* (sublation)
- **DOC:** sense, then, \pi \alpha \theta o \zeta designates the "size," the "measure," of that which happens to me, that which occurs to me in a harmful way. We have a corresponding expression for that: "that is a blow to me." From these four meanings, the genuine relatedness of \pi \acute{\alpha} \theta o \varsigma becomes visible; it is related to the being of living things, which is characterized by a thus-finding-oneself-again-and-again. The occurring to one befalls and strikes one in this disposition. This occurring has in itself the character of the harmful. The occurring itself, as happening, doe
- **DECISION:** 

### phf-bcap-0273  ·  sim 0.780  ·  prose:bcap
- page 141, doc `doc-f1ab2b58-344b-45`
- **STORED:** ).** The remark that Aristotle recognizes
- **DOC:** stead, the mode of being-in-the-world is, as such, determined by the μεσότης. Correspondingly, it must be noted that there is no μέσον in accordance with this way of being that would be \tilde{\epsilon}v and \tau\alpha\dot{\nu}\tau\dot{\rho}v \pi\tilde{\alpha}\sigma iv. &lt;sup&gt;221&lt;/sup&gt; On the other hand, with a πρᾶγμα καθ' αὐτό, for example, a line or two numbers, one and the same μέσον remains, just as four is always the double of two, and is equally distant from two and six. In this sense, there is no μέσον for the being of human beings because everything human is μέσον πρὸς ἡμᾶς.
- **DECISION:** 

### phf-bcap-0220  ·  sim 0.780  ·  prose:bcap
- page 143, doc `doc-f1ab2b58-344b-45`
- **STORED:** The always of being-there is the *frequently of repetition*
- **DOC:** Cultivating ἕξις never depends on an operation, a routine. In an operation, the moment is destroyed. Every completedness, as settled routine, breaks down in the face of the moment. Appropriation and cultivation of ἕξις through habituation means nothing other than correct repetition. Therefore, in Chapter 3, Aristotle also sharply distinguishes ἀρετή and action from τέχνη, although he initially groups them together, when demarcating them in opposition to ἐπιστήμη. Το appropriation ἐκ διδασκαλίας belong ἐμπειρία and χρόνος. 230 For Aristotle, "science," ἐπιστήμη, is a determinate ἕξις, a determi
- **DECISION:** 

### phf-bcap-0138  ·  sim 0.779  ·  prose:bcap
- page 103, doc `doc-f1ab2b58-344b-45`
- **STORED:** that which appears this way or that way to everyone or to most, to most or to the intelligent among them
- **DOC:** rather speaking in such a way that πιστεύειν grows up by way of the speaking. Those are the two possibilities lying within \lambdaόγος itself insofar as it has the task of letting see. Παράδειγμα is a leading-to-something, and it occurs in discourse as it relates to the topic through the use of an example, a concrete case. Παρά means what is present, that which stands before one, what is shown, directly put forward, demonstrated by example. Aristotle differentiates the parallel forms of the λέγειν of dialectic, ἀπόδειξις and ἐπαγωγή, in the Topics, one of his earliest writings. The treats of t
- **DECISION:** 

### phf-bcap-0383  ·  sim 0.778  ·  prose:bcap
- page 183, doc `doc-f1ab2b58-344b-45`
- **STORED:** a disposition set before an approaching possibility that pertains to me, comes toward me, and announces itself through the announcement
- **DOC:** b) The Topic, the First Definition, and the First Determinations First of all, Aristotle offers the topic and first determinations: \pi o \tilde{a} \delta \tilde{c} \phi o \beta o \tilde{b} v v \alpha \kappa \tilde{a} \tilde{b} v \alpha \tilde{b} \tilde{c} \tilde{c} v \tilde{c} \tilde{c} v \tilde{c} \tilde{c} \tilde{c} \tilde{c} \tilde{c} \tilde{c} \tilde{c} \tilde{c} On that basis, Aristotle seeks to give the first definition. Fear, however, is only genuinely intelligible when Aristotle supplies the πῶς ἔχοντες. In the first definition, only a formal structure of fear is offered; it is not ex
- **DECISION:** 

### phf-bcap-0290  ·  sim 0.776  ·  prose:bcap
- page 152, doc `doc-f1ab2b58-344b-45`
- **STORED:** The being of nature is determined not simply by hule, but *primarily by being-moved*.
- **DOC:** The addressing of this phenomenon, which should hit upon the \pi \acute{\alpha}\theta \eta as to what they are, must proceed toward that on the basis of which the \pi \acute{a}\theta \eta are, that wherein they are found. Their \tilde{v}\lambda\eta is nothing other than \sigma\tilde{\omega}\mu\alpha, the corporeality of the human being. Therefore, since the investigation of the \pi \alpha \theta \eta is of this sort, the opoi that circumscribe in themselves the phenomenon at each moment must, accordingly, fall out.&lt;sup&gt;258&lt;/sup&gt; Thus the ὄροι is of the ὀργή. "Being-angry is somethi
- **DECISION:** 

### phf-bcap-0266  ·  sim 0.774  ·  prose:bcap
- page 152, doc `doc-f1ab2b58-344b-45`
- **STORED:** The being of nature is determined not simply by hule, but *primarily by being-moved*
- **DOC:** The addressing of this phenomenon, which should hit upon the \pi \acute{\alpha}\theta \eta as to what they are, must proceed toward that on the basis of which the \pi \acute{a}\theta \eta are, that wherein they are found. Their \tilde{v}\lambda\eta is nothing other than \sigma\tilde{\omega}\mu\alpha, the corporeality of the human being. Therefore, since the investigation of the \pi \alpha \theta \eta is of this sort, the opoi that circumscribe in themselves the phenomenon at each moment must, accordingly, fall out.&lt;sup&gt;258&lt;/sup&gt; Thus the ὄροι is of the ὀργή. "Being-angry is somethi
- **DECISION:** 

### phf-bcap-0341  ·  sim 0.767  ·  prose:bcap
- page 177, doc `doc-f1ab2b58-344b-45`
- **STORED:** determine the possibilities of orienting oneself in the world essentially
- **DOC:** We now summarize the results of the overall consideration of the \pi \dot{\alpha}\theta\eta. The \pi \dot{\alpha}\theta\eta are the sort of thing that occurs in the soul, the sort of thing that is in living-being, and that means more precisely being-taken, losing-composure, κινεῖσθαι, which aims at the genuine being of living things, being-in-a-world. Πάθη are modes of being-taken with respect to being-in-the-world; through the \pi \dot{\alpha}\theta\eta, the possibilities of orienting oneself in the world are determined essentially. Being-out-of-composure is in itself related to being compose
- **DECISION:** 

### phf-bcap-0182  ·  sim 0.765  ·  prose:bcap
- page 116, doc `doc-f1ab2b58-344b-45`
- **STORED:** repeating the opinions to others. What is said is not decisive, but rather that it is *he* who said it
- **DOC:** d) The Character of δόξα as the Orientedness of Average Being-with-One-Another-in-the-World We want to gather the entire analysis together and orient it, with regard to its content, to the question that genuinely interests us: the peculiar phenomenon of being-oriented in the world, how human being-there initially has its world there in an average way, how orientedness is in the having-there of the world. What do we find in relation to this phenomenon of discoveredness on the basis of the analysis of \delta\delta\xi\alpha? \Deltaόξα is the genuine discoveredness of being-with-one-another-in-the
- **DECISION:** 

### phf-bcap-0338  ·  sim 0.764  ·  prose:bcap
- page 180, doc `doc-f1ab2b58-344b-45`
- **STORED:** Hedone and lupe are co-given; with every pathos, but equally with every perceiving, every thinking, considering, with theoria, to the extent that they are basic modes of living, hedone is an inseparable companion
- **DOC:** The genuine being of human beings, the highest being-possibility, lies in θεωρεῖν—the possibility of being there in the most radical sense.&lt;sup&gt;340&lt;/sup&gt; Ἡδονή is, put succinctly, nothing other than the determination of the presentness of being-in-the-world, which is there in finding-oneself as such. In connection with this determination of ἡδονή, I will briefly discuss how what is said about θεωρεῖν is to be understood. One must give up the definition of traditional psychology, which apprehends λύπη and ἡδονή as annexed to psychological processes. Ήδονή is always aimed at living a
- **DECISION:** 

### phf-bcap-0452  ·  sim 0.762  ·  prose:bcap
- page 207, doc `doc-f1ab2b58-344b-45`
- **STORED:** is not a scrutinizing of beings in their concrete determinations but a setting-forth of the basic respects guided by the question:
- **DOC:** CHAPTER TWO Interpretation of the Cultivation of the Concept of κίνησις as a Radical Grasping of the Interpretedness of Being-There §25. The Aristotelian Physics as ἀρχή-Research: Orientation toward the First Two Books The interpretedness that itself prevails in being-there, where the latter is determined by προαίρεσις, stands under the possibility of being grasped, in the sense that the world is genuinely considered in its being-there, and being-inthe-world can be examined with respect to what it is. In relation to the interpretedness of being-there itself, there is a ἕξις of ἀληθεύειν, a pos
- **DECISION:** 

### phf-bcap-0226  ·  sim 0.761  ·  prose:bcap
- page 145, doc `doc-f1ab2b58-344b-45`
- **STORED:** That time, not as duration, is precisely constitutive of arete as ethike is shown by Aristotle's emphasizing that genuine being-composed within being-there is gained by the human being *as a man*, and so not during youth and not during old age
- **DOC:** Άρετή, which goes toward ἦθος, ἀρετή ἠθική, has a fully specific γένεσις corresponding to its being-character, which Aristotle characterizes, at the beginning of Book 2 of the Nicomachean Ethics, separately from ἀρετή διανοητική, the ability-to-be-composed in the world, as further clarified in relation to looking-around-oneself in the world. Άρετή is related to πρᾶξις, άρετή ήθική is related to ἔθος. Its γένεσις is "habituating-oneself" in the sense of frequent working-through. 235 Insofar as one considers the other ἀρετή, ἀρετή διανοητική, in its γένεσις, perhaps science as possessing a deter
- **DECISION:** 

### phf-bcap-0084  ·  sim 0.759  ·  prose:bcap
- page 49, doc `doc-f1ab2b58-344b-45`
- **STORED:** a transposing-of-oneself-all-at-once into the genuinely available possibility of the being-there in question
- **DOC:** 1. In φωνή, just as in λόγος, a definiteness of being-in-the-world appears, a definite manner in which the world encounters life. This occurs, first, in the character of \dot{\eta}\delta\dot{\nu} and of \lambda\nu\pi\eta\rho\dot{\nu}, and in the second case in the character of the "beneficial and harmful" (συμφέρον, βλαβερὸν). These are fundamental determinations: the world in natural being-there is not a fact that I take notice of; it is not an actuality or a reality. Rather, the world is there for the most part in the mode of the beneficial and the harmful, of that which uplifts or upsets be
- **DECISION:** 

### phf-bcap-0113  ·  sim 0.755  ·  prose:bcap
- page 82, doc `doc-f1ab2b58-344b-45`
- **STORED:** It depends upon the genuine manner of being-there
- **DOC:** When we look around at the concrete being-there of human beings, we see definite professions, concerns: builder, shoemaker, and so on. They are the determinations of human being-there that do not apply to every human being as human. In these concerns, human beings are occupied with their hands, they go on foot, in the sense that they see and apprehend that certain parts of this being-there have, at each moment, their definite tasks and being-possibility. 107. Eth. Nic. A 5, 1097 b 17: μὴ συναριθμουμένην. 108. Eth. Nic. A 6, 1097 b 23 sq. 109. Eth. Nic. A 6, 1097 b 26 sq.: ἐν τῷ ἔργω δοκεῖ τἀγα
- **DECISION:** 

### phf-bcap-0056  ·  sim 0.750  ·  prose:bcap
- page 42, doc `doc-f1ab2b58-344b-45`
- **STORED:** the outermost aspect, outside of which, at first, nothing more of the matter is to be found,
- **DOC:** The methodological stance is already seen in principle at the outset of the Physics, which is one of Aristotle's earliest investigations and seems to have been worked out at the time that he was still in the Academy, collaborating with Plato. That which is initially known, from which I proceed, is the καθόλου, "something that I have there in a general way."&lt;sup&gt;54&lt;/sup&gt; I am superficially oriented in my surrounding world, without being able to give an immediate answer to the question regarding what that surrounding world is. Seeing genuine beings depends on the \kappa\alpha\thetaόλ
- **DECISION:** 


#### Source: prose:bor:aroles-kupers-towards-an-integral-pedagogy-2022 (2)

### phf-bor-aroles-kupers-towards-an-0014  ·  sim 0.821  ·  prose:bor:aroles-kupers-towards-an-integral-pedagogy-2022
- page 8, doc `doc-978df835-39c2-46`
- **STORED:** community of time without... community of physical space
- **DOC:** The realm of tele-present spaces involves a modified 'we-relationship' through which meaning-intentions are intersubjectively synthesised. The intersubjective achievements concerning projects grounded within the immediacy of tele-present 'place' create an embodiment 'in there'. This 'in there' means that learning takes place in a specific temporal simultaneity (i.e. virtual community of time), thus creating a third realm of co-existence. In such simultaneity, those involved are able to engage in instantaneous, synchronised contact with distant others, who are 'consociate contemporaries' (Zhao,
- **DECISION:** 

### phf-bor-aroles-kupers-towards-an-0001  ·  sim 0.752  ·  prose:bor:aroles-kupers-towards-an-integral-pedagogy-2022
- page 1, doc `doc-978df835-39c2-46`
- **STORED:** specifically Heidegger's concepts of enframing (*Gestell*) and releasement (*Gelassenheit*), extended
- **DOC:** Original Article Towards an integral pedagogy in the age of 'digital Gestell': Moving between embodied co-presence and telepresence in learning and teaching practices Management Learning 2022, Vol. 53(5) 757–775 © The Author(s) 2021 Article reuse guidelines: sagepub.com/journals-permissions DOI: 10.1177/13505076211053871 journals.sagepub.com/home/mlq Wendelin Küpers ICN Business School, ARTEM, Nancy, France &amp; Karlshochschule International University, Germany Abstract Digitalisation offers a wide array of opportunities, but also challenges, for universities and business schools alike, regar
- **DECISION:** 


#### Source: prose:bor:cheval-et-al-physically-active-individuals-look- (2)

### phf-bor-cheval-et-al-physically--0005  ·  sim 0.883  ·  prose:bor:cheval-et-al-physically-active-individuals-look-
- page 19, doc `doc-58acaca9-324b-47`
- **STORED:** very small... and could hardly be distinguished from simple measurement error
- **DOC:** Attentional bias to positive stimuli is thought to be the result of learned associations that serve the purpose of making rewarding behaviors more efficiently and spontaneously initiated (Rebar, 2017). Hence, this lends support for the suggestion that physical activity could be perceived as rewarding (Dietrich &amp; McDaniel, 2004; Olsen, 2011; Raichlen, Foster, Gerdeman, Seillier, &amp; Giuffrida, 2012), especially in hyperactive and highly active individuals (Giel et al., 2013). These reward-learning processes play a key role in the development and maintenance of addiction (Hyman &amp; Malen
- **DECISION:** 

### phf-bor-cheval-et-al-physically--0003  ·  sim 0.800  ·  prose:bor:cheval-et-al-physically-active-individuals-look-
- page 4, doc `doc-58acaca9-324b-47`
- **STORED:** spontaneously allocate[s] attention toward physical activity opportunities... and... disengage[s] from opportunities to minimize effort
- **DOC:** 1. Introduction Most individuals are now aware of the negative health consequences of physical inactivity and have the intention to exercise (Canadian Fitness and Lifestyle Research Institute, 2018; Martin, Morrow, Jackson, &amp; Dunn, 2000). Yet, despite their conscious motivation to be active, numerous individuals fail to exercise regularly. Only ~30% of the adult population worldwide regularly exercise (Guthold, Stevens, Riley, &amp; Bull, 2018; WHO, 2010). Physical inactivity is estimated to be responsible of one death every ten seconds worldwide (WHO, 2010). Until recently, the dominant a
- **DECISION:** 


#### Source: prose:bor:elpidorou-freeman-fear-anxiety-and-boredom-2020 (2)

### phf-bor-elpidorou-freeman-fear-a-0010  ·  sim 0.883  ·  prose:bor:elpidorou-freeman-fear-anxiety-and-boredom-2020
- page 10, doc `doc-534a5bc0-e1b2-41`
- **STORED:** we cannot maintain our attention to the situation at hand; we mind-wander and alternative goals and situations... become salient
- **DOC:** Whereas in the case of passive fear we negate our consciousness in order to negate the threat; in active fear, we flee. Yet, in essence the two are different manifestations of the same phenomenon. "Flight is fainting away in play," Sartre writes (STE 43). And he adds that "it is magical behaviour which negates the dangerous object with one's whole body, by reversing the vectorial structure of the space we live in and suddenly creating a potential direction on the other side. (ibid.). While fleeing, we have magically transformed our world so that it does not contain the threat. But of course, t
- **DECISION:** 

### phf-bor-elpidorou-freeman-fear-a-0009  ·  sim 0.800  ·  prose:bor:elpidorou-freeman-fear-anxiety-and-boredom-2020
- page 10, doc `doc-534a5bc0-e1b2-41`
- **STORED:** that gives rise to boredom is glossed as
- **DOC:** Whereas in the case of passive fear we negate our consciousness in order to negate the threat; in active fear, we flee. Yet, in essence the two are different manifestations of the same phenomenon. "Flight is fainting away in play," Sartre writes (STE 43). And he adds that "it is magical behaviour which negates the dangerous object with one's whole body, by reversing the vectorial structure of the space we live in and suddenly creating a potential direction on the other side. (ibid.). While fleeing, we have magically transformed our world so that it does not contain the threat. But of course, t
- **DECISION:** 


#### Source: prose:bor:elpidorou-freeman-is-profound-boredom-boredom-20 (1)

### phf-bor-elpidorou-freeman-is-pro-0001  ·  sim 0.829  ·  prose:bor:elpidorou-freeman-is-profound-boredom-boredom-20
- page 1, doc `doc-33c621b8-d017-46`
- **STORED:** to investigate profound boredom's place within contemporary psychological and philosophical research on boredom
- **DOC:** Is Profound Boredom Boredom? Andreas Elpidorou and Lauren Freeman 4 Martin Heidegger is credited as having offered one of the most 5 thorough phenomenological investigations of the nature of boredom in 6 the history of philosophy. Indeed, in his 1929–1930 lecture course, The 7 Fundamental Concepts of Metaphysics: World, Finitude, Solitude (FCM), 8 Heidegger goes to great lengths to distinguish between different types 9 of boredom and to explicate their respective characters. Moreover, Heidegger, at least within the context of his discussion of profound boredom [tiefe Langeweile], opposes much 
- **DECISION:** 


#### Source: prose:bor:elpidorou-the-good-of-boredom-2018 (2)

### phf-bor-elpidorou-the-good-of-bo-0012  ·  sim 0.895  ·  prose:bor:elpidorou-the-good-of-boredom-2018
- page 18, doc `doc-e2d98bca-2a86-47`
- **STORED:** Dante, Pascal, Novalis, Schopenhauer, Kierkegaard, Dostoevsky, Pessoa, ... Russell, and Brodsky
- **DOC:** 6. Connections and further directions Either in passing remarks or in sustained articulations of its nature, boredom figures in the works of authors such as Dante, Pascal, Novalis, Schopenhauer, Kierkegaard, Dostoevsky, Pessoa, Heidegger, Russell, and Brodsky. Indeed, discussions of boredom can be traced at least as far back as the writings of early Christian fathers who were concerned with a type of spiritual boredom (acedia) responsible for neglecting one's religious duties. Despite its long and intricate history, philosophical and literary discussions of boredom have tended to emphasize its
- **DECISION:** 

### phf-bor-elpidorou-the-good-of-bo-0014  ·  sim 0.850  ·  prose:bor:elpidorou-the-good-of-boredom-2018
- page 18, doc `doc-e2d98bca-2a86-47`
- **STORED:** against Kierkegaard's pronouncement that
- **DOC:** 6. Connections and further directions Either in passing remarks or in sustained articulations of its nature, boredom figures in the works of authors such as Dante, Pascal, Novalis, Schopenhauer, Kierkegaard, Dostoevsky, Pessoa, Heidegger, Russell, and Brodsky. Indeed, discussions of boredom can be traced at least as far back as the writings of early Christian fathers who were concerned with a type of spiritual boredom (acedia) responsible for neglecting one's religious duties. Despite its long and intricate history, philosophical and literary discussions of boredom have tended to emphasize its
- **DECISION:** 


#### Source: prose:bor:gibbs-the-concept-of-profound-boredom-2011 (2)

### phf-bor-gibbs-the-concept-of-pro-0023  ·  sim 0.852  ·  prose:bor:gibbs-the-concept-of-profound-boredom-2011
- page 12, doc `doc-7b4409b6-8e74-4a`
- **STORED:** instrumental way of being… enframed in the metrics of quality
- **DOC:** This approach is different from determining the quality of the delivery of education by looking at what leaves students bored, in the sense of emptiness or in limbo. It is this that has attracted contemporary research into performativity that, although not without merit, fails to deal with the greater underlying issue in any edifying process: the development of the individual for their own sake. What is needed is an edifying process to help develop the moment of vision as a way of dwelling. As Mc Neil says, it is not ''something that can simply be achieved once and for all. It entails, rather,
- **DECISION:** 

### phf-bor-gibbs-the-concept-of-pro-0001  ·  sim 0.759  ·  prose:bor:gibbs-the-concept-of-profound-boredom-2011
- page 10, doc `doc-7b4409b6-8e74-4a`
- **STORED:** (semester, credit hour, examination date) conceals the
- **DOC:** Seemingly Heidegger is saying that our capability to act meaningfully is dependent upon but not sufficiently satisfied by a collection of competencies: The inadequacy of knowing what but not recognising 'when' and 'how'. This inability to conceive hermeneutically of a situation where we can move ahead, resolutely, is especially evident when brought to the fore in profound boredom. Here, we are confronted with what our authenticity might be. We need to choose to not to turn away from it or to ignore it. In the moment of vision one is left to review oneself within the context of being. It comes 
- **DECISION:** 


#### Source: prose:bor:hadjioannou-ed-heidegger-on-affect-2019 (13)

### phf-bor-hadjioannou-ed-heidegger-0272  ·  sim 0.890  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 187, doc `doc-a8a92b45-281a-41`
- **STORED:** being uncanny reveals itself authentically in the basic finding… of angst
- **DOC:** these are identities we are already projecting upon, and some of these (such as gender, race, and social standing) are or can be identities that we find thrust upon us by our community. Indeed, we find ourselves already having been issued not only some of our identities but also our aptitudes and talents, as well as our bodies, our histories, our time and place, and so on. Is this a different type of finding-not finding ourselves called, but finding ourselves stuck with something? No; it is a variety of finding ourselves called. For what we find ourselves stuck with is what Heidegger calls our
- **DECISION:** 

### phf-bor-hadjioannou-ed-heidegger-0360  ·  sim 0.875  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 260, doc `doc-a8a92b45-281a-41`
- **STORED:** of phenomenological understanding, given
- **DOC:** However, Heidegger's claim that love opens up to truth, is by no means confined to personal letters. There are, in fact, many examples from his early Freiburg period, where Heidegger states that philosophy was neither science nor theoretical insight lead by principles, but "eros" or "passion" [Leidenschaft] (GA 61: 24). In this, Heidegger is influenced by Plato's Symposion, mystics in general and Eckhart in particular, but also by his contemporary Max Scheler whose works he seems to have read right after their publication. Giorgio Agamben was the first to point out that Heidegger's attention t
- **DECISION:** 

### phf-bor-hadjioannou-ed-heidegger-0231  ·  sim 0.850  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 158, doc `doc-a8a92b45-281a-41`
- **STORED:** a 'being-taken' of Dasein … from without
- **DOC:** 1 Heidegger on Affect—I: Befindlichkeit and Stimmung As Kate Withy has recently observed, "[m]ost interpretations of [his] account of authenticity ... follow Heidegger in focusing on owned understanding" (2015, 21), and there is no explicitly articulated account in Heidegger of owned or authentic emotion. But this is a little incongruous as emotion is key to his discussion of two concepts that are central to his existential analytic of Dasein: "Befindlichkeit" and "Stimmung." There is a broad consensus that Macquarrie and Robinson's translation of the former in their version of Sein und Zeit a
- **DECISION:** 

### phf-bor-hadjioannou-ed-heidegger-0433  ·  sim 0.844  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 277, doc `doc-a8a92b45-281a-41`
- **STORED:** comes across ... 'Experiences' [*Erlebnisse*]
- **DOC:** 2 Part I Heidegger explores the phenomenon of affective disposition (Befindlichkeit),&lt;sup&gt;2&lt;/sup&gt; and of "moods" (Stimmungen) in paragraph 29 of BT. To be precise, Heidegger explains at the beginning of the paragraph that disposition is the ontological characterization of the ontical phenomenon of mood. "What we indicate ontologically with the term disposition is ontically what is most familiar and an everyday kind of thing: mood, being in a mood" (SZ 134). The ontical phenomenon of moods manifest an "ontological disposition." Disposition is a mode of disclosure. It is, in fact, th
- **DECISION:** 

### phf-bor-hadjioannou-ed-heidegger-0253  ·  sim 0.837  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 169, doc `doc-a8a92b45-281a-41`
- **STORED:** though I think what ought to be done is *z*
- **DOC:** mentioned above that Rudd acknowledges the pluralist intuition: he does so when he insists that "[a] typical life narrative will not be a story of the pursuit of one single goal, but the story of how the protagonist attempts ... to coordinate his/her different projects and goals with one another" (2009, 65). The thought behind the third model is that what Rudd here adds to a standpoint model of authenticity might itself come closer to capturing Heideggerian authenticity—not as a supplement to a standpoint model but in its place. The penultimate section of the paper will sketch this third model
- **DECISION:** 

### phf-bor-hadjioannou-ed-heidegger-0416  ·  sim 0.812  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 50, doc `doc-a8a92b45-281a-41`
- **STORED:** stares at it with the inexorability of an enigma
- **DOC:** Heidegger is introducing a feature of Dasein's being-in-the-world which is crucial to his account—namely 'throwness' (Geworfenheit). We operate in such a way that it can often seem as though we are absorbed in one project before moving on to another, there is a surface story to our activities which we do not interrogate as to their ultimate significance since we normally look to avoid or evade what is disclosed to us in the basic, thrown character of the 'da' of everyday Dasein. Part of what is disclosed, is the nullity at the heart of Dasein. Heidegger will later say that Dasein is the null b
- **DECISION:** 

### phf-bor-hadjioannou-ed-heidegger-0127  ·  sim 0.795  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 91, doc `doc-a8a92b45-281a-41`
- **STORED:** of authentic self-understanding through
- **DOC:** Yet Heidegger also claims that philosophy has lost touch with this same soil. His aim, however is not to praise the traditional Greek notion of possibility, as "bringing-forth" (poeisis) over against techne. Rather, he is suggesting that metaphysical thinking, as a fundamental approach to beings as actualized, structurally inhibits reflection on other modes of disclosing and, most crucially, reflection on disclosing as such. But I will return to this later. For Heidegger, Aristotle's thought provides what he terms a "jolt to the present, or better put, to the future" (GA 18: 6; BCAP 5). Rhetor
- **DECISION:** 

### phf-bor-hadjioannou-ed-heidegger-0160  ·  sim 0.795  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 129, doc `doc-a8a92b45-281a-41`
- **STORED:** — *Befindlichkeit* is better translated
- **DOC:** 7. In her article, "The Methodological Role of Angst in Being and Time," Journal of the British Society for Phenomenology 43, no. 2 (2012): 195-211, Katherine Withy argues that while angst is usually understood as part of an ontological story about the fragility of meaning and the pertinent ontological risk involved, specifically connecting to an ethicalexistential dimension of BT, it would be more helpful to approach angst from a methodological perspective, namely from the perspective of the methodological role (Heidegger says) it plays. As Withy writes: "We analyse angst because it has to do
- **DECISION:** 

### phf-bor-hadjioannou-ed-heidegger-0026  ·  sim 0.789  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 11, doc `doc-a8a92b45-281a-41`
- **STORED:** and its 1940s retrospectives (cited as
- **DOC:** (published material, lecture material, even his private notebooks) in the complete edition (Gesamtausgabe) of his work, and prefaced it with the motto "Wege—nicht Werke" meaning "Ways—not works", because he considered his philosophical path to be one ridden with failed (but not futile) attempts to give expression to the problem of the meaning of Being. So whilst the deeper problem maintains a certain unity, Heidegger's style, angle, and (unavoidably) words used vary, as does the "success" and cogency of each "attempt". 2 Affective phenomena are always a fundamental part, and always form a cons
- **DECISION:** 

### phf-bor-hadjioannou-ed-heidegger-0122  ·  sim 0.768  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 87, doc `doc-a8a92b45-281a-41`
- **STORED:** only insofar as they exist with others amid matters made
- **DOC:** And yet in these early lectures Heidegger insists that rhetoric and dialectic are fundamentally discursive capacities (dynameis), while scientific thinking strives for a knowledge of real things (pragmata). What makes rhetoric unique, however, is that it exhibits a poietic character, a productive element, and simultaneously a demonstratively scientific character: it facilitates knowledge of real things which have been disclosed or rendered thematic productively. Rhetoric exhibits a specific form of logos, or knowing, parallel to, but distinct from, scientific knowing, insofar as it structures 
- **DECISION:** 

### phf-bor-hadjioannou-ed-heidegger-0079  ·  sim 0.755  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 72, doc `doc-a8a92b45-281a-41`
- **STORED:** metaphor (the *Stimme* and *Zuspruch des Seyns* —
- **DOC:** But what is this \pi \dot{\alpha}\theta \circ \varsigma? Is Plato saying philosophy is based on and sustained by feelings? Heidegger's discussion moves \pi \dot{\alpha}\theta \circ \varsigma out of the psychological realm of existential emotions and into the existential structure of ex-sistence. As he had previously done with Befindlichkeit (SZ §29), here Heidegger interprets \pi \dot{\alpha}\theta \circ \varsigma as the existential structure that he calls Stimmung: attunement to Seyn. But that very phrase ("attunement \underline{to}...") harbors the possibility of a ruinous error, that of div
- **DECISION:** 

### phf-bor-hadjioannou-ed-heidegger-0407  ·  sim 0.754  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 274, doc `doc-a8a92b45-281a-41`
- **STORED:** newly extracted each time... out of the basic disposition
- **DOC:** The Ethics of Moods François Raffoul 1 Introduction We know the ontological import of moods (Stimmungen) for Heidegger: moods or affective dispositions are not superficial additions to existence, not restricted to our "emotional" lives, not inner subjective feelings, but manifest an ontological truth of Dasein. Moods represent a fundamental feature of existence, which is never without a mood, always situated and disposed by a mood. Existence is never neutral, but always already "moved" by a mood. "Dasein is always already in a mood," says Heidegger (SZ 134). Heidegger talks of Grundstimmungen,
- **DECISION:** 

### phf-bor-hadjioannou-ed-heidegger-0260  ·  sim 0.750  ·  prose:bor:hadjioannou-ed-heidegger-on-affect-2019
- page 174, doc `doc-a8a92b45-281a-41`
- **STORED:** and remaining open to the full range of ways one's situation
- **DOC:** The openness upon which ATCI rests requires then that I resist the temptation merely to feel about my situation as "one feels" about "such situations" and its capacity to blind me to the normative multidimensionality of my concrete situation—of the many things that "one must do."41 To resist the temptation to be "relieved" by das Man "of its choice, its formation of judgments, and its estimation of values," Dasein must then remain open to the full range of ways in which its situation "summons" it: "when we master a mood"—here a generallyaccepted and exculpatory public sentiment about "how one 
- **DECISION:** 


#### Source: prose:bor:haj-bolouri-the-experience-of-immersive-virtual- (1)

### phf-bor-haj-bolouri-the-experien-0004  ·  sim 0.752  ·  prose:bor:haj-bolouri-the-experience-of-immersive-virtual-
- page 23, doc `doc-5d642501-098b-40`
- **STORED:** — Sense of Content, Sense of Familiarity, Sense of Mood, and Sense of Care — and, on that basis, proposes
- **DOC:** 5.1 A Nuanced Perspective of the IVR Experience as a Meaningful Escapism This study proposed that the IVR experience becomes a meaningful escapism when the virtual worlds we escape to have the ability to provide end-users of IVR a sense of content, sense of familiarity, sense of mood, and a sense of care. As such, all four characteristics are proposed to unveil how the IVR experience can be characterized as a meaningful escapism. However, I think that there is a need for further discussing the distinction between 'meaning' and 'meaningfulness', in order to clarify how the characteristics are p
- **DECISION:** 


#### Source: prose:bor:hughes-meaninglessness-and-monotony-in-pandemic- (1)

### phf-bor-hughes-meaninglessness-a-0020  ·  sim 0.851  ·  prose:bor:hughes-meaninglessness-and-monotony-in-pandemic-
- page 11, doc `doc-a22227cf-93e3-44`
- **STORED:** between familiar and unfamiliar can no longer be presupposed, which
- **DOC:** Beyond this straightforward explanation, however, it is my view pandemic boredom can be seen to expose and then exceed the distinctive methodological limitations of Heidegger's phenomenological interpretation of boredom in several ways: with regards to the ontological distinction between situative and existential attunements and then in terms of the relative significance of different experiences of boredom. Firstly, pandemic boredom problematizes Heidegger's ontological distinction between situative and existential attunements, which hinges on whether attunements turn one toward or away from t
- **DECISION:** 


#### Source: prose:bor:kim-et-al-detecting-boredom-from-eye-gaze-and-ee (1)

### phf-bor-kim-et-al-detecting-bore-0007  ·  sim 0.867  ·  prose:bor:kim-et-al-detecting-boredom-from-eye-gaze-and-ee
- page 1, doc `doc-7b32556c-da47-47`
- **STORED:** engagement... is a prerequisite for reaching the flow state,
- **DOC:** Contents lists available at ScienceDirect Biomedical Signal Processing and Control journal homepage: www.elsevier.com/locate/bspc Detecting boredom from eye gaze and EEG Joochan Kima, Jungryul Seo b, Teemu H. Lainec,∗ a Department of Life Media, Ajou University, Suwon, Republic of Korea b Department of Computer Engineering, Ajou University, Suwon, Republic of Korea c Department of Computer Science, Electrical and Space Engineering, Luleå University of Technology, Skellefteå, Sweden a r t i c l e i n f o Article history: Received 18 August 2017 Received in revised form 27 April 2018 Accepted 28
- **DECISION:** 


#### Source: prose:bor:mansikka-can-boredom-educate-us-2008 (1)

### phf-bor-mansikka-can-boredom-edu-0023  ·  sim 0.895  ·  prose:bor:mansikka-can-boredom-educate-us-2008
- page 5, doc `doc-a6967eb2-cc50-49`
- **STORED:** slipping away from ourselves toward whatever is happening
- **DOC:** We must understand this form of boredom, the experience of the ''long time'' due to a situation that we find boring. And in this situation the only way out is passing the time, looking for something that would divert our attention from the time. If we are successful in this attempt we forget both time and our boredom dissolve. Boredom has not left us completely indifferent toward the situation. It is rather that we are present in the actual situation but the situation both holds us in delay [hingehalten] by time and at the same time leave us empty. Heidegger makes a distinction between two str
- **DECISION:** 


#### Source: prose:bor:mertel-heidegger-technology-and-education-2020 (2)

### phf-bor-mertel-heidegger-technol-0019  ·  sim 0.763  ·  prose:bor:mertel-heidegger-technology-and-education-2020
- page 14, doc `doc-9d583ed3-2d5e-4f`
- **STORED:** beginning in pre-kindergarten, and the
- **DOC:** This becomes clearer when we consider the way in which enframing promotes a broader Leistungskultur, an obsessive 'culture of achievement', correlated with the generally observed increase in burnout and dissatisfaction in professional contexts and mental health issues among students.17 In a world where all that matters is the bottom line, and the optimalisation of the means for achieving taken-for-granted ends, it is not surprising that the self-worth of students is increasingly tied to the extent to which they are capable of producing results—good grades, impressive extra-curriculars which in
- **DECISION:** 

### phf-bor-mertel-heidegger-technol-0024  ·  sim 0.761  ·  prose:bor:mertel-heidegger-technology-and-education-2020
- page 13, doc `doc-9d583ed3-2d5e-4f`
- **STORED:** willingly sacrifices many options in pursuit of a sustained... development of her skills
- **DOC:** The Limits of the Skilled Coping Model In addition to my concerns regarding the skilled-coping model as a paradigm of Heidegger interpretation, I have reservations about its critical potential as a foundation for a positive educational programme capable of challenging the reifying effects of enframing. In particular, the problem manifests itself in what both Wrathall (2019) and Dreyfus (2009) take to be a paradigmatic case of a skillful activity that 'is divorced from the imperatives of a global sense [enframing]' and whose bodily skills 'have no ready value in the global economy'—that is, spo
- **DECISION:** 


#### Source: prose:bor:quaranta-in-the-mood-for-heideggerian-boredom-20 (1)

### phf-bor-quaranta-in-the-mood-for-0014  ·  sim 0.755  ·  prose:bor:quaranta-in-the-mood-for-heideggerian-boredom-20
- page 8, doc `doc-a478090c-b3af-4e`
- **STORED:** ; the film alone is insufficient, since moods are
- **DOC:** But how do cinematic moods disclose a film world, allowing for things in that world to matter for us and become intelligible? It is possible to talk about aesthetics of mood, namely the ways in which aesthetic choices can encourage the arousal of suitable moods and thus open up a meaningful cinematic world for the viewer (see Sinnerbrink, 2012). If as a viewer I am existentially embedded in a film world, I am also attuned to it in some way or another; my ability to be affectively and meaningfully responsive to what is going on is therefore contingent on the film's eliciting of apposite moods w
- **DECISION:** 


#### Source: prose:bor:raffaelli-et-al-the-knowns-and-unknowns-of-bored (2)

### phf-bor-raffaelli-et-al-the-know-0013  ·  sim 0.848  ·  prose:bor:raffaelli-et-al-the-knowns-and-unknowns-of-bored
- page 9, doc `doc-b3ae8a7a-3eca-40`
- **STORED:** if different types of boredom do indeed exist,
- **DOC:** Mood and fatigue Two additional factors are worth mentioning: mood and fatigue (we refer to these as probable correlates; see Table 1). Although there is limited empirical evidence linking each to boredom, they may be related to boredom due to their close relationships with failures in attentional allocation. Indeed, such failures in attention are considered to be a hallmark of the boredom experience (Eastwood et al. 2012). Inducing negative mood has been linked to reduced performance on the attentional blink task (Jefferies et al. 2008), SART (Smallwood et al. 2009), and the Stroop task (Croc
- **DECISION:** 

### phf-bor-raffaelli-et-al-the-know-0010  ·  sim 0.844  ·  prose:bor:raffaelli-et-al-the-knowns-and-unknowns-of-bored
- page 9, doc `doc-b3ae8a7a-3eca-40`
- **STORED:** if different types of boredom do indeed exist
- **DOC:** Mood and fatigue Two additional factors are worth mentioning: mood and fatigue (we refer to these as probable correlates; see Table 1). Although there is limited empirical evidence linking each to boredom, they may be related to boredom due to their close relationships with failures in attentional allocation. Indeed, such failures in attention are considered to be a hallmark of the boredom experience (Eastwood et al. 2012). Inducing negative mood has been linked to reduced performance on the attentional blink task (Jefferies et al. 2008), SART (Smallwood et al. 2009), and the Stroop task (Croc
- **DECISION:** 


#### Source: prose:bor:slaby-living-in-the-moment-2017 (1)

### phf-bor-slaby-living-in-the-mome-0030  ·  sim 0.788  ·  prose:bor:slaby-living-in-the-moment-2017
- page 8, doc `doc-af7095eb-3101-47`
- **STORED:** : the tone and drive of the relevant passages betray
- **DOC:** Time is key to everything here. In deep boredom, lived time flattens out into vast expanse of all-consuming insignificance – while by contrary, in the moment of vision, the present moment, dasein is concentrated again into this one focal point, into an extreme of the self-enabling act, here and now. In colloquial terms one might speak of 'getting one's act together', pulling oneself out of the slumber of futility into the resolute act. Rising to the occasion – living in the moment. In many of his formulations, Heidegger leaves little doubt that he thinks not heeding the 'message' of profound b
- **DECISION:** 


#### Source: prose:bor:tam-et-al-attention-drifting-in-and-out-2021 (1)

### phf-bor-tam-et-al-attention-drif-0007  ·  sim 0.878  ·  prose:bor:tam-et-al-attention-drifting-in-and-out-2021
- page 12, doc `doc-fa5d4a4d-968a-48`
- **STORED:** boredom serves a vital function of prompting individuals to direct their attention to... something that is of value
- **DOC:** One insight our model might offer the research on egodepletion is the distinction we make between engagement and effort. Ego-depletion has been suggested to result from prior self-control effort, which depletes resources (Baumeister &amp; Vohs, 2016) or motivates shifts in motivation and attention (Inzlicht &amp; Schmeichel, 2012). In BFM, IAE instigates the redirection of attention back to the task at hand, which may then impair subsequent self-control through resource depletion or shifts in motivation and attention. In this sense, egodepletion might result from the failure to attain adequate
- **DECISION:** 


#### Source: prose:bt (12)

### phf-bt-0339  ·  sim 0.893  ·  prose:bt
- page 409, doc `doc-b846644a-3c5e-40`
- **STORED:** circumspective concern with the ready-to-hand changes over into an exploration of what we come across as present-at-hand.
- **DOC:** Corresponding to the stage of our study at which we have now arrived, a further restriction will be imposed upon our Interpretation of the theoretical attitude. We shall investigate only the way in which circumspective 1 The italics in this and the following sentence appear only in the later editions. concern with the ready-to-hand changes over into an exploration of what we come across as present-at-hand within-the-world; and we shall be guided by the aim of penetrating to the temporal Constitution of Being-in-the-world in general. In characterizing the change-over from the manipulating and u
- **DECISION:** 

### phf-bt-0309  ·  sim 0.860  ·  prose:bt
- page 358, doc `doc-b846644a-3c5e-40`
- **STORED:** unfold them with more and more penetration.
- **DOC:** By thus casting light upon the 'connection' between anticipation and resoluteness in the sense of the possible modalization of the latter by the former, we have exhibited as a phenomenon an authentic potentialityfor-Being-a-whole which belongs to Dasein. If with this phenomenon we have reached a way of Being of Dasein in which it brings itself to itself and face to face with itself, then this phenomenon must, both ontically and ontologically, remain unintelligible to the everyday common-sense manner in which Dasein has been interpreted by the "they". It would be a misunderstanding to shove thi
- **DECISION:** 

### phf-bt-0349  ·  sim 0.854  ·  prose:bt
- page 108, doc `doc-b846644a-3c5e-40`
- **STORED:** it encounters within-the-world — and must
- **DOC:** any manner it explicitly comes away from anything, it can never do more than come back to the world. Being-in-the-world, according to our Interpretation hitherto, amounts to a non-thematic circumspective absorption in references or assignments constitutive for the readiness-to-hand of a totality of equipment. Any concern is already as it is, because of some familiarity with the world. In this familiarity Dasein can lose itself in what it encounters within-the-world and be fascinated with it. What is it that Dasein is familiar with? Why can the worldly character of what is within-the-world be l
- **DECISION:** 

### phf-bt-0113  ·  sim 0.821  ·  prose:bt
- page 168, doc `doc-b846644a-3c5e-40`
- **STORED:** as an essential existentiale. | (1) The
- **DOC:** The Self of everyday Dasein is the they-self, which we distinguish from the authentic Self-that is, from the Self which has been taken hold of in its own way [eigens ergriffenen]. As they-self, the particular Dasein has been dispersed into the "they", and must first find itself. This dispersal characterizes the 'subject' of that kind of Being which we know as concernful absorption in the world we encounter as closest to us. If Dasein is familiar with itself as they-self, this means at the same time that the "they" itself prescribes that way of interpreting the world and Being-inthe-world which
- **DECISION:** 

### phf-bt-0218  ·  sim 0.818  ·  prose:bt
- page 270, doc `doc-b846644a-3c5e-40`
- **STORED:** presuppose truth because, being in the kind of Being Dasein possesses, we are
- **DOC:** (c) The Kind of Being which Truth Possesses, and the Presupposition of Truth Dasein, as constituted by disclosedness, is essentially in the truth. Disclosedness is a kind of Being which is essential to Dasein. 'There is' truth only in so far as Dasein is and so long as Dasein is. Entities are uncovered only when Dasein is; and only as long as Dasein is, are they disclosed. Newton's laws, the principle of contradiction, any truth whatever—these are true only as long as Dasein is. Before there was any Dasein, there was no truth; nor will there be any after Dasein is no more. For in such a case t
- **DECISION:** 

### phf-bt-0302  ·  sim 0.814  ·  prose:bt
- page 426, doc `doc-b846644a-3c5e-40`
- **STORED:** ontologically as constantly present-at-hand
- **DOC:** What seems 'simpler' than to characterize the 'connectedness of life' between birth and death? It consists of a sequence of Experiences 'in time'. But if one makes a more penetrating study of this way of characterizing the 'connectedness' in question, and especially of the ontological assumptions behind it, the remarkable upshot is that, in this sequence of Experiences, what is 'really' 'actual' is, in each case, just that Experience which is present-at-hand 'in the current "now" ', while those Experiences which have passed away or are only coming along, either are no longer or are not yet 'ac
- **DECISION:** 

### phf-bt-0404  ·  sim 0.803  ·  prose:bt
- page 473, doc `doc-b846644a-3c5e-40`
- **STORED:** counted in the movement encountered in the horizon of the earlier and later.
- **DOC:** ¶ 81. Within-time-ness and the Genesis of the Ordinary Conception of Time How does something like 'time' first show itself for everyday circum-spective concern? In what kind of concernful equipment-using dealings does it become explicitly accessible? If it has been made public with the disclosedness of the world, if it has always been already a matter of concern with the discoveredness of entities within-the-world—a discoveredness which belongs to the world's disclosedness—and if it has been a matter of such concern in so far as Dasein calculates time in reckoning with itself, then the kind of
- **DECISION:** 

### phf-bt-0318  ·  sim 0.800  ·  prose:bt
- page 377, doc `doc-b846644a-3c5e-40`
- **STORED:** Heidegger: temporality is the primordial
- **DOC:** 1 'In der Befindlichlceit wird das Dasein von ihm selbst iiberfallen a1s das Seiende, das es, noch seiend, schon war, das heisst gewesen stiindig ist.' We have expanded our usual translation of 'Befindlichkeit' to bring out better the connection with the previous sentence. 2 'Entschlossen hat sich das Dasein gerade zuriickgeholt aus dem Verafallen, urn desto eigentlicher im "Augenblick" auf die erschlossene Situation "da" zu sein.' The German word 'Augenblick' has hitherto been translated simply as 'moment'; but here, and in many later passages, Heidegger has in mind its more literal meaning-'
- **DECISION:** 

### phf-bt-0093  ·  sim 0.791  ·  prose:bt
- page 154, doc `doc-b846644a-3c5e-40`
- **STORED:** the field belongs to such-and-such a person
- **DOC:** ¶ 26. The Dasein-with of Others and Everyday Being-with The answer to the question of the "who" of everyday Dasein is to be obtained by analysing that kind of Being in which Dasein maintains itself proximally and for the most part. Our investigation takes its orientation from Being-in-the-world—that basic state of Dasein by which every mode of its Being gets co-determined. If we are correct in saying that by the foregoing explication of the world, the remaining structural items of Being-in-the-world have become visible, then this must also have prepared us, in a way, for answering the question
- **DECISION:** 

### phf-bt-0154  ·  sim 0.791  ·  prose:bt
- page 74, doc `doc-b846644a-3c5e-40`
- **STORED:** something living which has reason/discourse
- **DOC:** I. I Being and Time 73 into words. These limitations, however, are found not only in Dilthey and Bergson but in all the 'personalitic' movements to which they have given direction and in every tendency towards a philosophical anthropology. The phenomenological Interpretation of personality is in principle more radical and more transparent; but the question of the Being of Dasein has a dimension which this too fails to enter. No matter how much HusseriU and Scheler may differ in their respective inquiries, in their methods of conducting them, and in their orientations towards the world as a who
- **DECISION:** 

### phf-bt-0156  ·  sim 0.786  ·  prose:bt
- page 201, doc `doc-b846644a-3c5e-40`
- **STORED:** | (1) In circumspective interpretation the
- **DOC:** The entity which is held in our fore-having-for instance, the hammer -is proximally ready-to-hand as equipment. If this entity becomes the 'object' of an assertion, then as soon as we begin this assertion, there is already a change-over in the fore-having. Something ready-to-hand with which we have to do or perform something, turns into something 'about which' the assertion that points it out is made. Our fore-sight is aimed at something present-at-hand in what is ready-to-hand. Both by andfor this way of looking at it [Hin-sicht], the ready-to-hand becomes veiled as ready-to-hand. Within this
- **DECISION:** 

### phf-bt-0170  ·  sim 0.750  ·  prose:bt
- page 212, doc `doc-b846644a-3c5e-40`
- **STORED:** *Geschreibe*); the average understanding
- **DOC:** &amp;lt;sup&gt;2&lt;/sup&gt; 'Die Rede spricht sich zumeist aus und hat sich schon immer ausgesprochen. Sie ist Sprache.' As we have pointed out earlier (see our note 1, p. 190 H. 149 above), it is often sufficient to translate 'aussprechen' as 'express'. In the present passage, however, the contotation of 'speaking out' or 'uttering' seems especially important; we shall occasionally make it explicit in our translation by hendiadys or other devices. Being is aimed at bringing the hearer to participate in disclosed Being towards what is talked about in the discourse. In the language which is sp
- **DECISION:** 


#### Source: prose:fcm (130)

### phf-fcm-1268  ·  sim 0.899  ·  prose:fcm
- page 245, doc `doc-f84025a6-ce43-41`
- **STORED:** in having this withheld . . . the animal is precisely taken by things
- **DOC:** The captivation of the animal therefore signifies, in the first place, essentially having every apprehending of something as something withheld from it. And furthermore: in having this withheld from it, the animal is precisely taken by things. Thus animal captivation characterizes the specific manner of being in which the animal relates itself to something else even while the possibility is withheld from it—or is taken away from the animal, as we might also say—of comporting and relating itself to something else as such and such at all, as something present at hand, as a being. And it is preci
- **DECISION:** 

### phf-fcm-0168  ·  sim 0.898  ·  prose:fcm
- page 13, doc `doc-f84025a6-ce43-41`
- **STORED:** if it is as clear as day that philosophical truth is absolutely certain truth, why does precisely this endeavor … never succeed?
- **DOC:** a) Philosophy presents itself as something that concerns everyone and is understood by everyone. Philosophy is something that concerns everyone. It is not the prerogative of one human being. Perhaps this is not in doubt. From this, however, our general awareness tacitly concludes that what concerns [angeht] everyone must be understood [eingehen] by everyone. It must be accessible for everyone straightaway. This 'straightaway' means: it must be immediately clear. Immediately that is to say: clear to everyone just as they are, without further effort on the part of clear and sound common sense. W
- **DECISION:** 

### phf-fcm-0609  ·  sim 0.898  ·  prose:fcm
- page 115, doc `doc-f84025a6-ce43-41`
- **STORED:** does not now first ensue … through the absence of fullness,
- **DOC:** What is boring us: not this and not that, but an 'I know not what'. However, this indeterminate, unfamiliar thing could after all be precisely that which must leave us empty. In that case, precisely in this respect, we would find a being left empty in this boredom. Yet let us look more closely. Are we attuned in such a way, do we feel ourselves left standing by those beings within the situation? Not really. For this to be the case and to be possible, we would actually have to set out and seek to become satisfied by things in the sense indicated. But what is missing here is precisely the unease
- **DECISION:** 

### phf-fcm-0118  ·  sim 0.897  ·  prose:fcm
- page 8, doc `doc-f84025a6-ce43-41`
- **STORED:** [1.] The ambiguity in philosophizing in general; [2.] The ambiguity in our philosophizing here and now in the comportment of listeners and … the lecturer; [3.] The ambiguity of philosophical truth as such
- **DOC:** Chapter Two Ambiguity in the Essence of Philosophy (Metaphysics) Our understanding of the title of the course and the specification of our task have thus been transformed, but also the fundamental comportment in which we are to maintain ourselves in all discussions. To put it more clearly: whereas we previously knew nothing at all of a fundamental comportment of philosophizing and merely entertained the indifferent expectation of acquiring some knowledge, we now for the very first time have some idea that something like a fundamental comportment is demanded. At first we might think that fundam
- **DECISION:** 

### phf-fcm-0399  ·  sim 0.897  ·  prose:fcm
- page 65, doc `doc-f84025a6-ce43-41`
- **STORED:** the 'how' according to which one is in such and such a way
- **DOC:** manner in which infectious germs wander back and forth from one organism to another? We do indeed say that attunement or mood is infectious. Or another human being is with us, someone who through their manner of being makes everything depressing and puts a damper on everything; nobody steps out of their shell. What does this tell us? Attunements are not side-effects, but are something which in advance determine our being with one another. It seems as though an attunement is in each case already there, so to speak, like an atmosphere in which we first immerse ourselves in each case and which th
- **DECISION:** 

### phf-fcm-1454  ·  sim 0.897  ·  prose:fcm
- page 1, doc `doc-f84025a6-ce43-41`
- **STORED:** propositional truth is [not] the fundamental form of truth
- **DOC:** c) Being free, pre-logical being open for beings as such and holding oneself toward the binding character of things as the ground of the possibility of assertion. The λόγος in the form of the λόγος ἀποφαντικός is the ability for a comportment that points beings out, whether in the manner of revealing (true) or concealing (false). Such ability is possible only as this ability if it is grounded in being free for beings as such. It is upon this that being free in that pointing out that points toward and away is grounded, and this being free in . . . can then unfold as being free for revealing or 
- **DECISION:** 

### phf-fcm-0811  ·  sim 0.895  ·  prose:fcm
- page 151, doc `doc-f84025a6-ce43-41`
- **STORED:** is the expansion of the temporal horizon, whose expansion does not bring Dasein liberation… but precisely the converse in oppressing it with its expanse
- **DOC:** then more as what is now and today—expands itself into the entire expanse of the temporality of Dasein. This lengthening of the while manifests the while of Dasein in its indeterminacy that is never absolutely determinable. This indeterminacy takes Dasein captive, yet in such a way that in the whole expansive and expanded expanse it can grasp nothing except the mere fact that it remains entranced by and toward this expanse. The lengthening of the while is the expansion of the temporal horizon, whose expansion does not bring Dasein liberation or unburden it, but precisely the converse in oppres
- **DECISION:** 

### phf-fcm-0266  ·  sim 0.894  ·  prose:fcm
- page 1, doc `doc-f84025a6-ce43-41`
- **STORED:** *theion*, the divine, without yet associating this with any particular religious view
- **DOC:** moved moves, what that which moves itself is as a whole and what the Prime Mover is. All this falls into ἐπιστήμη φυσική, i.e., there is as yet no clear structuring of any individual sciences or of an accompanying philosophy of nature. This ἐπιστήμη φυσική has as its object everything that in this sense belongs to φύσις and that the Greeks designate as τὰ φυσικά. The questioning proper to these sciences dealing with φύσις is the supreme question of the Prime Mover, of what this whole of φύσις is in itself as this whole. Aristotle designates this ultimate determinant within the φύσει ὄντα as th
- **DECISION:** 

### phf-fcm-0740  ·  sim 0.894  ·  prose:fcm
- page 1, doc `doc-f84025a6-ce43-41`
- **STORED:** Beings have… become indifferent as a whole, and we ourselves as these people are not excepted.
- **DOC:** a) Being left empty as Dasein's being delivered over to beings' telling refusal of themselves as a whole. In this 'it is boring for one' we are not seeking to fill a particular emptiness one that is at hand and that has arisen through a particular situation—by means of a particular being that is accessible in a particular situation. We are not concerned with filling a particular emptiness that arises for us out of particular circumstances; for instance, out of our arriving too early at the station. Here the emptiness is not the lack of any particular fulfilment. Nor is this emptiness a self-fo
- **DECISION:** 

### phf-fcm-0876  ·  sim 0.893  ·  prose:fcm
- page 159, doc `doc-f84025a6-ce43-41`
- **STORED:** only … from out of a particular, i.e., essential boredom
- **DOC:** We must now reconsider this question as that question which announces a waiting of Dasein that keeps to itself, i.e., which provides a hold for this keeping to itself. For this is what common understanding and the so-called praxis of life and all programmaticism never understands or can understand, namely that a question is able to provide a hold. According to reason, after all, this is achieved only by the answer. The answer is a fixed proposition, a dogma, a conviction. We have now to take up this question again—Has man today in the end become boring to himself?—as the question in which we r
- **DECISION:** 

### phf-fcm-0820  ·  sim 0.892  ·  prose:fcm
- page 152, doc `doc-f84025a6-ce43-41`
- **STORED:** the third form of boredom is not an arbitrary form… but with respect to the first and second… is the more profound, i.e., at the same time the more essential.
- **DOC:** Yet even if we were to admit this definition of boredom as a definition in the usual sense, it would still have to be said that it was read off too one-sidedly from the third form of boredom, and thus is by no means universal enough to fit all forms, such as the two discussed initially. This is how it seems. We must concede that we have borrowed this definition from the third form of boredom. Yet at the same time we must recall that the third form of boredom is not an arbitrary form of boredom, but with respect to the first and second form is the more profound, i.e., at the same time the more 
- **DECISION:** 

### phf-fcm-1400  ·  sim 0.891  ·  prose:fcm
- page 307, doc `doc-f84025a6-ce43-41`
- **STORED:** the examination of these *logoi* belongs to rhetoric and poetics
- **DOC:** b) Discourse as exhibiting (λόγος ἀποφαντικός) in its possibility of revealing-concealing (άληθεύειν-ψεύδεσθαι). We have thus achieved some initial understanding of what the inner possibility of the λόγος consists in, taken in this quite broad sense. However, Aristotle says: λόγος ἄπας μὲν σημαντικός, every λόγος indeed gives something to be understood—ἀποφαντικὸς δὲ οὐ πᾶς, but not every discourse is an exhibiting, i.e., one which, in the manner in which it gives something to be understood, has the specific tendency merely to exhibit as such whatever it is referring to. By propositional state
- **DECISION:** 

### phf-fcm-0502  ·  sim 0.889  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** We are sitting … in the tasteless station of some lonely minor railway. It is four hours until the next train arrives
- **DOC:** §23. Becoming bored and passing the time. We shall not consider becoming bored and being bored in themselves, but shall consider this boredom as that which we drive away [vertreiben], or seek to drive away, namely by passing the time [Zeitvertreib]. This is not something that we resort to of our own accord, as it were, without any boredom having set in, but a passing the time which lays claim upon us specifically out of and in opposition to a particular boredom. a) Passing the time as a driving away of boredom that drives time on. We are sitting, for example, in the tasteless station of some l
- **DECISION:** 

### phf-fcm-1414  ·  sim 0.887  ·  prose:fcm
- page 334, doc `doc-f84025a6-ce43-41`
- **STORED:** having a relation to beings as such at one's disposal
- **DOC:** The form of the assertion taken as positive and true makes an interpretation of the \lambda \acute{o} \gamma o \varsigma easier, for reasons we shall not discuss now. This kind of approach in logic which starts with the positive true judgement is justified within certain limits, but for this very reason it gives rise to the fundamental illusion that it is only a matter of simply relating the other possible forms of assertion to this one in a supplementary fashion. I myself—at least in carrying out the inter- pretation of λόγος—also fell victim to this illusion in Being and Time (cf. as exempt 
- **DECISION:** 

### phf-fcm-1336  ·  sim 0.884  ·  prose:fcm
- page 267, doc `doc-f84025a6-ce43-41`
- **STORED:** a not-having . . . on the basis of a having
- **DOC:** On the basis of our interpretation of animal captivation, however, we can now see where the misinterpretation lies. The animal certainly has access to ... and indeed to something that actually is. But this is something that only we are capable of experiencing and having manifest as beings. When we claimed by way of introduction that amongst other things world means the accessibility of beings, this characterization of the concept of world is easily misunderstood because the character of world remains underdetermined here. We must say that world does not mean the accessibility of beings but rat
- **DECISION:** 

### phf-fcm-1127  ·  sim 0.883  ·  prose:fcm
- page 194, doc `doc-f84025a6-ce43-41`
- **STORED:** Poverty in world implies a deprivation of world. Worldlessness … is constitutive of the stone in the sense that the stone cannot even be deprived
- **DOC:** But then the relation between the second thesis and the first, according to which the stone is worldless, instantly becomes problematic because there no longer seems to be any distinction between them. The stone is worldless, it is without world, it has no world. Neither the stone nor the animal has world. But this not-having of world is not to be understood in the same sense in each case. The different expressions worldlessness and poverty in world already indicate that there is indeed a distinction here. But if the animal is thus brought into such proximity to the stone, then we immediately 
- **DECISION:** 

### phf-fcm-0390  ·  sim 0.882  ·  prose:fcm
- page 65, doc `doc-f84025a6-ce43-41`
- **STORED:** like an atmosphere in which we first immerse ourselves … and which then attunes us through and through
- **DOC:** manner in which infectious germs wander back and forth from one organism to another? We do indeed say that attunement or mood is infectious. Or another human being is with us, someone who through their manner of being makes everything depressing and puts a damper on everything; nobody steps out of their shell. What does this tell us? Attunements are not side-effects, but are something which in advance determine our being with one another. It seems as though an attunement is in each case already there, so to speak, like an atmosphere in which we first immerse ourselves in each case and which th
- **DECISION:** 

### phf-fcm-0556  ·  sim 0.881  ·  prose:fcm
- page 1, doc `doc-f84025a6-ce43-41`
- **STORED:** a sign that … our passing the time is not really succeeding
- **DOC:** b) Passing the time and looking at our watch. Becoming bored as being affected in a paralysing way by time as it drags. Strange: in this way we experience many kinds of things, yet it is precisely boredom itself that we cannot manage to grasp—almost as though we were looking for something that does not exist at all. It is not all the things we thought it was. It vanishes and flutters away from us. And yet—this impatient waiting, the walking up and down, counting trees, and all the other abandoned activities attest precisely to the fact that the boredom is there. We confirm and reinforce this e
- **DECISION:** 

### phf-fcm-0129  ·  sim 0.881  ·  prose:fcm
- page 9, doc `doc-f84025a6-ce43-41`
- **STORED:** creative thinking and moral concern yields
- **DOC:** This dual semblance of being a science and worldview brings about a constant insecurity in philosophy. On the one hand, it seems as though one could not furnish philosophy with enough scientific knowledge and experience—and yet this 'never enough' of scientific knowledge is always too much at the decisive moment. On the other hand, philosophy—so it seems at first—demands that its knowledge be practically applied, as it were, and transformed into factical life. Yet it is always evident too that this moral concern remains superficial to philosophizing. It looks as though creative thinking and mo
- **DECISION:** 

### phf-fcm-0339  ·  sim 0.881  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** **take action within metaphysics itself**,
- **DOC:** Whenever we survey our whole discussion of the concept of metaphysics, we see that this title expresses a knowledge that is directed toward beings as a whole. At the same time, we can see that this expression 'as a whole' is a term which contains the real problem—the problem that must first be posed in general and cannot be made to vanish out of existence by taking over various opinions from the tradition. It is thus clear that we cannot simply take the title 'metaphysics' in its traditional meaning. We are taking over the expression 'metaphysics' as the title of a problem, better, as a title 
- **DECISION:** 

### phf-fcm-0395  ·  sim 0.880  ·  prose:fcm
- page 65, doc `doc-f84025a6-ce43-41`
- **STORED:** sets the tone for such being, i.e., attunes and determines the manner and way … of his being
- **DOC:** manner in which infectious germs wander back and forth from one organism to another? We do indeed say that attunement or mood is infectious. Or another human being is with us, someone who through their manner of being makes everything depressing and puts a damper on everything; nobody steps out of their shell. What does this tell us? Attunements are not side-effects, but are something which in advance determine our being with one another. It seems as though an attunement is in each case already there, so to speak, like an atmosphere in which we first immerse ourselves in each case and which th
- **DECISION:** 

### phf-fcm-0805  ·  sim 0.879  ·  prose:fcm
- page 149, doc `doc-f84025a6-ce43-41`
- **STORED:** the Dasein in us oscillates out into the expanse of the temporal horizon… and thus is able only to oscillate into the moment of vision pertaining to essential action
- **DOC:** It is boring for one. Entranced in the expanse of the temporal horizon and yet thereby impelled into the extremity of the moment of vision as that which properly makes possible, that which can announce itself as such only if it imposes itself compellingly as something possible—this is what occurs in such boredom. It happens in accordance with its essence neither in such a way that we are merely blindly abandoned to this entrancement, nor such that we can grasp the moment of vision, but in such a way that we are told of both—simultaneously in telling refusal and telling announcement. Both—which
- **DECISION:** 

### phf-fcm-1300  ·  sim 0.877  ·  prose:fcm
- page 256, doc `doc-f84025a6-ce43-41`
- **STORED:** [1.] withholding; [2.] being taken; [3.] absorption; [4.] openness for something else; [5.] the structure of encirclement thus given; and … [6.] … captivation is the condition of the possibility of any kind of behaviour
- **DOC:** 1. F. J. J. Buytendijk, Zur Untersuchung des Wesensunterschieds von Mensch und Tier. In: Blätter für Deutsche Philosophie. Vol. 3 (Berlin, 1929-30), p. 47. [1.] Captivation is withholding of the possibility of the manifestness of beings, a withholding which is essential and not merely an enduring or temporary one. An animal can only behave [sich . . . benehmen] but can never apprehend [vernehmen] something as something—which is not to deny that the animal sees or even perceives. Yet in a fundamental sense the animal does not have perception. [2.] The captivation of such behaviour is at the sam
- **DECISION:** 

### phf-fcm-0213  ·  sim 0.876  ·  prose:fcm
- page 20, doc `doc-f84025a6-ce43-41`
- **STORED:** being wise, the *to sophon* [philosophy], is something separated off from everything else
- **DOC:** Thus far, we have attempted to grasp philosophizing itself—albeit only in a provisional way—in contrast to our initial detours. We have done so in two ways. First, we clarified philosophical questioning by way of our interpretation of a word of Novalis: philosophizing is homesickness, the urge to be at home everywhere. Second, we characterized the unique ambiguity proper to philosophizing. From all this we may conclude that philosophy is something autonomous that stands on its own. We may neither take it as a science among others, nor as something that we find only whenever we question the sci
- **DECISION:** 

### phf-fcm-0764  ·  sim 0.876  ·  prose:fcm
- page 141, doc `doc-f84025a6-ce43-41`
- **STORED:** peculiar impoverishment… first brings the self in all its nakedness to itself as the self that is there and has taken over the being-there of its Da-sein
- **DOC:** For whom then? Not for me as me, not for me with these particular prospective intentions and so on. For the nameless and undetermined I, then? No, but presumably for the self whose name, status and the like have become irrelevant, and which is itself drawn into indifference. Yet the self of Dasein that is becoming irrelevant in all this does not thereby lose its determinacy, but rather the reverse, for this peculiar impoverishment which sets in with respect to ourselves in this 'it is boring for one' first brings the self in all its nakedness to itself as the self that is there and has taken o
- **DECISION:** 

### phf-fcm-0825  ·  sim 0.874  ·  prose:fcm
- page 153, doc `doc-f84025a6-ce43-41`
- **STORED:** as though the first were the cause of the second and… the second passed into the third.
- **DOC:** Yet why are we pointing precisely now to such a thing, i.e., to the problem of the essentiality of philosophical questioning, at this stage where we have apparently more or less reached a conclusion in our interpretation of the essence of boredom? We do so in order to prevent it appearing as though we had now-absolutely, as it were-illuminated boredom in itself; and in order at the same time to indicate in a positive manner and in advance that the characterization of the essentiality of the third form of boredom itself depends upon a hitherto inexplicit philosophical engagement that we may not
- **DECISION:** 

### phf-fcm-1391  ·  sim 0.871  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** is what it is … only and always as the moment of vision [*Augenblick*]
- **DOC:** With this fundamental attitude, which unwittingly comes into play from the outset, death, man's relationship toward death, is already taken as something present at hand. Since the ordinary understanding considers that which properly is to be that which is always present at hand, it sees the proper authenticity of existence in the permanent presence at hand of this relationship toward death, in this constant thinking about death. In this fundamental attitude, from which none of us may consider ourselves free, what is overlooked from the outset is that the fundamental character of existence, of 
- **DECISION:** 

### phf-fcm-0220  ·  sim 0.871  ·  prose:fcm
- page 20, doc `doc-f84025a6-ce43-41`
- **STORED:** lies prior to every occupation and constitutes the fundamental occurrence (*Grundgeschehen*) of Dasein, something autonomous that stands on its own
- **DOC:** Thus far, we have attempted to grasp philosophizing itself—albeit only in a provisional way—in contrast to our initial detours. We have done so in two ways. First, we clarified philosophical questioning by way of our interpretation of a word of Novalis: philosophizing is homesickness, the urge to be at home everywhere. Second, we characterized the unique ambiguity proper to philosophizing. From all this we may conclude that philosophy is something autonomous that stands on its own. We may neither take it as a science among others, nor as something that we find only whenever we question the sci
- **DECISION:** 

### phf-fcm-1279  ·  sim 0.871  ·  prose:fcm
- page 251, doc `doc-f84025a6-ce43-41`
- **STORED:** is open for . . . stimuli, for that which initiates, i.e., disinhibits the capability
- **DOC:** animal's behaviour fundamentally as a self-comportment toward beings as such. Yet that is precisely what is impossible. However this also implies that animals do not comport themselves indifferently with respect to beings either. For such indifference would also represent a relation to beings as such. But if behaviour is not a relation to beings, does this mean that it is a relation to nothing? Not at all. Yet if it is not a relation to nothing, it must always be a relation to something, which surely must itself be and actually is. Certainly, but the question is whether behaviour is not precis
- **DECISION:** 

### phf-fcm-0746  ·  sim 0.870  ·  prose:fcm
- page 136, doc `doc-f84025a6-ce43-41`
- **STORED:** a telling refusal [*Versagen*] on the part of beings as a whole with respect to these possibilities.
- **DOC:** Before we ask how we must grasp this emptiness more closely and how, correspondingly, being left empty is to be determined, we shall summarize our interpretation of profound boredom thus far. We are considering a third boredom which is meant to bring us closer to the depths of the essence of boredom, not by way of a construction of boredom in terms of time (which must be possible in principle) but in the same way as with the previous forms. From the outside this looks as though we have simply compiled an arbitrary list of the variations of boredom in general. And yet we have already seen a cer
- **DECISION:** 

### phf-fcm-0828  ·  sim 0.869  ·  prose:fcm
- page 153, doc `doc-f84025a6-ce43-41`
- **STORED:** Only because this constant possibility — the 'it is boring for one' — lurks in the ground of Dasein can man be bored… by the things and people around him
- **DOC:** Yet why are we pointing precisely now to such a thing, i.e., to the problem of the essentiality of philosophical questioning, at this stage where we have apparently more or less reached a conclusion in our interpretation of the essence of boredom? We do so in order to prevent it appearing as though we had now-absolutely, as it were-illuminated boredom in itself; and in order at the same time to indicate in a positive manner and in advance that the characterization of the essentiality of the third form of boredom itself depends upon a hitherto inexplicit philosophical engagement that we may not
- **DECISION:** 

### phf-fcm-0451  ·  sim 0.869  ·  prose:fcm
- page 75, doc `doc-f84025a6-ce43-41`
- **STORED:** we must find ourselves by binding ourselves to our being-there … and by letting such being-there become what is singularly binding for us
- **DOC:** We do not ultimately need any diagnoses or prognoses of culture in order to make sure of our situation, because they merely provide us with a role and untie us from ourselves, instead of helping us to want to find ourselves. Yet how are we to find ourselves—in some vain self-reflection, in that repugnant sniffing out of everything psychological which today has exceeded all measure? Or are we to find ourselves in such a way that we are thereby given back to ourselves, that is, given back to ourselves, so that we are given over to ourselves, given over to the task of becoming what we are? We may
- **DECISION:** 

### phf-fcm-0536  ·  sim 0.868  ·  prose:fcm
- page 99, doc `doc-f84025a6-ce43-41`
- **STORED:** we are also taken [*hingenommen*] by things, if not altogether lost in them … even captivated [*benommen*]
- **DOC:** d) Being left empty by the refusal of things, and an insight into its possible connection with being held in limbo by time as it drags. Just as we will hardly dispute altogether that this being held in limbo belongs to becoming bored, we will certainly insist that being held in limbo does not alone constitute boredom. For in passing the time we simultaneously seek to occupy ourselves with something. Yet how do we go about this? Is it by forcing ourselves to go to work despite there being a pleasant snowfall on the hills? No, in passing the time we seek for something to occupy us; though certai
- **DECISION:** 

### phf-fcm-0081  ·  sim 0.867  ·  prose:fcm
- page 3, doc `doc-f84025a6-ce43-41`
- **STORED:** the unrest of this 'not' we name **finitude**
- **DOC:** Let us remain with the issue and ask: What is all this talk about philosophy as homesickness? Novalis himself elucidates: "an urge to be everywhere at home." Philosophy can only be such an urge if we who philosophize are not at home everywhere. What is demanded by this urge? To be at home everywhere—what does that mean? Not merely here or there, nor even simply in every place, in all places taken together one after the other. Rather, to be at home everywhere means to be at once and at all times within the whole. We name this 'within the whole' and its character of wholeness the world. We are, 
- **DECISION:** 

### phf-fcm-0720  ·  sim 0.867  ·  prose:fcm
- page 132, doc `doc-f84025a6-ce43-41`
- **STORED:** for me as me, not for you as you… but for one
- **DOC:** The forms of boredom we have dealt with hitherto have already been characterized and designated as becoming bored by something in a particular situation, and as being bored with something on the occasion of a particular situation. And profound boredom? How are we to designate this? We shall try to do so, and shall say that profound boredom bores whenever we say, or better, whenever we silently know, that it is boring for one. It is boring for one. What is this 'it'? The 'it' that we mean whenever we say that it is thundering and lightening, that it is raining. It—this is the title for whatever
- **DECISION:** 

### phf-fcm-0748  ·  sim 0.867  ·  prose:fcm
- page 136, doc `doc-f84025a6-ce43-41`
- **STORED:** left entirely in the lurch… not only not occupied with this or that being… but as a whole.
- **DOC:** Before we ask how we must grasp this emptiness more closely and how, correspondingly, being left empty is to be determined, we shall summarize our interpretation of profound boredom thus far. We are considering a third boredom which is meant to bring us closer to the depths of the essence of boredom, not by way of a construction of boredom in terms of time (which must be possible in principle) but in the same way as with the previous forms. From the outside this looks as though we have simply compiled an arbitrary list of the variations of boredom in general. And yet we have already seen a cer
- **DECISION:** 

### phf-fcm-0800  ·  sim 0.867  ·  prose:fcm
- page 148, doc `doc-f84025a6-ce43-41`
- **STORED:** not solved… but merely grasped in its nucleus
- **DOC:** We have attempted to explicate the temporal character of the third form of boredom. We can conclude from all that has been said hitherto that here we encounter a limit to this investigation, and that therefore the investigation necessarily has a peculiar difficulty compared to all our earlier ones. There are two reasons for this difficulty. The first lies in the essence of this boredom itself, insofar as this boredom conceals its temporal character in a distinct sense, or in any case conceals it to all appearances; secondly, the reason for the difficulty in carrying out the demonstration we ha
- **DECISION:** 

### phf-fcm-1220  ·  sim 0.864  ·  prose:fcm
- page 228, doc `doc-f84025a6-ce43-41`
- **STORED:** insect eye… approached through a most remarkable experiment
- **DOC:** On the basis of its drive-character, capacity is intrinsically characterized as something subservient rather than as something present at hand which is serviceable for. . . . For a drive is never present at hand. As something which drives, it is essentially on the way to . . . , always driving on toward . . . —it is something that submits to itself, something which is intrinsically service and subservient. That which the capacity as such allows to arise and brings into relation to itself, namely the organ, is thus taken into service or released from service (as in the case of atrophy). An inst
- **DECISION:** 

### phf-fcm-0804  ·  sim 0.864  ·  prose:fcm
- page 148, doc `doc-f84025a6-ce43-41`
- **STORED:** it is not some now-point that we simply ascertain, but is the look of Dasein in the three perspectival directions… present, future, and past
- **DOC:** We have attempted to explicate the temporal character of the third form of boredom. We can conclude from all that has been said hitherto that here we encounter a limit to this investigation, and that therefore the investigation necessarily has a peculiar difficulty compared to all our earlier ones. There are two reasons for this difficulty. The first lies in the essence of this boredom itself, insofar as this boredom conceals its temporal character in a distinct sense, or in any case conceals it to all appearances; secondly, the reason for the difficulty in carrying out the demonstration we ha
- **DECISION:** 

### phf-fcm-0140  ·  sim 0.864  ·  prose:fcm
- page 9, doc `doc-f84025a6-ce43-41`
- **STORED:** makes no difference to us … if we pass it by
- **DOC:** This dual semblance of being a science and worldview brings about a constant insecurity in philosophy. On the one hand, it seems as though one could not furnish philosophy with enough scientific knowledge and experience—and yet this 'never enough' of scientific knowledge is always too much at the decisive moment. On the other hand, philosophy—so it seems at first—demands that its knowledge be practically applied, as it were, and transformed into factical life. Yet it is always evident too that this moral concern remains superficial to philosophizing. It looks as though creative thinking and mo
- **DECISION:** 

### phf-fcm-0757  ·  sim 0.862  ·  prose:fcm
- page 138, doc `doc-f84025a6-ce43-41`
- **STORED:** here in the third form… there is nothing to be found here of time
- **DOC:** It is now a matter of seeing how, in boredom, being left empty is associated with this other structural moment. Yet once again we may not simply presuppose this association on the basis of what has gone before. It is rather a matter of seeing this association of being left empty and being held in limbo anew and from out of the essence of this boredom itself. Therefore—almost as though we knew nothing at all of the second structural moment—we must ask: To what extent is the specific being left empty of this third form of boredom in itself associated in general with something else? Boredom and i
- **DECISION:** 

### phf-fcm-0234  ·  sim 0.861  ·  prose:fcm
- page 23, doc `doc-f84025a6-ce43-41`
- **STORED:** encompass[ing] both, and even in a certain way includ[ing] divine beings
- **DOC:** a) Elucidation of the word φυσικά. φύσις as the self-forming prevailing of beings as a whole. We shall begin our elucidation of the context of the word with the last-mentioned term: φυσικά. In it lies φύσις, which we customarily translate as nature. This word itself comes from the Latin natura—nasci: to be born, to arise, to grow. This is also the fundamental meaning of the Greek φύσις, φύειν. Φύσις means that which is growing, growth, that which has itself grown in such growth. We here take growth and growing, however, in the quite elementary and broad sense in which it irrupts in the primal 
- **DECISION:** 

### phf-fcm-1182  ·  sim 0.858  ·  prose:fcm
- page 210, doc `doc-f84025a6-ce43-41`
- **STORED:** The word 'organ' derives from the Greek *organon* or 'instrument'. The Greek word *ergon* is the same as the German word *Werk*
- **DOC:** The most common way of characterizing the living being as such is to define it in terms of the organic as opposed to the inorganic. Of course this distinction immediately appears questionable and quite misleading as soon as we think about organic and inorganic chemistry and recall that organic chemistry is anything but a science of the organic in the sense of the living being as such. It is called organic chemistry precisely because the organic in the sense of the living being remains inaccessible to it in principle. What we mean by describing the character of the living being as 'organic' is 
- **DECISION:** 

### phf-fcm-0289  ·  sim 0.858  ·  prose:fcm
- page 37, doc `doc-f84025a6-ce43-41`
- **STORED:** now no longer means that which comes after the doctrines on physics, but that which deals with whatever turns away from the *physika* and turns toward... beings in general and toward that being which properly is
- **DOC:** μετά has a further meaning in Greek, however, which is connected with the first. If I go behind a matter and go after it, in so doing I move away from one matter and over to another, i.e., I turn myself 'around' in a certain respect. We have this meaning of μετά in the sense of 'away from something toward something else' in the Greek word μεταβολή (changeover [Umschlag]). In condensing the Greek title τὰ μετὰ τὰ φυσικά into the Latin expression metaphysica, the μετά has altered its meaning. The meaning of changeover, of 'turning away from one matter toward another', of 'going from one over to 
- **DECISION:** 

### phf-fcm-0331  ·  sim 0.857  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** the I is precisely **not** put in question
- **DOC:** What is the fundamental trait of modern metaphysics? Modern metaphysics is determined by the fact that the entirety of the traditional problematic comes under the aspect of a new science, which is represented by mathematical natural science. The less explicit train of thought is this: if metaphysics asks concerning the first causes, concerning the most general and highest meaning of beings, in short concerning what is highest, ultimate, and supreme, then this kind of knowing must be commensurate with what is asked about. Yet that means: it must itself be absolutely certain. Thus, via the guidi
- **DECISION:** 

### phf-fcm-0492  ·  sim 0.857  ·  prose:fcm
- page 84, doc `doc-f84025a6-ce43-41`
- **STORED:** Wearisome means: it does not rivet us; we are … not taken [*hingenommen*] by it, but merely held in limbo [*hingehalten*] by it. Tedious means: it does not engross us, we are left empty [*leer gelassen*]
- **DOC:** fore belong to the object and yet are taken from the subject. Yet these are contradictory, incompatible determinations. In any case we are unable to see how they are possible in their unity. Nor has it been decided whether this twofold characterization actually fits the facts of the matter at all, or whether it does not rather distort them from the outset, no matter how self-evident it may appear. Yet if we are thus unclear about the general characteristic of the boringness of a thing taken as a property, may we then hope to explain this particular property in the right way? Do we then not sim
- **DECISION:** 

### phf-fcm-0700  ·  sim 0.856  ·  prose:fcm
- page 127, doc `doc-f84025a6-ce43-41`
- **STORED:** having no time … the most rigorous seriousness … perhaps the way in which we are most lost
- **DOC:** In the face of this difficulty, which imposes itself of its own accord, we must indeed initially hold fast to the fact that the distinction exposed earlier between the two forms of boredom (with respect to the second form of boredom being essentially anchored in Dasein as such) resulted from boredom and its structure. In the face of this distinction which lies in the matter itself it can be of no consequence that the situation in the first form, as a situation, is perhaps of greater intensity than that in the second form. Certainly—in both cases the kind of situation is not accidental to the c
- **DECISION:** 

### phf-fcm-0085  ·  sim 0.855  ·  prose:fcm
- page 3, doc `doc-f84025a6-ce43-41`
- **STORED:** that solitariness in which each human being first… enters into a nearness to… world
- **DOC:** Let us remain with the issue and ask: What is all this talk about philosophy as homesickness? Novalis himself elucidates: "an urge to be everywhere at home." Philosophy can only be such an urge if we who philosophize are not at home everywhere. What is demanded by this urge? To be at home everywhere—what does that mean? Not merely here or there, nor even simply in every place, in all places taken together one after the other. Rather, to be at home everywhere means to be at once and at all times within the whole. We name this 'within the whole' and its character of wholeness the world. We are, 
- **DECISION:** 

### phf-fcm-0280  ·  sim 0.855  ·  prose:fcm
- page 34, doc `doc-f84025a6-ce43-41`
- **STORED:** gathered and order[ed]... the entire corpus of Aristotelian treatises
- **DOC:** When the attempt is made to slot the entire stock of ancient philosophizing into scholastic disciplines, then this simultaneously means that the manner of knowing is no longer a living philosophizing from out of the problems themselves, but takes place in the manner in which domains of knowledge are elsewhere dealt with in the sciences. The manner in which these domains of philosophy are dealt with now becomes a science, ἐπιστήμη in the Aristotelian sense. There arises the ἐπιστήμη λογική, followed by the ἐπιστήμη φυσική; and the ἐπιστήμη ἡθική completes things. In this way there ensue three d
- **DECISION:** 

### phf-fcm-1206  ·  sim 0.855  ·  prose:fcm
- page 224, doc `doc-f84025a6-ce43-41`
- **STORED:** only because the capacity is intrinsically subservient.
- **DOC:** To say that a finished product is ready not only means that it is [1.] completed, and [2.] serviceable for . . . , but also means that it is [3.] incapable of getting any further in its specific being as such (equipmental being). It is now completed, that is, it is and remains something that can be called upon and used precisely as something produced and only as such. In its equipmental being it indeed enables and prescribes a particular application in each case. But with regard to this application, and how it takes place or whether it takes place or not, the equipment not only has no part to 
- **DECISION:** 

### phf-fcm-1280  ·  sim 0.850  ·  prose:fcm
- page 251, doc `doc-f84025a6-ce43-41`
- **STORED:** other is taken up into this openness . . . in a manner that we shall describe as **disinhibition** [*Enthemmung*]
- **DOC:** animal's behaviour fundamentally as a self-comportment toward beings as such. Yet that is precisely what is impossible. However this also implies that animals do not comport themselves indifferently with respect to beings either. For such indifference would also represent a relation to beings as such. But if behaviour is not a relation to beings, does this mean that it is a relation to nothing? Not at all. Yet if it is not a relation to nothing, it must always be a relation to something, which surely must itself be and actually is. Certainly, but the question is whether behaviour is not precis
- **DECISION:** 

### phf-fcm-0753  ·  sim 0.849  ·  prose:fcm
- page 138, doc `doc-f84025a6-ce43-41`
- **STORED:** the very possibilities of [Dasein's] doing and acting
- **DOC:** It is now a matter of seeing how, in boredom, being left empty is associated with this other structural moment. Yet once again we may not simply presuppose this association on the basis of what has gone before. It is rather a matter of seeing this association of being left empty and being held in limbo anew and from out of the essence of this boredom itself. Therefore—almost as though we knew nothing at all of the second structural moment—we must ask: To what extent is the specific being left empty of this third form of boredom in itself associated in general with something else? Boredom and i
- **DECISION:** 

### phf-fcm-1006  ·  sim 0.843  ·  prose:fcm
- page 172, doc `doc-f84025a6-ce43-41`
- **STORED:** in fact ... necessarily different in every instance
- **DOC:** §41. The beleaguering of the three questions by tradition and by sound common sense. If we take them as they initially presented themselves to us, then surely our three questions—What is world? What is finitude? What is individuation?—simply ask about something with which we are all already familiar. Certainly all the questions of philosophy are of a such a kind that we could almost say that the more philosophy concerns itself with a problem completely unfamiliar to everyday awareness, then the more philosophy is avoiding the central issues and concerning itself with the inessential. The more 
- **DECISION:** 

### phf-fcm-0328  ·  sim 0.843  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** **the problem of absolute certainty is... the fundamental problem of modern philosophy**,
- **DOC:** What is the fundamental trait of modern metaphysics? Modern metaphysics is determined by the fact that the entirety of the traditional problematic comes under the aspect of a new science, which is represented by mathematical natural science. The less explicit train of thought is this: if metaphysics asks concerning the first causes, concerning the most general and highest meaning of beings, in short concerning what is highest, ultimate, and supreme, then this kind of knowing must be commensurate with what is asked about. Yet that means: it must itself be absolutely certain. Thus, via the guidi
- **DECISION:** 

### phf-fcm-0089  ·  sim 0.842  ·  prose:fcm
- page 5, doc `doc-f84025a6-ce43-41`
- **STORED:** all such being gripped… comes from and remains in an attunement [*Stimmung*]
- **DOC:** Above all, however, we shall never have comprehended these concepts [Begriffe] and their conceptual rigor unless we have first been gripped [ergriffen]&lt;sup&gt;3&lt;/sup&gt; by whatever they are supposed to comprehend. The fundamental concern of philosophizing pertains to such being gripped, to awakening and planting it. All such being gripped, however, comes from and remains in an attunement [Stimmung]. To the extent that conceptual comprehending and philosophizing is not some arbitrary enterprise alongside others, but happens in the ground [Grunde] of human Dasein, the attunements out of w
- **DECISION:** 

### phf-fcm-0371  ·  sim 0.841  ·  prose:fcm
- page 61, doc `doc-f84025a6-ce43-41`
- **STORED:** potential to be away … belongs to the way in which man is in general,
- **DOC:** c) The being-there and not-being-there of attunement on the grounds of man's being as being-there and being-away (being absent). That it is by no means a matter of the distinction between consciousness and unconsciousness in the case of man when we speak of this simultaneous being-there [Da-sein] and not-being-there [Nicht-Da-sein] becomes clear from an occurrence that happens when we are quite awake, if for the moment we posit awakeness as conscious life in contrast to unconscious life (sleep). How often it happens, in a conversation among a group of people, that we are 'not there', how often
- **DECISION:** 

### phf-fcm-0598  ·  sim 0.839  ·  prose:fcm
- page 112, doc `doc-f84025a6-ce43-41`
- **STORED:** in accepting the invitation … we have given ourselves time; we have time for it and leave ourselves time for it,
- **DOC:** If therefore we say that in the second instance there is nothing boring to be found, this then means: there is no being we can determinately name, or no determinate context of such beings, that bores us directly. It does not at all mean, on the other hand, that nothing boring is to be found here at all. The comparison of the two forms of boredom shows that in the first form we have a determinate boring thing, whereas in the second form we have something indeterminate that bores us. That determinacy of the whole situation in accordance with which we are forced into it in a peculiar way is bound
- **DECISION:** 

### phf-fcm-1194  ·  sim 0.839  ·  prose:fcm
- page 218, doc `doc-f84025a6-ce43-41`
- **STORED:** is ready for writing, but it has no capacity for writing
- **DOC:** for. When something is in such a way as to serve for . . . , then it bestows the possibility of something else. That which is serviceable can only bestow possibility in this sense if, as something serviceable, it has a possibility. Having a possibility here cannot mean being equipped with a property. Rather it means being in such a way in accordance with its own essence that having possibility lies in its being in this way. It means that the latter, its being in such a way, is nothing other than the former, its having possibility. In the case of organ and equipment alike, serving for something
- **DECISION:** 

### phf-fcm-0278  ·  sim 0.838  ·  prose:fcm
- page 34, doc `doc-f84025a6-ce43-41`
- **STORED:** first explicitly introduced by those around **Xenocrates** and the pupils of Aristotle... as well as the Stoics
- **DOC:** When the attempt is made to slot the entire stock of ancient philosophizing into scholastic disciplines, then this simultaneously means that the manner of knowing is no longer a living philosophizing from out of the problems themselves, but takes place in the manner in which domains of knowledge are elsewhere dealt with in the sciences. The manner in which these domains of philosophy are dealt with now becomes a science, ἐπιστήμη in the Aristotelian sense. There arises the ἐπιστήμη λογική, followed by the ἐπιστήμη φυσική; and the ἐπιστήμη ἡθική completes things. In this way there ensue three d
- **DECISION:** 

### phf-fcm-0184  ·  sim 0.838  ·  prose:fcm
- page 16, doc `doc-f84025a6-ce43-41`
- **STORED:** The truth of philosophizing is in part rooted in the fate (*Geschick*) of Dasein
- **DOC:** First: precisely because this argument is so easy to bring up at any time, it has essentially nothing to say. It is completely empty and non-binding. It is an argument that does not relate to philosophy at all with respect to its inner content, but is a formal argumentation which forces every speaker back into self-contradiction. If the argument were able to have the force and range expected of it in such circumstances, then surely—at least for those who want to see everything based upon such certainty and certain proofs—it would have to be proven in advance that this empty trick employing for
- **DECISION:** 

### phf-fcm-0152  ·  sim 0.836  ·  prose:fcm
- page 12, doc `doc-f84025a6-ce43-41`
- **STORED:** the question of what the character of philosophical truth … is in general
- **DOC:** §6. The truth of philosophy and its ambiguity. In our preliminary appraisal thus far we have, in a provisional way, gained a characterization of metaphysics as a comprehensive thinking, a questioning which in every question, and not just in its results, questions the whole. Every question concerning the whole also comprehends within itself the questioner, puts the questioner into question from the perspective of the whole. We have sought to characterize the whole from one perspective, which looks like something psychological, the perspective of what we called the ambiguity of philosophizing. T
- **DECISION:** 

### phf-fcm-0191  ·  sim 0.833  ·  prose:fcm
- page 16, doc `doc-f84025a6-ce43-41`
- **STORED:** no knower necessarily stands so close to the verge of error … as the one who philosophizes
- **DOC:** First: precisely because this argument is so easy to bring up at any time, it has essentially nothing to say. It is completely empty and non-binding. It is an argument that does not relate to philosophy at all with respect to its inner content, but is a formal argumentation which forces every speaker back into self-contradiction. If the argument were able to have the force and range expected of it in such circumstances, then surely—at least for those who want to see everything based upon such certainty and certain proofs—it would have to be proven in advance that this empty trick employing for
- **DECISION:** 

### phf-fcm-0445  ·  sim 0.833  ·  prose:fcm
- page 74, doc `doc-f84025a6-ce43-41`
- **STORED:** our flight and disorientation, the illusion and our lostness become more acute
- **DOC:** Perhaps—precisely if and because we are striving to awaken a fundamental attunement—we must indeed proceed from an 'expression' in which we are merely set out. Perhaps this awakening of a fundamental attunement indeed looks like an ascertaining [Fest-stellung], yet is something other than settingout or ascertaining. Accordingly, if we cannot escape the fact that everything we are saying looks like a setting out of our situation, and seems as though it is ascertaining an attunement that underlies this situation and ex-presses itself [sich aus-drückt] in the situation; if we cannot deny this sem
- **DECISION:** 

### phf-fcm-0881  ·  sim 0.831  ·  prose:fcm
- page 159, doc `doc-f84025a6-ce43-41`
- **STORED:** everywhere there are disruptions, confusion, crises, catastrophes
- **DOC:** We must now reconsider this question as that question which announces a waiting of Dasein that keeps to itself, i.e., which provides a hold for this keeping to itself. For this is what common understanding and the so-called praxis of life and all programmaticism never understands or can understand, namely that a question is able to provide a hold. According to reason, after all, this is achieved only by the answer. The answer is a fixed proposition, a dogma, a conviction. We have now to take up this question again—Has man today in the end become boring to himself?—as the question in which we r
- **DECISION:** 

### phf-fcm-0586  ·  sim 0.829  ·  prose:fcm
- page 109, doc `doc-f84025a6-ce43-41`
- **STORED:** however much it fights against boredom, … also firmly captures it at the same time
- **DOC:** Passing the time is not lacking in this boredom either. Nor is it hidden or repressed, but presumably transformed in a particular way. How can we catch sight of this, without distorting the situation in any way? The yawning and the wanting to drum our fingers were a flaring up, as it were, of the kind of passing the time that we are acquainted with, in which we somehow seek to occupy ourselves. It is merely a matter of correctly seeing this flaring up of passing the time—not of viewing it in terms of isolated incidents, but of understanding it in the context of the whole situation of the eveni
- **DECISION:** 

### phf-fcm-0603  ·  sim 0.827  ·  prose:fcm
- page 114, doc `doc-f84025a6-ce43-41`
- **STORED:** inconspicuousness … insofar as passing the time does not specifically occupy us ourselves as such.
- **DOC:** b) Obstructive casualness as the deepening manner in which we are left empty by what is boring us. Being left empty in a self-forming emptiness. What is the result of our contrasting the two forms of boredom with one another? The result is evidently that we are not at all able to grasp the second form with the aid of the structure which we found in the first form. Thus a comparison becomes altogether impracticable. Stated positively, this means that we must interpret the second form of boredom purely on its own terms. without glancing sideways at the structure of the first, and must do so by u
- **DECISION:** 

### phf-fcm-0230  ·  sim 0.825  ·  prose:fcm
- page 23, doc `doc-f84025a6-ce43-41`
- **STORED:** neither... a broad, pre-scientific sense, nor... Goethe's sense
- **DOC:** a) Elucidation of the word φυσικά. φύσις as the self-forming prevailing of beings as a whole. We shall begin our elucidation of the context of the word with the last-mentioned term: φυσικά. In it lies φύσις, which we customarily translate as nature. This word itself comes from the Latin natura—nasci: to be born, to arise, to grow. This is also the fundamental meaning of the Greek φύσις, φύειν. Φύσις means that which is growing, growth, that which has itself grown in such growth. We here take growth and growing, however, in the quite elementary and broad sense in which it irrupts in the primal 
- **DECISION:** 

### phf-fcm-0231  ·  sim 0.824  ·  prose:fcm
- page 23, doc `doc-f84025a6-ce43-41`
- **STORED:** are not events in the narrow, present-day sense of a... biological process
- **DOC:** a) Elucidation of the word φυσικά. φύσις as the self-forming prevailing of beings as a whole. We shall begin our elucidation of the context of the word with the last-mentioned term: φυσικά. In it lies φύσις, which we customarily translate as nature. This word itself comes from the Latin natura—nasci: to be born, to arise, to grow. This is also the fundamental meaning of the Greek φύσις, φύειν. Φύσις means that which is growing, growth, that which has itself grown in such growth. We here take growth and growing, however, in the quite elementary and broad sense in which it irrupts in the primal 
- **DECISION:** 

### phf-fcm-0449  ·  sim 0.824  ·  prose:fcm
- page 74, doc `doc-f84025a6-ce43-41`
- **STORED:** Perhaps because we ourselves have become bored with ourselves? … Do things ultimately stand in such a way with us that a *profound boredom* draws back and forth like a silent fog in the abysses of Dasein?
- **DOC:** Perhaps—precisely if and because we are striving to awaken a fundamental attunement—we must indeed proceed from an 'expression' in which we are merely set out. Perhaps this awakening of a fundamental attunement indeed looks like an ascertaining [Fest-stellung], yet is something other than settingout or ascertaining. Accordingly, if we cannot escape the fact that everything we are saying looks like a setting out of our situation, and seems as though it is ascertaining an attunement that underlies this situation and ex-presses itself [sich aus-drückt] in the situation; if we cannot deny this sem
- **DECISION:** 

### phf-fcm-0325  ·  sim 0.823  ·  prose:fcm
- page 51, doc `doc-f84025a6-ce43-41`
- **STORED:** at the same time... bring[ing] into play the interpretation in terms of content
- **DOC:** He explains the expression 'metaphysics' in a sense that deviates from the explanation given by Aquinas, and brings in another point of view which is significant in the history of metaphysics: de his rebus, quae scientias seu res naturales consequentur. Metaphysics deals with that which follows after natural things, et ideo metaphysica dicta est, quasi post physicam, seu ultra physicam constituta; post (inquam) non dignitate, aut naturae ordine, sed acquisitionis, generationis, seu inventionis; vel, si ex parte objecti illud intelligamus, res, de quibus haec scientia tractat, dicuntur esse pos
- **DECISION:** 

### phf-fcm-0419  ·  sim 0.821  ·  prose:fcm
- page 68, doc `doc-f84025a6-ce43-41`
- **STORED:** mediating epoch … to bring about a new sublation of the opposition 'life and spirit'
- **DOC:** The best-known interpretation of our situation, one that was provocative for a short period, is the one that has come to be expressed in the slogan "decline of the West." What is essential for us is what underlies this 'prophecy' as its fundamental thesis. Reduced to a formula, it is this: the decline of life in and through spirit. What spirit, in particular as reason (ratio), has formed and created for itself in technology, economy, in world trade, and in the entire reorganization of existence symbolised by the city, is now turning against the soul, against life, overwhelming it and forcing c
- **DECISION:** 

### phf-fcm-0669  ·  sim 0.821  ·  prose:fcm
- page 126, doc `doc-f84025a6-ce43-41`
- **STORED:** in the first case what is boring comes from outside … so that we become bored *by* …
- **DOC:** If we thus summarize our characterization of the second form of boredom. we see that in the first case what is boring comes from outside, as it were, so that we become bored by. . . . A particular situation with its circumstances transposes us into boredom. Here on the other hand, in the second case, what is boring does not come from outside: it arises from out of Dasein itself. This means that precisely because the boredom is dissipated throughout the whole situation in this creeping way, it cannot be bound to this situation as such. The second form of boredom is less situation-bound than the
- **DECISION:** 

### phf-fcm-0657  ·  sim 0.819  ·  prose:fcm
- page 124, doc `doc-f84025a6-ce43-41`
- **STORED:** this self-forming emptiness … sets us in place, binds us … holds us in limbo … as our own proper self that we ourselves have left standing
- **DOC:** Yet we have thereby expressed a decisive insight that we have been seeking all along: an insight into the unity of the two structural moments of being left empty and being held in limbo. These are not two pieces arbitrarily stuck together; rather, letting ourselves go in this peculiar chattering away is a making present of whatever is taking place. Wholly present, we bring time to a stand. The time that has come to a stand forms an emptiness that irrupts against the background of everything that is happening. At the same time, however, it is this self-forming emptiness that sets us in place, b
- **DECISION:** 

### phf-fcm-0539  ·  sim 0.818  ·  prose:fcm
- page 100, doc `doc-f84025a6-ce43-41`
- **STORED:** leave us in peace, do not disturb us. Yet they do not help us either … They abandon us to ourselves
- **DOC:** Yet what else can these things do than to peacefully satisfy that which they themselves are? Nor do we demand anything else of them, neither in boredom nor otherwise. Can the trees outside that we enumerate in our boredom do anything other than stand alongside the street and grow toward the sky? What is it that suddenly happens, then, so that all these things bore us, so that a boredom befalls us from out of them? We cannot now say in turn that they bore us because they leave us empty. Rather the question is: What does it mean to leave empty, to come to be left empty? To leave empty does not a
- **DECISION:** 

### phf-fcm-0542  ·  sim 0.818  ·  prose:fcm
- page 102, doc `doc-f84025a6-ce43-41`
- **STORED:** Becoming disappointed … does not mean becoming bored. … Where we become disappointed we have nothing more to seek and we withdraw. But here we precisely stay; not only that, but we are held in limbo
- **DOC:** not offer that which we expect of it in the particular situation. The station accordingly does not fulfil our expectations of it. We say that it disappoints us. Becoming disappointed, however, does not mean becoming bored. This offering nothing that leaves us empty is not our being disappointed. Where we become disappointed we have nothing more to seek and we withdraw. But here we precisely stay; not only that, but we are held in limbo. And yet it is not only the station that now refuses itself, but first and foremost its surroundings, and together with these surroundings as a whole the statio
- **DECISION:** 

### phf-fcm-0654  ·  sim 0.818  ·  prose:fcm
- page 124, doc `doc-f84025a6-ce43-41`
- **STORED:** a decisive insight … into the unity of the two structural moments.
- **DOC:** Yet we have thereby expressed a decisive insight that we have been seeking all along: an insight into the unity of the two structural moments of being left empty and being held in limbo. These are not two pieces arbitrarily stuck together; rather, letting ourselves go in this peculiar chattering away is a making present of whatever is taking place. Wholly present, we bring time to a stand. The time that has come to a stand forms an emptiness that irrupts against the background of everything that is happening. At the same time, however, it is this self-forming emptiness that sets us in place, b
- **DECISION:** 

### phf-fcm-0299  ·  sim 0.817  ·  prose:fcm
- page 1, doc `doc-f84025a6-ce43-41`
- **STORED:** a complete misinterpretation of the *theion* which, in Aristotle, is at least left to stand as a problem
- **DOC:** in the Sixth Book of the Metaphysics, at the point where he speaks of First Philosophy, divides the latter—as we have already heard—into two fundamental orientations of questioning, without making their unity itself into a prob-Jem. According to this division, the issue is on the one hand beings as such. i.e., that which pertains to every being as a being, to every ov insofar as it is an ov. The question is asked: what belongs to a being, insofar as it is a being, quite irrespective of whether it is this one or that one? What belongs to it insofar as it is something like a being at all? First 
- **DECISION:** 

### phf-fcm-0677  ·  sim 0.810  ·  prose:fcm
- page 126, doc `doc-f84025a6-ce43-41`
- **STORED:** we are oppressed by the dragging of time … we have no time
- **DOC:** If we thus summarize our characterization of the second form of boredom. we see that in the first case what is boring comes from outside, as it were, so that we become bored by. . . . A particular situation with its circumstances transposes us into boredom. Here on the other hand, in the second case, what is boring does not come from outside: it arises from out of Dasein itself. This means that precisely because the boredom is dissipated throughout the whole situation in this creeping way, it cannot be bound to this situation as such. The second form of boredom is less situation-bound than the
- **DECISION:** 

### phf-fcm-0401  ·  sim 0.810  ·  prose:fcm
- page 65, doc `doc-f84025a6-ce43-41`
- **STORED:** the presupposition for such things, the 'medium' within which they first happen
- **DOC:** manner in which infectious germs wander back and forth from one organism to another? We do indeed say that attunement or mood is infectious. Or another human being is with us, someone who through their manner of being makes everything depressing and puts a damper on everything; nobody steps out of their shell. What does this tell us? Attunements are not side-effects, but are something which in advance determine our being with one another. It seems as though an attunement is in each case already there, so to speak, like an atmosphere in which we first immerse ourselves in each case and which th
- **DECISION:** 

### phf-fcm-0323  ·  sim 0.810  ·  prose:fcm
- page 51, doc `doc-f84025a6-ce43-41`
- **STORED:** stresses the *meta* in the sense of *post*
- **DOC:** He explains the expression 'metaphysics' in a sense that deviates from the explanation given by Aquinas, and brings in another point of view which is significant in the history of metaphysics: de his rebus, quae scientias seu res naturales consequentur. Metaphysics deals with that which follows after natural things, et ideo metaphysica dicta est, quasi post physicam, seu ultra physicam constituta; post (inquam) non dignitate, aut naturae ordine, sed acquisitionis, generationis, seu inventionis; vel, si ex parte objecti illud intelligamus, res, de quibus haec scientia tractat, dicuntur esse pos
- **DECISION:** 

### phf-fcm-1132  ·  sim 0.808  ·  prose:fcm
- page 194, doc `doc-f84025a6-ce43-41`
- **STORED:** is not given for the stone as an underlying support … let alone given as earth
- **DOC:** But then the relation between the second thesis and the first, according to which the stone is worldless, instantly becomes problematic because there no longer seems to be any distinction between them. The stone is worldless, it is without world, it has no world. Neither the stone nor the animal has world. But this not-having of world is not to be understood in the same sense in each case. The different expressions worldlessness and poverty in world already indicate that there is indeed a distinction here. But if the animal is thus brought into such proximity to the stone, then we immediately 
- **DECISION:** 

### phf-fcm-0865  ·  sim 0.806  ·  prose:fcm
- page 159, doc `doc-f84025a6-ce43-41`
- **STORED:** never understands … that a question is able to provide a hold,
- **DOC:** We must now reconsider this question as that question which announces a waiting of Dasein that keeps to itself, i.e., which provides a hold for this keeping to itself. For this is what common understanding and the so-called praxis of life and all programmaticism never understands or can understand, namely that a question is able to provide a hold. According to reason, after all, this is achieved only by the answer. The answer is a fixed proposition, a dogma, a conviction. We have now to take up this question again—Has man today in the end become boring to himself?—as the question in which we r
- **DECISION:** 

### phf-fcm-0932  ·  sim 0.806  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** register this profound boredom … as though it were a matter of fact
- **DOC:** ment of vision itself be understood, and that means seized upon, as the innermost necessity [Notwendigkeit] of the freedom of Dasein. What is simultaneously announced is the necessity of understanding the fact that Dasein must first of all bring itself into the realm of what is free again, must comprehend itself as Da-sein. With the absence of any essential oppressiveness—if this absence of oppressiveness really oppressed us—there would have to go together a hunger for the most extreme and primary possibility of this moment of vision. Yet we cannot ever objectively assert or ascertain in itsel
- **DECISION:** 

### phf-fcm-0839  ·  sim 0.804  ·  prose:fcm
- page 155, doc `doc-f84025a6-ce43-41`
- **STORED:** that attunement in itself makes manifest… Dasein itself,
- **DOC:** §35. Temporality in a particular way of its temporalizing as that which properly bores us in boredom. Because, however, the origin of boredom and the original relationship between the various forms of boredom remain and must remain completely concealed from our everyday understanding of this attunement, our everyday consciousness is also governed by uncertainty as to what properly bores us, as to what that which is originarily boring is. At first it seems that what bores us are boring things and people and suchlike. It would be wrong and at the same time unfruitful to want to eliminate this st
- **DECISION:** 

### phf-fcm-0200  ·  sim 0.803  ·  prose:fcm
- page 16, doc `doc-f84025a6-ce43-41`
- **STORED:** inherently assured in advance that nothing … can happen to it
- **DOC:** First: precisely because this argument is so easy to bring up at any time, it has essentially nothing to say. It is completely empty and non-binding. It is an argument that does not relate to philosophy at all with respect to its inner content, but is a formal argumentation which forces every speaker back into self-contradiction. If the argument were able to have the force and range expected of it in such circumstances, then surely—at least for those who want to see everything based upon such certainty and certain proofs—it would have to be proven in advance that this empty trick employing for
- **DECISION:** 

### phf-fcm-0113  ·  sim 0.800  ·  prose:fcm
- page 8, doc `doc-f84025a6-ce43-41`
- **STORED:** lecture theatre, lectern, lecturer, listeners
- **DOC:** Chapter Two Ambiguity in the Essence of Philosophy (Metaphysics) Our understanding of the title of the course and the specification of our task have thus been transformed, but also the fundamental comportment in which we are to maintain ourselves in all discussions. To put it more clearly: whereas we previously knew nothing at all of a fundamental comportment of philosophizing and merely entertained the indifferent expectation of acquiring some knowledge, we now for the very first time have some idea that something like a fundamental comportment is demanded. At first we might think that fundam
- **DECISION:** 

### phf-fcm-0507  ·  sim 0.800  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** Being bored with something … is not a waiting for something,
- **DOC:** §23. Becoming bored and passing the time. We shall not consider becoming bored and being bored in themselves, but shall consider this boredom as that which we drive away [vertreiben], or seek to drive away, namely by passing the time [Zeitvertreib]. This is not something that we resort to of our own accord, as it were, without any boredom having set in, but a passing the time which lays claim upon us specifically out of and in opposition to a particular boredom. a) Passing the time as a driving away of boredom that drives time on. We are sitting, for example, in the tasteless station of some l
- **DECISION:** 

### phf-fcm-1143  ·  sim 0.800  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** to indicate that what the lizard lies on
- **DOC:** The lizard basking in the sun on its warm stone does not merely crop up in the world. It has sought out this stone and is accustomed to doing so. If we now remove the lizard from its stone, it does not simply lie wherever we have put it but starts looking for its stone again, irrespective of whether or not it actually finds it. The lizard basks in the sun. At least this is how we describe what it is doing, although it is doubtful whether it really comports itself in the same way as we do when we lie out in the sun, i.e., whether the sun is accessible to it as sun, whether the lizard is capable
- **DECISION:** 

### phf-fcm-1389  ·  sim 0.799  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** the meaning-content of these concepts does not directly intend or express what they refer to, but only gives an indication … that anyone who seeks to understand is called upon … to undertake a transformation of themselves into their Dasein
- **DOC:** Now it is always possible to take up the content of these concepts without their indicative character. But then the concepts not only fail to provide what they intend but rather—and this is the truly fateful thing—they become a supposedly genuine and rigorously defined starting point for groundless questions. One characteristic example of this is the problem of human freedom and the way in which this is investigated in the context of a concept of causality oriented toward the specific manner of being of that which is present at hand. Even where something other than natural causality was sought
- **DECISION:** 

### phf-fcm-0842  ·  sim 0.797  ·  prose:fcm
- page 157, doc `doc-f84025a6-ce43-41`
- **STORED:** a certain conception of feelings… is not as harmless as we think
- **DOC:** Yet if such a thing as boredom is understood in the ordinary sense, then it is precisely the dominance of this understanding that suppresses profound boredom and itself constantly contributes to keeping boredom where we like to see it, so that one can pounce upon it within the field of the busy activity of Dasein in its superficiality. Here we see that a certain conception of feelings and suchlike is not as harmless as we think, but has a decisive and essential say in their possibility, their scope, and their depth. Chapter Five The Question Concerning a Particular Profound Boredom as the Fund
- **DECISION:** 

### phf-fcm-0127  ·  sim 0.797  ·  prose:fcm
- page 9, doc `doc-f84025a6-ce43-41`
- **STORED:** be practically applied … and transformed into factical life
- **DOC:** This dual semblance of being a science and worldview brings about a constant insecurity in philosophy. On the one hand, it seems as though one could not furnish philosophy with enough scientific knowledge and experience—and yet this 'never enough' of scientific knowledge is always too much at the decisive moment. On the other hand, philosophy—so it seems at first—demands that its knowledge be practically applied, as it were, and transformed into factical life. Yet it is always evident too that this moral concern remains superficial to philosophizing. It looks as though creative thinking and mo
- **DECISION:** 

### phf-fcm-1319  ·  sim 0.796  ·  prose:fcm
- page 260, doc `doc-f84025a6-ce43-41`
- **STORED:** who has repeatedly pointed out … that what the animal stands in relation to is given for it in a different way than … for the human being
- **DOC:** 2. H. Driesch, Die Lokalisation morphogenetischer Vorgänge. Ein Beweis vitalist. Geschehens (Leipzig, 1899). 3. Zeitschrift für Biologie, Neue Folge. Ed. W. Kühne and C. Voit (Munich and Leipzig, 1896ff.). 4. J. von Uexküll, Umwelt und Innenwelt der Tiere, op. cit., p. 207. Uexküll is the one who has repeatedly pointed out with the greatest emphasis that what the animal stands in relation to is given for it in a different way than it is for the human being. Yet this is precisely the place where the decisive problem lies concealed and demands to be exposed. For it is not simply a question of a 
- **DECISION:** 

### phf-fcm-1420  ·  sim 0.795  ·  prose:fcm
- page 342, doc `doc-f84025a6-ce43-41`
- **STORED:** : in this apparently isolated judgement
- **DOC:** However, how does this point concerning the determinate quality of the board being relative to the subject serve to illuminate the pre-logical manifestness of beings? This manifestness, after all, is supposed to make possible the so-called objective provision of a measure on the part of beings with regard to the λόγος as a pointing out that keeps to this measure. In talking about subject-relatedness, however, we have arrived at the opposite. However, what is at issue is not the subject-relatedness of the property 'badly positioned'. We will perhaps also find such a relatedness in the property 
- **DECISION:** 

### phf-fcm-0541  ·  sim 0.793  ·  prose:fcm
- page 100, doc `doc-f84025a6-ce43-41`
- **STORED:** refuses itself to us as a station … because the train that belongs to it has not yet arrived
- **DOC:** Yet what else can these things do than to peacefully satisfy that which they themselves are? Nor do we demand anything else of them, neither in boredom nor otherwise. Can the trees outside that we enumerate in our boredom do anything other than stand alongside the street and grow toward the sky? What is it that suddenly happens, then, so that all these things bore us, so that a boredom befalls us from out of them? We cannot now say in turn that they bore us because they leave us empty. Rather the question is: What does it mean to leave empty, to come to be left empty? To leave empty does not a
- **DECISION:** 

### phf-fcm-0262  ·  sim 0.793  ·  prose:fcm
- page 29, doc `doc-f84025a6-ce43-41`
- **STORED:** We barbarians... think that such things happened overnight
- **DOC:** β) The second meaning of φύσις: prevailing as such as the essence and inner law of the matter. In the expression \varphi \circ \sigma \varsigma, however, prevailing as such, which lets everything that prevails be as that which it is, is equiprimordially and just as essentially understood. \Phi \circ \sigma \varsigma now no longer means one region among others, indeed it does not mean a region of beings at all, but the nature of beings. Nature now has the meaning of innermost essence, as when we say: the nature of things, and in so doing mean not only the nature of natural things, but the natur
- **DECISION:** 

### phf-fcm-0322  ·  sim 0.791  ·  prose:fcm
- page 50, doc `doc-f84025a6-ce43-41`
- **STORED:** Suárez... says it is called metaphysics **because it is theology**,
- **DOC:** simultaneously to discuss in an appropriate manner all the questions belonging to the twelve books of Aristotle's Metaphysics. In contrast to earlier scholasticism, Suarez indeed saw that the twelve books of Aristotle form a whole that is inherently disordered, although he did not realize that this book is not one written by Aristotle, but a compilation of treatises put together by his students. He sought to overcome this disorder by giving the main problems a systematic order. Independent discussion of the whole area of the problem with respect to natural theology goes back to Suarez, whereas
- **DECISION:** 

### phf-fcm-1169  ·  sim 0.791  ·  prose:fcm
- page 1, doc `doc-f84025a6-ce43-41`
- **STORED:** permit[s], resist[s], or possibly forbid[s]
- **DOC:** Chapter Four Clarification of the Essence of the Animal's Poverty in World by Way of the Question Concerning the Essence of Animality, the Essence of Life in General, and the Essence of the Organism §49. The methodological question concerning the ability to transpose oneself into other beings (animal, stone, and man) as a substantive question concerning the specific manner of being that belongs to such beings. We have, then, to specify how the animal stands in relation to all of this, and how whatever it is that the animal stands in relation to is given for the animal. But how are we to do so?
- **DECISION:** 

### phf-fcm-0181  ·  sim 0.790  ·  prose:fcm
- page 16, doc `doc-f84025a6-ce43-41`
- **STORED:** we are not at all absolutely certain … whether we are philosophizing at all in all these discussions
- **DOC:** First: precisely because this argument is so easy to bring up at any time, it has essentially nothing to say. It is completely empty and non-binding. It is an argument that does not relate to philosophy at all with respect to its inner content, but is a formal argumentation which forces every speaker back into self-contradiction. If the argument were able to have the force and range expected of it in such circumstances, then surely—at least for those who want to see everything based upon such certainty and certain proofs—it would have to be proven in advance that this empty trick employing for
- **DECISION:** 

### phf-fcm-0795  ·  sim 0.789  ·  prose:fcm
- page 147, doc `doc-f84025a6-ce43-41`
- **STORED:** a being impelled through entrancing time into that time itself… toward the moment of vision as the fundamental possibility of Dasein's existence proper.
- **DOC:** such, namely time, announces and tells of as something in fact refused; what it precisely holds before us as something that has apparently vanished; what it gives to be known and properly makes possible as something possible and only as this, as something that can be given to be free; what it gives to be free in its telling announcing—is nothing less than the freedom of Dasein as such. For this freedom of Dasein only is in Dasein's freeing itself. The self-liberation of Dasein, however, only happens in each case if Dasein resolutely discloses [sich entschließt] itself to itself, i.e., disclose
- **DECISION:** 

### phf-fcm-1198  ·  sim 0.789  ·  prose:fcm
- page 219, doc `doc-f84025a6-ce43-41`
- **STORED:** It is not the organ which has a capacity but the organism which has capacities… It is the capability which procures organs for itself
- **DOC:** Equipment always has a particular readiness, while the organ always has a capacity. Yet the eye, for example, which we have hitherto distinguished from the pen as a particular organ, no more possesses an independent capacity for seeing than the pen has a capacity for writing, especially as we pointed out that the possibility of seeing is itself the condition of the possibility of the eye as an organ. We must hold fast to the fact that the organ in itself does not have the capacity for seeing either, and must not force facts for the sake of the distinction we wished to identify between readines
- **DECISION:** 

### phf-fcm-0689  ·  sim 0.786  ·  prose:fcm
- page 129, doc `doc-f84025a6-ce43-41`
- **STORED:** more of an evasion … boredom itself … more a letting oneself be bored.
- **DOC:** [5.] In I, we have a fluttering unease of passing the time, a running up against boredom that somehow easily becomes confused, and accordingly a being driven around within boredom itself. (For our unease in passing the time precisely makes the boredom itself to some extent more pressing and more unsettling.) In II, passing the time is rather more of an evasion in the face of boredom, and boredom itself is more a letting oneself be bored. [6.] The distinction with respect to the range of resonance of boredom: In I, we have a being forced in between particular boring things, and correspondingly 
- **DECISION:** 

### phf-fcm-0334  ·  sim 0.785  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** We are taking over the expression 'metaphysics'... **as a title for the fundamental problem of metaphysics itself which lies in the question of what it, metaphysics, itself is**
- **DOC:** Whenever we survey our whole discussion of the concept of metaphysics, we see that this title expresses a knowledge that is directed toward beings as a whole. At the same time, we can see that this expression 'as a whole' is a term which contains the real problem—the problem that must first be posed in general and cannot be made to vanish out of existence by taking over various opinions from the tradition. It is thus clear that we cannot simply take the title 'metaphysics' in its traditional meaning. We are taking over the expression 'metaphysics' as the title of a problem, better, as a title 
- **DECISION:** 

### phf-fcm-0163  ·  sim 0.785  ·  prose:fcm
- page 13, doc `doc-f84025a6-ce43-41`
- **STORED:** mathematical knowledge … the highest, most rigorous, and most certain knowledge
- **DOC:** a) Philosophy presents itself as something that concerns everyone and is understood by everyone. Philosophy is something that concerns everyone. It is not the prerogative of one human being. Perhaps this is not in doubt. From this, however, our general awareness tacitly concludes that what concerns [angeht] everyone must be understood [eingehen] by everyone. It must be accessible for everyone straightaway. This 'straightaway' means: it must be immediately clear. Immediately that is to say: clear to everyone just as they are, without further effort on the part of clear and sound common sense. W
- **DECISION:** 

### phf-fcm-0528  ·  sim 0.782  ·  prose:fcm
- page 96, doc `doc-f84025a6-ce43-41`
- **STORED:** inherent predicament … is precisely that we cannot find anything in particular
- **DOC:** However things may stand in this respect, from the perspective of passing the time and according to its ownmost intention we can say that what is at issue in passing the time is wanting to overcome the vacillation of time. To be slow and to drag are not the same thing; that which drags is indeed necessarily slow in a certain sense—but not everything that is slow necessarily drags. The time that drags must be coerced into passing more quickly, so that its being paralysed does not paralyse us, so that the boredom disappears. The result for our guiding problem of what becoming bored properly is t
- **DECISION:** 

### phf-fcm-0706  ·  sim 0.782  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** really asking the metaphysical question, what is world?
- **DOC:** Chapter Five The Question Concerning a Particular Profound Boredom as the Fundamental Attunement of Our Contemporary Dasein § 37. Reconsideration of the question concerning a profound boredom as the fundamental attunement of our Dasein. § 38. The question concerning a particular profound boredom in the direction of a specific being left empty and a specific being held in limbo. a) The essential need as a whole and the absence (telling refusal) of any essential oppressiveness in our contemporary Dasein as being left empty in this particular profound boredom.b) The most extreme demand on Dasein 
- **DECISION:** 

### phf-fcm-0612  ·  sim 0.781  ·  prose:fcm
- page 115, doc `doc-f84025a6-ce43-41`
- **STORED:** manifests itself … as an illusion (a peculiar dissatisfaction!),
- **DOC:** What is boring us: not this and not that, but an 'I know not what'. However, this indeterminate, unfamiliar thing could after all be precisely that which must leave us empty. In that case, precisely in this respect, we would find a being left empty in this boredom. Yet let us look more closely. Are we attuned in such a way, do we feel ourselves left standing by those beings within the situation? Not really. For this to be the case and to be possible, we would actually have to set out and seek to become satisfied by things in the sense indicated. But what is missing here is precisely the unease
- **DECISION:** 

### phf-fcm-1124  ·  sim 0.780  ·  prose:fcm
- page 193, doc `doc-f84025a6-ce43-41`
- **STORED:** also helps to define our second thesis in relation to the third … For man does have a world
- **DOC:** What is poor here by no means represents merely what is 'less' or 'lesser' with respect to what is 'more' or 'greater'. Being poor does not simply mean possessing nothing, or little, or less than another. Rather being poor means being deprived [Entbehren]. Such deprivation in turn is possible in different ways depending on how whatever is poor is deprived and comports itself in its deprivation, how it responds to the deprivation, how it takes this deprivation. In short: with regard to what such a being is deprived of and above all to the way in which it is deprived, namely the way in which it 
- **DECISION:** 

### phf-fcm-0758  ·  sim 0.778  ·  prose:fcm
- page 138, doc `doc-f84025a6-ce43-41`
- **STORED:** feels timeless… removed from the flow of time
- **DOC:** It is now a matter of seeing how, in boredom, being left empty is associated with this other structural moment. Yet once again we may not simply presuppose this association on the basis of what has gone before. It is rather a matter of seeing this association of being left empty and being held in limbo anew and from out of the essence of this boredom itself. Therefore—almost as though we knew nothing at all of the second structural moment—we must ask: To what extent is the specific being left empty of this third form of boredom in itself associated in general with something else? Boredom and i
- **DECISION:** 

### phf-fcm-0271  ·  sim 0.776  ·  prose:fcm
- page 1, doc `doc-f84025a6-ce43-41`
- **STORED:** What Aristotle achieved... has been handed down to us in individual lecture courses and treatises,
- **DOC:** moved moves, what that which moves itself is as a whole and what the Prime Mover is. All this falls into ἐπιστήμη φυσική, i.e., there is as yet no clear structuring of any individual sciences or of an accompanying philosophy of nature. This ἐπιστήμη φυσική has as its object everything that in this sense belongs to φύσις and that the Greeks designate as τὰ φυσικά. The questioning proper to these sciences dealing with φύσις is the supreme question of the Prime Mover, of what this whole of φύσις is in itself as this whole. Aristotle designates this ultimate determinant within the φύσει ὄντα as th
- **DECISION:** 

### phf-fcm-0788  ·  sim 0.774  ·  prose:fcm
- page 145, doc `doc-f84025a6-ce43-41`
- **STORED:** this entrancing power of time… is that which also calls and tells of what is properly refused
- **DOC:** It is boring for one. Entranced, and yet accustomed to being acquainted and concerned only with beings and indeed with this or that being in each case, Dasein finds nothing, in the telling refusal of these beings as a whole, which could "explain" this entrancement to it. It is from here that there stirs what is enigmatic and concealed in the power that envelops us in this 'it is boring for one'. For in this attunement, after all, we do not usually philosophize about boredom or in boredom, rather—it is boring for one. Instead, we leave this concealed entrancement its power. It thus becomes appa
- **DECISION:** 

### phf-fcm-1294  ·  sim 0.774  ·  prose:fcm
- page 253, doc `doc-f84025a6-ce43-41`
- **STORED:** however strong or intense a stimulus is . . . a particular animal may be utterly unresponsive
- **DOC:** In its instinctual relatedness to . . . , behaviour is open for. . . . But as instinctual activity it can at the same time only be touched or affected by something that brings the instinctual relatedness into play, i.e., by something that can disinhibit it. That which disinhibits and releases the inhibitedness of the instinctual drive, that which allows the instinctual activity to respond to the disinhibition, and thus allows the animal to move within certain instinctual drives, must always in accordance with its essence withdraw itself. It is nothing enduring that could stand over against the
- **DECISION:** 

### phf-fcm-1432  ·  sim 0.771  ·  prose:fcm
- page 357, doc `doc-f84025a6-ce43-41`
- **STORED:** , since the radicalization of that idea was only
- **DOC:** distinction that concerns the being of beings, or more precisely the distinction within which everything ontological moves and which it presupposes, as it were, for its own possibility. It is the distinction in which being is distinguished from beings, which it also determines in the way their being is constituted. The ontological difference is the difference sustaining and guiding such a thing as the ontological in general, and not a particular distinction that can or must be made within the ontological. Even in giving it this name and outlining its features, we are pushing the problem of the
- **DECISION:** 

### phf-fcm-0276  ·  sim 0.768  ·  prose:fcm
- page 1, doc `doc-f84025a6-ce43-41`
- **STORED:** man's stance... from which our expression 'ethics' comes
- **DOC:** Aristotle died around 322-21 B.C. Since then, however, philosophy has long become the victim of ambiguity. The philosophy of antiquity reached its acme with Aristotle, and its descent and proper decline begins with him. In Plato and Aristotle the formation of schools becomes unavoidable. What effect does this have? Living questioning dies out. The proper grip that held philosophical questioning is absent. And this is all the more so since what once meant being gripped in this way has come to be something known and has been spoken out. What has been spoken out is taken on its own and made into 
- **DECISION:** 

### phf-fcm-0819  ·  sim 0.767  ·  prose:fcm
- page 151, doc `doc-f84025a6-ce43-41`
- **STORED:** not… false, but presumably… over-emphasised
- **DOC:** then more as what is now and today—expands itself into the entire expanse of the temporality of Dasein. This lengthening of the while manifests the while of Dasein in its indeterminacy that is never absolutely determinable. This indeterminacy takes Dasein captive, yet in such a way that in the whole expansive and expanded expanse it can grasp nothing except the mere fact that it remains entranced by and toward this expanse. The lengthening of the while is the expansion of the temporal horizon, whose expansion does not bring Dasein liberation or unburden it, but precisely the converse in oppres
- **DECISION:** 

### phf-fcm-0674  ·  sim 0.767  ·  prose:fcm
- page 126, doc `doc-f84025a6-ce43-41`
- **STORED:** we are held more toward ourselves, somehow enticed back into the specific gravity of Dasein, even though … we leave our own proper self standing and unfamiliar
- **DOC:** If we thus summarize our characterization of the second form of boredom. we see that in the first case what is boring comes from outside, as it were, so that we become bored by. . . . A particular situation with its circumstances transposes us into boredom. Here on the other hand, in the second case, what is boring does not come from outside: it arises from out of Dasein itself. This means that precisely because the boredom is dissipated throughout the whole situation in this creeping way, it cannot be bound to this situation as such. The second form of boredom is less situation-bound than the
- **DECISION:** 

### phf-fcm-1348  ·  sim 0.767  ·  prose:fcm
- page 270, doc `doc-f84025a6-ce43-41`
- **STORED:** that which disinhibits . . . brings an essential disruption into the essence of the animal
- **DOC:** the thesis has led us to our destination in a practical fashion. In spite of everything it has brought us closer to an elucidation of the concept of world. It is true that positively speaking we have still learned very little about the essence of world, and have only learned about the animal and its not-having of world, about its captivation. Consequently we have merely acquainted ourselves with the negative side of the matter. And yet we should consider the fact that we ourselves are the positive side, that we ourselves exist in the having of world. That is why, through that apparently purely
- **DECISION:** 

### phf-fcm-0919  ·  sim 0.765  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** no longer need … to throw ourselves open to danger,
- **DOC:** The deepest, essential need in Dasein is not that a particular actual need oppresses us, but that an essential oppressiveness refuses itself, that we scarcely apprehend and are scarcely able to apprehend this telling refusal of any oppressiveness as a whole. And this for the reason that what announces and tells of itself in such telling refusal remains inaudible. Because it is not heard we can merely inquire about it in the first instance. Yet just as with regard to the being left empty of our Dasein, we must inquire about the being held in limbo that is in unity with it, in order to first att
- **DECISION:** 

### phf-fcm-1252  ·  sim 0.765  ·  prose:fcm
- page 236, doc `doc-f84025a6-ce43-41`
- **STORED:** no question of simply transferring this state . . . into the animal.
- **DOC:** b) The animal's absorption in itself as captivation. Captivation (the essence of the peculiarity proper to the organism) as the inner possibility of behaviour. This preliminary interpretation concerning what it is that capability is capable of provides us with a further context for inquiring concretely about what is in question, namely how the organism as a capable behavioural being is proper to itself. It thus enables us to concretely inquire about the essence of the peculiarity proper to the organism. Behaviour is intrinsically a being capable (driving, drivenness). We said that being capabl
- **DECISION:** 

### phf-fcm-0941  ·  sim 0.764  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** liberate the humanity in man … to let the Dasein in him become essential
- **DOC:** ment of vision itself be understood, and that means seized upon, as the innermost necessity [Notwendigkeit] of the freedom of Dasein. What is simultaneously announced is the necessity of understanding the fact that Dasein must first of all bring itself into the realm of what is free again, must comprehend itself as Da-sein. With the absence of any essential oppressiveness—if this absence of oppressiveness really oppressed us—there would have to go together a hunger for the most extreme and primary possibility of this moment of vision. Yet we cannot ever objectively assert or ascertain in itsel
- **DECISION:** 

### phf-fcm-0172  ·  sim 0.764  ·  prose:fcm
- page 15, doc `doc-f84025a6-ce43-41`
- **STORED:** This emptiest and at the same time least binding knowledge … cannot become the measure for the richest and most binding knowledge imaginable: philosophical knowledge
- **DOC:** To these two objections it must be said: We are not denying philosophy the character of absolute science because it has not yet attained this status hitherto, but because this idea of the essence of philosophy is ascribed to philosophy on the grounds of its ambiguity, and because this idea undermines the essence of philosophy at its core. This is why we gave a rough indication of the provenance of this idea. What does it mean to uphold mathematical knowledge as the measure of knowledge and as the ideal of truth for philosophy? It means nothing less than making that knowledge which is absolutel
- **DECISION:** 

### phf-fcm-0290  ·  sim 0.761  ·  prose:fcm
- page 37, doc `doc-f84025a6-ce43-41`
- **STORED:** Metaphysics becomes the title for knowledge of... the suprasensuous
- **DOC:** μετά has a further meaning in Greek, however, which is connected with the first. If I go behind a matter and go after it, in so doing I move away from one matter and over to another, i.e., I turn myself 'around' in a certain respect. We have this meaning of μετά in the sense of 'away from something toward something else' in the Greek word μεταβολή (changeover [Umschlag]). In condensing the Greek title τὰ μετὰ τὰ φυσικά into the Latin expression metaphysica, the μετά has altered its meaning. The meaning of changeover, of 'turning away from one matter toward another', of 'going from one over to 
- **DECISION:** 

### phf-fcm-0329  ·  sim 0.759  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** most clearly... in Descartes, but especially in Fichte
- **DOC:** What is the fundamental trait of modern metaphysics? Modern metaphysics is determined by the fact that the entirety of the traditional problematic comes under the aspect of a new science, which is represented by mathematical natural science. The less explicit train of thought is this: if metaphysics asks concerning the first causes, concerning the most general and highest meaning of beings, in short concerning what is highest, ultimate, and supreme, then this kind of knowing must be commensurate with what is asked about. Yet that means: it must itself be absolutely certain. Thus, via the guidi
- **DECISION:** 

### phf-fcm-0279  ·  sim 0.758  ·  prose:fcm
- page 34, doc `doc-f84025a6-ce43-41`
- **STORED:** scholastic structuring prefigures the conception of philosophy... for the following period,
- **DOC:** When the attempt is made to slot the entire stock of ancient philosophizing into scholastic disciplines, then this simultaneously means that the manner of knowing is no longer a living philosophizing from out of the problems themselves, but takes place in the manner in which domains of knowledge are elsewhere dealt with in the sciences. The manner in which these domains of philosophy are dealt with now becomes a science, ἐπιστήμη in the Aristotelian sense. There arises the ἐπιστήμη λογική, followed by the ἐπιστήμη φυσική; and the ἐπιστήμη ἡθική completes things. In this way there ensue three d
- **DECISION:** 

### phf-fcm-0160  ·  sim 0.757  ·  prose:fcm
- page 13, doc `doc-f84025a6-ce43-41`
- **STORED:** Whatever everyone can understand prescribes in general what can be true … what a philosophical truth must look like
- **DOC:** a) Philosophy presents itself as something that concerns everyone and is understood by everyone. Philosophy is something that concerns everyone. It is not the prerogative of one human being. Perhaps this is not in doubt. From this, however, our general awareness tacitly concludes that what concerns [angeht] everyone must be understood [eingehen] by everyone. It must be accessible for everyone straightaway. This 'straightaway' means: it must be immediately clear. Immediately that is to say: clear to everyone just as they are, without further effort on the part of clear and sound common sense. W
- **DECISION:** 

### phf-fcm-0205  ·  sim 0.756  ·  prose:fcm
- page 19, doc `doc-f84025a6-ce43-41`
- **STORED:** is not man, the dubious subject of the everyday … Rather, in philosophizing the Da-sein in man launches the attack upon man
- **DOC:** Insight into the multiple ambiguity of philosophizing acts as a deterrent [abschreckend] and ultimately betrays the entire fruitlessness of such activity. It would be a misunderstanding if we wished in the slightest to weaken this impression of the hopelessness of philosophizing, or to mediate it belatedly by indicating that in the end things are not so bad after all, that philosophy has achieved many things in the history of mankind, and so on. This is merely idle talk that talks in a direction leading away from philosophy. We must rather uphold and hold out in this terror [Schrecken]. For in
- **DECISION:** 

### phf-fcm-1412  ·  sim 0.755  ·  prose:fcm
- page 1, doc `doc-f84025a6-ce43-41`
- **STORED:** *logos apophantikos* merely takes apart [*legt … auseinander*], in the assertion, what is already manifest
- **DOC:** c) Being free, pre-logical being open for beings as such and holding oneself toward the binding character of things as the ground of the possibility of assertion. The λόγος in the form of the λόγος ἀποφαντικός is the ability for a comportment that points beings out, whether in the manner of revealing (true) or concealing (false). Such ability is possible only as this ability if it is grounded in being free for beings as such. It is upon this that being free in that pointing out that points toward and away is grounded, and this being free in . . . can then unfold as being free for revealing or 
- **DECISION:** 

### phf-fcm-0156  ·  sim 0.753  ·  prose:fcm
- page 13, doc `doc-f84025a6-ce43-41`
- **STORED:** tacitly concludes that what concerns everyone must be understood by everyone,
- **DOC:** a) Philosophy presents itself as something that concerns everyone and is understood by everyone. Philosophy is something that concerns everyone. It is not the prerogative of one human being. Perhaps this is not in doubt. From this, however, our general awareness tacitly concludes that what concerns [angeht] everyone must be understood [eingehen] by everyone. It must be accessible for everyone straightaway. This 'straightaway' means: it must be immediately clear. Immediately that is to say: clear to everyone just as they are, without further effort on the part of clear and sound common sense. W
- **DECISION:** 

### phf-fcm-0892  ·  sim 0.752  ·  prose:fcm
- page 161, doc `doc-f84025a6-ce43-41`
- **STORED:** is the emptiness as a whole, so that no one stands with anyone else … in the rooted unity of essential action
- **DOC:** the powerlessness of science, the erosion of art, the groundlessness of philosophy, the impotence of religion. Certainly, there are needs everywhere. Yet it will be said that it is, after all, one-sided to see nothing but needs. For the renewed attempts and efforts which are constantly made to control these needs, to put an end to them, to convert them directly into order and satisfaction are just as intense and clamorous. In keeping with this, it is not only individuals that are at work everywhere, but groups, associations, circles, classes, parties—everyone and everything is organised to mee
- **DECISION:** 

### phf-fcm-0538  ·  sim 0.750  ·  prose:fcm
- page 100, doc `doc-f84025a6-ce43-41`
- **STORED:** To leave empty does not at all mean: to be absent … rather things must be at hand in order to leave us empty
- **DOC:** Yet what else can these things do than to peacefully satisfy that which they themselves are? Nor do we demand anything else of them, neither in boredom nor otherwise. Can the trees outside that we enumerate in our boredom do anything other than stand alongside the street and grow toward the sky? What is it that suddenly happens, then, so that all these things bore us, so that a boredom befalls us from out of them? We cannot now say in turn that they bore us because they leave us empty. Rather the question is: What does it mean to leave empty, to come to be left empty? To leave empty does not a
- **DECISION:** 

### phf-fcm-0905  ·  sim 0.750  ·  prose:fcm
- page 0, doc `doc-f84025a6-ce43-41`
- **STORED:** we scarcely apprehend … this telling refusal
- **DOC:** The deepest, essential need in Dasein is not that a particular actual need oppresses us, but that an essential oppressiveness refuses itself, that we scarcely apprehend and are scarcely able to apprehend this telling refusal of any oppressiveness as a whole. And this for the reason that what announces and tells of itself in such telling refusal remains inaudible. Because it is not heard we can merely inquire about it in the first instance. Yet just as with regard to the being left empty of our Dasein, we must inquire about the being held in limbo that is in unity with it, in order to first att
- **DECISION:** 


#### Source: prose:svw:champion-social-and-cultural-presence-in-oblivio (1)

### phf-svw-champion-social-and-cult-0005  ·  sim 0.897  ·  prose:svw:champion-social-and-cultural-presence-in-oblivio
- page 1, doc `doc-5cabd941-2441-43`
- **STORED:** several key features [that] allow Oblivion to be considered as a social world,
- **DOC:** Social Presence and Cultural Presence In Oblivion Erik Champion Media Arts, COFA, UNSW, PO Box 259 Paddington, NSW 2021 Australia +61 2 9385 0605 e.champion@unsw.edu.au ABSTRACT Single player games are now powerful enough to convey the impression of shared worlds with social presence and social agency. Unfortunately, there are few clear definitions of 'world' as it applies to commercial computer games, or as it could be used to help improvements these games. With that in mind, this paper will explore a framework for defining virtual worlds and then apply it to Elder Scrolls IV: Oblivion (Figur
- **DECISION:** 


#### Source: prose:svw:davis-boellstorff-compulsive-creativity-2016 (1)

### phf-svw-davis-boellstorff-compul-0013  ·  sim 0.810  ·  prose:svw:davis-boellstorff-compulsive-creativity-2016
- page 1, doc `doc-f6b61ed5-a75b-44`
- **STORED:** …disability and the digital… persons living with Parkinson's disease who are active in the virtual world Second Life
- **DOC:** Compulsive Creativity: Virtual Worlds, Disability, and Digital Capital DONNA Z. DAVIS University of Oregon, USA TOM BOELLSTORFF University of California, Irvine, USA1 In this article, we analyze the intersection of creativity and agency by examining what might appear to be a very different intersection: disability and the digital. We do this by exploring what we term "compulsive creativity" as experienced by persons living with Parkinson's disease who are active in the virtual world Second Life. To address forms of social and cultural capital, we introduce the notions of "digital embodied stat
- **DECISION:** 
