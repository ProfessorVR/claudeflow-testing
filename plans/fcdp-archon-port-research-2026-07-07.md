# FCDP→Archon Port — Deep-Research Raw Outputs (Perplexity sonar-deep-research, 2026-07-07)

Three queries: Q1 stylometric bands/minimum sample; Q2 judge architecture/gates; Q3 disclosure/provenance/quotes.
Q2 and Q3 truncated mid-document by the API but their synthesis paragraphs + citation lists are complete.
Attribution caution: Q2 misnames the DSPy authors ('Khlaaf' — actually Khattab et al., Stanford NLP); verify names before citing formally.

═══════════════════════ Q2 — JUDGE ARCHITECTURE ═══════════════════════
# Judge Architecture and Gate Pipeline Design for Multi‑Stage LLM Drafting in Humanities Dissertations (2024–2026)

Large language models are increasingly used not only to generate dissertation prose, but also to **judge and gate** intermediate outputs in multi‑stage drafting protocols that move from planning to discourse skeletons, to drafts with quote placeholders, through mechanical checks and separate LLM‑judge gates, and finally into bounded revision loops. Across 2024–2026, research on LLM‑as‑a‑judge has converged on several themes that are directly relevant to designing such gate‑enforced pipelines: ensembles of judges versus single strong judges, rubric design (binary checklists vs scalar scores and structured outputs), systematic biases and their mitigations, ordering of deterministic versus model‑based validation stages, and the benefits and limits of iterative self‑refinement. Drawing on peer‑reviewed work and major technical reports from leading institutions, the evidence suggests that multi‑judge panels improve reliability mainly when judges are **diverse**, while panels of identical models offer only modest gains and may amplify self‑preference biases; that decomposed **binary question batteries and checklist‑style rubrics** substantially improve reliability and calibration relative to undifferentiated Likert scores; that LLM judges are measurably vulnerable to position, verbosity, and self‑preference biases, with mitigations such as randomization, reference‑guided grading, and carefully designed rationales yielding mixed but promising results; that pipelines benefit from **cheap deterministic gates preceding expensive LLM‑based judgments** and from assertion‑style frameworks that make such gates explicit; and that iterative self‑critique yields diminishing returns beyond a small number of steps, with fresh‑context critics and multi‑agent debates often outperforming same‑context self‑review. For each of these findings, this report names the originating institution, authors, year, venue, and rates evidence strength as **STRONG, MODERATE, or WEAK**, while explicitly highlighting contested or incomplete areas where current data do not yet justify strong design commitments.

## 1. Background: LLM‑as‑a‑Judge and Multi‑Stage Drafting Pipelines

### 1.1. The rise of LLM‑as‑a‑judge in evaluation systems

The paradigm of using LLMs as evaluators—“LLM‑as‑a‑judge”—has evolved rapidly since 2023, as researchers sought scalable alternatives to expensive human evaluation for text generation quality, safety, and preference alignment. A foundational example is **G‑Eval**, introduced by Liu et al. at Microsoft Research in a 2023 EMNLP main conference paper, which uses GPT‑4 with chain‑of‑thought reasoning and structured form‑filling to assess summarization and dialogue outputs, showing substantially higher correlation with human judgments than traditional automatic metrics.[40][41] Evidence strength: MODERATE (single peer‑reviewed study, EMNLP 2023). In parallel, Kocmi and Federmann at Microsoft documented in an EMNLP 2023 Findings paper that GPT‑4, used as a judge on sequence‑to‑sequence tasks, correlates more closely with human assessments than BLEU‑like metrics and can highlight stylistic preferences that classical metrics miss.[42] Evidence strength: MODERATE (single peer‑reviewed study, EMNLP 2023 Findings).

Building on these early efforts, several 2024–2025 technical reports have surveyed and systematized the LLM‑as‑a‑judge landscape. A comprehensive survey by Zhang et al., affiliated with major academic and industrial institutions, synthesizes strategies for improving reliability, mitigating bias, and deploying LLM judges in diverse domains, emphasizing the need for standardized protocols and explicit reliability benchmarks.[3][3] Evidence strength: WEAK (arXiv preprint only, though from multiple leading institutions). A related survey by Xia et al. overviews LLM‑based evaluation methods across tasks and introduces taxonomies for “what to judge, how to judge, and where to judge,” providing a conceptual scaffold for designing discipline‑specific judge pipelines, including academic writing contexts.[6][6][6] Evidence strength: WEAK (arXiv preprint, multi‑institution survey).

These works establish that LLM‑based judges can achieve **human‑like evaluation quality** in many text generation domains, but also that their reliability is sensitive to prompt design, rubric structure, and the presence of biases such as self‑preference and verbosity. For a humanities dissertation drafting protocol, this means that LLM‑judges can plausibly gate successive stages of prose construction, but the architecture of judges and gates must be engineered carefully to avoid subtle distortions of scholarly reasoning and style.

### 1.2. Multi‑stage drafting protocols and gate semantics

The multi‑stage protocol you are considering—moving from plan to discourse skeleton, then to drafted prose with quote‑ID placeholders, followed by mechanical gates (e.g., citation placement, formatting, basic linguistic checks) and separate LLM‑judge gates, culminating in a bounded revision loop—is structurally similar to multi‑module LM pipelines studied in work on declarative LM programming and behavioral testing. In a 2023 NeurIPS paper, Khlaaf et al. at Stanford introduced **DSPy**, a framework that compiles declarative language model calls into self‑improving pipelines, allowing designers to express pipelines as “text transformation graphs” with modules that can include assertions and evaluation steps.[74] Evidence strength: MODERATE (single peer‑reviewed study, NeurIPS 2023). Although DSPy’s focus is on task performance rather than dissertation writing, its pipeline abstraction—with explicit evaluation modules and the ability to optimize them—supports the idea that complex drafting workflows can benefit from **separate, well‑typed judge modules** rather than monolithic generation prompts.

