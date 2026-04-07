#!/usr/bin/env python3
"""
compile-corpus-index.py

Pre-compiles the corpus index (~290 files in corpus/index/) into a single
compiled-index.json.  The output contains four arrays:

    ontologyNodes       - canonical concept nodes from all ontology files
    crossPipelineHooks  - cross-pipeline hook entries
    tensionEdges        - tension / conflict edge entries
    canonicalTerms      - deduplicated flat list of all terms, sorted by
                          length descending for greedy matching

Safe to re-run (idempotent).  Malformed rows/entries are skipped with
warnings to stderr.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

REPO = Path(__file__).resolve().parent.parent
CORPUS_INDEX = REPO / "corpus" / "index"
OUTPUT = CORPUS_INDEX / "compiled-index.json"

# Text directories mapped to human-readable labels
TEXT_DIRS: dict[str, dict] = {
    "Aristotle - Complete Works": {
        "label": "Aristotle",
        "ontology_format": "table",
        "analysis_subdir": None,       # flat directory
    },
    "Heidegger - Being and Time": {
        "label": "Heidegger - Being and Time",
        "ontology_format": "header",
        "analysis_subdir": "bt-analysis",
    },
    "Heidegger - Basic Concepts of Aristotelian Philosophy": {
        "label": "Heidegger - Basic Concepts of Aristotelian Philosophy",
        "ontology_format": "table",
        "analysis_subdir": "bcap-analysis",
    },
    "Rickert - Ambient Rhetoric": {
        "label": "Rickert - Ambient Rhetoric",
        "ontology_format": "header",
        "analysis_subdir": "rickert-analysis",
    },
    "Von Uexkull - A Foray into the Worlds of Animals and Humans": {
        "label": "Von Uexkull - A Foray into the Worlds of Animals and Humans",
        "ontology_format": "header",
        "analysis_subdir": "uex-analysis",
    },
}

# Map short work prefixes in file names to human-readable text labels
ARISTOTLE_WORK_MAP: dict[str, str] = {
    "de-anima":          "Aristotle - De Anima",
    "metaphysics":       "Aristotle - Metaphysics",
    "physics":           "Aristotle - Physics",
    "rhetoric":          "Aristotle - Rhetoric",
    "sense-sensibilia":  "Aristotle - Sense and Sensibilia",
    "movement-animals":  "Aristotle - Movement of Animals",
    "on-memory":         "Aristotle - On Memory",
    "on-colours":        "Aristotle - On Colours",
    "on-things-heard":   "Aristotle - On Things Heard",
    "corpus":            "Aristotle - Complete Works",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def warn(msg: str) -> None:
    print(f"WARNING: {msg}", file=sys.stderr)


def read_text(path: Path) -> str:
    """Read a file with UTF-8, falling back to latin-1 for encoding issues."""
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        warn(f"UTF-8 decode failed for {path}, falling back to latin-1")
        return path.read_text(encoding="latin-1")


def strip_bold(s: str) -> str:
    """Remove markdown bold markers from a string."""
    return s.replace("**", "").strip()


def first_sentence(text: str) -> str:
    """Extract the first sentence from a paragraph of text."""
    text = text.strip()
    # Match up to the first period followed by whitespace or end-of-string,
    # but skip common abbreviations like "e.g.", "i.e.", "cf."
    m = re.search(r'(?<!\be)(?<!\bi)(?<!\bcf)(?<!\bvs)\.\s', text)
    if m:
        return text[: m.start() + 1].strip()
    # No sentence break found -- return the whole thing (might be a single
    # sentence without a final period)
    return text.strip()


def parse_units(raw: str) -> list[str]:
    """Parse a comma/space separated units string into a list."""
    if not raw or not raw.strip():
        return []
    return [u.strip() for u in re.split(r'[,;\s]+', raw.strip()) if u.strip()]


# ---------------------------------------------------------------------------
# TABLE format parser  (Aristotle per-work + corpus ontologies)
# ---------------------------------------------------------------------------

def parse_table_ontology(text: str, text_label: str) -> list[dict]:
    """
    Parse an Aristotle-style ontology file.

    Handles THREE sub-formats:
      A) Pipe-delimited row tables (DA, Rhetoric, SS, MA, etc.)
         Full: #, Name, Greek, Transliteration, Translation, Type, Definition,
               Units, Centrality, global_candidate
         Peripheral: #, Name, Greek, Transliteration, Translation, Type,
                     Units, global_candidate
         BCAP-like: includes an Aliases column
      B) Field/Value tables (Metaphysics, Physics)
         ### N.N Greek -- English
         | Field | Value |
         |-------|-------|
         | Greek | ... |
      C) Corpus-level table (slightly different column order)
    """
    nodes: list[dict] = []

    # Detect which sub-format: if we see "| Field | Value |" it is format B
    if re.search(r'(?m)^\|\s*\*?\*?Field\*?\*?\s*\|\s*\*?\*?Value\*?\*?\s*\|', text):
        return _parse_field_value_ontology(text, text_label)

    # Otherwise, parse as pipe-delimited row tables (format A/C)
    #
    # Restrict to Section 3A (Canonical Node List) to avoid picking up
    # edge tables from Section 3B or other non-ontology tables.
    section_3a_text = text
    m_3a = re.search(r'(?m)^##\s+(?:Section\s+)?3A[.:\s]', text)
    if m_3a:
        start = m_3a.start()
        # Find the next ## section
        m_next = re.search(r'(?m)^##\s+(?:Section\s+)?3[B-Z]', text[start + 10:])
        end = start + 10 + m_next.start() if m_next else len(text)
        section_3a_text = text[start:end]
    else:
        # Also try "## Canonical Concepts" or "## 4A:" for corpus ontology
        m_alt = re.search(r'(?m)^##\s+(?:Canonical|4A)', text)
        if m_alt:
            start = m_alt.start()
            m_next = re.search(r'(?m)^##\s+(?:4[B-Z]|[^#])', text[start + 10:])
            end = start + 10 + m_next.start() if m_next else len(text)
            section_3a_text = text[start:end]

    in_table = False
    header_cols: list[str] = []
    current_centrality = "unknown"

    for line in section_3a_text.splitlines():
        stripped = line.strip()

        # Track centrality tier from section headers
        tier_match = re.match(r'###\s+(Core|Important|Peripheral)', stripped, re.I)
        if tier_match:
            current_centrality = tier_match.group(1).lower()

        # Detect table rows (start with |)
        if not stripped.startswith("|"):
            in_table = False
            header_cols = []
            continue

        cells = [c.strip() for c in stripped.strip("|").split("|")]

        if len(cells) < 5:
            continue

        # Skip separator rows (---|---| etc)
        if all(re.match(r'^[-:]+$', c.strip()) for c in cells):
            in_table = True
            continue

        # Detect header row
        first_lower = cells[0].strip().lower().replace("#", "").strip()
        if first_lower in ("", "concept", "targeted concept") or cells[0].strip() == "#":
            header_cols = [c.strip().lower() for c in cells]
            in_table = True
            continue

        if not in_table:
            # We haven't seen a separator yet -- this is the header row
            header_cols = [c.strip().lower() for c in cells]
            in_table = True
            continue

        # This is a data row
        try:
            node = _parse_table_row(cells, header_cols, text_label, current_centrality)
            if node:
                nodes.append(node)
        except Exception as e:
            warn(f"Skipping malformed table row in {text_label}: {e}")

    return nodes


def _parse_field_value_ontology(text: str, text_label: str) -> list[dict]:
    """
    Parse a Metaphysics/Physics-style ontology with Field/Value tables.

    Format:
        ### N.N Greek — English
        | Field | Value |
        |-------|-------|
        | **Greek** | ... |
        | **Transliteration** | ... |
        ...
    """
    nodes: list[dict] = []

    # Split on ### headers that contain concept numbers
    # Handles both "### 1.1 concept" (Metaphysics) and "### 1. concept" (Physics)
    sections = re.split(r'(?m)^###\s+(\d+(?:\.\d+)?)\b\.?\s+', text)

    for i in range(1, len(sections), 2):
        section_num = sections[i].strip()
        section_body = sections[i + 1] if i + 1 < len(sections) else ""

        try:
            node = _parse_field_value_section(section_body, text_label)
            if node:
                nodes.append(node)
        except Exception as e:
            warn(f"Skipping malformed field/value section {section_num} in {text_label}: {e}")

    return nodes


def _parse_field_value_section(section: str, text_label: str) -> dict | None:
    """Parse a single Field/Value concept section."""
    lines = section.strip().splitlines()
    if not lines:
        return None

    # First line is the concept title: "Greek — English" or just "concept"
    title = lines[0].strip()

    # Parse the Field/Value table
    fields: dict[str, str] = {}
    for line in lines:
        stripped = line.strip()
        if not stripped.startswith("|"):
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        if len(cells) >= 2:
            key = strip_bold(cells[0]).strip().lower()
            val = strip_bold(cells[1]).strip()
            if key and key not in ("field", "---", "") and not re.match(r'^[-:]+$', key):
                fields[key] = val

    if not fields:
        return None

    # Extract name from title (before the dash)
    name_match = re.match(r'(.+?)\s*[—–-]\s*(.+)', title)
    if name_match:
        greek_from_title = name_match.group(1).strip()
        english_from_title = name_match.group(2).strip()
    else:
        greek_from_title = title
        english_from_title = ""

    name = fields.get("canonical name", english_from_title or greek_from_title)
    greek = fields.get("greek", greek_from_title)
    # Handle compound Greek fields like "εἶδος (*eidos*) / μορφή (*morphē*)"
    greek = re.sub(r'\s*\([^)]*\)\s*', ' ', greek).strip()

    transliteration = fields.get("transliteration", "")
    # Clean up transliteration: "energeia / entelecheia" or "eidos / morphē"
    transliteration = re.sub(r'\s*\([^)]*\)\s*', ' ', transliteration).strip()

    translation = fields.get("barnes translation", fields.get("translation", ""))
    definition = fields.get("definition", "")
    units_raw = fields.get("units", "")
    centrality = fields.get("centrality", "")
    # Clean centrality: might be "**Core**" or "**Architectonic** -- the concept..."
    centrality = re.split(r'\s*[—–-]\s*', strip_bold(centrality))[0].strip().lower()
    # Normalize non-standard tiers
    if centrality in ("architectonic", "foundational"):
        centrality = "core"
    elif centrality in ("high", "moderate"):
        centrality = "important"

    return {
        "name": name,
        "greek": greek,
        "transliteration": transliteration,
        "translation": translation,
        "definition": definition,
        "type": centrality or "unknown",
        "units": parse_units(units_raw),
        "text": text_label,
        "aliases": [],
        "centralityTier": centrality,
    }


def _parse_table_row(
    cells: list[str],
    header_cols: list[str],
    text_label: str,
    default_centrality: str = "unknown",
) -> dict | None:
    """Parse a single table row into an ontologyNode dict.

    Uses header_cols for intelligent column lookup when available,
    falling back to positional parsing.  Handles the BCAP "Aliases"
    column and various column counts (7-10+).
    """
    n = len(cells)

    # Build a map from header keywords to cell values
    hmap: dict[str, str] = {}
    if header_cols and len(header_cols) == n:
        for h, v in zip(header_cols, cells):
            hmap[h] = v

    has_header = bool(hmap)

    def get(keys: list[str], pos: int | None = None) -> str:
        """Look up by header keywords first, then by position.

        When headers are present and matched, only use positional
        fallback if no header match was found AND headers are absent.
        """
        for k in keys:
            for hk, hv in hmap.items():
                if k in hk:
                    return hv.strip()
        if not has_header and pos is not None and 0 <= pos < n:
            return cells[pos].strip()
        return ""

    name_raw = get(["canonical name", "concept", "node"], 1)
    if not name_raw:
        return None

    name = strip_bold(name_raw)
    greek = strip_bold(get(["greek lemma", "greek"], 2))
    transliteration = get(["transliteration"], 3)
    translation = get(["translation", "barnes translation", "mr_translation"], 4)

    # Header-driven parsing: use hmap keys to locate each field
    has_header = bool(hmap)
    has_definition_col = has_header and any("definition" in h for h in hmap)
    has_aliases_col = has_header and any("aliases" in h.lower() for h in hmap)

    definition = ""
    units_raw = ""
    centrality = ""
    node_type = ""
    aliases_raw = ""

    if has_header:
        # Header-driven: look up each field by name
        node_type = get(["type"])
        definition = get(["definition"])
        units_raw = get(["units", "key units"])
        centrality = get(["centrality"])
        aliases_raw = get(["aliases"])
    elif n >= 10:
        # Positional: full core/important row (10 columns)
        node_type = cells[5].strip()
        definition = cells[6].strip()
        units_raw = cells[7].strip()
        centrality = cells[8].strip()
    elif n >= 8:
        # Positional: peripheral (8 cols, no definition) or alternate
        node_type = cells[5].strip()
        units_raw = cells[6].strip()
    elif n >= 7:
        # Shorter rows (BCAP important: 7 cols without aliases)
        node_type = cells[4].strip() if n > 4 else ""
        definition = cells[5].strip() if n > 5 else ""
        units_raw = cells[6].strip() if n > 6 else ""
    else:
        # Best-effort for very short rows
        node_type = cells[5].strip() if n > 5 else ""
        units_raw = cells[n - 2].strip() if n > 3 else ""

    # Clean up centrality
    centrality = strip_bold(centrality).lower()
    if centrality not in ("core", "important", "peripheral"):
        # Try to infer from the row's # prefix
        row_id = cells[0].strip() if cells else ""
        if row_id.startswith("C"):
            centrality = "core"
        elif row_id.startswith("I"):
            centrality = "important"
        elif row_id.startswith("P"):
            centrality = "peripheral"
        else:
            centrality = default_centrality

    # Parse aliases
    aliases = []
    if aliases_raw:
        aliases = [a.strip() for a in aliases_raw.split(",") if a.strip()]

    return {
        "name": name,
        "greek": greek,
        "transliteration": transliteration,
        "translation": translation,
        "definition": strip_bold(definition),
        "type": node_type or centrality,
        "units": parse_units(units_raw),
        "text": text_label,
        "aliases": aliases,
        "centralityTier": centrality,
    }


# ---------------------------------------------------------------------------
# HEADER format parser (BT, BCAP, Rickert, Uexkull ontologies)
# ---------------------------------------------------------------------------

def parse_header_ontology(text: str, text_label: str) -> list[dict]:
    """
    Parse a markdown header-based ontology (BT, BCAP, Rickert, Uexkull).

    Handles two sub-formats:
      A) #### N. Name (German/Greek) with bullet-point fields
      B) **N. Name** with dash-indented fields (Rickert style)

    Also handles the Uexkull table format in 3A.
    """
    nodes: list[dict] = []

    # First, try to parse any tables in the ontology section (Uexkull has
    # a table in 3A)
    table_nodes = _parse_header_tables(text, text_label)
    if table_nodes:
        nodes.extend(table_nodes)

    # Then parse header/bullet sections
    # Split on #### headers or bold-number patterns
    sections = re.split(
        r'(?m)^(?:####\s+\d+\.\s+|(?:\*\*\d+\.\s+))',
        text
    )

    for i, section in enumerate(sections):
        if i == 0:
            continue  # preamble before first node

        try:
            node = _parse_header_section(section, text_label)
            if node:
                # Avoid duplicates from table parsing
                if not any(n["name"] == node["name"] for n in nodes):
                    nodes.append(node)
        except Exception as e:
            warn(f"Skipping malformed header section in {text_label}: {e}")

    return nodes


def _parse_header_tables(text: str, text_label: str) -> list[dict]:
    """Parse any pipe-delimited tables found in header-format ontology files."""
    nodes = []
    # Only parse the 3A section
    m = re.search(r'(?m)^##\s+3A[.:]', text)
    if not m:
        return nodes

    section_start = m.start()
    # Find next ## section
    m2 = re.search(r'(?m)^##\s+[^#]', text[section_start + 10:])
    section_end = section_start + 10 + m2.start() if m2 else len(text)
    section_text = text[section_start:section_end]

    # Check if there are pipe-delimited tables
    if "|" not in section_text:
        return nodes

    # Parse tables within this section
    in_table = False
    header_cols: list[str] = []
    current_centrality = "unknown"

    for line in section_text.splitlines():
        stripped = line.strip()

        # Track centrality tier from section headers
        tier_match = re.match(r'###\s+(Core|Important|Peripheral)', stripped, re.I)
        if tier_match:
            current_centrality = tier_match.group(1).lower()
            in_table = False
            header_cols = []
            continue

        if not stripped.startswith("|"):
            if in_table:
                in_table = False
                header_cols = []
            continue

        cells = [c.strip() for c in stripped.strip("|").split("|")]

        if len(cells) < 4:
            continue

        # Separator row
        if all(re.match(r'^[-:]+$', c.strip()) for c in cells):
            in_table = True
            continue

        # Header detection
        first_lower = cells[0].strip().lower().replace("#", "").strip()
        if first_lower in ("", "#") or "node" in cells[0].lower():
            header_cols = [c.strip().lower() for c in cells]
            in_table = True
            continue

        if not in_table:
            header_cols = [c.strip().lower() for c in cells]
            in_table = True
            continue

        # Data row
        try:
            node = _parse_uexkull_table_row(cells, header_cols, text_label, current_centrality)
            if node:
                nodes.append(node)
        except Exception as e:
            warn(f"Skipping malformed Uexkull table row: {e}")

    return nodes


def _parse_uexkull_table_row(
    cells: list[str],
    header_cols: list[str],
    text_label: str,
    default_centrality: str,
) -> dict | None:
    """Parse a row from Uexkull-style table (different column order)."""
    n = len(cells)
    hmap = {}
    if header_cols and len(header_cols) == n:
        for h, v in zip(header_cols, cells):
            hmap[h] = v.strip()

    def get(keys: list[str], pos: int | None = None) -> str:
        for k in keys:
            for hk, hv in hmap.items():
                if k in hk:
                    return hv
        if pos is not None and 0 <= pos < n:
            return cells[pos].strip()
        return ""

    name = strip_bold(get(["node", "concept", "canonical"], 1))
    if not name:
        return None

    german_or_greek = strip_bold(get(["german", "greek"], 2))
    category = get(["category", "type"], 3)
    centrality = get(["centrality"], 4) or default_centrality
    definition = get(["definition"], 5)

    # Units field might be "First Unit" or "Key Units"
    first_unit = get(["first unit"], 6)
    key_units = get(["key units", "units"], 7)
    units_str = key_units or first_unit

    return {
        "name": name,
        "greek": german_or_greek,
        "transliteration": "",
        "translation": "",
        "definition": strip_bold(definition),
        "type": category or centrality.lower(),
        "units": parse_units(units_str),
        "text": text_label,
        "aliases": [],
        "centralityTier": strip_bold(centrality).lower() if centrality else default_centrality,
    }


def _parse_header_section(section: str, text_label: str) -> dict | None:
    """Parse a single #### N. Name ... section into a node dict."""
    lines = section.strip().splitlines()
    if not lines:
        return None

    # First line contains the name (and possibly parenthetical German/Greek)
    title_line = lines[0].strip().rstrip("*")
    # Remove trailing ** if the section was split on a bold pattern
    title_line = title_line.rstrip("*").strip()

    # Extract name and parenthetical
    name_match = re.match(r'^(.+?)(?:\s*\((.+?)\))?\s*$', title_line)
    if not name_match:
        return None

    name = strip_bold(name_match.group(1).strip())
    parenthetical = name_match.group(2) or ""

    # Parse bullet fields
    fields: dict[str, str] = {}
    current_key = ""
    current_val = ""

    for line in lines[1:]:
        stripped = line.strip()
        # Match "- **key**: value" or "- **key:** value"
        m = re.match(r'^-\s+\*\*(.+?)\*\*:?\s*(.*)', stripped)
        if m:
            if current_key:
                fields[current_key] = current_val.strip()
            current_key = m.group(1).strip().lower().rstrip(":")
            current_val = m.group(2).strip()
        elif stripped.startswith("-") and ":" in stripped[:40]:
            # Plain dash field without bold: "- Type: concept"
            if current_key:
                fields[current_key] = current_val.strip()
            parts = stripped.lstrip("- ").split(":", 1)
            if len(parts) == 2:
                current_key = parts[0].strip().lower()
                current_val = parts[1].strip()
        elif current_key and stripped:
            current_val += " " + stripped
        elif stripped.startswith("###") or stripped.startswith("---"):
            break

    if current_key:
        fields[current_key] = current_val.strip()

    # If no bullet fields found, this is not a real node section
    if not fields:
        return None

    # Extract node properties from fields
    canonical_name = fields.get("canonical_name", name)
    german = fields.get("german_lemma", "")
    greek = fields.get("greek_lemma", german)
    # Use parenthetical as fallback for german/greek
    if not greek and parenthetical:
        greek = parenthetical
    transliteration = fields.get("transliteration", "")
    translation = fields.get("mr_translation", fields.get("translation", ""))
    definition = fields.get("definition", "")
    node_type = fields.get("type", "")
    units_raw = fields.get("units", fields.get("key units", ""))
    centrality = fields.get("centrality", "")
    aliases_raw = fields.get("aliases", "")
    chapters_raw = fields.get("chapters", "")

    # Parse aliases
    aliases = []
    if aliases_raw:
        aliases = [a.strip() for a in aliases_raw.split(",") if a.strip()]

    # Parse units/chapters
    units = parse_units(units_raw)
    if not units and chapters_raw:
        units = parse_units(chapters_raw)

    return {
        "name": strip_bold(canonical_name),
        "greek": strip_bold(greek),
        "transliteration": transliteration,
        "translation": translation,
        "definition": strip_bold(definition),
        "type": node_type or centrality,
        "units": units,
        "text": text_label,
        "aliases": aliases,
        "centralityTier": centrality.lower() if centrality else "unknown",
    }


