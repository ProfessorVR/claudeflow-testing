#!/usr/bin/env python
"""ch-eeg O-9 processing (v2, PAPER-GROUNDED via King & Salvo ASEE 2023 #37129).
4-ch BIOPAC EEG .mat v5 @200Hz. Montage CONFIRMED from the paper: columns = F3, F4, P3, P4
(frontal pair, parietal pair; Table 2 lists them in that order). Bandpass 1-35 Hz (paper).
DMN BOREDOM MARKER (paper): increased power in alpha (8-12 Hz) + theta (4-8 Hz) over frontal+parietal
= boring-like. So higher alpha+theta power = MORE boredom-like (NOT a theta/alpha workload ratio).
Keystone test: does the clinical video's DMN power resemble boring (per the paper's N=3 finding)?
Run: /home/dalton/.pyenv/versions/3.11.9/bin/python3 . Outputs: out/ch-eeg-bandpower.csv, ch-eeg-keystone.csv, ch-eeg-qc.csv
"""
import os
import numpy as np
import scipy.io as sio
from scipy.signal import butter, filtfilt, iirnotch, welch
from common import subject_map, norm_stim, STIMULI

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "out")
THETA = (4, 8); ALPHA = (8, 12)          # paper bands
BANDPASS = (1.0, 35.0)                    # paper
CHAN = ["F3", "F4", "P3", "P4"]           # confirmed column order
FRONTAL = [0, 1]; PARIETAL = [2, 3]
EPOCH_S = 2.0; TRIM_IF_OVER = 264000; TRIM_TO = 204000


def load_eeg(path):
    m = sio.loadmat(path, squeeze_me=True)
    data = np.asarray(m["data"], float)
    eeg = data[:, :4]
    fs = 1000.0 / float(np.atleast_1d(m["isi"])[0])
    return eeg, fs


def preprocess(eeg, fs):
    x = eeg - np.nanmean(eeg, axis=0)
    b, a = butter(4, [BANDPASS[0] / (fs / 2), BANDPASS[1] / (fs / 2)], btype="band")
    x = filtfilt(b, a, x, axis=0)
    bn, an = iirnotch(60.0, 30.0, fs)
    return filtfilt(bn, an, x, axis=0)


def bandpower(seg, fs, band):
    f, p = welch(seg, fs=fs, nperseg=min(len(seg), int(fs)))
    idx = (f >= band[0]) & (f < band[1])
    return float(np.trapezoid(p[idx], f[idx]))


def main():
    rows, qc = [], []
    dmn_by_subj = {}
    for sid, subj in subject_map():
        eegdir = os.path.join(subj, "EEG")
        if not os.path.isdir(eegdir):
            continue
        for stim in STIMULI:
            cands = [f for f in os.listdir(eegdir) if f.lower().endswith(".mat")
                     and norm_stim(os.path.splitext(f)[0]) == stim]
            if not cands:
                qc.append(dict(subject=sid, stimulus=stim, note="MISSING")); continue
            path = os.path.join(eegdir, sorted(cands, key=len)[0])
            try:
                eeg, fs = load_eeg(path)
            except Exception as e:
                qc.append(dict(subject=sid, stimulus=stim, note=f"ERROR:{type(e).__name__}")); continue
            trimmed = len(eeg) > TRIM_IF_OVER
            if trimmed:
                eeg = eeg[:TRIM_TO]
            x = preprocess(eeg, fs)
            med = np.median(x, axis=0); mad = np.median(np.abs(x - med), axis=0) + 1e-9
            hi = med + 6 * 1.4826 * mad; lo = med - 6 * 1.4826 * mad
            step = int(EPOCH_S * fs); n_ep = len(x) // step
            # per-channel alpha/theta power, averaged over retained epochs
            a_acc = np.zeros(4); t_acc = np.zeros(4); kept = 0
            for e in range(n_ep):
                seg = x[e * step:(e + 1) * step]
                if np.any((seg > hi) | (seg < lo)) or np.any(np.std(seg, axis=0) < 1e-7):
                    continue
                for c in range(4):
                    a_acc[c] += bandpower(seg[:, c], fs, ALPHA)
                    t_acc[c] += bandpower(seg[:, c], fs, THETA)
                kept += 1
            if kept == 0:
                qc.append(dict(subject=sid, stimulus=stim, note="0 retained epochs")); continue
            alpha = (a_acc / kept) * 1e6; theta = (t_acc / kept) * 1e6   # per-channel mean power, uV^2
            dmn_ch = alpha + theta                                # per-channel DMN (alpha+theta)
            row = dict(subject=sid, stimulus=stim, retained_epoch_pct=round(100 * kept / n_ep, 1),
                       duration_min=round(len(eeg) / fs / 60, 1),
                       frontal_alpha=alpha[FRONTAL].mean(), parietal_alpha=alpha[PARIETAL].mean(),
                       frontal_theta=theta[FRONTAL].mean(), parietal_theta=theta[PARIETAL].mean(),
                       dmn_power=float(dmn_ch.mean()),           # mean (alpha+theta) over 4 channels
                       parietal_alpha_only=float(alpha[PARIETAL].mean()))  # paper's most consistent marker
            for c in range(4):
                row[f"{CHAN[c]}_alpha"] = float(alpha[c]); row[f"{CHAN[c]}_theta"] = float(theta[c])
            row["qc_flag"] = ("trimmed;" if trimmed else "") + f"retained{row['retained_epoch_pct']}%"
            rows.append(row)
            dmn_by_subj.setdefault(sid, {})[stim] = row["dmn_power"]

    # keystone test: within each subject, is CLC's DMN closer to BOR or to INT? (paper: CLC resembles BOR)
    ks = []
    for sid, d in dmn_by_subj.items():
        if all(s in d for s in ("BOR", "CLC", "INT")):
            db = abs(d["CLC"] - d["BOR"]); di = abs(d["CLC"] - d["INT"])
            ks.append(dict(subject=sid, dmn_BOR=round(d["BOR"], 3), dmn_CLC=round(d["CLC"], 3),
                           dmn_INT=round(d["INT"], 3), clc_closer_to=("BOR" if db < di else "INT"),
                           keystone_consistent=(db < di)))

    import csv
    fields = (["subject", "stimulus", "retained_epoch_pct", "duration_min", "frontal_alpha", "parietal_alpha",
               "frontal_theta", "parietal_theta", "dmn_power", "parietal_alpha_only"]
              + [f"{c}_{b}" for c in CHAN for b in ("alpha", "theta")] + ["qc_flag"])
    with open(os.path.join(OUT, "ch-eeg-bandpower.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore"); w.writeheader(); w.writerows(rows)
    with open(os.path.join(OUT, "ch-eeg-keystone.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["subject", "dmn_BOR", "dmn_CLC", "dmn_INT", "clc_closer_to", "keystone_consistent"])
        w.writeheader(); w.writerows(ks)
    with open(os.path.join(OUT, "ch-eeg-qc.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["subject", "stimulus", "note"]); w.writeheader(); w.writerows(qc)
    print(f"ch-eeg v2 done: {len(rows)}/24 band-power cells; keystone rows={len(ks)}; qc={len(qc)}")
    n_ks = sum(1 for k in ks if k["keystone_consistent"])
    print(f"keystone: clinical DMN closer to BORING in {n_ks}/{len(ks)} subjects (paper predicts CLC resembles boring)")


if __name__ == "__main__":
    main()