Similarly, Ribeiro et al. at the University of Washington and Microsoft Research, in their ACL 2020 paper on **CheckList**, argued for behavioral testing frameworks that decompose evaluation into capability‑wise test matrices, enabling cheap, systematic checks that can be executed independently of full task‑level scoring.[34][35] Evidence strength: STRONG (peer‑reviewed, widely replicated behavioral testing methodology). Their approach maps closely onto the notion of **mechanical gate passes** in your protocol: CheckList‑style tests can enforce basic linguistic and structural properties before invoking more expensive human or LLM judges to assess discourse quality, argumentation, or alignment with disciplinary norms.

Taken together, these strands of work imply that a gate‑enforced dissertation drafting pipeline should distinguish between inexpensive, deterministic or rule‑based gates (e.g., structural and mechanical checks) and more complex judgment gates handled by LLMs. They also suggest that judge modules should be explicitly defined, with their inputs, outputs, and constraints made clear, as in DSPy’s module abstractions.[74] Evidence strength for applying these ideas to dissertation drafting is WEAK, because no direct empirical study has yet evaluated such pipelines in academic writing, but the underlying principles are grounded in peer‑reviewed work on LM pipelines and behavioral testing.

## 2. Panels versus Single Judges: Reliability, Bias, and Self‑Preference

### 2.1. Evidence for multi‑judge ensembles versus single strong judges

The question of whether to use **panels or juries of LLM judges** versus a single strong judge has been directly studied in recent work on aggregating multiple LLM‑based evaluations. Papadopoulos et al. from the University of Edinburgh and collaborators introduced **SkillAggregation**, a method for combining multiple LLM judge outputs without reference labels, extending earlier aggregation methods from image classification to NLP tasks such as Chatbot Arena comparisons.[22][22] Evidence strength: WEAK (arXiv preprint, though with large‑scale experiments across multiple tasks). Their empirical results show that SkillAggregation, which learns judge‑specific “skill” parameters, outperforms equal‑weight averaging and yields higher agreement with human preferences on most tasks, particularly when judges differ in architecture or training. This suggests that **diverse panels of LLM judges can improve reliability compared to any single judge**, by smoothing out idiosyncratic errors and biases.[22][22]

Similarly, Islam et al. at a European university evaluated three majority voting strategies for phishing URL detection using LLMs: prompt‑based ensembles (same model, multiple prompts), model‑based ensembles (multiple models, one prompt), and hybrid ensembles.[17] Evidence strength: WEAK (arXiv preprint, domain‑specific). They found that hybrid ensembles—combining prompt diversity and model diversity—achieved the highest detection performance, surpassing single‑judge baselines. Their analysis underscores that **ensemble gains arise from diversity**: multiple views on the same item, whether via different prompts or different models, capture different aspects of the signal and reduce error variance.[17]

At a larger scale, Zhang et al. in the **LLMJudge challenge** at SIGIR 2024 released and benchmarked 42 sets of LLM‑generated relevance judgments for the TREC 2023 Deep Learning track, allowing analysis of systematic biases and ensemble strategies.[11] Evidence strength: STRONG (peer‑reviewed SIGIR 2024 resource paper). While the primary focus was on the properties of individual LLM judgment sets, their data enabled exploration of ensemble effects, showing that aggregating judgments from multiple LLMs can improve robustness to particular failure modes, but also that ensembles can inherit shared biases when models are similar.[11] This provides strong empirical backing for the idea that multi‑judge panels improve reliability most when judges differ in architecture, training corpus, or prompting regime.

For your dissertation drafting protocol, these findings imply that a **panel is more likely to be worth the additional cost** if the judges are meaningfully diverse—e.g., a mixture of general‑purpose models and specialized academic style judges—rather than copies of the same base model. When diversity is limited, ensemble gains may be marginal, as discussed next.

### 2.2. Panels of the same base model and self‑preference bias

The situation where all judges are instantiated from the **same base model family** raises concerns of correlated biases and a phenomenon termed **preference leakage** or self‑preference bias. Hu et al. in a 2025 arXiv technical report from top universities defined **preference leakage** as a contamination problem in LLM‑as‑a‑judge when synthetic data generators and evaluators are related—being the same model, sharing an inheritance relationship, or belonging to the same family.[8] Evidence strength: MODERATE (major‑lab preprint with extensive experiments). Across multiple settings, they showed that judges exhibit significant bias toward outputs produced by related models, systematically favoring responses from their own family and thereby distorting evaluation results.[8] This bias persists even when judges are fine‑tuned for evaluation and when outputs are anonymized, indicating that internal representations still encode family‑specific stylistic and content fingerprints.

A related concern is raised in **No Free Labels**, a 2025 Anthropic technical report that systematically evaluates how well LLM judges can grade correctness of conversational responses without human grounding.[24] Evidence strength: MODERATE (major‑lab technical report, though preprint). The authors demonstrate that judges often mis‑classify incorrect answers as correct, especially when those answers share stylistic

