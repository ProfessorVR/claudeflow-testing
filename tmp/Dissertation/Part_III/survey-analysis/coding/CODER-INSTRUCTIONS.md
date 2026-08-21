# Coder Instructions — VLE Survey Open-Text Corpus (read fully before coding)

You are coding anonymized student survey responses from an undergraduate biomedical engineering course taught with a virtual learning environment (VLE). Deployment context: the VLE is a downloadable 3D application (a virtual medical center with clinical 360° videos and clinician interviews inside it), run by students **on their own computers (desktop 3D)**; the survey calls it "the VR platform" but headset use was effectively nil in these terms. A set of **YouTube videos** of the same clinical footage existed as a fallback; ~44% of students used only those. Items: Q5 = most useful aspect of the course; Q6 = what could be improved; Q9 = what to add/improve in the platform; Q10 = proposed educational VR use-cases.

## Your task
For EVERY input line, assign one or more codes from the codebook below. Base codes ONLY on what the text says — no inference beyond the words. A response may take codes from several families; within a family pick the best fit(s). If a response is in a language other than English, translate it, code the translation, and add the flag `TRANSLATED`.

## Codebook

**Family A — boredom-form signatures**
- `A1.dark` darkness/visibility/legibility/grainy-image complaints
- `A1.nav` navigation/wayfinding/hard-to-find-things complaints
- `A1.crash` crash/bug/glitch/freeze complaints
- `A1.lag` latency/buffering/loading/optimization/performance complaints
- `A1.occl` avatar-occlusion/bodies-in-the-way complaints
- `A1.prox` must-stand-close/viewing-distance complaints
- `A1.install` install/download/compatibility/setup complaints
- `A1.hw` hardware access complaints (no headset, laptop too weak)
- `A1.other` other DETERMINATE named friction
- `A2-DIFFUSE` dissatisfaction/emptiness with NO determinate culprit ("just didn't do much for me")
- `A3-MONOTONY` tedium words about the offering: monotonous, boring, repetitive, dry, long-winded
- `A4-DIV` divergence candidate: THE SAME RESPONSE contains a surface-positive signal (praise/engagement/presence) AND a hollowness/emptiness/monotony signal (e.g. "the idea is amazing, the videos not so much")
- `A5-WITHDRAWN` gave up / stopped using / abandoned after trying (NOT mere non-access)

**Family B — flight / passing-the-time**
- `B1-FALLBACK` used the YouTube videos instead of the app (any stated reason)
- `B2-MINIMAL` minimal-compliance use (did the least required, skimmed, just-for-the-quiz)
- `B3-PASSTIME` off-task self-occupation during materials (multitasking, phone)

**Family C — temporal texture**
- `C1-DRAG` time-drag phenomenology: dragged, took forever, couldn't sit through, felt long
- `C2-FLOW` time-vanishing: flew by, lost track of time
- `C3-LENGTH` objective length comments (too long/short) WITHOUT drag phenomenology

**Family D — design/chain-node (the platform as designed conditions)**
- `D0-A0A1` perceptual conditions: visibility, audio quality, image grain/quality of the ROOM/environment
- `D1-A2` content/image quality at the pivot: 360 footage quality, camera position, views
- `D2-A3` interest/meaning: content relevance, fascination, curiosity (or their absence)
- `D3-A3A4` action affordances: interactivity, things to DO, tasks, note-taking, "just watching" complaints, wanting hands-on
- `D4-LOOP` return-use/habit: would use again, came back, one-and-done

**Family E — involvement channels (mention-level vocabulary)**
- `E-KIN` movement/controls as felt experience
- `E-SPA` space/place/layout/exploring/getting lost
- `E-SHA` others/avatars/multi-user/together/collaboration
- `E-NAR` cases/stories/the patient/procedure narratives
- `E-AFF` feelings: exciting, cool, uncomfortable, nauseating, wonder
- `E-LUD` goals/tasks/challenge/quiz-driven engagement

**Family F — incorporation-positive**
- `F1-PRESENCE` being-there talk: "actually in the OR," immersive, felt present
- `F2-WORLD` the environment as a PLACE: rooms, walking through, being inside
- `F3-CARRY` carry-over: thought about it after, changed how they see clinical settings, applied elsewhere

**Family G — suggestions (mostly Q9/Q10)**
- `G1-PROVISION` provide hardware/access (headsets, lab sessions)
- `G2-OPTIMIZE` performance/stability/compatibility improvements
- `G3-CONTENT` more/better/varied content (procedures, specialties, interviews)
- `G4-INTERACT` add interactivity/tasks/assessment in-world
- `G5-GUIDE` onboarding/tutorial/navigation help/clearer instructions
- `G6-USECASE` proposed VR use-cases beyond the course (Q10's remit) — anatomy teaching, remote teamwork, museums, etc.

**Family H — emergent**
- `H-NEW-<slug>` anything codable that fits NO code above (invent a short slug; use sparingly)

**Housekeeping**
- `X-NONUSE` pure non-access statement without evaluation ("never used it") — if a friction is named as the REASON, also add the A1.* code
- `X-EMPTY` contentless: "n/a," "nothing," "good," "none"
- `X-OFFTOPIC` course elements unrelated to the VLE/videos: exams, homework, grading, lecture logistics, scheduling. (Talk about the clinical videos, the platform, or course video content IS on-topic.)
- `MASK` any person-name or self-identifying info still visible in the text (flag it; do not repeat the name in evidence)

## Output format — STRICT
One line per input response, same order as input, pipe-separated:
`rcode|item|CODE1;CODE2;CODE3|evidence`
- `evidence` = a short quoted span (≤12 words, verbatim from the response) ONLY when you assigned any Family-A code, F1-PRESENCE, or C1-DRAG; otherwise leave the field empty (line ends with `|`).
- Every input line MUST appear exactly once in your output. No commentary, no headers, no blank lines — output the coded lines ONLY.