# ---------------------------------------------------------------------------
# Cross-pipeline hooks parser
# ---------------------------------------------------------------------------

def parse_cross_pipeline_hooks(text: str, source_text: str, file_stem: str) -> list[dict]:
    """
    Parse cross-pipeline hooks markdown files.

    Two formats exist:
      A) DA-style: "## Hook N: source (X) -> target (Y)"
      B) Met/Phys/other: "## N. title" or "## N. concept -> target"
         with subsections "### N.M subtitle"
    """
    hooks: list[dict] = []

    # Determine the source work from file name
    work_prefix = file_stem.replace("-cross-pipeline-hooks", "")

    # Strategy: split on ## headers and process each top-level section.
    # For DA-style, each ## is a hook.
    # For Met/Phys-style, each ## is a target pipeline, and ### are hooks.

    sections = re.split(r'(?m)^##\s+', text)
    hook_counter = 0

    for section in sections[1:]:  # skip preamble
        section_text = section.strip()
        first_line = section_text.split("\n", 1)[0].strip()

        # DA-style: "Hook N: source (X) -> target (Y)"
        hook_match = re.match(
            r'Hook\s+(\d+):\s*(.+)',
            first_line, re.I
        )
        if hook_match:
            hook_counter += 1
            hook = _parse_da_style_hook(
                section_text, source_text, work_prefix, hook_counter
            )
            if hook:
                hooks.append(hook)
            continue

        # Met/Phys style: numbered section is a target pipeline
        # Parse subsections as individual hooks
        num_match = re.match(r'(\d+)\.\s*(.+)', first_line)
        if num_match:
            pipeline_title = num_match.group(2).strip()
            subsections = re.split(r'(?m)^###\s+', section_text)
            for sub in subsections[1:]:
                hook_counter += 1
                hook = _parse_met_style_hook(
                    sub, source_text, work_prefix, pipeline_title, hook_counter
                )
                if hook:
                    hooks.append(hook)
            # If no subsections, treat the whole section as one hook
            if len(subsections) <= 1 and len(section_text) > 100:
                hook_counter += 1
                hook = _parse_flat_section_hook(
                    section_text, source_text, work_prefix, hook_counter
                )
                if hook:
                    hooks.append(hook)
            continue

        # Flat sections without numbering (e.g., "concept -> target [TAG]")
        if len(section_text) > 80:
            hook_counter += 1
            hook = _parse_flat_section_hook(
                section_text, source_text, work_prefix, hook_counter
            )
            if hook:
                hooks.append(hook)

    return hooks