## CITATIONS
[1] https://arxiv.org/pdf/2403.18771.pdf
[2] https://arxiv.org/pdf/2410.12784.pdf
[3] https://arxiv.org/pdf/2411.15594v1.pdf
[4] https://arxiv.org/pdf/2503.09347.pdf
[5] https://arxiv.org/html/2412.05579
[6] https://arxiv.org/html/2411.16594
[7] https://arxiv.org/pdf/2502.13396.pdf
[8] http://arxiv.org/pdf/2502.01534.pdf
[9] https://arxiv.org/pdf/2404.08008.pdf
[10] http://arxiv.org/pdf/2410.16256.pdf
[11] http://arxiv.org/pdf/2502.13908.pdf
[12] https://arxiv.org/pdf/2409.09045.pdf
[13] https://arxiv.org/html/2406.11871v1
[14] https://arxiv.org/pdf/2402.10669.pdf
[15] https://arxiv.org/pdf/2402.01766v2.pdf
[16] http://arxiv.org/pdf/2502.02988.pdf
[17] http://arxiv.org/pdf/2412.00166.pdf
[18] http://arxiv.org/pdf/2502.18018.pdf
[19] http://arxiv.org/pdf/2503.13507.pdf
[20] http://arxiv.org/pdf/2411.03417.pdf
[21] http://arxiv.org/pdf/2402.06782.pdf
[22] https://arxiv.org/pdf/2410.10215.pdf
[23] https://aclanthology.org/2023.findings-emnlp.722.pdf
[24] http://arxiv.org/pdf/2503.05061.pdf
[25] https://aclanthology.org/2023.findings-emnlp.796.pdf
[26] https://arxiv.org/pdf/2405.20947.pdf
[27] https://arxiv.org/pdf/2406.11717.pdf
[28] https://arxiv.org/pdf/2401.05566.pdf
[29] https://arxiv.org/pdf/2501.15453.pdf
[30] http://arxiv.org/pdf/2501.10800v1.pdf
[31] https://arxiv.org/pdf/2310.13798.pdf
[32] https://arxiv.org/pdf/2010.07079.pdf
[33] https://arxiv.org/pdf/2404.07362.pdf
[34] https://www.aclweb.org/anthology/2020.acl-main.442.pdf
[35] http://arxiv.org/pdf/2005.04118v1.pdf
[36] http://arxiv.org/pdf/2407.03572.pdf
[37] https://arxiv.org/html/2409.11052
[38] http://arxiv.org/pdf/2408.10918.pdf
[39] https://arxiv.org/pdf/2103.13353.pdf
[40] https://aclanthology.org/2023.emnlp-main.153.pdf
[41] https://arxiv.org/pdf/2303.16634.pdf
[42] https://aclanthology.org/2023.emnlp-main.543.pdf
[43] https://arxiv.org/pdf/2410.09775.pdf
[44] http://arxiv.org/pdf/2501.15595.pdf
[45] http://arxiv.org/pdf/2306.03100.pdf
[46] https://arxiv.org/html/2503.05965v1
[47] http://arxiv.org/pdf/2403.02839.pdf
[48] https://arxiv.org/pdf/2503.04910.pdf
[49] http://arxiv.org/pdf/2312.06149.pdf
[50] https://arxiv.org/pdf/2411.15100.pdf
[51] https://arxiv.org/pdf/2303.04729.pdf
[52] https://arxiv.org/pdf/2404.02823.pdf
[53] https://www.aclweb.org/anthology/P19-1080.pdf
[54] https://aclanthology.org/2023.emnlp-main.190.pdf
[55] https://arxiv.org/pdf/2402.08761.pdf
[56] https://arxiv.org/pdf/2104.14700.pdf
[57] https://pmc.ncbi.nlm.nih.gov/articles/PMC10120732/
[58] http://arxiv.org/pdf/2411.03350.pdf
[59] https://arxiv.org/pdf/2212.08073.pdf
[60] https://arxiv.org/pdf/2312.03689.pdf
[61] https://arxiv.org/pdf/2402.07350.pdf
[62] http://arxiv.org/pdf/2502.15861.pdf
[63] https://arxiv.org/pdf/2305.18449.pdf
[64] http://arxiv.org/pdf/2503.04474.pdf
[65] http://arxiv.org/pdf/2402.13926.pdf
[66] https://arxiv.org/pdf/2405.13820v1.pdf
[67] https://arxiv.org/pdf/2402.15302.pdf
[68] https://arxiv.org/abs/2301.12867
[69] http://arxiv.org/pdf/2405.06800.pdf
[70] http://arxiv.org/pdf/2502.16366.pdf
[71] https://arxiv.org/pdf/2402.08983.pdf
[72] https://arxiv.org/pdf/2310.08118.pdf
[73] http://arxiv.org/pdf/2407.00215.pdf
[74] https://arxiv.org/pdf/2310.03714.pdf
[75] http://arxiv.org/pdf/2403.16479.pdf
[76] https://arxiv.org/pdf/2311.02103.pdf
[77] https://arxiv.org/pdf/2401.15545.pdf
[78] http://arxiv.org/pdf/2503.00145.pdf
[79] https://aclanthology.org/2023.findings-emnlp.89.pdf
[80] http://arxiv.org/pdf/2409.10280.pdf
[81] http://arxiv.org/pdf/2411.15470.pdf
[82] http://arxiv.org/pdf/2407.13633.pdf
[83] https://arxiv.org/pdf/2410.19738.pdf
═══════════════════════ Q3 — DISCLOSURE / PROVENANCE ═══════════════════════
# Disclosure, Provenance, and Quotation Integrity in AI‑Assisted Humanities Dissertations (2024–2026)

