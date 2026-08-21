"""Defensive parser for the 7-item self-report instrument (12 subjects, 36 episodes).

The surveys are free text and inconsistently formatted: `a. 2`, `a.6`, `a. 20 min`,
`a. NA`, `5 min (fell asleep)`, `"1 hour"`, `25 sec`, `10-12`. Nothing is coerced
silently. Every value carries a confidence flag and every interpretation - every
unit conversion, range midpoint, non-numeric token - is written to the journal with
its raw string so it can be reviewed by hand.

Confidence levels:
  exact     the answer is a bare number in the expected range
  converted a unit or range was interpreted (25 sec -> 0.42 min; 10-12 -> 11)
  flagged   a number was recovered from surrounding prose
  semantic  a non-numeric answer carrying meaning (NA on "minutes until bored"
            means the subject never became bored - that is data, not absence)
  missing   no answer present

Prior exposure follows the author's rule (2026-07-30): a subject counts as exposed
only where the folder carries the (Med) medical-student marker or the survey states
experience explicitly. Silence counts as no exposure.
"""
import os
import re

import numpy as np
import pandas as pd

import adapters
import config as C
import journal as J

ITEMS = {
    1: ("fatigue_prior", "likert"),
    2: ("boredom", "likert"),
    3: ("engagement", "likert"),
    4: ("minutes_until_bored", "minutes"),
    5: ("sleep_fight", "likert"),
    6: ("felt_duration_min", "minutes"),
    7: ("fatigue_after", "likert"),
}

ORDINALS = {"first": 1, "1st": 1, "second": 2, "2nd": 2, "third": 3, "3rd": 3}
_Q = re.compile(r"^\s*(\d)\s*\.\s")
_A = re.compile(r"^\s*a\s*\.?\s*(.*?)\s*$", re.I)
_NUM = re.compile(r"-?\d+(?:\.\d+)?")


def _is_heading(line):
    s = line.strip()
    if not s or _Q.match(s) or _A.match(s) or s.startswith("("):
        return None
    if "scale from" in s.lower() or "how " in s.lower():
        return None
    return adapters.norm_stim(s)


def _order_from_heading(line):
    for m in re.finditer(r"\(([^)]*)\)", line):
        tok = m.group(1).strip().lower()
        for k, v in ORDINALS.items():
            if re.search(rf"\b{k}\b", tok):
                return v
    return np.nan


def _likert(raw, sid, stim, field):
    if raw is None or raw == "":
        J.coerce("survey", f"{sid} {stim} {field}", raw, None, "missing", "no answer present")
        return np.nan, "missing"
    nums = _NUM.findall(raw)
    if not nums:
        J.coerce("survey", f"{sid} {stim} {field}", raw, None, "missing",
                 "non-numeric answer on a 1-9 item")
        return np.nan, "missing"
    v = float(nums[0])
    if raw.strip() == nums[0]:
        conf = "exact"
        if not (1 <= v <= 9):
            J.coerce("survey", f"{sid} {stim} {field}", raw, v, "flagged",
                     "value outside the instrument's 1-9 range")
            conf = "flagged"
        return v, conf
    J.coerce("survey", f"{sid} {stim} {field}", raw, v, "flagged",
             "number recovered from surrounding text")
    return v, "flagged"


