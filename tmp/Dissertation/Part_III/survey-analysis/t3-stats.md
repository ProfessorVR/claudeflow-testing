# T3 Diagnostics — coded-corpus statistics (post-adjudication)

**REBUILT 2026-07-23 (Station 7 Fable re-pass refresh; backup `.backups/20260723T173251/`).**
Canonical passes are now ALL Fable 5: batches 1/2/5 take the blind replacement passes
`coding/pass2-{1,2,5}.txt` (superseding the Haiku 4.5 passes; cross-model mean Jaccard
.596/.514/.668 — see `coding/xmodel-batch{1,2,5}-compare.txt`); batches 3/4/6 unchanged.
Adjudications 1–7 verified intact post-rebuild. Findings impact: `07-repass-impact-memo.md`.

## Code counts (total | W25/S25/W26 | per-100-responses APP vs VID)
- `G6-USECASE`: 184 | 81/60/43 | APP 21.2 vs VID 21.1
- `X-OFFTOPIC`: 179 | 72/64/43 | APP 19.4 vs VID 21.6
- `D2-A3`: 166 | 73/40/53 | APP 20.7 vs VID 17.2
- `E-SHA`: 91 | 41/29/21 | APP 11.0 vs VID 9.8
- `X-EMPTY`: 69 | 19/24/26 | APP 9.1 vs VID 6.6
- `G3-CONTENT`: 58 | 23/25/10 | APP 7.1 vs VID 6.1
- `G4-INTERACT`: 57 | 22/24/11 | APP 8.6 vs VID 4.2
- `G5-GUIDE`: 52 | 16/27/9 | APP 5.6 vs VID 6.4
- `E-NAR`: 51 | 24/12/15 | APP 6.7 vs VID 4.9
- `B1-FALLBACK`: 48 | 31/7/10 | APP 3.2 vs VID 8.1
- `E-LUD`: 41 | 14/15/12 | APP 2.8 vs VID 6.9
- `G2-OPTIMIZE`: 39 | 22/12/5 | APP 3.7 vs VID 5.4
- `D3-A3A4`: 37 | 21/7/9 | APP 4.8 vs VID 3.7
- `E-SPA`: 36 | 25/6/5 | APP 4.3 vs VID 3.9
- `D1-A2`: 34 | 24/7/3 | APP 5.0 vs VID 2.7
- `E-AFF`: 34 | 16/10/8 | APP 4.1 vs VID 3.7
- `A1.other`: 32 | 22/3/7 | APP 5.0 vs VID 2.2
- `A1.crash`: 29 | 21/4/4 | APP 4.1 vs VID 2.5
- `A1.install`: 26 | 14/7/5 | APP 0.9 vs VID 5.4
- `A1.lag`: 25 | 14/5/6 | APP 3.0 vs VID 2.7
- `A1.nav`: 21 | 10/6/5 | APP 2.8 vs VID 2.0
- `X-NONUSE`: 21 | 12/6/3 | APP 0.0 vs VID 5.1
- `F1-PRESENCE`: 19 | 8/4/7 | APP 2.8 vs VID 1.5
- `A1.hw`: 13 | 8/4/1 | APP 0.9 vs VID 2.2
- `A4-DIV`: 13 | 6/3/4 | APP 1.3 vs VID 1.7
- `C3-LENGTH`: 13 | 7/4/2 | APP 1.3 vs VID 1.7
- `H-NEW-lecture`: 13 | 9/4/0 | APP 0.9 vs VID 2.0
- `D0-A0A1`: 11 | 5/3/3 | APP 1.7 vs VID 0.7
- `A1.dark`: 10 | 7/2/1 | APP 1.5 vs VID 0.7
- `A2-DIFFUSE`: 10 | 5/1/4 | APP 1.5 vs VID 0.7
- `A5-WITHDRAWN`: 9 | 7/0/2 | APP 0.6 vs VID 1.5
- `G1-PROVISION`: 9 | 6/1/2 | APP 0.6 vs VID 1.5
- `H-NEW-skeptic`: 9 | 0/0/9 | APP 1.7 vs VID 0.2
- `D4-LOOP`: 8 | 1/1/6 | APP 0.9 vs VID 1.0
- `F3-CARRY`: 7 | 3/2/2 | APP 1.1 vs VID 0.5
- `E-KIN`: 6 | 5/1/0 | APP 0.2 vs VID 1.2
- `H-NEW-vr-redundant`: 6 | 6/0/0 | APP 0.4 vs VID 1.0
- `H-NEW-videos-suffice`: 5 | 5/0/0 | APP 0.4 vs VID 0.7
- `A3-MONOTONY`: 4 | 2/2/0 | APP 0.9 vs VID 0.0
- `F2-WORLD`: 4 | 2/1/1 | APP 0.9 vs VID 0.0
- `TRANSLATED`: 3 | 3/0/0 | APP 0.0 vs VID 0.7
- `A1.prox`: 2 | 1/1/0 | APP 0.2 vs VID 0.2
- `B2-MINIMAL`: 2 | 0/0/2 | APP 0.2 vs VID 0.2
- `H-NEW-optional`: 2 | 0/0/2 | APP 0.4 vs VID 0.0
- `C1-DRAG`: 1 | 0/1/0 | APP 0.2 vs VID 0.0
- `H-NEW-integration`: 1 | 0/0/1 | APP 0.0 vs VID 0.2
- `H-NEW-low-immersion`: 1 | 1/0/0 | APP 0.0 vs VID 0.2
- `H-NEW-playback`: 1 | 0/0/1 | APP 0.2 vs VID 0.0
- `MASK`: 1 | 0/0/1 | APP 0.0 vs VID 0.2 (W26-R007/Q5 — anonymization follow-up pending)

