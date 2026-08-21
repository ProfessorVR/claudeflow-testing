#!/usr/bin/env python3
"""
Migrate 40 cross-pipeline bridge edges from phantasia-analysis/cross-pipeline-bridge.md
into god-reason/reasoning.jsonl.

Parses markdown tables from sections 4B.2, 4C.2, 4D.2, 4E.2.
"""

import json
import re
import sys
from pathlib import Path

PROJECT = Path("/home/dalton/projects/claudeflow-testing")
SOURCE_MD = PROJECT / "phantasia-analysis" / "cross-pipeline-bridge.md"
TARGET_JSONL = PROJECT / "god-reason" / "reasoning.jsonl"

# Confidence mapping
CONFIDENCE_MAP = {
    "[EXPLICIT]": "high",
    "[INTERP-high]": "medium",
    "[INTERP-low]": "low",
    "[INTERP-speculative]": "low",
}

# KU linking rules: concept keywords -> KU IDs
KU_LINKS = {
    "phantasia": ["ku_72ae5c1cbc"],           # phantasia as distinct faculty
    "kinesis": ["ku_71b580d6f7"],              # phantasia connected to kinesis
    "pathos": ["ku_589e2a2f8a"],               # perception, interpretation cluster
    "Befindlichkeit": ["ku_8447bccb29"],       # Heidegger interprets pathe as Befindlichkeiten
    "Stimmung": ["ku_8447bccb29"],             # same KU — pathe as Befindlichkeiten
    "dioxis": ["ku_bca0bdc936"],               # dioxis and phyge as basic ways
    "phyge": ["ku_bca0bdc936"],                # dioxis and phyge as basic ways
    "orexis": ["ku_bca0bdc936"],               # connected to dioxis/phyge
    "taking_as": ["ku_9dbdeb8728"],            # discriminating power
    "kairos": ["ku_43bc20a392"],               # kairos as ambient
    "chronos": ["ku_71b580d6f7", "ku_e53d298d41"],  # kinesis + Da-Charakter
    "resonant_motion": ["ku_71b580d6f7"],      # kinesis connection
    "apoleipomene_kinesis": ["ku_71b580d6f7"], # kinesis connection
    "antichesis": ["ku_71b580d6f7"],           # kinesis connection
    "habituated_phantasia": ["ku_72ae5c1cbc"], # phantasia faculty
    "sensitive_phantasia": ["ku_72ae5c1cbc", "ku_c2ce85927c"],  # phantasia + perception of magnitude
    "deliberative_phantasia": ["ku_72ae5c1cbc"],  # phantasia faculty
    "affective_architecture": ["ku_589e2a2f8a"],  # perception/interpretation cluster
    "Erschlossenheit": ["ku_00e1411b29"],      # being as being-present
    "Geworfenheit": ["ku_8447bccb29"],         # Befindlichkeit context
    "resonant_affect": ["ku_8447bccb29", "ku_589e2a2f8a"],  # pathe + perception cluster
    "dual_trace": ["ku_71b580d6f7"],           # kinesis
    "Bedeutsamkeit": ["ku_8447bccb29"],        # Befindlichkeit context
    "Sorge": [],                                # no direct KU match
    "Verstehen": [],                            # no direct KU match
    "ontological_completion": ["ku_00e1411b29"],  # being as being-present
    "Funktionskreis (T-stage analogue)": ["ku_71b580d6f7"],  # kinesis parallel
    "doxa/krisis": ["ku_589e2a2f8a"],          # perception cluster
    "T-stage schema": ["ku_71b580d6f7", "ku_72ae5c1cbc"],  # kinesis + phantasia
    "tripartite temporal formula": ["ku_71b580d6f7"],  # kinesis/temporal
    "4-step schema": ["ku_8447bccb29", "ku_72ae5c1cbc"],  # Befindlichkeit + phantasia
}


def resolve_ku_ids(source_concept: str) -> list:
    """Look up KU IDs for a source concept."""
    # Direct match
    if source_concept in KU_LINKS:
        return KU_LINKS[source_concept]
    # Partial match on known keywords
    ids = set()
    for key, ku_ids in KU_LINKS.items():
        if key.lower() in source_concept.lower():
            ids.update(ku_ids)
    return sorted(ids)


