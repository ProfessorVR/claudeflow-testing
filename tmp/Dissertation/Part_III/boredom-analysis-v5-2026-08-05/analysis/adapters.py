"""Adapters over the methodology of record.

`scripts/boredom-o9/` produced the Round 1 results in the dissertation and the four
correctness checks are defined against its behavior, so it is imported, never
edited and never copied. Where a helper is not usable as written it is WRAPPED here
and the wrapper is recorded in `WRAPPERS`, which METHODS.md prints verbatim.

`boredom-o9-processing/ch_hmd_r2.py` is this project's own work and may be extended;
extensions live in `r2.py`, not in that file.
"""
import os
import sys

import numpy as np
import pandas as pd

import config as C

# Import in place; neither tree is modified on disk. ORDER MATTERS: boredom-o9-processing
# holds its own copies of common/ch_hmd/ch_stats/ch_eeg/ch_fig/ch_validate. They are
# currently md5-identical to the methodology of record, but relying on that is exactly
# the drift this arrangement exists to prevent, so METHODOLOGY_OF_RECORD is inserted
# LAST and therefore resolves FIRST. Only ch_hmd_r2 is taken from the R2 tree.
sys.path.insert(0, C.R2_PARSER)
sys.path.insert(0, C.METHODOLOGY_OF_RECORD)

import common as _common          # noqa: E402  methodology of record
import ch_hmd as _ch_hmd          # noqa: E402
import ch_stats as _ch_stats      # noqa: E402
import ch_eeg as _ch_eeg          # noqa: E402
import ch_hmd_r2 as _ch_hmd_r2    # noqa: E402  this project's own parser

# Re-exported unchanged -------------------------------------------------------
subject_map = _common.subject_map
norm_stim = _common.norm_stim
norm_token = _common.norm_token
read_hmd = _ch_hmd.read_hmd
find_files = _ch_hmd.find_files
parse_window = _ch_hmd.parse_window
signal_stats = _ch_hmd.stats
rank_biserial = _ch_stats.rank_biserial
GVEC = _ch_hmd.GVEC
ARO = _ch_hmd.ARO
R1_COLS = _ch_hmd.COLS

WRAPPERS = []


def _record(name, reason):
    WRAPPERS.append({"wrapper": name, "reason": reason})


# ---------------------------------------------------------------------------
def source_versions():
    """File-level provenance of the imported modules, for RUN-MANIFEST.json."""
    import hashlib
    out = []
    for mod in (_common, _ch_hmd, _ch_stats, _ch_eeg, _ch_hmd_r2):
        p = os.path.abspath(mod.__file__)
        if p.endswith(".pyc"):
            p = p.replace("__pycache__/", "").split(".cpython")[0] + ".py"
        with open(p, "rb") as fh:
            body = fh.read()
        out.append({"module": mod.__name__, "path": p, "bytes": len(body),
                    "md5": hashlib.md5(body).hexdigest()})
    return out


# ---------------------------------------------------------------------------
_record("run_ch_hmd(outdir)",
        "ch_hmd.main() writes to a module-level OUT that is .gitignored and absent. "
        "The wrapper rebinds ch_hmd.OUT to this run's out/ directory and calls "
        "main() unmodified, so the feature code path is byte-for-byte the one that "
        "produced the dissertation's Round 1 numbers. Nothing is written into "
        "scripts/boredom-o9/.")


def run_ch_hmd(outdir):
    """Run the Round 1 pipeline as written, into `outdir`.

    Enforces the crop-only rule BEFORE running: the spec requires that a missing
    crop fail loudly rather than silently fall back to the full recording, and
    ch_hmd.main() would otherwise substitute the full window.
    """
    missing = []
    for sid, path in subject_map():
        hmd = os.path.join(path, "HMD")
        if not os.path.isdir(hmd):
            missing.append((sid, "*", "no HMD directory"))
            continue
        ff = find_files(hmd)
        for stim in C.STIMULI:
            if not ff[stim]["crop"]:
                missing.append((sid, stim, "no _Crop file"))
    if missing:
        raise SystemExit("CROP-ONLY RULE VIOLATED - refusing to fall back to full "
                         "recordings:\n" + "\n".join(f"  {s} {t}: {r}" for s, t, r in missing))

    os.makedirs(outdir, exist_ok=True)
    prev = _ch_hmd.OUT
    try:
        _ch_hmd.OUT = outdir
        _ch_hmd.main()
    finally:
        _ch_hmd.OUT = prev

    qc = pd.read_csv(os.path.join(outdir, "ch-hmd-qc.csv"))
    bad = qc[qc.window != "crop"]
    if len(bad):
        raise SystemExit(f"CROP-ONLY RULE VIOLATED after run: {len(bad)} cell(s) not crop")
    return qc


