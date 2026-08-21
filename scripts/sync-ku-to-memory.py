#!/usr/bin/env python3
"""
Sprint 3 Task 14: Sync KUs and reasoning edges to the memory server's session store.

Reads from the canonical JSONL files and writes to .agentdb/session-knowledge.json
so that the memory server can serve KU/edge data to cross-session queries.

Usage:
    python3 scripts/sync-ku-to-memory.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


REPO_ROOT = Path(__file__).resolve().parents[1]
KU_PATH = REPO_ROOT / "god-learn" / "knowledge.jsonl"
EDGE_PATH = REPO_ROOT / "god-reason" / "reasoning.jsonl"
SESSION_KNOWLEDGE = REPO_ROOT / ".agentdb" / "session-knowledge.json"


def load_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    items = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                items.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return items


def ku_to_memory_entry(ku: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a KU from JSONL format to memory server knowledge entry format."""
    return {
        "id": ku.get("id", "unknown"),
        "type": "knowledge_unit",
        "domain": ku.get("domain", "unknown"),
        "content": ku.get("claim", ""),
        "metadata": {
            "source": ku.get("source") or (ku.get("sources", [{}])[0].get("author") if ku.get("sources") else "unknown"),
            "confidence": ku.get("confidence", 0.5),
            "origin": "god-learn/knowledge.jsonl",
            "synced_at": datetime.now(timezone.utc).isoformat(),
        },
        "tags": ["ku", ku.get("domain", "unknown")],
    }


def edge_summary_entry(edges: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Create a summary entry for reasoning edges."""
    by_pipeline: Dict[str, int] = {}
    by_relation: Dict[str, int] = {}
    for e in edges:
        p = e.get("pipeline", "unknown")
        r = e.get("relation", "unknown")
        by_pipeline[p] = by_pipeline.get(p, 0) + 1
        by_relation[r] = by_relation.get(r, 0) + 1

    return {
        "id": "reasoning_edge_summary",
        "type": "reasoning_graph_summary",
        "domain": "meta",
        "content": f"Reasoning graph: {len(edges)} edges across {len(by_pipeline)} pipelines",
        "metadata": {
            "total_edges": len(edges),
            "by_pipeline": by_pipeline,
            "by_relation": by_relation,
            "origin": "god-reason/reasoning.jsonl",
            "synced_at": datetime.now(timezone.utc).isoformat(),
        },
        "tags": ["reasoning", "graph", "summary"],
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Sync KUs/edges to memory server session store")
    ap.add_argument("--dry-run", action="store_true", help="Print what would be written without modifying files")
    args = ap.parse_args()

    # Load canonical data
    kus = load_jsonl(KU_PATH)
    edges = load_jsonl(EDGE_PATH)
    print(f"Loaded {len(kus)} KUs from {KU_PATH}")
    print(f"Loaded {len(edges)} edges from {EDGE_PATH}")

    # Build memory entries
    memory_entries: List[Dict[str, Any]] = []
    for ku in kus:
        memory_entries.append(ku_to_memory_entry(ku))
    if edges:
        memory_entries.append(edge_summary_entry(edges))

    # Load existing session knowledge (if any)
    existing: List[Dict[str, Any]] = []
    if SESSION_KNOWLEDGE.exists():
        try:
            existing = json.loads(SESSION_KNOWLEDGE.read_text(encoding="utf-8"))
            if not isinstance(existing, list):
                existing = []
        except (json.JSONDecodeError, TypeError):
            existing = []

    # Remove any previously synced KU/edge entries
    existing = [e for e in existing if e.get("type") not in ("knowledge_unit", "reasoning_graph_summary")]

    # Merge
    merged = existing + memory_entries

    if args.dry_run:
        print(f"\n[DRY RUN] Would write {len(memory_entries)} entries to {SESSION_KNOWLEDGE}")
        print(f"  - {len(kus)} knowledge_unit entries")
        print(f"  - 1 reasoning_graph_summary entry")
        print(f"  - {len(existing)} existing non-KU entries preserved")
        return 0

    # Write
    SESSION_KNOWLEDGE.parent.mkdir(parents=True, exist_ok=True)
    SESSION_KNOWLEDGE.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"\nWritten {len(memory_entries)} entries to {SESSION_KNOWLEDGE}")
    print(f"  - {len(kus)} knowledge_unit entries")
    print(f"  - 1 reasoning_graph_summary entry")
    print(f"  - {len(existing)} existing entries preserved")
    print(f"Total entries in session store: {len(merged)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