The rapid diffusion of large language models (LLMs) into academic writing has forced graduate schools, research organizations, and standards bodies to articulate new expectations for disclosure, provenance, and quotation integrity in theses and dissertations, especially in the humanities where interpretive prose and source‑based argumentation are central. Across leading universities and research bodies between roughly 2023 and 2026, a clear pattern has emerged: generative AI may be used only within carefully defined bounds, its use must be transparently disclosed at a non‑trivial level of granularity, and human authors remain fully responsible for the correctness of facts, citations, and quotations, with particular concern about hallucinated or subtly altered quoted material.(University of Georgia Graduate School, “Policy on Use of Generative AI in Theses and Dissertations,” 2023, institutional policy webpage, evidence strength: MODERATE)[1](Harvard Graduate School of Education Office of the Registrar, “HGSE AI Policy,” 2023, institutional policy webpage, evidence strength: MODERATE)[14](ETH Zurich Library, “Plagiarism and Generative Artificial Intelligence – KI,” 2023, institutional guidance webpage, evidence strength: MODERATE)[13]  At the same time, standards for machine‑readable provenance such as W3C’s PROV model and the C2PA content provenance specification provide formal vocabularies for representing authorship and transformation trails, even though their application to fine‑grained textual authorship in dissertations is still emergent rather than fully institutionalized.(World Wide Web Consortium, Moreau & Groth eds., “PROV‑DM: The PROV Data Model,” W3C Recommendation, 2013, standards specification, evidence strength: MODERATE)(Coalition for Content Provenance and Authenticity, “C2PA Technical Specification,” 2023, standards specification, evidence strength: MODERATE)  In this report I synthesize policy documents and technical guidelines from leading universities and research bodies, together with formal provenance frameworks, to evaluate how a gate‑enforced, multi‑stage LLM drafting protocol for humanities dissertation prose—structured as plan → discourse skeleton → draft with quotation placeholders → mechanical gates → separate LLM‑judge gates → a bounded revision loop—can be brought into alignment with current norms on disclosure, provenance, and verbatim quotation integrity, and whether per‑passage hash‑chained provenance records with gate annotations are proportionate or excessive relative to these emerging standards.

## 1. Framing the Problem: Gate‑Enforced LLM Drafting Protocols and Humanities Dissertation Norms

### 1.1. Gate‑Enforced Multi‑Stage Drafting as a Response to Integrity Concerns

The multi‑stage LLM drafting protocol you are considering—beginning with a human‑directed conceptual plan, moving through a discourse skeleton, then producing a prose draft with strictly controlled quotation placeholders, and finally subjecting each stage to mechanical and judgmental gates within a bounded revision loop of at most three iterations—embodies an attempt to reconcile the affordances of generative AI with traditional scholarly expectations of originality, transparency, and source fidelity in humanities dissertations. This kind of protocol is motivated by widely documented concerns in institutional guidelines that generative AI tools can hallucinate facts, fabricate citations, and manipulate quoted material, and that they blur the boundary between human and machine authorship unless their use is carefully constrained and disclosed.(Harvard University Information Technology, “Generative AI Guidelines,” 2023, institutional IT guidance webpage, evidence strength: MODERATE)[4](University of Washington College of Engineering, “UW Engineering’s AI and Content Guidelines,” 2023, institutional guidance webpage, evidence strength: MODERATE)[9](ETH Zurich, “Academic Integrity,” 2023, institutional academic integrity webpage, evidence strength: MODERATE)[10]  For example, Harvard’s university‑wide IT guidance explicitly cautions that AI‑generated content may be inaccurate, misleading, or entirely fabricated, and emphasizes that users remain responsible for any content they publish that includes AI‑generated material.(Harvard University Information Technology, “Generative AI Guidelines,” 2023, institutional IT guidance webpage, evidence strength: MODERATE)[4]  Similarly, the University of Washington’s College of Engineering notes that generative AI can hallucinate, be boring, lack depth, and “manipulate and create false quotations,” and urges that AI output always be reviewed and verified by a human before external use.(University of Washington College of Engineering, “UW Engineering’s AI and Content Guidelines,” 2023, institutional guidance webpage, evidence strength: MODERATE)[9]  ETH Zurich’s academic integrity guidance stresses that content creators remain responsible for correctness and quality, and that generative AI’s probabilistic outputs must always be scrutinized by a “human in the loop” to validate results and check for biases.(ETH Zurich, “Academic Integrity,” 2023, institutional academic integrity webpage, evidence strength: MODERATE)[10]

Within this landscape, a gate‑enforced protocol seeks to treat LLMs as tools for constrained drafting and revision, not as autonomous authors, while making it easier to delimit machine contributions and maintain an auditable trail of human oversight. The protocol’s initial human plan and discourse skeleton stages foreground human agency in defining the argumentative structure, while the subsequent AI‑assisted drafting stage is designed to be bounded by quote‑ID placeholders that prevent the model from inventing or altering verbatim quotations from primary or secondary sources. This structural separation resonates with guidelines from institutions like Harvard Graduate School of Education, which permit generative AI for brainstorming, clarification, and scenario generation but explicitly forbid using AI to “create all or part of an assignment” that is then submitted as one’s own work without attribution.(Harvard Graduate School of Education Office of the Registrar, “HGSE AI Policy,” 2023, institutional policy webpage, evidence strength: MODERATE)[14]  That policy also requires students to acknowledge and document any permitted use of generative AI by naming the tools used, the prompts provided, and how the output was integrated into the final work, thereby implicitly encouraging workflows where AI assistance is modular and traceable rather than pervasive and opaque.(Harvard Graduate School of Education Office of the Registrar, “HGSE AI Policy,” 2023, institutional policy webpage, evidence strength: MODERATE)[14]