def parse_table_rows(text: str) -> list[dict]:
    """Parse markdown table rows, skipping header and separator."""
    rows = []
    lines = text.strip().split("\n")
    for line in lines:
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.split("|")[1:-1]]  # drop empty first/last
        if len(cells) < 7:
            continue
        # Skip header row and separator
        if cells[0] == "#" or re.match(r"^-+$", cells[0]):
            continue
        try:
            num = int(cells[0])
        except ValueError:
            continue
        rows.append({
            "num": num,
            "source": cells[1],
            "relation": cells[2],
            "target": cells[3],
            "domain": cells[4],
            "confidence_raw": cells[5],
            "note": cells[6] if len(cells) > 6 else "",
        })
    return rows


def extract_section(md_text: str, header_pattern: str, next_header: str) -> str:
    """Extract text between two section headers."""
    start = md_text.find(header_pattern)
    if start == -1:
        raise ValueError(f"Could not find section: {header_pattern}")
    end = md_text.find(next_header, start + len(header_pattern))
    if end == -1:
        end = len(md_text)
    return md_text[start:end]


def main():
    md_text = SOURCE_MD.read_text()

    # Define sections and their pipeline tags
    sections = [
        ("### 4B.2 Bridge Edges", "### 4B.3", "bcap"),
        ("### 4C.2 Bridge Edges", "### 4C.3", "bt"),
        ("### 4D.2 Bridge Edges", "### 4D.3", "rickert"),
        ("### 4E.2 Bridge Edges", "### 4E.3", "uexkull"),
    ]

    all_edges = []
    for start_header, end_header, pipeline_tag in sections:
        section_text = extract_section(md_text, start_header, end_header)
        rows = parse_table_rows(section_text)
        print(f"  {pipeline_tag}: parsed {len(rows)} edges")

        for row in rows:
            confidence = CONFIDENCE_MAP.get(row["confidence_raw"], "low")
            edge_id = f"edge_bridge_{pipeline_tag}_{row['num']:02d}"
            ku_ids = resolve_ku_ids(row["source"])

            edge = {
                "id": edge_id,
                "source": row["source"],
                "relation": row["relation"],
                "target": row["target"],
                "domain": row["domain"],
                "confidence": confidence,
                "pipeline": f"bridge_{pipeline_tag}",
                "knowledge_ids": ku_ids,
            }
            all_edges.append(edge)

    print(f"\nTotal edges parsed: {len(all_edges)}")
    if len(all_edges) != 40:
        print(f"WARNING: Expected 40 edges, got {len(all_edges)}", file=sys.stderr)
        sys.exit(1)

    # Check for duplicate IDs
    ids = [e["id"] for e in all_edges]
    if len(ids) != len(set(ids)):
        print("ERROR: Duplicate edge IDs detected", file=sys.stderr)
        sys.exit(1)

    # Check no duplicates against existing file
    existing_ids = set()
    if TARGET_JSONL.exists():
        for line in TARGET_JSONL.read_text().strip().split("\n"):
            if line.strip():
                existing_ids.add(json.loads(line)["id"])

    conflicts = set(ids) & existing_ids
    if conflicts:
        print(f"ERROR: {len(conflicts)} edge IDs already exist: {conflicts}", file=sys.stderr)
        sys.exit(1)

    # Append to JSONL
    with open(TARGET_JSONL, "a") as f:
        for edge in all_edges:
            f.write(json.dumps(edge) + "\n")

    print(f"Appended {len(all_edges)} bridge edges to {TARGET_JSONL}")
    print(f"Previous count: {len(existing_ids)}, new count: {len(existing_ids) + len(all_edges)}")

    # Summary by pipeline
    for pipeline_tag in ["bcap", "bt", "rickert", "uexkull"]:
        pipeline_edges = [e for e in all_edges if e["pipeline"] == f"bridge_{pipeline_tag}"]
        linked = sum(1 for e in pipeline_edges if e["knowledge_ids"])
        print(f"  bridge_{pipeline_tag}: {len(pipeline_edges)} edges, {linked} KU-linked")


if __name__ == "__main__":
    main()
