"""Phase A event extraction: eye-closure runs, audio cues (CPU whisper), sync fit,
stimulus bounds, and the analysis window. Writes CropEvents.json per session.

All video-clock times are seconds into the session's HMD recording; all ET times are
seconds relative to the EyeTracking file's first valid timestamp (ts0_us).
"""
from __future__ import annotations

import json
import re
import subprocess
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np
import pandas as pd

from common import (CLOSURE_GAP_TOL_S, CLOSURE_MIN_S, CUE_CLOSE_VARIANTS,
                    CUE_OPEN_VARIANTS, ENV_FRAME_S, HEAD_GUARD_S,
                    L_CLOSE_S, L_OPEN_S, OPENNESS_CLOSED_BELOW, PROTOCOL_RUN_MAX_S,
                    PROTOCOL_RUN_MIN_S, SCRATCH, STIM_OFF_SILENCE_S,
                    STIM_ON_GAP_TOL_S, STIM_ON_MIN_RUN_S, SYNC_SPREAD_WARN_S,
                    TAIL_GUARD_S, TS_OUTLIER_S, TS_VALID_MIN, WHISPER_BIN,
                    WINDOW_SANE_MAX_S, WINDOW_SANE_MIN_S, Session, ffprobe_duration)

WORD_RE = re.compile(r"[^a-z0-9 ]+")


# ---------------------------------------------------------------- ET closure runs

def load_et_times(session: Session) -> tuple[pd.DataFrame, float]:
    """Return (df with t [s, ET-rel] / closed flag / file_line, ts0_us)."""
    df = pd.read_csv(session.et_csv,
                     usecols=["ts/sys", "ts/omni", "left/openness", "right/openness"])
    df["file_line"] = np.arange(2, len(df) + 2)  # 1-based file line incl. header
    ts = df["ts/sys"].where(df["ts/sys"] > TS_VALID_MIN, df["ts/omni"])
    ok = ts > TS_VALID_MIN
    med = ts[ok].median()
    ok &= (ts - med).abs() < TS_OUTLIER_S * 1e6
    df = df[ok].reset_index(drop=True)
    ts = ts[ok].reset_index(drop=True)
    ts0 = float(ts.iloc[0])
    df["t"] = (ts - ts0) / 1e6
    df["ts_us"] = ts
    df["closed"] = ((df["left/openness"] < OPENNESS_CLOSED_BELOW)
                    & (df["right/openness"] < OPENNESS_CLOSED_BELOW))
    return df, ts0


def closure_runs(df: pd.DataFrame) -> list[dict]:
    """Sustained bilateral-closure runs (>= CLOSURE_MIN_S, gaps <= CLOSURE_GAP_TOL_S)."""
    closed = df["closed"].to_numpy()
    t = df["t"].to_numpy()
    lines = df["file_line"].to_numpy()
    raw, start = [], None
    for i in range(len(closed)):
        if closed[i] and start is None:
            start = i
        elif not closed[i] and start is not None:
            raw.append((start, i - 1))
            start = None
    if start is not None:
        raw.append((start, len(closed) - 1))
    merged: list[list[int]] = []
    for a, b in raw:
        if merged and t[a] - t[merged[-1][1]] < CLOSURE_GAP_TOL_S:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    return [
        {"t_on": float(t[a]), "t_off": float(t[b]),
         "line_on": int(lines[a]), "line_off": int(lines[b]),
         "dur": float(t[b] - t[a])}
        for a, b in merged if t[b] - t[a] >= CLOSURE_MIN_S
    ]


def pick_protocol_runs(session: Session, df: pd.DataFrame,
                       runs: list[dict]) -> tuple[dict, dict, list[str]]:
    """Choose the instructed start/end closure runs (manual anchors win)."""
    flags: list[str] = []
    if session.manual_lines:
        m = session.manual_lines

        def run_near(line_on: int, line_open: int | None) -> dict:
            # Prefer the run CONTAINING the manual onset (the definitive onset may
            # sit inside a longer merged run when drowsy flicker precedes it).
            contain = [r for r in runs
                       if r["line_on"] - 60 <= line_on <= r["line_off"] + 60]
            if contain:
                best = min(contain, key=lambda r: abs(r["line_on"] - line_on))
            else:
                best = min(runs, key=lambda r: abs(r["line_on"] - line_on))
                if abs(best["line_on"] - line_on) > 600:
                    flags.append(f"MANUAL_ANCHOR_MISMATCH:{line_on}")
            if line_open is not None and abs(best["line_off"] - line_open) > 600:
                flags.append(f"MANUAL_REOPEN_MISMATCH:{line_open}")
            return best

        start = run_near(m["start_close"], m["start_open"])
        end = run_near(m["end_close"], m.get("end_open"))
        return start, end, flags

    et_end = float(df["t"].iloc[-1])
    starts = [r for r in runs
              if PROTOCOL_RUN_MIN_S <= r["dur"] <= PROTOCOL_RUN_MAX_S
              and r["t_on"] > 2.0 and r["t_on"] < 400.0]
    ends = [r for r in runs
            if PROTOCOL_RUN_MIN_S <= r["dur"] <= PROTOCOL_RUN_MAX_S
            and et_end - r["t_off"] < 60.0]
    if not starts or not ends:
        raise RuntimeError(f"{session.key}: no protocol closure candidates "
                           f"(starts={len(starts)} ends={len(ends)})")
    return starts[0], ends[-1], flags