From an evidence perspective, the rationale for such gated protocols is supported primarily by institutional risk assessments and technical guidelines rather than large‑scale controlled experiments on dissertation drafting. University IT and ethics offices have synthesized reported failures of LLMs—such as hallucinated citations, misquotations, and privacy risks—and built policies around human oversight and transparency, but there is relatively little peer‑reviewed experimental work on the specific design of multi‑stage, gate‑enforced dissertation writing pipelines.(Harvard University Information Technology, “Generative AI Guidelines,” 2023, institutional IT guidance webpage, evidence strength: MODERATE)[4](ETH Zurich Library, “Plagiarism and Generative Artificial Intelligence – KI,” 2023, institutional guidance webpage, evidence strength: MODERATE)[13](European Commission Directorate‑General for Research and Innovation, “Living Guidelines on the Responsible Use of Generative AI in Research,” 2024, technical guidelines document, evidence strength: MODERATE)[12]  As a result, any detailed protocol design must be understood as an interpretation and operationalization of principles articulated in these guidelines rather than as a direct implementation of tested templates; the evidence for specific multi‑gate architectures is therefore best classified as WEAK in the strict sense of lacking dedicated empirical validation, even though the underlying concerns they address are well documented.

### 1.2. Humanities Dissertations as

## CITATIONS
[1] https://grad.uga.edu/policy-on-use-of-generative-ai-in-theses-and-dissertations/
[2] https://communitystandards.stanford.edu/policies-guidance%23policies-guidance-links/bca-guidance-recommendations
[3] https://ist.mit.edu/ai-guidance
[4] https://www.huit.harvard.edu/ai/guidelines
[5] https://www.ox.ac.uk/research/support/governance-and-committees/research-policies/policy-for-using-generative-ai-in
[6] https://www.cshss.cam.ac.uk/education/generative-artificial-intelligence-ai-and-scholarship/template-declaration-use-generative
[7] https://history.princeton.edu/graduate/ai-policy
[8] https://grad.berkeley.edu/academics/graduate-academic-integrity/resources-for-faculty-and-staff/
[9] https://www.engr.washington.edu/mycoe/marcom/social-media/ai-guidelines
[10] https://ethz.ch/en/the-eth-zurich/education/ai-in-education/academic-integrity.html
[11] https://digitalcommons.usu.edu/etd2023/124/
[12] https://research-and-innovation.ec.europa.eu/document/download/2b6cf7e5-36ac-41cb-aab5-0d32050143dc_en?filename=ec_rtd_ai-guidelines.pdf
[13] https://library.ethz.ch/en/scientific-writing/plagiat-und-kuenstliche-intelligenz-ki.html
[14] https://registrar.gse.harvard.edu/learning/policies-forms/ai-policy
[15] https://ora.ox.ac.uk/objects/uuid:415b8656-afe9-4f53-9155-d8852d3aee2c
═══════════════════════ Q1 — STYLOMETRIC BANDS / SAMPLE SIZE ═══════════════════════
# Stylometric Tolerance Bands and Authorship Verification as Quality Gates in Multi‑Stage LLM Drafting Protocols for Humanities Dissertations

Designing a gate‑enforced, multi‑stage large language model (LLM) drafting protocol for humanities dissertation prose requires a precise understanding of how far one can trust stylometric measurements at the scale of typical dissertation sections, and how reliably authorship‑verification methods and style‑control techniques can be used as quality gates. Drawing only on peer‑reviewed work and technical reports from major universities, research organizations, and top venues in computational linguistics and stylometry, this report synthesizes evidence on three tightly related topics: minimum text length and within‑author variance for stable stylometric fingerprints; the stability of particular stylometric features in short LLM‑generated sections and the limits of reliable measurement at 400–1500 words; and the state of the art in authorship verification and LLM style matching, including exemplar‑based control, numeric targets, and fine‑tuning. For every empirical finding, the originating authors, institutions, year, venue, and an explicit evidence‑strength grade (STRONG, MODERATE, WEAK) are provided. Overall, existing work suggests that robust, content‑agnostic stylometric fingerprints generally require several thousand tokens, that within‑author variation across documents is substantial but structured enough to support empirically derived tolerance bands, that many lexical and syntactic features can be measured with moderate reliability in 1000–1500 word sections while more global discourse metrics are underpowered, and that modern representation‑learning approaches to authorship verification offer promising—but still methodologically contested—foundations for using “same‑author” scoring as a gate on LLM‑generated prose. Evidence on direct style control in LLMs via numeric stylometric targets is currently weak, whereas exemplar‑based conditioning and fine‑tuning enjoy moderate empirical support.  

## 1. Context: Multi‑Stage LLM Drafting and Stylometry in Humanities Research Writing

### 1.1. The Gate‑Enforced Drafting Protocol and its Stylometric Goals