def _parse_da_style_hook(
    section: str,
    source_text: str,
    work_prefix: str,
    num: int,
) -> dict | None:
    """Parse a DA-style hook with 'Hook N: source -> target' header."""
    lines = section.strip().splitlines()
    title_line = lines[0].strip()

    # Extract title after "Hook N:"
    m = re.match(r'Hook\s+\d+:\s*(.+)', title_line, re.I)
    title = m.group(1).strip() if m else title_line

    # Parse source and target concepts from title
    # Patterns: "concept (WORK) -> concept (WORK)" or "concept -> concept"
    source_concept = ""
    target_concept = ""
    target_text = ""

    arrow_m = re.match(r'(.+?)\s*(?:→|->|-->)\s*(.+)', title)
    if arrow_m:
        src_part = arrow_m.group(1).strip()
        tgt_part = arrow_m.group(2).strip()

        # Extract concept and work abbreviation
        src_m = re.match(r'(.+?)\s*\(([^)]+)\)\s*$', src_part)
        if src_m:
            source_concept = src_m.group(1).strip()
        else:
            source_concept = src_part

        tgt_m = re.match(r'(.+?)\s*\(([^)]+)\)\s*$', tgt_part)
        if tgt_m:
            target_concept = tgt_m.group(1).strip()
            target_text = tgt_m.group(2).strip()
        else:
            target_concept = tgt_part

    # Extract bridge structure and dissertation relevance
    full_text = "\n".join(lines[1:])
    bridge = _extract_section_content(full_text, "bridge structure")
    relevance = _extract_section_content(full_text, "dissertation relevance")

    # Extract tag
    tag = "INTERP-high"  # default
    tag_m = re.search(r'\[(INTERP-\w+)\]', full_text)
    if tag_m:
        tag = tag_m.group(1)

    return {
        "id": f"hook-{work_prefix}-{num:02d}",
        "sourceText": source_text,
        "sourceConcept": source_concept,
        "targetText": target_text,
        "targetConcept": target_concept,
        "title": title,
        "bridge": first_sentence(bridge) if bridge else "",
        "relevance": first_sentence(relevance) if relevance else "",
        "tag": tag,
    }


