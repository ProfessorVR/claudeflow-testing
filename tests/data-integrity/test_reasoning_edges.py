"""
Regression tests for reasoning edge data integrity.

Validates fixes for:
  C-01: No self-referential edges (source == target)
  C-02: No duplicate (source, relation, target) triples
  H-04: No duplicate ontology node names in compiled-index.json
  H-06: No collapsed similarity tiers ("inheritance" → "is_variant_of")
"""

import json
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
REASONING_JSONL = REPO / "god-reason" / "reasoning.jsonl"
COMPILED_INDEX = REPO / "corpus" / "index" / "compiled-index.json"
KNOWLEDGE_JSONL = REPO / "god-learn" / "knowledge.jsonl"


@pytest.fixture
def edges():
    assert REASONING_JSONL.exists(), f"Missing {REASONING_JSONL}"
    return [json.loads(l) for l in REASONING_JSONL.read_text().splitlines() if l.strip()]


@pytest.fixture
def compiled_index():
    assert COMPILED_INDEX.exists(), f"Missing {COMPILED_INDEX}"
    return json.load(COMPILED_INDEX.open())


@pytest.fixture
def knowledge_units():
    assert KNOWLEDGE_JSONL.exists(), f"Missing {KNOWLEDGE_JSONL}"
    return [json.loads(l) for l in KNOWLEDGE_JSONL.read_text().splitlines() if l.strip()]


# ── C-01: No self-referential edges ──────────────────────────────────────────

class TestC01SelfReferentialEdges:
    def test_no_self_refs(self, edges):
        self_refs = [e for e in edges if e.get("source") == e.get("target")]
        examples = [f"{e['source']} {e['relation']} {e['target']}" for e in self_refs[:3]]
        assert len(self_refs) == 0, (
            f"Found {len(self_refs)} self-referential edges. Examples: {examples}"
        )


# ── C-02: No duplicate triples ──────────────────────────────────────────────

class TestC02DuplicateTriples:
    def test_no_duplicate_triples(self, edges):
        triples = [
            (e.get("source", "").lower(), e.get("relation", ""), e.get("target", "").lower())
            for e in edges
        ]
        seen = set()
        dupes = []
        for t in triples:
            if t in seen:
                dupes.append(t)
            seen.add(t)
        assert len(dupes) == 0, (
            f"Found {len(dupes)} duplicate triples. "
            f"Examples: {dupes[:3]}"
        )


# ── H-04: No duplicate ontology node names ──────────────────────────────────

class TestH04OntologyNodes:
    def test_no_duplicate_names(self, compiled_index):
        names = [n["name"].lower() for n in compiled_index["ontologyNodes"]]
        seen = set()
        dupes = [n for n in names if n in seen or seen.add(n)]
        assert len(dupes) == 0, f"Duplicate ontology names: {dupes[:10]}"


# ── H-06: Semantic edge relations ───────────────────────────────────────────

class TestH06SemanticRelations:
    def test_no_collapsed_inheritance_relation(self, edges):
        """'inheritance' should now be 'is_variant_of' in new edges."""
        # Note: existing edges may still have old relation names;
        # this test validates that the VOCAB_MAP normalization is applied
        relations = set(e.get("relation", "") for e in edges)
        if "inheritance" in relations:
            count = sum(1 for e in edges if e.get("relation") == "inheritance")
            pytest.fail(
                f"Found {count} edges with raw 'inheritance' relation. "
                "These should be normalized to 'is_variant_of' via VOCAB_MAP."
            )


# ── KU schema validation ────────────────────────────────────────────────────

class TestKnowledgeUnitSchema:
    def test_all_kus_have_id_and_claim(self, knowledge_units):
        missing = [i for i, ku in enumerate(knowledge_units) if not ku.get("id") or not ku.get("claim")]
        assert len(missing) == 0, f"KUs at indices {missing[:5]} missing id or claim"

    def test_confidence_is_valid_type(self, knowledge_units):
        """Confidence must be a string tier ('high'/'medium'/'low') or a number 0-1."""
        valid_tiers = {"high", "medium", "low"}
        invalid = []
        for ku in knowledge_units:
            c = ku.get("confidence")
            if isinstance(c, str) and c not in valid_tiers:
                invalid.append((ku.get("id"), c))
            elif isinstance(c, (int, float)) and not (0.0 <= c <= 1.0):
                invalid.append((ku.get("id"), c))
            elif c is None:
                invalid.append((ku.get("id"), None))
        assert len(invalid) == 0, f"KUs with invalid confidence: {invalid[:5]}"

    def test_sources_pages_are_strings(self, knowledge_units):
        """Pages field should be string (e.g., '356-358'), not number[]."""
        for ku in knowledge_units:
            for src in ku.get("sources", []):
                pages = src.get("pages")
                if pages is not None:
                    assert isinstance(pages, str), (
                        f"KU {ku['id']}: pages should be string, got {type(pages).__name__}: {pages}"
                    )