The protocol under consideration can be characterized as a structured, multi‑stage drafting pipeline in which an LLM produces dissertation prose via a sequence of steps: an explicit plan, a discourse skeleton, a first draft with quote‑ID placeholders, a set of mechanical gates (for citation, structure, and basic style checks), followed by independent LLM‑judge gates and a bounded revision loop limited to three iterations. The central methodological question is how stylometric and authorship‑verification tools can be integrated into this pipeline to impose quantitative constraints on style, thereby ensuring that the generated prose remains consistent with the human author’s established scholarly voice and meets discipline‑specific expectations for humanities writing.

Stylometric research over the last decade has increasingly addressed the question of how to operationalize “authorial style” as measurable patterns in lexical choice, syntactic structure, and discourse organization, and how to distinguish those patterns from topic, genre, and content effects. The survey “Authorship Attribution Methods, Challenges, and Future Research Directions,” published in *Information* (MDPI) in 2023 by a team of authors from institutions in India and Saudi Arabia, provides a broad overview of stylometric feature sets and machine‑learning methods for authorship attribution and verification, emphasizing their relevance to forensic linguistics, plagiarism detection, and software forensics.[10][10][10][10] Evidence from this survey is MODERATE because it synthesizes many peer‑reviewed studies but itself has not been independently replicated.

For humanities dissertation prose, the salient style dimensions include sentence length distributions, degree of syntactic subordination, choice of reporting verbs and evaluative adjectives, the balance between direct quotation and paraphrase, and higher‑order discourse moves such as hedging, stance marking, and intertextual framing. None of these dimensions can be treated as entirely content‑agnostic, but stylometry aims to capture the subset that remains relatively stable across topics and sections for a given author. Studies on content‑agnostic stylometry, such as the work on “authorship identification of documents with high content similarity” by human‑computer interaction researchers at the University of Göttingen and the University of Kassel, published in *Frontiers in Psychology* in 2018, show that humans and algorithms can identify authorship among documents with nearly identical content by focusing on features like function word frequencies, punctuation use, and preferred syntactic constructions.[8][8][8][8][8] This evidence is MODERATE, arising from a single peer‑reviewed study with controlled experimental design but not yet widely replicated.

A gate‑enforced LLM drafting protocol seeks to harness these stylometric insights in two ways. First, it aims to define tolerance bands for key stylistic metrics—ranges within which generated text should fall to be considered consistent with the author’s voice. Second, it contemplates using authorship‑verification models as “same‑author” gates, requiring that generated sections be classified as likely written by the human author rather than by some undefined external source. Both uses require careful consideration of minimum text length, within‑author variance, and the stability of stylometric features at section scale.

### 1.2. From Authorship Attribution to Authorship Verification and Style Quality Gates

Traditional authorship attribution research, dating back to mid‑twentieth‑century analyses of disputed literary texts, focused on closed‑set classification: given an anonymous text and a known set of candidate authors, assign the most probable author. As the MDPI survey by the Indian–Saudi team notes, this paradigm has expanded to include open‑set attribution, authorship verification (deciding whether two texts are by the same author), and style change detection within multi‑authored documents.[10][10][10][10] The survey reviews work in venues such as ACL, EMNLP, and forensic linguistics journals, highlighting that authorship verification is particularly relevant when the set of possible authors is large or undefined, which is typical in online environments and aligns closely with our situation of comparing LLM outputs to a single human author’s corpus.

A recent preprint “Stylometry Analysis of Multi‑authored Documents for Authorship and Author Style Change Detection” by researchers affiliated with a European technical university and published on arXiv in 2024 extends verification paradigms to multi‑authored and AI‑augmented documents, proposing a pipeline that segments documents and applies stylometric clustering to detect shifts in authorial style.[11] Because this work is currently a preprint without formal peer review, its evidence is graded as WEAK, though it is noteworthy for directly addressing LLM‑influenced authorship. The authors argue, based on stylometric features such as function word frequencies, POS n‑grams, and syntactic complexity, that style changes introduced by AI tools can be detected even when content remains constant, suggesting that similar techniques could be used to monitor LLM‑generated dissertation prose.

Parallel to stylometry, deep‑learning work has explored authorship representation learning. The 2023 paper “Can Authorship Representation Learning Capture Stylistic Features?” published in *Transactions of the Association for Computational Linguistics* (TACL) by a collaboration including researchers from a major US university and industry labs (e.g., Google Research) investigates whether representations learned from large author‑labeled corpora genuinely encode stylistic rather than topical information.[5][5][5][5][5][5][5] This study uses datasets of fanfiction, blogs, and other social media texts, training neural models to perform authorship attribution and then probing whether the learned embeddings correlate with stylistic features. The evidence is MODERATE, as it is a single, peer‑reviewed study in a top venue, but its conclusions are nuanced and partially contested.

For a gate‑enforced dissertation drafting protocol, the import of this line of work is twofold. On one hand, it supports the feasibility of authorship‑verification models that can compare generated sections to a reference corpus of the student’s past writing and produce a same‑author likelihood score. On the other hand, it warns that such models may inadvertently rely on topical or contextual cues if not carefully controlled, which would be problematic for cross‑chapter comparisons in dissertations where topics evolve. This tension is particularly relevant when we consider minimum text length and within‑author variability.

## 2. Minimum Text Length and Within‑Author Variance in Stylometric Fingerprints

### 2.1. Stylometric Stability and Sample Size: General Principles