def _parse_met_style_hook(
    section: str,
    source_text: str,
    work_prefix: str,
    pipeline_title: str,
    num: int,
) -> dict | None:
    """Parse a Met/Phys-style subsection hook."""
    lines = section.strip().splitlines()
    title_line = lines[0].strip()

    # Title format: "N.M concept_name [TAG]"
    m = re.match(r'[\d.]+\s*(.+)', title_line)
    title = m.group(1).strip() if m else title_line

    # Clean tag from title
    tag = "INTERP-high"
    tag_m = re.search(r'\[(INTERP-\w+)\]', title)
    if tag_m:
        tag = tag_m.group(1)
        title = title.replace(tag_m.group(0), "").strip()

    # Also check the body for a tag line
    full_text = "\n".join(lines[1:])
    body_tag_m = re.search(r'\[(INTERP-\w+)\]', full_text)
    if body_tag_m:
        tag = body_tag_m.group(1)

    # Extract target pipeline from the parent section title
    target_text = _infer_target_text(pipeline_title)

    # Try to parse source/target concepts from the title
    source_concept = ""
    target_concept = ""

    arrow_m = re.match(r'(.+?)\s*(?:→|->|-->)\s*(.+)', title)
    if arrow_m:
        source_concept = arrow_m.group(1).strip()
        target_concept = arrow_m.group(2).strip()
    else:
        # The title itself is the concept
        source_concept = title

    # Extract content
    bridge = _extract_section_content(full_text, "bridge structure")
    relevance = _extract_section_content(full_text, "dissertation relevance")

    # For Met-style hooks without explicit bridge/relevance sections,
    # use the body text
    if not bridge:
        bridge = _extract_first_paragraph(full_text)

    return {
        "id": f"hook-{work_prefix}-{num:02d}",
        "sourceText": source_text,
        "sourceConcept": source_concept,
        "targetText": target_text,
        "targetConcept": target_concept,
        "title": title,
        "bridge": first_sentence(bridge) if bridge else "",
        "relevance": first_sentence(relevance) if relevance else "",
        "tag": tag,
    }


