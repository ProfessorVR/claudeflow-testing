"""Shared paths, session discovery, and per-session config for the Round 2
gaze-overlay / data-trim pipeline (plans/boredom-r2-gaze-overlay-plan-2026-07-31.md).

Phase A is CPU-only by contract: CUDA_VISIBLE_DEVICES is forced empty in run_phase_a.py
and whisper is always invoked with --device cpu.
"""
from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

ROUND2 = Path("/mnt/d/PhD/Dissertation/Boredom Experiment/Boredom Experiment Round 2")
SUBJECTS = ROUND2 / "Subjects"
SCRATCH = Path(
    os.environ.get(
        "R2_SCRATCH",
        "/tmp/claude-1000/-home-dalton-projects-claudeflow-testing/"
        "9a342feb-ff56-4815-b9b9-e750b9b8fd9f/scratchpad/phase_a",
    )
)
WHISPER_BIN = os.path.expanduser("~/.pyenv/versions/3.11.9/bin/whisper")

CONDITIONS = ("Boring", "Clinical", "Interesting")
STREAM_PREFIXES = ("EyeTracking", "CL", "HR", "HRV", "IMU")

# Timestamp columns considered per stream, in fallback order (values are epoch
# microseconds; anything <= 1e15 is treated as invalid, e.g. CL/IMU ts/sys == 0).
TS_CANDIDATES = ("ts/sys", "ts/omni", "frame/ts_lerp/sys", "frame/ts_lerp/omni")
TS_VALID_MIN = 1.0e15
TS_OUTLIER_S = 4 * 3600  # drop rows whose timestamp is > 4 h from the file median

# Closure detection (conventions from boredom-analysis r2.py)
OPENNESS_CLOSED_BELOW = 0.5
CLOSURE_MIN_S = 10.0          # sustained run to count as an instructed-closure candidate
CLOSURE_GAP_TOL_S = 2.0       # merge closed runs separated by shorter re-openings
PROTOCOL_RUN_MIN_S = 15.0     # instructed closures are ~30 s; artifacts are shorter
PROTOCOL_RUN_MAX_S = 90.0

# Cue phrase variants: (normalized phrase, allowed audio tracks). Lucas (03-13, the
# first Round 2 subject) predates the standardized script — his sessions use
# "eyes close(d)" / "it's open" style phrasings. Short variants are restricted to
# the mic-dominant track (a:1) because the stimulus narration on the mix track
# produces false positives for them.
CUE_CLOSE_VARIANTS = [
    ("close your eyes", (0, 1)),
    ("eyes closed", (1,)),
    ("eyes close", (1,)),
    ("close her eyes", (1,)),
]
CUE_OPEN_VARIANTS = [
    ("open your eyes", (0, 1)),
    ("eyes open", (1,)),
    ("its open", (1,)),
]

# Cue → behavior latency priors measured on the pilot (Abner/Boring):
# reopen ~0.7 s after the end of "open your eyes"; closure ~1.5 s after the onset
# of "close your eyes".
L_OPEN_S = 0.7
L_CLOSE_S = 1.5
SYNC_SPREAD_WARN_S = 2.0      # |b_start - b_end| beyond this flags the session

# Analysis window guards (user-ruled)
HEAD_GUARD_S = 5.0
TAIL_GUARD_S = 2.0
WINDOW_SANE_MIN_S = 600.0
WINDOW_SANE_MAX_S = 1200.0

# Stimulus-audio envelope detection
ENV_FRAME_S = 0.25
STIM_ON_MIN_RUN_S = 10.0
STIM_ON_GAP_TOL_S = 2.0
STIM_OFF_SILENCE_S = 20.0

