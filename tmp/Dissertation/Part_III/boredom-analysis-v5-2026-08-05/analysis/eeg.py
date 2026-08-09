"""EEG, analyzed in full and reported including its negatives (spec section D18).

The framing ruling is that EEG was dropped because it was too noisy and the eye
tracking was definitive enough. That claim has to be EVIDENCED, so this module runs
the channel completely, reports epoch retention, signal-to-noise and significance,
and excludes no cell for being noisy - excluding the noisiest cells would quietly
remove the very evidence the claim rests on.

Round 2 has no EEG, so this is N=8 permanently.

Band power comes from ch_eeg.py unmodified: 4 channels F3/F4/P3/P4 at 200 Hz,
1-35 Hz bandpass, 60 Hz notch, 2 s epochs, 6-MAD artifact rejection, alpha 8-12 Hz
and theta 4-8 Hz, DMN = alpha + theta averaged over the four channels.
"""
import os

import numpy as np
import pandas as pd
import scipy.io as sio

import adapters
import config as C
import journal as J
import stats as S


def snr_per_cell():
    """Noise burden per cell, from the same preprocessing ch_eeg.py applies.

    The reported quantity is the ARTIFACT-TO-CLEAN VARIANCE RATIO: mean variance of
    the epochs the 6-MAD rule rejected, over mean variance of the epochs it retained.
    It is deliberately not called signal-to-noise. Rejection targets high-amplitude
    excursions, so rejected epochs carry more variance by construction and the
    conventional SNR ratio would be below 1 by definition, which says nothing. The
    ratio as defined here answers the question the framing ruling actually needs:
    how much larger is the discarded material than the material kept.
    """
    rows = []
    import ch_eeg as _e
    for sid, subj in adapters.subject_map():
        eegdir = os.path.join(subj, "EEG")
        if not os.path.isdir(eegdir):
            continue
        for stim in C.STIMULI:
            cands = [f for f in sorted(os.listdir(eegdir)) if f.lower().endswith(".mat")
                     and adapters.norm_stim(os.path.splitext(f)[0]) == stim]
            if not cands:
                J.exclude(scope="eeg cell", item=f"{sid} {stim}",
                          reason="no .mat file", recoverable=False)
                continue
            path = os.path.join(eegdir, sorted(cands, key=len)[0])
            try:
                eeg, fs = _e.load_eeg(path)
            except Exception as exc:
                J.exclude(scope="eeg cell", item=f"{sid} {stim}",
                          reason=f"unreadable: {type(exc).__name__}", recoverable=False)
                continue
            trimmed = len(eeg) > _e.TRIM_IF_OVER
            if trimmed:
                eeg = eeg[:_e.TRIM_TO]
            x = _e.preprocess(eeg, fs)
            med = np.median(x, axis=0)
            mad = np.median(np.abs(x - med), axis=0) + 1e-9
            hi, lo = med + 6 * 1.4826 * mad, med - 6 * 1.4826 * mad
            step = int(_e.EPOCH_S * fs)
            n_ep = len(x) // step
            kept_var, rej_var, kept = [], [], 0
            for e in range(n_ep):
                seg = x[e * step:(e + 1) * step]
                bad = np.any((seg > hi) | (seg < lo)) or np.any(np.std(seg, axis=0) < 1e-7)
                (rej_var if bad else kept_var).append(float(np.mean(np.var(seg, axis=0))))
                kept += (not bad)
            ret = 100.0 * kept / n_ep if n_ep else np.nan
            ratio = (float(np.mean(rej_var)) / float(np.mean(kept_var))
                     if kept_var and rej_var and np.mean(kept_var) > 0 else np.nan)
            rows.append(dict(subject=sid, stimulus=stim, fs_hz=fs, n_epochs=n_ep,
                             retained_epochs=kept, retained_pct=ret,
                             rejected_pct=100 - ret if ret == ret else np.nan,
                             clean_var_uv2=float(np.mean(kept_var)) if kept_var else np.nan,
                             artifact_var_uv2=float(np.mean(rej_var)) if rej_var else np.nan,
                             artifact_to_clean_variance_ratio=ratio,
                             trimmed=trimmed))
            if ret == ret and ret < 50:
                J.qc(channel="EEG", subject=sid, stimulus=stim, flag="low retention",
                     detail=f"{ret:.1f}% of 2 s epochs retained")
    return pd.DataFrame(rows)


def analyze(outdir):
    """-> (bandpower, keystone, qc, snr, tests) frames."""
    adapters.run_ch_eeg(outdir)
    bp = pd.read_csv(os.path.join(outdir, "ch-eeg-bandpower.csv"))
    ks = pd.read_csv(os.path.join(outdir, "ch-eeg-keystone.csv"))
    qc = pd.read_csv(os.path.join(outdir, "ch-eeg-qc.csv"))
    snr = snr_per_cell()

    rows, details = [], []
    for col, label in [("dmn_power", "EEG DMN power (alpha+theta)"),
                       ("parietal_alpha", "EEG parietal alpha"),
                       ("frontal_alpha", "EEG frontal alpha"),
                       ("parietal_theta", "EEG parietal theta"),
                       ("frontal_theta", "EEG frontal theta")]:
        t = adapters.surface_table(bp, col)
        r, d = S.test_surface(t, label, poolable_key="eeg", scope="R1 only (N=8)",
                              n_note="Round 2 has no EEG; this channel is N=8 permanently")
        rows.append(r)
        details.extend(d)
    J.note("EEG",
           "Every cell is reported regardless of retention. No cell is excluded for "
           "being noisy, because the retention and SNR figures ARE the evidence for "
           "the ruling that EEG was dropped as too noisy; removing the worst cells "
           "would remove the justification.")
    return bp, ks, qc, snr, pd.DataFrame(rows), pd.DataFrame(details)