def _parse_flat_section_hook(
    section: str,
    source_text: str,
    work_prefix: str,
    num: int,
) -> dict | None:
    """Parse a flat section as a single hook."""
    lines = section.strip().splitlines()
    title_line = lines[0].strip()

    # Strip numbering
    m = re.match(r'[\d.]+\s*(.+)', title_line)
    title = m.group(1).strip() if m else title_line

    tag = "INTERP-high"
    tag_m = re.search(r'\[(INTERP-\w+)\]', section)
    if tag_m:
        tag = tag_m.group(1)

    full_text = "\n".join(lines[1:])

    # Try to infer target
    target_text = _infer_target_text(title)

    # Parse arrow in title
    source_concept = ""
    target_concept = ""
    arrow_m = re.match(r'(.+?)\s*(?:→|->|-->)\s*(.+)', title)
    if arrow_m:
        source_concept = arrow_m.group(1).strip()
        target_concept = arrow_m.group(2).strip()
    else:
        source_concept = title

    bridge = _extract_section_content(full_text, "bridge structure")
    relevance = _extract_section_content(full_text, "dissertation relevance")
    if not bridge:
        bridge = _extract_first_paragraph(full_text)

    return {
        "id": f"hook-{work_prefix}-{num:02d}",
        "sourceText": source_text,
        "sourceConcept": source_concept,
        "targetText": target_text,
        "targetConcept": target_concept,
        "title": title,
        "bridge": first_sentence(bridge) if bridge else "",
        "relevance": first_sentence(relevance) if relevance else "",
        "tag": tag,
    }


