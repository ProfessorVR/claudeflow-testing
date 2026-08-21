"""Pilot: can CLIP tell the three stimuli apart on the in-VR headset feed?

Zero-shot classification of sampled frames against text prompts describing the three
known stimuli plus off-stimulus states. Run offline against the cached
sentence-transformers/clip-ViT-B-32. Emits counts + a timeline; no frame is ever
returned to the conversation and no filename or name is printed.
"""
import glob
import os
import sys
import time

import torch
from PIL import Image
from sentence_transformers import SentenceTransformer

FRAMES = sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                       "pilot", "frames", "*.jpg")))
INTERVAL_S = 5

# Stimuli per P1/P2: Boring = 1989 MS-Word tutorial; Interesting = alien-reproduction-
# vehicle video; Clinical = 360-degree spinal-deformation surgery.
CLASSES = {
    "BOR": [
        "a screenshot of a 1980s word processor software tutorial",
        "an old beige computer software interface with menus and text",
        "a vintage instructional video about typing a document",
    ],
    "INT": [
        "a documentary about aliens and unidentified flying objects",
        "a conspiracy video with diagrams of alien spacecraft",
        "a narrator discussing extraterrestrial vehicles",
    ],
    "CLC": [
        "a surgical operating room with surgeons performing an operation",
        "a close-up of spinal surgery with surgical instruments and blood",
        "medical staff in scrubs around an operating table",
    ],
    "OFF": [
        "a black screen",
        "a virtual reality menu or loading screen",
        "an empty grey room with no content",
    ],
}


def main():
    if not FRAMES:
        print("no frames found"); return
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    t0 = time.time()
    model = SentenceTransformer("sentence-transformers/clip-ViT-B-32", device=dev)
    t_load = time.time() - t0

    labels, prompts = [], []
    for k, ps in CLASSES.items():
        for p in ps:
            labels.append(k); prompts.append(p)
    with torch.no_grad():
        temb = model.encode(prompts, convert_to_tensor=True, normalize_embeddings=True)

    t1 = time.time()
    imgs = [Image.open(f) for f in FRAMES]
    with torch.no_grad():
        iemb = model.encode(imgs, batch_size=64, convert_to_tensor=True,
                            normalize_embeddings=True, show_progress_bar=False)
    t_embed = time.time() - t1

    sims = iemb @ temb.T                      # (n_frames, n_prompts)
    # max similarity per class
    per_class = {}
    for k in CLASSES:
        idx = [i for i, l in enumerate(labels) if l == k]
        per_class[k] = sims[:, idx].max(dim=1).values
    stack = torch.stack([per_class[k] for k in CLASSES], dim=1)
    pred_i = stack.argmax(dim=1).tolist()
    keys = list(CLASSES)
    preds = [keys[i] for i in pred_i]
    conf = stack.softmax(dim=1).max(dim=1).values.tolist()

    print(f"model load {t_load:.1f}s · embed {len(FRAMES)} frames in {t_embed:.1f}s "
          f"({len(FRAMES)/t_embed:.0f} fps) · device {dev}")
    print(f"\nframes={len(FRAMES)}  span={len(FRAMES)*INTERVAL_S/60:.1f} min")
    print("\nclass counts:")
    for k in keys:
        n = preds.count(k)
        print(f"  {k}  {n:>4}  ({100*n/len(preds):>5.1f}%)")
    print(f"\nmean confidence {sum(conf)/len(conf):.3f}")

    # compact run-length timeline
    print("\ntimeline (run-length, mm:ss):")
    runs, cur, start = [], preds[0], 0
    for i, p in enumerate(preds[1:], 1):
        if p != cur:
            runs.append((cur, start * INTERVAL_S, i * INTERVAL_S)); cur, start = p, i
    runs.append((cur, start * INTERVAL_S, len(preds) * INTERVAL_S))
    for lab, a, b in runs:
        if b - a >= 15:
            print(f"  {a//60:02d}:{a%60:02d}–{b//60:02d}:{b%60:02d}  {lab}  ({(b-a)//60}m{(b-a)%60:02d}s)")
    print(f"\n(runs total {len(runs)}; only runs >=15s shown)")


if __name__ == "__main__":
    main()
