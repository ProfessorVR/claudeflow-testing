# BME VR Clinical Needs-Finding Environment — Design + Chain Read (seed case)

**Role:** concrete seed evidence for the Wendt design lens (`../../_synthesis/dfd-vle-design-manual.md`) and the rhetorical-ontology bridge (`../../_synthesis/dfd-rhetorical-ontology-bridge.md`).
**Sources:** three videos at `D:\PhD\Dissertation\Media\VLE\` (≈21 min): `Virtual Space - Group.mp4` (16.5 min, multi-user dev/QA walkthrough), `MediaPlayer.mp4` (2.1 min, narrated how-to for the media players), `Windows 2024.02.20…mp4` (2.4 min, solo capture). Whisper transcripts + 289 sampled frames (1/5 s group, 1/3 s others, 1280px); curated contact sheets + a key frame are in `frames/`, transcripts alongside.
**Provenance discipline:** §§1–4 below describe the environment **as observed** (factual). §5 (chain read) and §6 (levers) are **`anticipatory-application`** — the dissertation's interpretive construction, not anything the footage "says." These videos are **developer/QA capture, not student-use sessions**: they evidence the VLE's *design-as-built*, not learner behaviour or engagement outcomes (those await the 4 quarters of student data, post-Part-II).

---

## 1. The environment as built
A networked, multi-user VR space (Unreal Engine; Meta Quest — the Quest pointer is visible) rendered as a **virtual medical-center building**: lobby/atrium with seating, corridors, and rooms, traversed by metallic third-person **avatars** (multiple users present — "Dalton," "Crystal," and others appear by name in the group session). Wayfinding is carried by **yellow guide-lines painted on the floor** that lead from open areas toward room entrances. Vertical circulation is by **elevators (intended) and stairs** (the group session notes the elevators were broken — "I gotta find the freaking stairs").

Rooms are **named by clinical procedure** — wall titles read **"Cataract Operations"** and **"Cornea Transplant"**, with glaucoma content also present — i.e., an **ophthalmology / global-eye-health** subject domain. Each room is a darkened "media room" holding one or more large wall-mounted **screens** on which clinical video plays. Printed **instructions are posted on the wall** beside the players ("instructions are on the wall, just in case you forget").

## 2. The media player — interaction & mediation model
From the narrated how-to (`transcript-mediaplayer.txt`) and the UI visible in `frames/CONTACT_mediaplayer.jpg`:
- **Open/engage:** approach a player and press **`E`**, then choose a **content tab — "Procedures" or "Interviews"** (both tabs are visible bottom-left of every player), wait for load, then **Play**.
- **Streaming behaviour:** a **3-second buffer delay** after Play; **adaptive bitrate** ("after a certain amount of time it adapts to your bandwidth and gives the best resolution your internet is capable of"). Raw files are served from **S3**; YouTube streaming was weighed and rejected for the 360 overlay use-case (group session).
- **Scrubbing:** must **pause before scrubbing**, click the timeline, wait for update, then play (another 3-sec delay).
- **Close/switch:** **`Q`** to kill the current video, **`E`** to reopen and select another.
- **360 + overlay:** procedure videos are **first-person 360°** with a **picture-in-picture POV inset** and a **"Hide POV"** toggle (the "two views… similar to YouTube where you can pan" that the team calls "the entire point of all the filming").

## 3. The content library
Two content types per player:
- **Procedures** — 360° operative footage (an operating room with gowned surgical team, surgical lights, monitors, patient; endoscopic/POV inset). Procedures span cataract, cornea transplant, glaucoma.
- **Interviews** — clinician talking-head videos. The visible menu lists, among others: **Anesthesiologist Dr. Jose Saravia** (+ "Local Anesthesia Procedure"), **Glaucoma & Cataract Resident Dr. Rogger Guevara**, **Glaucoma Surgeon Dr. Luis Perrera**, **Cornea Bank & EOP Dr. Nicholas Gonzales**, **Medical Director Dr. Eric Schmidt (Parts 01–03)**, **OR Manager Jorge Medina**, and a **"Mobile Clinic Team for Rural Visits"** — i.e., the library spans the full clinical pathway and its surrounding roles/logistics, suited to **needs-finding** (students observe procedures + stakeholder interviews to surface clinical problems/needs for BME design).

## 4. Design frictions observed in the capture
Surfaced unprompted during the dev/QA walkthrough — each is a design datum:
- **Lighting / legibility:** the media rooms are very dark — "you're trying to make us so that we can't see shit… like I'm in a dark room"; screens are "barely seen," footage "grainy" (accepted: "I'd rather have it work").
- **Occlusion & proximity:** to watch, a user "almost ha[s] to go up to it like this close," and then "our bodies are in the way" — avatars occlude the screen for one another in the shared room.
- **Wayfinding / circulation:** broken elevators force a hunt for stairs; the yellow line is the main orientation aid.
- **Latency:** the 3-sec buffer + adaptive-bitrate ramp imposes a wait between intention and image.
- **Build fragility:** Unreal Engine version mismatches; the recurring concern of getting footage to "work."

## 5. Actualization-chain read of the canonical task (anticipatory-application)
Canonical learner act: *a student enters the Cataract room, opens a Procedures video, and watches to find a clinical need.* Located on the rhetorical-ontology chain (all `anticipatory-application`):
- **A0/A1 (object + medium → aisthēsis):** the designed **medium is doubly layered** — the VR room mediates a *screen* that mediates *360° clinical footage*. Perception's preconditions are exactly where the frictions bite: **darkness depresses the hedonic/῾discriminative tone at A1** (the scene barely registers), **occlusion and required proximity** gate whether the object actualizes a perception at all, and **buffer latency** breaks the object's availability. Design here = A0/A1 design.
- **A2 (phantasma — taking-as):** the 360 + POV inset is built to let the student **take the footage *as* a clinical situation seen from the practitioner's standpoint** — the "two views" make the scene present *as* something one is inside of, not merely watching. This is "designing the *as*."
- **A3 (doxa + emotion):** needs-finding *is* an A3 act — the student must **ratify** "this is a problem / an unmet need" (a *doxa*) and be **moved** by it (the affective charge that makes a need feel worth solving). The Interviews tab supplies the *doxa*-laden evaluative framing (clinicians naming what is hard, scarce, rural-inaccessible).
- **A4 (action + hexis):** completed acts are note-taking, discussion with co-present peers, and downstream BME design — and, diachronically, the **sedimenting of a clinical-observer *hexis*** (learning to *see* clinically).

## 6. Engagement/boredom hooks + design levers
- **→ FCM-boredom (Part III #2):** the friction cluster (dark, occluded, latent, passive watching of long 360 clips) is a **first-form-boredom risk surface** — being-bored-*by* a screen one scans for something to attend to; the "two views" + interaction (`E`/scrub) are the **engagement levers** that fight it. (See `../../../Heidegger - The Fundamental Concepts of Metaphysics/_synthesis/fcm-king-salvo-bridge.md`.)
- **→ design levers (feed the manual's playbook):** raise A0/A1 legibility (lighting, contrast, screen scale, anti-occlusion seating/teleport-to-view); shorten intention→image latency; make the *taking-as* active (annotation, gaze-anchored POV); scaffold the A3 needs-*doxa* (prompts pairing a Procedure with its Interview).

## Asset inventory (`frames/`, transcripts alongside)
- `CONTACT_group.jpg` — 25 sampled frames of the multi-user building walkthrough (lobby, corridors, yellow line, media rooms, avatars).
- `CONTACT_mediaplayer.jpg` — player UI, Procedures/Interviews tabs, 360 OR footage + POV inset, interview menu, "Cataract Operations"/"Cornea Transplant" room titles.
- `CONTACT_windows.jpg` — solo capture frames.
- `keyframe_clinical-screen.jpg` — full-res: avatar before a screen showing the 360 operating-room scene.
- `transcript-{group,mediaplayer,windows}.txt` — whisper large-v3 transcripts. Full 289-frame set + source videos remain at the scratchpad / `D:` source.