# ---------------------------------------------------------------------------
_record("run_ch_eeg(outdir)",
        "Same OUT-rebinding as run_ch_hmd, plus a numpy compatibility shim. "
        "ch_eeg.bandpower() calls np.trapezoid, which exists only in NumPy >= 2.0; "
        "the run interpreter carries NumPy 1.26.4, where the identical function is "
        "named np.trapz (np.trapezoid IS the 2.0 rename of np.trapz, same "
        "implementation). The shim aliases the new name to the old for the duration "
        "of the call and is removed afterwards. VERIFIED numerically: band powers "
        "computed under NumPy 1.26.4 + shim are bit-identical to those computed "
        "under NumPy 2.2.6's native np.trapezoid. ch_eeg.py is not edited.")


def run_ch_eeg(outdir):
    os.makedirs(outdir, exist_ok=True)
    shimmed = not hasattr(np, "trapezoid")
    if shimmed:
        np.trapezoid = np.trapz
    prev = _ch_eeg.OUT
    try:
        _ch_eeg.OUT = outdir
        _ch_eeg.main()
    finally:
        _ch_eeg.OUT = prev
        if shimmed:
            del np.trapezoid


# ---------------------------------------------------------------------------
_record("surface_table(frame, column)",
        "ch_stats.wide() reads a CSV from its own OUT by filename. The wrapper "
        "takes an in-memory DataFrame instead, so the same pivot (index=subject, "
        "columns=stimulus, aggfunc='first', reindexed to BOR/CLC/INT) is applied "
        "to tables this run builds - including pooled and rate-variant tables that "
        "have no file in ch_stats' directory.")


def surface_table(frame, column):
    """ch_stats.wide()'s pivot, applied to an in-memory frame."""
    p = frame.pivot_table(index="subject", columns="stimulus", values=column,
                          aggfunc="first")
    return p.reindex(columns=list(C.STIMULI))


# ---------------------------------------------------------------------------
_record("r1_cell_frame(sid, stim, path)",
        "ch_hmd.main() consumes parse_window() inline and emits only summary rows, "
        "so per-sample series are unreachable for time-course figures, closure "
        "episodes and rate decimation. The wrapper calls the SAME read_hmd() and "
        "parse_window() and returns their per-sample output instead of aggregating "
        "it. No feature definition is re-implemented.")


def r1_cell_frame(path):
    """Per-sample series for one Round 1 cell, via the record's own parser.

    Returns (signals dict, time series, qc dict, raw frame). The raw frame is
    returned because per-eye closure is read from columns F/G (dilL/dilR), where
    -1 is the vendor's eyes-closed sentinel; parse_window() masks those to NaN,
    which is correct for pupil but destroys the closure information.
    """
    df = read_hmd(path)
    raw = df.copy()
    sig, t, qc = parse_window(df)
    for c in ("dilL", "dilR", "validL", "validR"):
        raw[c] = pd.to_numeric(raw[c], errors="coerce")
    return sig, t, qc, raw


# ---------------------------------------------------------------------------
_record("decimate_r1_cell(raw, target_hz, native_hz)",
        "Implements author decision D1 for S06's two off-regime cells. Mirrors the "
        "step rule already used by ch_hmd_r2.gaze_dev(decimate_to=...): "
        "step = round(native/target), take every step-th row. Applied to the RAW "
        "rows before parse_window(), so every downstream feature is computed by the "
        "record's own code on the thinned series.")


def decimate_r1_cell(raw, target_hz, native_hz):
    step = max(1, int(round(float(native_hz) / float(target_hz))))
    return raw.iloc[::step].reset_index(drop=True), step


# ---------------------------------------------------------------------------
_record("r2_collect(subject_path)",
        "ch_hmd_r2.collect() identifies streams by column count alone, and HRV "
        "files carry 8 columns exactly like cognitive-load files. It is currently "
        "saved only by 'largest file wins' - verified, all 12 cells select a CL- "
        "file - but that is magnitude luck, and in one recorder session the HRV "
        "file IS classified as cognitive load. The wrapper requires filename prefix "
        "AND header agreement before accepting a stream.")

_record("r2_collect(subject_path)",
        "Round 2 crop-only collector (author ruling D-01/D-03, 2026-07-31). Reads "
        "ONLY files whose name carries _Crop, mirroring Round 1's crop-only rule, "
        "and identifies each stream by its FILENAME PREFIX alone rather than by "
        "column count. Column counts became unusable when cropping appended t_rel_s "
        "to every file (32->33, 16->17, 8->9, 7->8) and they never separated "
        "cognitive load from HRV, which share a count in both the original and the "
        "cropped form. Every file names its own measurement, so the filename is the "
        "reliable key. HRV is recognized in order to be rejected and logged.")