# Manual anchors: 1-based CSV file line numbers (line 1 = header), from the user's
# manual review of all 12 sessions (2026-07-31), independently re-verified against
# the data (compare_anchors.py). start_close/end_close = definitive closure onset
# (user-authoritative — algorithmic run-merging can start early on pre-instruction
# drowsy flicker, 41 s early on Matthew Boring); start_open = reopen edge (user and
# detection agree within ~±1 line; detection's sample-exact edge is used);
# end_open = None where the closure runs to (near) end of file ("End").
# Notes: Matthew Interesting start_close given once as "15999" — data confirms
# 159999 (verified transition, and matches the user's earlier message). Lucas
# Interesting start_open given as "49333" — data confirms 4933. Warat Clinical end
# confirmed: subject re-opened early (13.6 s before EOF, 5 brief re-openings
# inside the instructed closure), onset 132779 verified correct.
MANUAL_ANCHOR_LINES: dict[str, dict[str, int | None]] = {
    "Abner Portillo_03-21-24_Boring":
        {"start_close": 1347, "start_open": 5279, "end_close": 129185, "end_open": None},
    "Abner Portillo_03-21-24_Clinical":
        {"start_close": 540, "start_open": 4514, "end_close": 129272, "end_open": None},
    "Abner Portillo_03-21-24_Interesting":
        {"start_close": 8328, "start_open": 12283, "end_close": 135971, "end_open": None},
    "Lucas Jones_03-13-24_Boring":
        {"start_close": 1699, "start_open": 5665, "end_close": 128825, "end_open": 132870},
    "Lucas Jones_03-13-24_Clinical":
        {"start_close": 2109, "start_open": 5798, "end_close": 129473, "end_open": None},
    "Lucas Jones_03-13-24_Interesting":
        {"start_close": 1029, "start_open": 4933, "end_close": 128864, "end_open": 133131},
    "Matthew Lo_03-18-24_Boring":
        {"start_close": 17601, "start_open": 21467, "end_close": 144822, "end_open": None},
    "Matthew Lo_03-18-24_Clinical":
        {"start_close": 7586, "start_open": 11417, "end_close": 152419, "end_open": None},
    "Matthew Lo_03-15-24_Interesting":
        {"start_close": 159999, "start_open": 163806, "end_close": 287622, "end_open": 291497},
    "Warat Kosolpisitkul_03-21-24_Boring":
        {"start_close": 1130, "start_open": 4763, "end_close": 127208, "end_open": None},
    "Warat Kosolpisitkul_03-21-24_Clinical":
        {"start_close": 787, "start_open": 4091, "end_close": 132779, "end_open": None},
    "Warat Kosolpisitkul_03-21-24_Interesting":
        {"start_close": 1895, "start_open": 5635, "end_close": 129576, "end_open": None},
}


@dataclass
class Session:
    subject: str
    name: str            # e.g. "Abner Portillo_03-21-24_Boring"
    condition: str
    dir: Path
    et_csv: Path
    stream_csvs: dict[str, Path]
    hmd_video: Path | None
    bodycam_video: Path | None
    manual_lines: dict[str, int] | None = None
    flags: list[str] = field(default_factory=list)

    @property
    def key(self) -> str:
        return self.name


def ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def discover_sessions() -> list[Session]:
    sessions: list[Session] = []
    for subj_dir in sorted(SUBJECTS.iterdir()):
        if not subj_dir.is_dir():
            continue
        obs = subj_dir / "OBS"
        for sess_dir in sorted(subj_dir.iterdir()):
            if not sess_dir.is_dir() or sess_dir.name in ("OBS", "HMD"):
                continue
            cond = sess_dir.name.rsplit("_", 1)[-1]
            if cond not in CONDITIONS:
                continue
            ets = [p for p in sess_dir.glob("EyeTracking-*.csv")
                   if not p.stem.endswith("_Crop")]
            if len(ets) != 1:
                raise RuntimeError(f"{sess_dir}: expected 1 EyeTracking csv, got {ets}")
            streams = {}
            for pref in STREAM_PREFIXES:
                cands = [p for p in sess_dir.glob(f"{pref}-*.csv")
                         if not p.stem.endswith("_Crop")]
                if len(cands) > 1:
                    raise RuntimeError(f"{sess_dir}: multiple {pref} csvs: {cands}")
                if cands:
                    streams[pref] = cands[0]
            prefix = sess_dir.name[: -(len(cond) + 1)]
            hmd = obs / f"{prefix}_HMD_{cond}.mkv"
            body = None
            for stem in (f"{prefix}_BodyCam_{cond}.mkv", f"{prefix}_Webcam_{cond}.mkv"):
                if (obs / stem).exists():
                    body = obs / stem
            sessions.append(Session(
                subject=subj_dir.name,
                name=sess_dir.name,
                condition=cond,
                dir=sess_dir,
                et_csv=ets[0],
                stream_csvs=streams,
                hmd_video=hmd if hmd.exists() else None,
                bodycam_video=body,
                manual_lines=MANUAL_ANCHOR_LINES.get(sess_dir.name),
            ))
    return sessions