# ---------------------------------------------------------------- audio & whisper

def extract_wav(video: Path, track: int, t0: float, t1: float, out: Path) -> Path:
    out.parent.mkdir(parents=True, exist_ok=True)
    if not out.exists():
        subprocess.run(
            ["ffmpeg", "-v", "error", "-ss", f"{max(0.0, t0):.3f}",
             "-t", f"{t1 - max(0.0, t0):.3f}", "-i", str(video),
             "-map", f"0:a:{track}", "-ac", "1", "-ar", "16000", str(out), "-y"],
            check=True,
        )
    return out


def transcribe_cpu(wav: Path, model: str = "base") -> list[tuple[str, float, float]]:
    """CPU-only whisper; returns [(word, start, end)] relative to the wav."""
    out_dir = wav.parent if model == "base" else wav.parent / f"wh_{model}"
    out_json = out_dir / f"{wav.stem}.json"
    if not out_json.exists():
        subprocess.run(
            [WHISPER_BIN, str(wav), "--model", model, "--language", "en",
             "--device", "cpu", "--fp16", "False", "--word_timestamps", "True",
             "--output_format", "json", "--output_dir", str(out_dir),
             "--verbose", "False"],
            check=True, capture_output=True,
            env={"PATH": "/usr/bin:/bin", "CUDA_VISIBLE_DEVICES": "",
                 "HOME": str(Path.home())},
        )
    data = json.loads(out_json.read_text())
    words = []
    for seg in data.get("segments", []):
        for w in seg.get("words", []):
            words.append((WORD_RE.sub("", w["word"].strip().lower()),
                          float(w["start"]), float(w["end"])))
    return words


def find_phrase(words: list[tuple[str, float, float]], phrase: str,
                thresh: float = 0.78) -> list[dict]:
    """Fuzzy sliding-window match; times are wav-relative."""
    target = phrase.split()
    n = len(target)
    hits = []
    for i in range(len(words) - n + 1):
        win = words[i:i + n]
        score = SequenceMatcher(None, " ".join(w[0] for w in win), phrase).ratio()
        if score >= thresh:
            hits.append({"score": round(score, 3), "t_on": win[0][1],
                         "t_off": win[-1][2],
                         "text": " ".join(w[0] for w in win)})
    # collapse overlapping hits, keep best score
    hits.sort(key=lambda h: h["t_on"])
    out: list[dict] = []
    for h in hits:
        if out and h["t_on"] - out[-1]["t_off"] < 1.0:
            if h["score"] > out[-1]["score"]:
                out[-1] = h
        else:
            out.append(h)
    return out


def best_near(hits: list[dict], t_expect: float, tol: float) -> dict | None:
    close = [h for h in hits if abs(h["t_on"] - t_expect) <= tol]
    return max(close, key=lambda h: h["score"]) if close else None


# ---------------------------------------------------------------- audio envelope

def rms_envelope(wav: Path) -> tuple[np.ndarray, np.ndarray]:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(wav), "-f", "s16le", "-"],
        capture_output=True, check=True,
    ).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    frame = int(16000 * ENV_FRAME_S)
    n = len(x) // frame
    env = np.sqrt((x[: n * frame].reshape(n, frame) ** 2).mean(axis=1))
    return np.arange(n) * ENV_FRAME_S, env


def sustained_run_start(t: np.ndarray, env: np.ndarray, thr: float,
                        t_from: float, min_run: float, gap_tol: float) -> float | None:
    active = env >= thr
    i0 = np.searchsorted(t, t_from)
    run_start, last_active = None, None
    for i in range(i0, len(t)):
        if active[i]:
            if run_start is None:
                run_start = t[i]
            elif last_active is not None and t[i] - last_active > gap_tol:
                run_start = t[i]
            last_active = t[i]
            if run_start is not None and t[i] - run_start >= min_run:
                return float(run_start)
        elif last_active is not None and t[i] - last_active > gap_tol:
            run_start = None
    return None


