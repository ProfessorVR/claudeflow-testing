#!/usr/bin/env python3
"""Extract Physics and Metaphysics Bekker loci relevant to A0 from the Aristotle Complete Works index."""
import json
import re
from collections import defaultdict

BEKKER_INDEX = "/home/dalton/projects/claudeflow-testing/corpus/index/Aristotle - Complete Works/aristotle-bekker-index.json"

# Works of interest for A0
TARGET_WORKS = {"physics", "metaphysics", "sense_and_sensibilia"}

# Target concepts (Greek and English)
TARGET_CONCEPTS = {
    "κίνησις", "kinesis", "motion",
    "ἐνέργεια", "energeia", "actuality",
    "δύναμις", "dunamis", "potentiality", "potency",
    "ἐντελέχεια", "entelecheia", "entelechy",
    "χρόνος", "chronos", "time",
    "νῦν", "nun", "now",
    "οὐσία", "ousia", "substance", "being",
    "πρὸς τι", "pros ti",
    "ποίησις", "poiesis",
    "πάθησις", "pathesis",
    "πάθος", "pathos",
    "τέλος", "telos",
    "ἀτελής", "ateles",
}


def concept_match(concepts_list, text_fields):
    joined = " ".join(concepts_list) + " " + " ".join(text_fields)
    low = joined.lower()
    for c in TARGET_CONCEPTS:
        if c.lower() in low:
            return True
    return False


def bekker_sort_key(bekker_str):
    m = re.match(r"(\d+)([ab])?", bekker_str)
    if not m:
        return (0, "", 0)
    num = int(m.group(1))
    side = m.group(2) or ""
    return (num, side)


def main():
    with open(BEKKER_INDEX) as f:
        entries = json.load(f)

    # Group by work
    by_work = defaultdict(list)
    for e in entries:
        work = (e.get("work") or "").lower().replace(" ", "_")
        if work not in TARGET_WORKS:
            continue
        if not concept_match(e.get("concepts", []), [e.get("description", "")]):
            continue
        by_work[work].append(e)

    # Sort by Bekker
    for w in by_work:
        by_work[w].sort(key=lambda e: bekker_sort_key(e.get("bekker", "0a")))

    report = []
    report.append("# A0 Aristotle Bekker Loci — Extracted from Complete Works Index\n")
    report.append("Date: 2026-04-23\n")
    report.append("Source: `corpus/index/Aristotle - Complete Works/aristotle-bekker-index.json`\n")
    report.append("Target works: Physics, Metaphysics, Sense and Sensibilia\n")
    report.append(
        "Concept filter: kinesis, energeia, dunamis, entelecheia, chronos, "
        "nun, ousia, pros-ti, poiesis, pathesis, pathos, telos, ateles\n\n"
    )

    total = 0
    for w in sorted(by_work.keys()):
        entries = by_work[w]
        report.append(f"\n## {w.replace('_', ' ').title()} ({len(entries)} loci)\n\n")
        for e in entries:
            report.append(f"**{e.get('bekker')}** [{e.get('unit_id')}, p. {e.get('pdf_page')}]\n")
            report.append(f"- Description: {e.get('description', '').strip()}\n")
            report.append(f"- Concepts: {', '.join(e.get('concepts', []))}\n\n")
        total += len(entries)

    report.append(f"\n---\n\n**Total loci extracted:** {total}\n")

    out = "/home/dalton/projects/claudeflow-testing/tmp/a0-aristotle-bekker-extract-2026-04-23.md"
    with open(out, "w") as f:
        f.write("".join(report))
    print(f"Wrote: {out}")
    print(f"Total loci extracted: {total}")
    for w in sorted(by_work.keys()):
        print(f"  {w}: {len(by_work[w])}")


if __name__ == "__main__":
    main()