def _extract_section_content(text: str, section_name: str) -> str:
    """Extract content after a **Section Name**: marker."""
    pattern = re.compile(
        r'\*\*' + re.escape(section_name) + r'\*\*:?\s*(.+?)(?=\n\*\*|\n---|\n##|\Z)',
        re.I | re.DOTALL,
    )
    m = pattern.search(text)
    if m:
        return m.group(1).strip()
    return ""


def _extract_first_paragraph(text: str) -> str:
    """Extract the first non-empty paragraph from text."""
    paragraphs = re.split(r'\n\s*\n', text.strip())
    for p in paragraphs:
        p = p.strip()
        if p and not p.startswith("|") and not p.startswith("---") and not p.startswith("#"):
            return p
    return ""


def _infer_target_text(title: str) -> str:
    """Infer the target text/pipeline from a section title."""
    lower = title.lower()
    if "bcap" in lower or "ga 18" in lower or "basic concepts" in lower:
        return "BCAP"
    if "b&t" in lower or "being and time" in lower or "bt" in lower.split():
        return "BT"
    if "uexk" in lower or "foray" in lower or "streifzuge" in lower:
        return "Uexkull"
    if "rickert" in lower or "ambient" in lower:
        return "Rickert"
    if "sense and sensibilia" in lower or "de sensu" in lower:
        return "Sense and Sensibilia"
    if "de anima" in lower:
        return "De Anima"
    if "rhetoric" in lower:
        return "Rhetoric"
    if "physics" in lower:
        return "Physics"
    if "metaphysics" in lower:
        return "Metaphysics"
    return ""