(responses by stratum: APP 463 · VID 408 · UNK 2)

(zero-attested codes after adjudication AND after the 2026-07-23 all-Fable rebuild: `A1.occl`, `B3-PASSTIME`, `C2-FLOW` — C2's strike [02 §Manual adjudication items 5–6] was independently replicated by the blind batch-2 replacement pass, which applied C2 nowhere; engagement-side temporal talk remains unattested in this corpus)

(code-ID hygiene 2026-07-23: off-codebook variant `D1-A0A1` — a coder blend of D1's prefix with D0's node label, 4 applications — folded into `D0-A0A1`; S25-R069/Q9 additionally +`D1-A2`; see 02 §Manual adjudication item 7. The blind Fable replacement pass reproduced the fold-in's readings natively and the variant is absent from the rebuilt corpus.)

## Friction-prediction scorecard (Wendt bme-vle-read predictions vs complaints)
- dark rooms / legibility (`A1.dark`): 10 complaints → **ATTESTED** [upgraded at the 2026-07-23 refresh; was 4/weakly — F2 wording ruling pending]
- avatar occlusion (`A1.occl`): 0 complaints → **UNATTESTED**
- must-stand-close (`A1.prox`): 2 complaints → **WEAKLY ATTESTED**
- buffer latency / performance (`A1.lag`): 25 complaints → **CONFIRMED**
- wayfinding/navigation (`A1.nav`): 21 complaints → **CONFIRMED**
- Unpredicted-but-found frictions: `A1.crash`=29, `A1.install`=26, `A1.hw`=13, `A1.other`=32

## DIV-candidate register (A4-DIV, full — rebuilt 2026-07-23; 13 rows / 12 unique texts, see dup note)
- **S25-R009/Q10** (Q8=VID-only, VID): "I do not think VR programs are where we want them at the moment. It is a cool concept, but I feel like at the moment it is not doing much to help regarding this class or the assignment. I feel like it makes it more confu"
- **S25-R021/Q5** (Q8=VID-only, VID): "I think the lectures gave the most direct information relevant to the course. The Vr was nice but it wasn't super useful in my opinion. It was harder to navigate than just regular youtube videos."
- **S25-R022/Q9** (Q8=Yes, APP): "The actual idea of having the VR clinic is amazing, the videos and images that come with it not so much"
- **W25-R014/Q9** (Q8=No, APP): "It just felt unnecessary honestly. The youtube videos got the job done just as well with less effort. The VR is a cool idea but the quality is so low I don't gain from the atmosphere and I dont feel immersed."
- **W25-R029/Q9** (Q8=VID-only, VID): "I think the platform is a little gimmicky and clunky. It was annoying to use at times, so I just stuck to the YouTube videos even though I thought the platform was pretty cool."
- **W25-R030/Q9** (Q8=No, APP): "The idea of the clinical immersion platform was very clever, however I think it did not greatly impact my learning personally because my laptop is unable to run the program to an effective degree. When I tried watching t"
- **W25-R065/Q6** (Q8=VID-only, VID): "If there's anything I wanted to have done more, it's use the 3D space. Even though this aspect of the course was the most heavily advertised, it didn't really serve much of a purpose in the learning of this class. Maybe "
- **W25-R075/Q6** (Q8=VID-only, VID): "I believe the VR platform could be improved to be a more enjoyable experience for the user. It still has great potential to be a thorough and useful immersive experience for viewing clinical procedures; however, the curr"
- **W25-R078/Q6** (Q8=VID-only, VID): "I thought the software was good in theory but honestly posted videos under modules would've been much more efficient and beneficial for our learning. I also think given the amount of units this course is I don't think th"
- **W26-R011/Q5** (Q8=VID-only, VID): [verbatim-identical to S25-R021/Q5 — the cross-term duplicate pair, 02 limitation 4: COUNT ONCE]
- **W26-R014/Q6** (Q8=No, APP): "I think the VR environment was really cool and I really started to appreciate it more as the quarter continued, but the VR does look odd on a laptop. I can understand how it would be beneficial if we actually had VR gogg"
- **W26-R016/Q6** (Q8=No, APP): "The virtual reality environment, while it allows for more immersion, wasn't the highlight of the course, and could be amended for something else."
- **W26-R049/Q6** (Q8=No, APP): "I think the VR platform is a fun idea however it is labor intensive for my laptop, so I don't run it very often, I think VR platform portion of the course is unnecessary for my understanding of the material."

(register changes at the 2026-07-23 rebuild: REMOVED — no coder-level A4 in the canonical passes — W25-R007/Q10, W25-R014/Q6, W25-R017/Q9, W25-R037/Q9, W25-R038/Q10, W25-R056/Q9, W25-R059/Q6; ADDED W26-R011/Q5 [dup], W26-R014/Q6. F5's §D-grid re-sort over the new register pending user review per 07-repass-impact-memo.)

## Wendt node scorecard (D-code count | co-occur A-family | co-occur F-family)
- `D0-A0A1`: 11 | with-A 9 | with-F 0
- `D1-A2`: 34 | with-A 18 | with-F 3
- `D2-A3`: 166 | with-A 11 | with-F 16
- `D3-A3A4`: 37 | with-A 4 | with-F 1
- `D4-LOOP`: 8 | with-A 3 | with-F 0

## Selected co-occurrences
- `A1.lag` ∧ `B1-FALLBACK`: 4
- `A1.install` ∧ `B1-FALLBACK`: 11
- `A1.crash` ∧ `B1-FALLBACK`: 5
- `A3-MONOTONY` ∧ `D1-A2`: 2
- `A3-MONOTONY` ∧ `C3-LENGTH`: 1
- `F1-PRESENCE` ∧ `D2-A3`: 10
- `H-NEW-*` (any) ∧ `B1-FALLBACK`: 5
- `A1.nav` ∧ `G5-GUIDE`: 11

## Channel mentions by term (E-family)
- `E-SHA`: W25 41 · S25 29 · W26 21
- `E-SPA`: W25 25 · S25 6 · W26 5
- `E-KIN`: W25 5 · S25 1 · W26 0
- `E-NAR`: W25 24 · S25 12 · W26 15
- `E-AFF`: W25 16 · S25 10 · W26 8
- `E-LUD`: W25 14 · S25 15 · W26 12

## Emergent (H-NEW-*) inventory
- `H-NEW-lecture`: 13 — e.g. "The lecture videos were the most useful as it provided loads of resources to use regarding the manufacturing and process"
- `H-NEW-skeptic`: 9 — e.g. "To be frank, I think the traditional way of learning is the most effective because it is the least gimmicky. However, to"
- `H-NEW-vr-redundant`: 6 (all W25, batch-1 Fable replacement pass) — e.g. "I think that the VR video game needs to be improved drastically, or else it is largely obsolete. I found it much easier "
- `H-NEW-videos-suffice`: 5 (all W25, batch-2 Fable replacement pass) — e.g. "To be honest, I don't think the VR application is needed at all because I saw a lot of students that were unable to down"
- `H-NEW-optional`: 2 — e.g. "I do not think this one should ever be mandated in the future. It should be an extra option. I cannot imagine a time whe"
- `H-NEW-low-immersion`: 1 — W25-R007/Q10
- `H-NEW-integration`: 1 — W26-R005/Q6 ("they can be integrated more into the course")
- `H-NEW-playback`: 1 — "I think it would be helpful to have the option to change the playback speed of the videos."
(dispositions in 02 §Emergent: vr-redundant + videos-suffice = the value-skepticism theme independently rediscovered in W25 — sweep numbers remain canonical for F6)

## WE activation-status recount (2026-07-23, adjudicated — full report: 06-we-activation-recount.md)
Candidate set 115 rows (E-SHA 67 ∪ keyword sweep 48); two blind passes, 93.0% exact agreement,
zero disagreement on the experience bins; 8 boundary disputes user-adjudicated 2026-07-23.
**Mention-level FLOORS — no activation denominator exists; never report as rates.**
- `ACTIVATOR`: 1 | 0/0/1 | Q10 (W26-R037)
- `NON-ACTIVATOR`: 11 | 7/3/1 | Q10×10, Q6×1 — 5 of 11 are non-E-SHA rows (E-SHA-filter insufficiency: family-level coding under-surfaces non-activation)
- `OPTATIVE-MANDATE`: 4 | 1/2/1 | Q9×1, Q10×3
- `OPTATIVE-CAPABILITY`: 13 | 6/4/3 | Q9×5, Q10×8 — awareness-gap subset 12 (5/4/3; excludes W25-R084, a genuine feature request per AUTHOR-CONFIRMED platform fact: no reservable private rooms)
- `COURSE-SOCIAL`: 28 · `HYPOTHETICAL`: 49 counted (50 rows; S25-R021/W26-R011 dup counted once) · `NOT-WE`: 8
(note: the recount predates the all-Fable rebuild and is independent of it — its candidate set was keyword-swept over the full corpus, not filtered by family codes; the E-SHA count cited in its header reflects the pre-rebuild corpus)
