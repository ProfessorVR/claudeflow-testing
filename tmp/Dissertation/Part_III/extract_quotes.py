#!/usr/bin/env python
"""Pull quotation candidates out of the index entries, for gating against archon.

The entries use ONLY straight double quotes (3,666 of them; zero curly), so pairing
has to be sequential. Doing that over a whole file is fragile: one unpaired quote
flips the parity for everything after it, which produced spans running from the
CLOSE of one quotation to the OPEN of the next. Pairing per LINE contains the damage
to a single line.

Also filtered out: spans carrying entry-prose markers (markdown emphasis, page
citations, the entry's own tagging vocabulary), which are not source wording.
"""
import glob
import os
import re
import sys

ROOT = "/home/dalton/projects/archon-cli-v3/index/Boredom Secondary (Part III)"

UNITS = ["bor-sec-10", "bor-sec-11", "bor-sec-18", "bor-sec-19", "bor-sec-07",
         "bor-sec-28", "bor-sec-27", "bor-sec-33", "bor-sec-36", "bor-sec-38",
         "bor-sec-30", "bor-sec-32", "bor-sec-29", "bor-sec-44", "bor-sec-25",
         "bor-sec-26"]

# Markers that mean the span is the entry talking, not the source speaking.
PROSE_MARKERS = ("**", "](", "pp.", "FAITHFUL", "UNVERIFIED", "anticipatory",
                 "bor-sec-", "fcm-0", "§", "P/", "FE,", "|")

# Trailing punctuation the entry adds inside the quotation marks. Verified relevant:
# "it is boring for one," FAILS while "it is boring for one" is EXACT.
TRAIL = ' \t,.;:—–-*'
LEAD = ' \t*—–-'


def spans(line):
    """Sequentially paired straight-quote spans on one line."""
    parts = line.split('"')
    # parts[1], parts[3], ... are the quoted spans
    return [parts[i] for i in range(1, len(parts), 2)]


def main():
    seen = set()
    for unit in UNITS:
        hits = glob.glob(os.path.join(ROOT, "*", f"{unit}-*.md"))
        if not hits:
            print(f"# MISSING ENTRY {unit}", file=sys.stderr)
            continue
        with open(hits[0], encoding="utf-8") as fh:
            for line in fh:
                for raw in spans(line):
                    q = " ".join(raw.split())
                    q = q.strip(LEAD).strip(TRAIL).strip()
                    if len(q.split()) < 4 or len(q) > 400:
                        continue
                    if any(m in q for m in PROSE_MARKERS):
                        continue
                    # An unclosed italic or a stray bracket means the span ran past
                    # the quotation it belongs to.
                    if q.count("(") != q.count(")") or q.count("[") != q.count("]"):
                        continue
                    key = (unit, q.lower())
                    if key in seen:
                        continue
                    seen.add(key)
                    print(f"{unit}\t{q}")


if __name__ == "__main__":
    main()