# ---------------------------------------------------------------------------
# Tension edges parser
# ---------------------------------------------------------------------------

def parse_tension_edges(path: Path, text_label: str) -> list[dict]:
    """
    Parse a tension-edges.json file.

    Handles two formats:
      A) BT/BCAP/Rickert/Uexkull: objects with {node_a, node_b,
         dependency_edge: {relation, ...}, conflict_edge: {relation, ...}}
      B) Aristotle: objects with {id, node_a, node_b,
         dependency_edge: "string", conflict_edge: "string", works, units}
      C) Uexkull alternate: {tension, nodeA, nodeB, type, units, description}
    """
    edges: list[dict] = []
    try:
        raw = json.loads(read_text(path))
    except (json.JSONDecodeError, FileNotFoundError) as e:
        warn(f"Failed to parse {path}: {e}")
        return edges

    if not isinstance(raw, list):
        warn(f"Unexpected format in {path}: expected array")
        return edges

    for i, entry in enumerate(raw):
        try:
            edge = _normalize_tension_edge(entry, text_label, i)
            if edge:
                edges.append(edge)
        except Exception as e:
            warn(f"Skipping malformed tension edge #{i} in {path}: {e}")

    return edges


def _normalize_tension_edge(entry: dict, text_label: str, idx: int) -> dict | None:
    """Normalize a tension edge entry into the common output schema."""
    if not isinstance(entry, dict):
        return None

    # Determine format by inspecting keys
    edge_id = entry.get("id", f"T{idx + 1}")
    node_a = entry.get("node_a", entry.get("nodeA", ""))
    node_b = entry.get("node_b", entry.get("nodeB", ""))

    if not node_a or not node_b:
        return None

    dep_edge = entry.get("dependency_edge", "")
    conf_edge = entry.get("conflict_edge", "")

    # Extract relations
    dep_relation = ""
    conf_relation = ""

    if isinstance(dep_edge, dict):
        dep_relation = dep_edge.get("relation", "")
    elif isinstance(dep_edge, str):
        dep_relation = dep_edge

    if isinstance(conf_edge, dict):
        conf_relation = conf_edge.get("relation", "")
    elif isinstance(conf_edge, str):
        conf_relation = conf_edge

    # Uexkull alternate format
    if "type" in entry and "tension" in entry:
        conf_relation = entry.get("type", "")
        if not dep_relation:
            dep_relation = conf_relation

    description = (
        entry.get("tension_description", "")
        or entry.get("description", "")
        or entry.get("synthesis", "")
        or entry.get("productive_character", "")
    )

    units = entry.get("units", [])
    if isinstance(units, str):
        units = parse_units(units)

    return {
        "id": str(edge_id),
        "text": text_label,
        "nodeA": node_a,
        "nodeB": node_b,
        "dependencyRelation": dep_relation,
        "conflictRelation": conf_relation,
        "description": description,
        "units": units,
    }


# ---------------------------------------------------------------------------
# Main collection logic
# ---------------------------------------------------------------------------

def collect_ontology_nodes() -> list[dict]:
    """Collect all ontology nodes from all texts."""
    nodes: list[dict] = []

    for dir_name, cfg in TEXT_DIRS.items():
        base = CORPUS_INDEX / dir_name
        if not base.is_dir():
            warn(f"Directory not found: {base}")
            continue

        analysis_dir = base / cfg["analysis_subdir"] if cfg["analysis_subdir"] else base
        if not analysis_dir.is_dir():
            warn(f"Analysis directory not found: {analysis_dir}")
            continue

        if cfg["ontology_format"] == "table":
            if cfg["analysis_subdir"]:
                # Non-Aristotle table format (e.g., BCAP) -- single file
                onto_file = analysis_dir / "book-level-ontology.md"
                if onto_file.is_file():
                    text = read_text(onto_file)
                    file_nodes = parse_table_ontology(text, cfg["label"])
                    nodes.extend(file_nodes)
                else:
                    warn(f"Ontology file not found: {onto_file}")
            else:
                # Aristotle: multiple per-work ontology files + corpus ontology
                for onto_file in sorted(analysis_dir.glob("*-ontology.md")):
                    work_key = onto_file.stem.replace("-ontology", "")
                    text_label = ARISTOTLE_WORK_MAP.get(
                        work_key, f"Aristotle - {work_key}"
                    )
                    text = read_text(onto_file)
                    file_nodes = parse_table_ontology(text, text_label)
                    nodes.extend(file_nodes)

        elif cfg["ontology_format"] == "header":
            # Single book-level ontology with header/bullet format
            onto_file = analysis_dir / "book-level-ontology.md"
            if onto_file.is_file():
                text = read_text(onto_file)
                file_nodes = parse_header_ontology(text, cfg["label"])
                nodes.extend(file_nodes)
            else:
                warn(f"Ontology file not found: {onto_file}")

    return nodes


def collect_cross_pipeline_hooks() -> list[dict]:
    """Collect all cross-pipeline hook entries."""
    hooks: list[dict] = []

    # Only Aristotle has cross-pipeline hook files
    aristotle_dir = CORPUS_INDEX / "Aristotle - Complete Works"
    if not aristotle_dir.is_dir():
        warn("Aristotle directory not found")
        return hooks

    for hook_file in sorted(aristotle_dir.glob("*-cross-pipeline-hooks.md")):
        work_key = hook_file.stem.replace("-cross-pipeline-hooks", "")
        source_text = ARISTOTLE_WORK_MAP.get(work_key, f"Aristotle - {work_key}")
        text = read_text(hook_file)
        file_hooks = parse_cross_pipeline_hooks(text, source_text, hook_file.stem)
        hooks.extend(file_hooks)

    return hooks


