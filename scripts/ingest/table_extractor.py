"""
Table Extractor — Extract tables from PDF documents and convert to
CSV, Markdown, and JSON representations for embedding and retrieval.

Provides the TableExtractor, TableExtractionResult, and Table classes
expected by run_ingest_phase2.py (Phase 2).

Extraction strategy:
  1. Primary: camelot-py with lattice flavor (best for ruled tables)
  2. Fallback: camelot-py with stream flavor (for borderless tables)
  3. Fallback: PyMuPDF page.find_tables() (if camelot unavailable)

Dependencies: camelot-py[cv], pymupdf (fitz), pandas
"""

from __future__ import annotations

import csv
import io
import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Probe for camelot availability
try:
    import camelot
    CAMELOT_AVAILABLE = True
except ImportError:
    CAMELOT_AVAILABLE = False
    logger.info("camelot-py not installed — will use PyMuPDF table extraction")

try:
    import fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    logger.warning("PyMuPDF (fitz) not installed — table extraction will be limited")


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class Table:
    """A single extracted table."""
    page_num: int           # 1-indexed page number
    csv_content: str        # CSV string representation
    markdown: str           # Markdown pipe-table representation
    json_content: str       # JSON array-of-dicts representation
    rows: int
    cols: int


@dataclass
class TableExtractionResult:
    """Result of table extraction for an entire document."""
    total_tables: int = 0
    pages_with_tables: List[int] = field(default_factory=list)
    tables: List[Table] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Conversion helpers
# ---------------------------------------------------------------------------

def _dataframe_to_csv(df) -> str:
    """Convert a pandas DataFrame to a CSV string."""
    buf = io.StringIO()
    df.to_csv(buf, index=False, quoting=csv.QUOTE_MINIMAL)
    return buf.getvalue()


def _dataframe_to_markdown(df) -> str:
    """Convert a pandas DataFrame to a pipe-separated Markdown table."""
    cols = list(df.columns)
    lines: List[str] = []

    # Header row
    header = "| " + " | ".join(str(c) for c in cols) + " |"
    lines.append(header)

    # Separator row
    sep = "| " + " | ".join("---" for _ in cols) + " |"
    lines.append(sep)

    # Data rows
    for _, row in df.iterrows():
        cells = "| " + " | ".join(str(v).replace("|", "\\|") for v in row) + " |"
        lines.append(cells)

    return "\n".join(lines)


def _dataframe_to_json(df) -> str:
    """Convert a pandas DataFrame to a JSON string (list of row dicts)."""
    records = df.to_dict(orient="records")
    return json.dumps(records, ensure_ascii=False, indent=2)