def _minutes(raw, sid, stim, field):
    """Minutes, from anything the instrument actually received."""
    if raw is None or raw == "":
        J.coerce("survey", f"{sid} {stim} {field}", raw, None, "missing", "no answer present")
        return np.nan, "missing", ""
    s = raw.strip().strip('"').strip()
    low = s.lower()

    # Author ruling R-09 (2026-07-31): S04's answer on the boring film is VOID.
    # She rated boredom 1, engagement 7, felt duration 8 min against a true 17, and
    # fatigue falling 7 -> 1, then answered "1" to minutes-until-bored. She has since
    # confirmed she did not know the item allowed 0 or not-applicable. The value is
    # therefore reclassified into the category the instrument already carries for
    # people who never became bored, rather than kept as a contradictory number.
    if (sid, stim, field) in C.VOID_SURVEY_ANSWERS:
        J.coerce("survey", f"{sid} {stim} {field}", raw, None, "semantic",
                 C.VOID_SURVEY_ANSWERS[(sid, stim, field)])
        return np.nan, "semantic", "never_bored"

    if re.fullmatch(r"n\s*/?\s*a\.?", low) or low in ("na", "n/a", "none", "-"):
        # On "minutes until bored" this is meaningful: the subject never got bored.
        J.coerce("survey", f"{sid} {stim} {field}", raw, None, "semantic",
                 "NA on minutes-until-bored = never became bored; retained as a "
                 "category, NOT imputed and NOT treated as zero")
        return np.nan, "semantic", "never_bored"

    note = ""
    if "asleep" in low or "fell asleep" in low:
        note = "fell_asleep"

    if re.search(r"half\s*way|halfway|half of", low):
        v = C.HALFWAY_MIN
        J.coerce("survey", f"{sid} {stim} {field}", raw, v, "converted", C.HALFWAY_APPROVAL)
        return v, "converted", note

    hour = re.search(r"(\d+(?:\.\d+)?)\s*(?:hour|hr)", low)
    if hour:
        v = float(hour.group(1)) * 60.0
        J.coerce("survey", f"{sid} {stim} {field}", raw, v, "converted",
                 f"hours -> minutes ({hour.group(1)} h = {v:.0f} min)")
        return v, "converted", note

    sec = re.search(r"(\d+(?:\.\d+)?)\s*(?:sec|s\b)", low)
    if sec:
        v = float(sec.group(1)) / 60.0
        J.coerce("survey", f"{sid} {stim} {field}", raw, round(v, 3), "converted",
                 f"seconds -> minutes ({sec.group(1)} s = {v:.3f} min)")
        return v, "converted", note

    rng = re.fullmatch(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(?:min\w*)?", low)
    if rng:
        a, b = float(rng.group(1)), float(rng.group(2))
        v = (a + b) / 2
        J.coerce("survey", f"{sid} {stim} {field}", raw, v, "converted",
                 f"range midpoint ({a}-{b} -> {v})")
        return v, "converted", note

    nums = _NUM.findall(s)
    if not nums:
        J.coerce("survey", f"{sid} {stim} {field}", raw, None, "missing",
                 "no number recoverable")
        return np.nan, "missing", note
    v = float(nums[0])
    bare = re.fullmatch(r"\d+(?:\.\d+)?\s*(?:min\w*)?", low)
    if bare:
        return v, "exact", note
    J.coerce("survey", f"{sid} {stim} {field}", raw, v, "flagged",
             f"number recovered from free text: {s!r}")
    return v, "flagged", note


def _demographics(lines, sid):
    """Round 2 header block. Absent for two of the four subjects."""
    d = {}
    for line in lines:
        s = line.strip()
        low = s.lower()
        if "medical footage" in low:
            d["prior_exposure_statement"] = s
            d["prior_exposure_survey"] = 0 if re.match(r"^\s*no\b", low) else 1
            J.coerce("survey", f"{sid} prior_exposure", s,
                     d["prior_exposure_survey"], "flagged",
                     "value carried entirely by the presence or absence of a leading "
                     "'no'; the item has no yes/no answer token")
            continue
        m = re.match(r"^\s*(age|major|year|ethnicity|first generation|gender)\s*[-:.]\s*(.+)$",
                     low)
        if m:
            key = m.group(1).replace(" ", "_")
            val = m.group(2).strip()
            d[key] = float(_NUM.findall(val)[0]) if key == "age" and _NUM.findall(val) else val
    return d


def parse_file(path, sid, is_med_marker):
    """-> (episode rows, subject-level demographics)."""
    text = open(path, errors="replace").read()
    lines = text.splitlines()

    blocks, cur, head_idx = {}, None, {}
    for i, line in enumerate(lines):
        st = _is_heading(line)
        if st and st not in blocks:
            blocks[st], cur = [], st
            head_idx[st] = i
        elif cur:
            blocks[cur].append(line)

    demo = _demographics(lines[:head_idx.get(list(blocks)[0], 0) + 10] if blocks else [], sid)
    exposed = 1 if is_med_marker else int(demo.get("prior_exposure_survey", 0) or 0)

    rows = []
    for stim, body in blocks.items():
        vals, confs, notes = {}, {}, []
        pending = None
        for line in body:
            qm = _Q.match(line)
            if qm:
                pending = int(qm.group(1))
                continue
            am = _A.match(line)
            if am and pending in ITEMS:
                field, kind = ITEMS[pending]
                raw = am.group(1)
                if kind == "likert":
                    v, c = _likert(raw, sid, stim, field)
                else:
                    v, c, note = _minutes(raw, sid, stim, field)
                    if note:
                        notes.append(f"{field}:{note}")
                vals[field] = v
                confs[f"{field}_confidence"] = c
                vals[f"{field}_raw"] = raw
                pending = None

        for n, (field, _) in ITEMS.items():
            vals.setdefault(field, np.nan)
            confs.setdefault(f"{field}_confidence", "missing")
            if confs[f"{field}_confidence"] == "missing" and f"{field}_raw" not in vals:
                J.exclude(scope="survey item", item=f"{sid} {stim} {field}",
                          reason="item not present in the file", recoverable=False)

        row = dict(subject=sid, stimulus=stim,
                   round=1 if sid.startswith("S") else 2,
                   viewing_order_stated=_order_from_heading(lines[head_idx[stim]]),
                   prior_exposure=exposed,
                   prior_exposure_source=("(Med) folder marker" if is_med_marker
                                          else ("survey statement" if "prior_exposure_survey" in demo
                                                else "no statement -> assumed none")),
                   notes=";".join(notes))
        row.update(vals)
        row.update(confs)
        rows.append(row)
    return rows, demo


def parse_all():
    """All 12 surveys -> (episode frame, demographics frame)."""
    rows, demos = [], []

    for sid, path in adapters.subject_map():
        is_med = "(med)" in os.path.basename(path).lower() or "med" in re.findall(
            r"\(([^)]*)\)", os.path.basename(path).lower())
        txts = [f for f in sorted(os.listdir(path)) if f.lower().endswith(".txt")]
        if not txts:
            J.exclude(scope="survey", item=sid, reason="no survey file", recoverable=False)
            continue
        r, d = parse_file(os.path.join(path, txts[0]), sid, is_med)
        rows.extend(r)
        d["subject"] = sid
        d["med_marker"] = bool(is_med)
        demos.append(d)

    SUB2 = adapters.r2_subjects_dir()
    for i, d in enumerate(sorted(os.listdir(SUB2)), 1):
        sid = f"R2-{i:02d}"
        found = None
        for root, _, files in os.walk(os.path.join(SUB2, d)):
            for f in sorted(files):
                if f.lower().endswith(".txt"):
                    found = os.path.join(root, f)
                    break
            if found:
                break
        if not found:
            J.exclude(scope="survey", item=sid, reason="no survey file", recoverable=False)
            continue
        r, dm = parse_file(found, sid, False)
        rows.extend(r)
        dm["subject"] = sid
        dm["med_marker"] = False
        demos.append(dm)

    df = pd.DataFrame(rows)
    if len(df):
        df["felt_duration_ratio"] = df.felt_duration_min / C.STIMULUS_ACTUAL_MIN
        df["depletion"] = df.fatigue_after - df.fatigue_prior
        # Within-instrument divergence: both boredom AND engagement high (the S07
        # signature). The two are separate items, not a bipolar axis, which is the
        # design choice that lets a subject report both at once.
        df["divergent_selfreport"] = (df.boredom >= 5) & (df.engagement >= 5)
        df = df.sort_values(["subject", "stimulus"]).reset_index(drop=True)
    return df, pd.DataFrame(demos)


def attach_viewing_order(survey_df, order_map):
    """order_map: {(subject, stimulus): rank} derived from recording timestamps."""
    survey_df = survey_df.copy()
    survey_df["viewing_order"] = [
        order_map.get((r.subject, r.stimulus), np.nan) for r in survey_df.itertuples()]
    agree = survey_df.dropna(subset=["viewing_order_stated"])
    if len(agree):
        n_ok = int((agree.viewing_order_stated == agree.viewing_order).sum())
        J.note("viewing order",
               f"{n_ok}/{len(agree)} episodes whose heading states an order are reproduced "
               f"by the recording timestamps; order for all 36 episodes is therefore taken "
               f"from timestamps.")
    return survey_df