def collect_tension_edges() -> list[dict]:
    """Collect all tension edge entries."""
    edges: list[dict] = []

    for dir_name, cfg in TEXT_DIRS.items():
        base = CORPUS_INDEX / dir_name
        if not base.is_dir():
            continue

        analysis_dir = base / cfg["analysis_subdir"] if cfg["analysis_subdir"] else base
        if not analysis_dir.is_dir():
            continue

        tension_file = analysis_dir / "tension-edges.json"
        if tension_file.is_file():
            text_label = cfg["label"]
            file_edges = parse_tension_edges(tension_file, text_label)
            edges.extend(file_edges)

    return edges


def build_canonical_terms(nodes: list[dict]) -> list[str]:
    """
    Build a deduplicated flat list of all terms from ontology nodes.

    Includes: name, transliteration, greek, and all aliases.
    Sorted by length descending for greedy matching.
    """
    terms: set[str] = set()

    for node in nodes:
        for field in ("name", "transliteration", "greek"):
            val = node.get(field, "")
            if val:
                cleaned = strip_bold(val).strip()
                if cleaned and len(cleaned) > 1:
                    terms.add(cleaned)

        for alias in node.get("aliases", []):
            cleaned = strip_bold(alias).strip()
            if cleaned and len(cleaned) > 1:
                terms.add(cleaned)

        # Also include translation if non-trivial
        translation = node.get("translation", "")
        if translation and len(translation) > 2:
            terms.add(strip_bold(translation).strip())

    # Sort by length descending (greedy matching), then alphabetically
    return sorted(terms, key=lambda t: (-len(t), t.lower()))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def deduplicate_ontology_nodes(nodes: list[dict]) -> list[dict]:
    """
    H-04: Merge duplicate ontology nodes by canonical name.
    When the same concept (e.g. "Substance") appears in multiple texts,
    merge into a single node keeping the richest definition and combining text sources.
    M-05: Filter out nodes with no definition (unless they have Greek or transliteration).
    """
    by_name: dict[str, dict] = {}
    for node in nodes:
        key = node["name"].lower()
        if key in by_name:
            existing = by_name[key]
            # Keep the longer definition
            new_def = node.get("definition", "")
            old_def = existing.get("definition", "")
            if len(new_def or "") > len(old_def or ""):
                existing["definition"] = new_def
            # Combine text sources
            existing_text = existing.get("text", "")
            new_text = node.get("text", "")
            if new_text and new_text != existing_text:
                existing["text"] = f"{existing_text}; {new_text}"
            # Merge aliases
            old_aliases = set(existing.get("aliases", []))
            new_aliases = set(node.get("aliases", []))
            if new_aliases - old_aliases:
                existing["aliases"] = sorted(old_aliases | new_aliases)
            # Merge units
            old_units = set(existing.get("units", []))
            new_units = set(node.get("units", []))
            if new_units - old_units:
                existing["units"] = sorted(old_units | new_units)
            # Keep Greek/transliteration if missing
            for field in ("greek", "transliteration", "translation"):
                if not existing.get(field) and node.get(field):
                    existing[field] = node[field]
        else:
            by_name[key] = dict(node)  # copy

    merged = list(by_name.values())

    # M-05: Flag nodes without definitions (but keep if they have Greek/transliteration)
    no_def = [n for n in merged if not n.get("definition")]
    if no_def:
        has_greek = sum(1 for n in no_def if n.get("greek") or n.get("transliteration"))
        print(f"  WARNING: {len(no_def)} nodes have no definition ({has_greek} have Greek/transliteration)")

    return merged


def main() -> None:
    print(f"Compiling corpus index from: {CORPUS_INDEX}")
    print(f"Output: {OUTPUT}")
    print()

    # Collect all data
    raw_nodes = collect_ontology_nodes()
    nodes = deduplicate_ontology_nodes(raw_nodes)
    hooks = collect_cross_pipeline_hooks()
    edges = collect_tension_edges()
    terms = build_canonical_terms(nodes)

    # Build output
    result = {
        "builtAt": datetime.now(timezone.utc).isoformat(),
        "ontologyNodes": nodes,
        "crossPipelineHooks": hooks,
        "tensionEdges": edges,
        "canonicalTerms": terms,
    }

    # Write output
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    # Print summary
    print("=== Compilation Summary ===")
    print(f"  Ontology nodes:        {len(nodes)} (from {len(raw_nodes)} raw, {len(raw_nodes) - len(nodes)} duplicates merged)")
    print(f"  Cross-pipeline hooks:  {len(hooks)}")
    print(f"  Tension edges:         {len(edges)}")
    print(f"  Canonical terms:       {len(terms)}")
    print()

    # Breakdown by text
    text_counts: dict[str, int] = {}
    for n in nodes:
        t = n.get("text", "unknown")
        text_counts[t] = text_counts.get(t, 0) + 1
    print("  Nodes by text:")
    for t in sorted(text_counts.keys()):
        print(f"    {t}: {text_counts[t]}")

    print()
    print(f"  Output written to: {OUTPUT}")
    print(f"  Output size: {OUTPUT.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