Stylometry depends on the law of large numbers applied to linguistic events: the more tokens, sentences, and clauses we observe from a given author, the closer our empirical estimates of frequencies (e.g., function word usage, average sentence length, clause‑depth distribution) approach the author’s underlying stylistic preferences. At small sample sizes, stochastic variation and content effects can dominate, causing substantial noise in measured metrics. The MDPI survey on authorship attribution reports that many classical methods, particularly those based on relative frequencies of function words or character n‑grams, show a monotonic improvement in accuracy as sample size increases from a few hundred to several thousand tokens.[10][10][10][10] Because this survey synthesizes numerous peer‑reviewed experiments, including work in leading computational linguistics venues, the evidence for such monotonic improvement is STRONG.

Empirical studies focusing explicitly on short texts provide more fine‑grained insights. The paper “An Investigation of Supervised Learning Methods for Authorship Attribution in Short Hinglish Texts using Char & Word N‑grams” by Kaur and colleagues at the National Institute of Technology, Kurukshetra, India, published in *Computing* in 2019, examines authorship attribution for very short bilingual (Hindi–English) messages retrieved from a messaging application.[19][19][19] They experiment with varying text lengths and report that character n‑gram features achieve reasonable attribution accuracy even for texts around 100–200 words, while word‑level n‑grams perform poorly at such lengths. This is a single peer‑reviewed study in a specialist journal, so the evidence is MODERATE. However, because Hinglish social messages differ markedly from humanities dissertation prose in genre and register, we must be cautious in extrapolating.

Studies grounded in European languages and literary texts offer complementary data. The MDPI paper “Parallel Stylometric Document Embeddings with Deep Learning Based Language Models in Literary Authorship Attribution” by a team including researchers from a major Central European university, published in *Mathematics* in 2022, uses 7051 10,000‑token chunks from 700 part‑of‑speech and lemma‑annotated literary documents across seven languages to train deep stylometric embeddings.[1] They explicitly select 10,000‑token chunks to ensure sufficient length for stable stylometric representation, and their experiments show high attribution accuracy at this length. Because this is a single, peer‑reviewed study with large sample sizes and multilingual scope, the evidence for 10,000‑token chunks being sufficient for robust fingerprints is MODERATE.

Indirectly, minimum text length expectations can also be inferred from work modeling texts as complex networks. The study “Authorship attribution based on Life‑Like Network Automata” by Amancio and colleagues at the São Paulo State University and the University of São Paulo, published in *Frontiers in Physics* in 2018, represents words as nodes and links them based on textual co‑occurrence, then applies cellular automata dynamics to perform authorship attribution.[29][29][29][29] Their corpus consists of literary works of substantial length, and they note that network‑based measures such as clustering coefficient and betweenness centrality are more reliable when computed over long texts rather than short fragments. This is a single peer‑reviewed study in a reputable journal, so the evidence is MODERATE. The same authors’ earlier work “Comparing intermittency and network measurements of words and their dependency on authorship,” an arXiv preprint from 2011, analyzes word co‑occurrence networks across 40 books from 8 authors, finding that measures like average shortest path length and clustering coefficient depend on authorship but require substantial text to stabilize.[20][20][20][20] As a preprint without peer review, this evidence is WEAK, but it nevertheless reinforces the minimum length intuition.

Collectively, these studies suggest an empirical spectrum: for coarse stylometric attribution using character n‑grams or simple function‑word frequencies, text lengths of a few hundred words may suffice for moderate accuracy in some domains; for more nuanced style representation and content‑agnostic authorship verification, lengths on the order of several thousand tokens (e.g., 5,000–10,000 tokens) are typically used. Given that dissertation sections often fall in the 2,000–5,000 word range, a gate‑enforced protocol could plausibly treat each section as a viable unit for stylometric verification while recognizing that short subsections of 400–800 words may generate noisier measurements. Because this synthesis rests on multiple peer‑reviewed studies and surveys, the evidence for a qualitative relationship between text length and stylometric stability is STRONG.[1][10][10][10][10][29][29][29][29]

### 2.2. Within‑Author Variance across Documents and Sections

Minimum text length addresses the question of noise due to insufficient sampling, but for a gate protocol the more critical question is within‑author variance: how much do an author’s own stylometric metrics vary across documents or sections, and therefore how wide should tolerance bands be to avoid false rejections of authentically authored text?

Empirical work directly quantifying within‑author variance is relatively sparse, but several studies provide relevant observations. The “Authorship identification of documents with high content similarity” study in *Frontiers in Psychology* by Schaub, Keller, and colleagues (University of Göttingen and University of Kassel, 2018) conducts two experiments: a quantitative crowd‑sourcing study and a qualitative analysis, both involving documents with nearly identical content but different authors.[8][8][8][8][8] While their primary focus is on between‑author discrimination, their analysis shows that even when content and genre are controlled, individual authors exhibit variation in specific features such as sentence length, the use of personal pronouns, and punctuation intensity. They report ranges rather than fixed values, suggesting that authorship judgments rely on relative tendencies rather than rigid thresholds. Because this is a well‑designed, peer‑reviewed study, the evidence that within‑author stylometric metrics vary across documents yet retain identifiable patterns is MODERATE.

Legal stylistics research offers another window into within‑author variance. The article “Quantitative Distribution of Verbal Structures with Reference to the Authorship Factor in Legal Stylistics” by Malinowski at the University of Wrocław, published in *Studies in Logic, Grammar and Rhetoric* in 2021, examines a custom corpus of English legal texts classified as secondary genres and investigates the distribution of verbal structures across authorship categories.[26][26] The study applies quantitative and qualitative analysis to show that individual legal writers exhibit tendencies in the use of active vs. passive voice, modal verbs, and particular verbal constructions, but these tendencies fluctuate depending on genre (e.g., contracts vs. briefs) and document purpose. The evidence is MODERATE, as this is a single peer‑reviewed study, but it supports the view that within‑author variability is constrained by genre and communicative purpose yet non‑trivial in magnitude.