def _rows_cols_to_table(rows_data: List[List[str]], page_num: int) -> Optional[Table]:
    """Build a Table object from raw row data (list of lists of strings)."""
    if not rows_data or len(rows_data) < 1:
        return None

    num_rows = len(rows_data)
    num_cols = max(len(r) for r in rows_data) if rows_data else 0

    if num_rows == 0 or num_cols == 0:
        return None

    # Normalize: ensure every row has the same number of columns
    normalized = []
    for row in rows_data:
        padded = list(row) + [""] * (num_cols - len(row))
        normalized.append(padded[:num_cols])

    # Use first row as header
    header = normalized[0]
    body = normalized[1:] if len(normalized) > 1 else []

    # Build CSV
    csv_buf = io.StringIO()
    writer = csv.writer(csv_buf, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(header)
    for row in body:
        writer.writerow(row)
    csv_content = csv_buf.getvalue()

    # Build Markdown
    md_lines: List[str] = []
    md_lines.append("| " + " | ".join(str(c).replace("|", "\\|") for c in header) + " |")
    md_lines.append("| " + " | ".join("---" for _ in header) + " |")
    for row in body:
        md_lines.append("| " + " | ".join(str(c).replace("|", "\\|") for c in row) + " |")
    markdown = "\n".join(md_lines)

    # Build JSON (list of dicts keyed by header)
    records = []
    for row in body:
        records.append({header[i]: row[i] for i in range(num_cols)})
    json_content = json.dumps(records, ensure_ascii=False, indent=2)

    return Table(
        page_num=page_num,
        csv_content=csv_content,
        markdown=markdown,
        json_content=json_content,
        rows=num_rows,
        cols=num_cols,
    )


# ---------------------------------------------------------------------------
# TableExtractor
# ---------------------------------------------------------------------------

def _is_real_table(table: Table) -> bool:
    """Reject false-positive tables that are really prose, title pages, or TOC entries.

    A real table has structured, short-cell data — not prose paragraphs
    misdetected by camelot's stream mode.
    """
    if table.rows < 3 or table.cols < 2:
        return False

    # Parse CSV to check cell content
    try:
        rows = list(csv.reader(io.StringIO(table.csv_content)))
    except Exception:
        return False

    if len(rows) < 3:
        return False

    data_rows = rows[1:]  # skip header
    if not data_rows:
        return False

    # Count columns that actually have content in ≥40% of rows
    col_content_counts = []
    for col_idx in range(min(table.cols, len(rows[0]))):
        non_empty = sum(1 for row in data_rows
                        if col_idx < len(row) and row[col_idx].strip())
        col_content_counts.append(non_empty)

    meaningful_cols = sum(1 for c in col_content_counts if c >= len(data_rows) * 0.4)
    if meaningful_cols < 2:
        return False

    # Reject tables with many declared columns but few meaningful ones
    # (camelot stream creates phantom columns from whitespace)
    if table.cols > 3 and meaningful_cols <= 2:
        return False

    # Reject minimal tables (exactly 3 rows) unless they have strong structure
    # 3 rows = header + 2 data rows — very weak signal, usually prose fragments
    if table.rows <= 4 and meaningful_cols <= 3:
        # Check if first column is mostly empty (phantom margin column)
        if col_content_counts and col_content_counts[0] < len(data_rows) * 0.3:
            return False

    all_cells = [cell.strip() for row in data_rows for cell in row if cell.strip()]
    if not all_cells:
        return False

    # Reject if header row is entirely empty — not a real table
    header = rows[0]
    if all(not c.strip() for c in header):
        return False

    avg_cell_len = sum(len(c) for c in all_cells) / len(all_cells)

    # Reject prose masquerading as tables:
    # Real table cells are short (names, numbers, labels). Avg >40 chars = prose.
    if avg_cell_len > 40:
        return False

    # Reject high row count with only 2 columns — almost always prose layout
    # Real 2-column tables rarely exceed ~20 rows
    if meaningful_cols == 2 and table.rows > 20:
        return False

    # Reject if many cells are long prose fragments (>80 chars)
    long_cells = sum(1 for c in all_cells if len(c) > 80)
    if long_cells > len(all_cells) * 0.15:
        return False

    # Reject title pages, copyright, TOC
    all_text = table.csv_content.lower()
    title_markers = ["complete works", "revised oxford", "copyright", "isbn",
                     "published by", "university press", "all rights reserved",
                     "table of contents", "editors' introduction",
                     "princeton university", "bollingen series"]
    marker_hits = sum(1 for m in title_markers if m in all_text)
    if marker_hits >= 1:
        return False

    return True


class TableExtractor:
    """Extract tables from PDF documents."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self._config = config or {}
        self._min_rows = self._config.get("min_rows", 3)
        self._min_cols = self._config.get("min_cols", 2)
        self._flavor = self._config.get("flavor", None)  # None = try lattice then stream

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def extract_tables(self, path_abs) -> TableExtractionResult:
        """
        Extract all tables from a PDF file.

        Args:
            path_abs: Path to the PDF file (str or Path).

        Returns:
            TableExtractionResult with all discovered tables.
        """
        path_abs = Path(path_abs)
        if not path_abs.exists():
            logger.error(f"PDF not found: {path_abs}")
            return TableExtractionResult()

        # Try camelot first, then fall back to PyMuPDF
        if CAMELOT_AVAILABLE:
            result = self._extract_with_camelot(path_abs)
            if result.total_tables > 0:
                return result
            logger.debug(f"Camelot found no tables in {path_abs.name}, trying PyMuPDF fallback")

        if PYMUPDF_AVAILABLE:
            return self._extract_with_pymupdf(path_abs)

        logger.warning("No table extraction backend available")
        return TableExtractionResult()

    def create_table_chunks(
        self,
        table: Table,
        context_before: Optional[str],
        context_after: Optional[str],
        doc_id: str,
        chunk_index: int,
    ) -> Dict[str, Any]:
        """
        Create an embeddable chunk representation of a table.

        Args:
            table: The Table object.
            context_before: Text immediately preceding the table (or None).
            context_after: Text immediately following the table (or None).
            doc_id: Document identifier.
            chunk_index: Index in the chunk sequence.

        Returns:
            Dict with "text" (str) and "metadata" (dict) keys.
        """
        parts: List[str] = [
            f"[TABLE] Page {table.page_num}, {table.rows} rows \u00d7 {table.cols} columns"
        ]

        if context_before:
            parts.append(context_before.strip())

        parts.append(table.markdown)

        if context_after:
            parts.append(context_after.strip())

        text = "\n".join(parts)

        metadata = {
            "type": "table",
            "page_num": table.page_num,
            "rows": table.rows,
            "cols": table.cols,
            "doc_id": doc_id,
            "chunk_index": chunk_index,
        }

        return {"text": text, "metadata": metadata}

    # ------------------------------------------------------------------
    # Camelot extraction
    # ------------------------------------------------------------------

    def _extract_with_camelot(self, path_abs: Path) -> TableExtractionResult:
        """Extract tables using camelot-py."""
        tables: List[Table] = []
        pages_with_tables: set = set()

        flavors = self._get_camelot_flavors()

        for flavor in flavors:
            try:
                camelot_tables = camelot.read_pdf(
                    str(path_abs),
                    pages="all",
                    flavor=flavor,
                )
            except Exception as e:
                logger.warning(f"Camelot {flavor} extraction failed for {path_abs.name}: {e}")
                continue

            if len(camelot_tables) == 0:
                continue

            for ct in camelot_tables:
                try:
                    df = ct.df
                    num_rows, num_cols = df.shape

                    # Apply minimum size filters
                    if num_rows < self._min_rows or num_cols < self._min_cols:
                        continue

                    # camelot page numbers are 1-indexed
                    page_num = ct.page

                    csv_content = _dataframe_to_csv(df)
                    markdown = _dataframe_to_markdown(df)
                    json_content = _dataframe_to_json(df)

                    table = Table(
                        page_num=page_num,
                        csv_content=csv_content,
                        markdown=markdown,
                        json_content=json_content,
                        rows=num_rows,
                        cols=num_cols,
                    )
                    if _is_real_table(table):
                        tables.append(table)
                        pages_with_tables.add(page_num)

                except Exception as e:
                    logger.warning(f"Failed to process camelot table: {e}")
                    continue

            # If lattice found tables, don't try stream
            if tables:
                break

        sorted_pages = sorted(pages_with_tables)
        return TableExtractionResult(
            total_tables=len(tables),
            pages_with_tables=sorted_pages,
            tables=tables,
        )

    def _get_camelot_flavors(self) -> List[str]:
        """Return the ordered list of camelot flavors to try."""
        if self._flavor:
            return [self._flavor]
        return ["lattice", "stream"]

    # ------------------------------------------------------------------
    # PyMuPDF fallback extraction
    # ------------------------------------------------------------------

    def _extract_with_pymupdf(self, path_abs: Path) -> TableExtractionResult:
        """Extract tables using PyMuPDF's find_tables() API."""
        tables: List[Table] = []
        pages_with_tables: set = set()

        try:
            doc = fitz.open(str(path_abs))
        except Exception as e:
            logger.error(f"Failed to open PDF with PyMuPDF: {e}")
            return TableExtractionResult()

        try:
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                page_num = page_idx + 1  # 1-indexed

                try:
                    # find_tables() available in PyMuPDF >= 1.23.0
                    tab_finder = page.find_tables()
                except AttributeError:
                    logger.debug("page.find_tables() not available in this PyMuPDF version")
                    break
                except Exception as e:
                    logger.warning(f"find_tables() failed on page {page_num}: {e}")
                    continue

                if not tab_finder or not tab_finder.tables:
                    continue

                for pymupdf_table in tab_finder.tables:
                    try:
                        # extract() returns list of lists of strings
                        rows_data = pymupdf_table.extract()
                        if not rows_data:
                            continue

                        num_rows = len(rows_data)
                        num_cols = max(len(r) for r in rows_data) if rows_data else 0

                        if num_rows < self._min_rows or num_cols < self._min_cols:
                            continue

                        # Replace None cells with empty strings
                        cleaned = []
                        for row in rows_data:
                            cleaned.append([str(cell) if cell is not None else "" for cell in row])

                        table = _rows_cols_to_table(cleaned, page_num)
                        if table is not None and _is_real_table(table):
                            tables.append(table)
                            pages_with_tables.add(page_num)

                    except Exception as e:
                        logger.warning(f"Failed to process PyMuPDF table on page {page_num}: {e}")
                        continue

        finally:
            doc.close()

        sorted_pages = sorted(pages_with_tables)
        return TableExtractionResult(
            total_tables=len(tables),
            pages_with_tables=sorted_pages,
            tables=tables,
        )