# Filename prefix -> stream kind. HRV is listed so it is rejected explicitly rather
# than falling through as an unknown stream.
_R2_PREFIX = {
    "EYETRACKING": "eye",
    "CL": "cog",
    "HR": "hr",
    "HRV": "hrv",
    "IMU": "imu",
}
_R2_KEEP = ("eye", "cog", "hr", "imu")
CROP_TAG = "_Crop"


def _header(path):
    with open(path, errors="replace") as fh:
        return fh.readline().strip()


class MissingCropError(RuntimeError):
    """An original stream exists with no matching _Crop. Never fall back."""


def r2_collect(subject_path):
    """{stim: {kind: path}} from _Crop files only. HRV is never returned.

    Fails loudly if any original CSV lacks a crop; a genuinely absent stream (no
    original either) is not an error and is logged by the caller.
    """
    out = {s: {} for s in C.STIMULI}
    rejected, missing = [], []
    for root, _, files in os.walk(subject_path):
        if any(os.path.abspath(root).startswith(os.path.abspath(x))
               for x in C.EXCLUDED_TREES):
            continue
        for f in sorted(files):
            if not f.lower().endswith(".csv"):
                continue
            p = os.path.join(root, f)
            if os.path.getsize(p) == 0:
                continue
            stim = _ch_hmd_r2.norm_stim(os.path.relpath(root, subject_path)) \
                or _ch_hmd_r2.norm_stim(f)
            if stim is None:
                continue
            if CROP_TAG not in f:
                # An original: its crop must exist beside it.
                if not os.path.exists(p.replace(".csv", f"{CROP_TAG}.csv")):
                    missing.append(os.path.relpath(p, subject_path))
                continue
            prefix = f.split("-")[0].upper()
            kind = _R2_PREFIX.get(prefix)
            if kind is None:
                rejected.append((os.path.basename(p), prefix, _header(p).count(",") + 1))
                continue
            if kind not in _R2_KEEP:                      # HRV, excluded by ruling
                rejected.append((os.path.basename(p), prefix, _header(p).count(",") + 1))
                continue
            prev = out[stim].get(kind)
            if prev is None or os.path.getsize(p) > os.path.getsize(prev):
                out[stim][kind] = p
    if missing:
        raise MissingCropError(
            "Round 2 is crop-only; these originals have no _Crop file: "
            + "; ".join(sorted(missing)))
    return out, rejected


# ---------------------------------------------------------------------------
_record("r2_time_seconds(df)",
        "Implements author decision D4. ch_hmd_r2.tsec() subtracts the raw minimum "
        "of the timestamp column; R2-01's Interesting file carries one row with "
        "ts/sys = 17, which makes that cell read 1.7e9 s and collapses its time "
        "axis. The wrapper drops timestamp rows more than 1e12 us from the median "
        "before rebasing, and reports how many it dropped so the exclusion is "
        "logged rather than silent. Cells with no outlier are numerically identical "
        "to ch_hmd_r2.tsec().")

_TS_OUTLIER_US = 1e12               # ~11.6 days from the median


def r2_time_seconds(df):
    """-> (seconds-from-start series, n_dropped, column used).

    Author ruling D-02 (2026-07-31): the cropped files carry `t_rel_s`, seconds
    from the analysis-window start on the eye-tracker clock, with a common zero
    across every stream of a session. Where it is present it is used directly and
    the D4 timestamp repair is unnecessary — it existed only because rebasing on a
    raw minimum collapsed R2-01's Interesting axis. The old path is retained below
    as a fallback so an uncropped file still parses.
    """
    if "t_rel_s" in df.columns:
        v = pd.to_numeric(df["t_rel_s"], errors="coerce")
        return v, 0, "t_rel_s"
    for c in ("ts/sys", "ts/omni", "ts/hw"):
        if c not in df.columns:
            continue
        v = pd.to_numeric(df[c], errors="coerce").where(lambda s: s > 0)
        if v.notna().sum() <= 10:
            continue
        med = v.median()
        keep = v.where((v > med - _TS_OUTLIER_US) & (v < med + _TS_OUTLIER_US))
        dropped = int(v.notna().sum() - keep.notna().sum())
        return (keep - keep.min()) / 1e6, dropped, c
    return pd.Series(np.arange(len(df), dtype=float) / 120.0), 0, "synthesised@120Hz"


# ---------------------------------------------------------------------------
_record("gaze_dev(gx, gy, gz, decimate_to)",
        "Re-exported from ch_hmd_r2 unchanged. Identical in definition to the "
        "record's inline Round 1 computation: Euclidean distance of combined gaze "
        "from the per-file MEDIAN gaze direction, then a 5-point centered rolling "
        "median with min_periods=1; variance = sd**2.")

gaze_dev = _ch_hmd_r2.gaze_dev
r2_stats = _ch_hmd_r2.stats
r2_subjects_dir = _ch_hmd_r2.subjects_dir