Network‑based stylometry again provides hints. Amancio’s “Life‑Like Network Automata” study observes that topological measures of word co‑occurrence networks differ across books by the same author, especially when the books span different periods or genres.[29][29][29][29] Although the authors do not quantify within‑author variance in detail, they note that some metrics (e.g., average path length) are relatively stable within an author’s oeuvre, while others (such as betweenness centrality of particular thematic words) fluctuate. This is MODERATE evidence derived from a single peer‑reviewed study that treats each book as a unit, and it suggests that gate designs should focus on features known to be relatively stable, such as function word distributions and overall sentence length profiles, rather than topic‑sensitive measures.

The comprehensive MDPI survey on authorship attribution summarizes multiple studies in which classifier performance is evaluated under cross‑topic conditions, that is, training on one topic and testing on another.[10][10][10][10] The survey notes that methods relying heavily on content words degrade significantly when topic shifts, whereas those focusing on syntactic and function‑word features retain higher accuracy. Since cross‑topic variation within a single author’s dissertation is analogous to these conditions, this suggests that some features (function word frequencies, basic syntactic complexity measures) exhibit lower within‑author variance across topics than content‑heavy metrics. Because this conclusion is consistent across multiple surveyed experiments in venues such as ACL and EMNLP, the evidence that function‑word and syntactic features are more stable across topics than content features is STRONG.

These findings collectively imply that within‑author variance is feature‑dependent. Measures like average sentence length, distribution of clause depth, and frequencies of core function words exhibit relatively narrow variation across sections written by the same author in similar genres, whereas content‑linked features such as topic‑specific terminology, discourse markers tied to argument structure, and network centrality of thematic terms vary substantially. For a humanities dissertation, where genre remains constant but topics evolve, tolerance bands for stable features can be relatively tight, while content‑linked features should either be excluded from gating or granted broader bands.

Because this synthesis relies on multiple peer‑reviewed studies and survey evidence, we can grade the overall conclusion—that within‑author variance is non‑trivial but structured and feature‑dependent—as STRONG.[8][8][8][8][8][26][26][10][10][10][10][29][29][29][29]

### 2.3. Empirical Tolerance Bands versus Fixed ± Widths

Given measurable within‑author variance, a crucial methodological question is whether tolerance bands for stylometric gates should be derived empirically—from distributions of metrics computed over

## CITATIONS
[1] https://www.mdpi.com/2227-7390/10/5/838/pdf?version=1646620629
[2] https://thescipub.com/pdf/jcssp.2010.235.243.pdf
[3] http://thesai.org/Downloads/Volume9No7/Paper_9-Ranking_Attribution_A_Novel_Method.pdf
[4] https://arxiv.org/pdf/2310.00436.pdf
[5] https://direct.mit.edu/tacl/article-pdf/doi/10.1162/tacl_a_00610/2184071/tacl_a_00610.pdf
[6] https://www.aclweb.org/anthology/E17-1107.pdf
[7] https://arxiv.org/pdf/2208.07395.pdf
[8] https://pmc.ncbi.nlm.nih.gov/articles/PMC5838116/
[9] http://arxiv.org/pdf/2402.04477.pdf
[10] https://www.mdpi.com/2078-2489/15/3/131/pdf?version=1709103650
[11] https://arxiv.org/pdf/2401.06752.pdf
[12] https://www.mdpi.com/2227-9709/9/3/60/pdf?version=1663118511
[13] https://arxiv.org/pdf/2212.06571.pdf
[14] https://pmc.ncbi.nlm.nih.gov/articles/PMC10399000/
[15] https://pmc.ncbi.nlm.nih.gov/articles/PMC8492806/
[16] https://pmc.ncbi.nlm.nih.gov/articles/PMC2215071/
[17] https://www.mdpi.com/2304-6775/10/1/9/pdf
[18] https://royalsocietypublishing.org/doi/10.1098/rspb.2024.1222
[19] https://arxiv.org/ftp/arxiv/papers/1812/1812.10281.pdf
[20] http://arxiv.org/pdf/1112.6045.pdf
[21] https://arxiv.org/pdf/2206.07026.pdf
[22] http://journals.uran.ua/eejet/article/download/186834/189088
[23] http://journals.uran.ua/eejet/article/download/142451/142492
[24] http://journals.uran.ua/eejet/article/download/149596/151353
[25] https://zenodo.org/records/4087660/files/15%20years%2014102020%20preprint.pdf
[26] https://www.sciendo.com/article/10.2478/slgr-2021-0010
[27] https://www.cambridge.org/core/services/aop-cambridge-core/content/view/S0261444800013811
[28] http://arxiv.org/pdf/2407.14997.pdf
[29] https://pmc.ncbi.nlm.nih.gov/articles/PMC5863954/
[30] https://arxiv.org/pdf/2210.13628.pdf
[31] https://pmc.ncbi.nlm.nih.gov/articles/PMC7544919/
[32] https://arxiv.org/pdf/2304.01393.pdf
[33] https://dx.plos.org/10.1371/journal.pone.0284630
[34] https://journals.openedition.org/variants/pdf/1220
[35] https://pmc.ncbi.nlm.nih.gov/articles/PMC10619992/
[36] https://computingonline.net/computing/article/view/512