# ---------------------------------------------------------------- per-session driver

def extract_events(session: Session) -> dict:
    flags: list[str] = list(session.flags)
    df, ts0 = load_et_times(session)
    runs = closure_runs(df)
    start_run, end_run, f = pick_protocol_runs(session, df, runs)
    flags += f
    et_end = float(df["t"].iloc[-1])

    ev: dict = {
        "session": session.key, "subject": session.subject,
        "condition": session.condition,
        "et_csv": session.et_csv.name, "ts0_us": ts0,
        "et_duration_s": et_end, "et_rows": int(len(df)),
        "closure_runs": runs,
        "start_run": start_run, "end_run": end_run, "flags": flags,
    }

    # --- analysis window, CSV-primary (user ruling 2026-07-31): the instructed
    # eye-closure edges in the eye-tracking data are authoritative; audio is only
    # for video sync and cross-checks. Window = reopen + 5 s -> closure onset - 2 s.
    # Start uses the sample-exact detected reopen edge (agrees with the manual
    # review within ~±1 line). End uses the user's manually reviewed definitive
    # closure onset when given: merged-run onsets can run early on pre-instruction
    # drowsy flicker (41 s early on Matthew Boring, audio-confirmed).
    start_et = start_run["t_off"] + HEAD_GUARD_S
    end_anchor_et = end_run["t_on"]
    if session.manual_lines and session.manual_lines.get("end_close") is not None:
        line = session.manual_lines["end_close"]
        sel = df[df["file_line"] == line]
        if len(sel):
            end_anchor_et = float(sel["t"].iloc[0])
            if not bool(sel["closed"].iloc[0]):
                flags.append(f"MANUAL_END_NOT_CLOSED:{line}")
        else:
            flags.append(f"MANUAL_END_LINE_MISSING:{line}")
    end_et = end_anchor_et - TAIL_GUARD_S
    dur = end_et - start_et
    if not (WINDOW_SANE_MIN_S <= dur <= WINDOW_SANE_MAX_S):
        flags.append(f"WINDOW_DUR_SUSPECT_{dur:.0f}S")
    ev["window"] = {
        "start_et_s": start_et, "end_et_s": end_et, "duration_s": dur,
        "end_anchor_et_s": end_anchor_et,
        "start_us": ts0 + start_et * 1e6, "end_us": ts0 + end_et * 1e6,
    }

    if session.hmd_video is None:
        flags.append("NO_HMD_VIDEO")
        return ev

    vdur = ffprobe_duration(session.hmd_video)
    b0 = vdur - et_end  # ends-aligned prior for video_t - et_t
    ev["hmd_video"] = session.hmd_video.name
    ev["video_duration_s"] = vdur
    ev["b0_prior_s"] = b0

    sdir = SCRATCH / session.key
    win_start = (max(0.0, start_run["t_on"] + b0 - 60.0),
                 min(vdur, start_run["t_off"] + b0 + 90.0))
    win_end = (max(0.0, end_run["t_on"] + b0 - 90.0),
               min(vdur, end_run["t_on"] + b0 + 60.0))

    words_cache: dict[tuple, list] = {}

    def get_words(label: str, track: int, model: str) -> list:
        key = (label, track, model)
        if key not in words_cache:
            w0, w1 = win_start if label == "start" else win_end
            wav = extract_wav(session.hmd_video, track, w0, w1,
                              sdir / f"{label}_a{track}.wav")
            words_cache[key] = [(w, s + w0, e + w0)
                                for w, s, e in transcribe_cpu(wav, model)]
        return words_cache[key]

    def cue(label: str, variants: list, t_expect: float, tol: float) -> dict | None:
        best = None
        for model in ("base", "small"):
            for phrase, tracks in variants:
                for track in tracks:
                    hits = find_phrase(get_words(label, track, model), phrase)
                    h = best_near(hits, t_expect, tol)
                    if h and (best is None or h["score"] > best["score"]):
                        best = {**h, "track": track, "model": model, "phrase": phrase}
            if best is not None and best["score"] >= 0.9:
                break  # escalate to the small model only when base was unconvincing
        return best

    cues: dict[str, dict | None] = {
        "start_close": cue("start", CUE_CLOSE_VARIANTS, start_run["t_on"] + b0, 45.0),
        "start_open": cue("start", CUE_OPEN_VARIANTS, start_run["t_off"] + b0, 45.0),
        "end_close": cue("end", CUE_CLOSE_VARIANTS, end_run["t_on"] + b0, 60.0),
        "end_open": cue("end", CUE_OPEN_VARIANTS, end_run["t_off"] + b0, 60.0),
    }
    ev["cues"] = cues

    # --- sync fit: video_t = et_t + b (a = 1; pilot drift < 0.3 s / 18 min).
    # Every located cue contributes an anchor via its latency prior; disagreement
    # between anchors surfaces as `spread`.
    b_est = []
    if cues["start_close"]:
        b_est.append(("start_close",
                      cues["start_close"]["t_on"] + L_CLOSE_S - start_run["t_on"]))
    if cues["start_open"]:
        b_est.append(("start_open",
                      cues["start_open"]["t_off"] + L_OPEN_S - start_run["t_off"]))
    if cues["end_close"]:
        b_est.append(("end_close",
                      cues["end_close"]["t_on"] + L_CLOSE_S - end_run["t_on"]))
    if cues["end_open"]:
        b_est.append(("end_open",
                      cues["end_open"]["t_off"] + L_OPEN_S - end_run["t_off"]))
    if not b_est:
        flags.append("NO_SYNC_ANCHORS")
        return ev
    b = float(np.median([v for _, v in b_est]))
    spread = float(max(v for _, v in b_est) - min(v for _, v in b_est)) \
        if len(b_est) > 1 else None
    if len(b_est) < 2:
        flags.append("SINGLE_ANCHOR")
        if abs(b - b0) > 20.0:
            flags.append(f"SYNC_VS_PRIOR_{b - b0:+.1f}S")
    if spread is not None and spread > SYNC_SPREAD_WARN_S:
        flags.append(f"SYNC_SPREAD_{spread:.1f}S")
    ev["sync"] = {"b_s": b, "anchors": {k: v for k, v in b_est}, "spread_s": spread}

    # --- video-clock mapping of the CSV-primary window (used by Phase B cutting)
    ev["window"]["start_v_s"] = start_et + b
    ev["window"]["end_v_s"] = end_et + b

    # --- cross-checks only: stimulus-audio envelope. Flags, never boundary moves.
    reopen_v = start_run["t_off"] + b
    t_env, env = rms_envelope(sdir / "start_a0.wav")
    t_env = t_env + win_start[0]
    quiet = env[(t_env > (cues["start_close"]["t_off"] if cues["start_close"]
                          else win_start[0])) & (t_env < reopen_v - 2.0)]
    noise = float(np.percentile(quiet, 10)) if len(quiet) else float(np.percentile(env, 10))
    thr = noise + 0.30 * (float(np.percentile(env, 90)) - noise)
    stim_on_v = sustained_run_start(t_env, env, thr, reopen_v - 1.5,
                                    STIM_ON_MIN_RUN_S, STIM_ON_GAP_TOL_S)
    ev["stim_on_v"] = stim_on_v
    if stim_on_v is None:
        flags.append("NO_STIM_ONSET")
    elif (stim_on_v - b) - start_run["t_off"] > 3.0:
        flags.append(f"STIM_DELAY_{(stim_on_v - b) - start_run['t_off']:.0f}S")

    stim_off_v = None
    if cues["end_close"]:
        instr_v = cues["end_close"]["t_on"]
        if (instr_v - b) < end_run["t_on"] - 5.0:
            flags.append(f"INSTR_EARLY_{end_run['t_on'] - (instr_v - b):.0f}S")
        t3, e3 = rms_envelope(sdir / "end_a0.wav")
        t3 = t3 + win_end[0]
        thr3 = float(np.percentile(e3, 10)) + 0.15 * (
            float(np.percentile(e3, 90)) - float(np.percentile(e3, 10)))
        before = (t3 < instr_v + 2.0)
        act = t3[before][e3[before] >= thr3]
        if len(act):
            last_active = float(act[-1])
            if instr_v - last_active >= STIM_OFF_SILENCE_S:
                stim_off_v = last_active
                if end_run["t_on"] - (stim_off_v - b) > 30.0:
                    flags.append(f"STIM_ENDED_EARLY_{end_run['t_on'] - (stim_off_v - b):.0f}S")
        else:
            flags.append("END_AUDIO_ALL_QUIET")
    ev["stim_off_v"] = stim_off_v
    return ev


def write_events(session: Session, ev: dict) -> Path:
    out = session.dir / "CropEvents.json"
    out.write_text(json.dumps(ev, indent=2))
    return out
