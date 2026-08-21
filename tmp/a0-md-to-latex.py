#!/usr/bin/env python3
"""Convert A0 markdown output to LaTeX-friendly format for Overleaf upload.

Preserves:
- Italics (*text* -> \\textit{text})
- Bold (**text** -> \\textbf{text})
- Headings (## -> \\subsection*{}, # -> \\section*{})
- Greek characters (wrapped in \\gk{})
- Subscripted chain labels (A_0, A_1, etc.)
- Existing \\footnote{} blocks
- Markdown tables -> LaTeX tabular
- Em/en dashes
"""
import re
import sys
from pathlib import Path


INPUT = Path("/home/dalton/projects/claudeflow-testing/tmp/a2-god-write-output-raw-2026-04-23.md")
OUTPUT = Path("/home/dalton/projects/claudeflow-testing/tmp/a2-aisthesis-v1.tex")


# Greek Unicode ranges
GREEK_RANGES = [
    (0x0370, 0x03FF),  # Greek and Coptic
    (0x1F00, 0x1FFF),  # Greek Extended
]


def is_greek_char(ch: str) -> bool:
    cp = ord(ch)
    for lo, hi in GREEK_RANGES:
        if lo <= cp <= hi:
            return True
    return False


# Unicode subscript digits 0-9 and common letters
SUBSCRIPT_MAP = {
    "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
    "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
    "₍": "(", "₎": ")", "ₙ": "n", "ₐ": "a",
}


def convert_subscripted_labels(text: str) -> str:
    """Convert A₀, A₁, A₍ₙ₎, etc. into $A_0$, $A_1$, $A_{n}$.

    Matches a letter followed by one or more subscript characters.
    """
    # Pattern: any letter or closing paren followed by subscript chars
    pattern = re.compile(r"([A-Za-z])([₀-₉₍₎ₙₐ]+)")

    def replace(m):
        base = m.group(1)
        subs = m.group(2)
        converted = "".join(SUBSCRIPT_MAP.get(c, c) for c in subs)
        # Handle compound subscripts like A_(n) -> A_{(n)}
        if len(converted) > 1 or not converted[0].isdigit():
            return f"${base}_{{{converted}}}$"
        return f"${base}_{converted}$"

    return pattern.sub(replace, text)


def wrap_greek_runs(text: str) -> str:
    """Wrap runs of consecutive Greek characters in \\gk{}.

    Preserves spaces WITHIN a Greek run (e.g., multi-word Greek phrases).
    Also preserves apostrophes and combining marks within Greek runs.
    """
    result = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if is_greek_char(ch):
            # Start of Greek run — consume until non-Greek (but allow spaces between Greek words and standard punctuation/diacritics)
            start = i
            while i < n:
                c = text[i]
                if is_greek_char(c):
                    i += 1
                elif c == " " and i + 1 < n and is_greek_char(text[i + 1]):
                    # Space inside Greek run (next char also Greek)
                    i += 1
                elif c in "́̀͂̓̔̈ͅ":
                    # Combining Greek diacritics
                    i += 1
                else:
                    break
            greek = text[start:i]
            result.append(f"\\gk{{{greek}}}")
        else:
            result.append(ch)
            i += 1
    return "".join(result)


def convert_markdown_emphasis(text: str) -> str:
    """Convert **bold** and *italic* to \\textbf{} and \\textit{}.

    Must handle **text** before *text* to avoid collision.
    """
    # **bold**
    text = re.sub(r"\*\*([^*\n]+?)\*\*", r"\\textbf{\1}", text)
    # *italic*
    text = re.sub(r"\*([^*\n]+?)\*", r"\\textit{\1}", text)
    return text


def convert_dashes(text: str) -> str:
    """Unicode em/en dashes -> LaTeX."""
    text = text.replace("—", "---")
    text = text.replace("–", "--")
    return text


def convert_arrows_and_symbols(text: str) -> str:
    """Convert Unicode arrows and math symbols to LaTeX math-mode equivalents."""
    text = text.replace("→", r"$\to$")
    text = text.replace("←", r"$\leftarrow$")
    text = text.replace("↔", r"$\leftrightarrow$")
    text = text.replace("⇒", r"$\Rightarrow$")
    text = text.replace("⇐", r"$\Leftarrow$")
    text = text.replace("≈", r"$\approx$")
    text = text.replace("≠", r"$\neq$")
    text = text.replace("≤", r"$\leq$")
    text = text.replace("≥", r"$\geq$")
    text = text.replace("×", r"$\times$")
    text = text.replace("·", r"$\cdot$")
    return text


def convert_smart_quotes(text: str) -> str:
    """Smart quotes -> LaTeX ``...''."""
    # Opening/closing double quotes
    text = text.replace("“", "``")
    text = text.replace("”", "''")
    text = text.replace("‘", "`")
    text = text.replace("’", "'")
    return text


def escape_latex_specials(text: str, inside_math: bool = False) -> str:
    """Escape LaTeX special characters in plain text segments.

    We don't escape: \\ ^ ~ < > (these are handled only where needed)
    We escape: # $ % & _ {} when they are NOT already part of LaTeX markup.
    """
    # Escape # (chapter references etc.)
    # Careful: don't escape # inside table headers; we handle tables separately.
    # Since we process headings first (removing #), remaining # are content
    text = re.sub(r"(?<![\\])#(?=\w)", r"\\#", text)
    # Escape % (only when bare — not at column markers in tabular)
    text = re.sub(r"(?<![\\])%(?=[^%])", r"\\%", text)
    # & and _ are handled per-context (tables use & as column separator)
    return text


def convert_table_row(line: str) -> list[str]:
    """Parse a markdown table row '| c1 | c2 | c3 |' into cell list."""
    # Strip leading/trailing | and whitespace
    stripped = line.strip()
    if stripped.startswith("|"):
        stripped = stripped[1:]
    if stripped.endswith("|"):
        stripped = stripped[:-1]
    cells = [c.strip() for c in stripped.split("|")]
    return cells


def is_table_separator(line: str) -> bool:
    """Check if line is a markdown table separator like |---|---|---|."""
    stripped = line.strip()
    if not stripped.startswith("|"):
        return False
    # Pattern of -, |, :, spaces
    return bool(re.fullmatch(r"\|[\s\-:|]+\|?", stripped))


def convert_table(lines: list[str]) -> str:
    """Convert a markdown table block into LaTeX tabular."""
    if len(lines) < 2:
        return "\n".join(lines)
    header = convert_table_row(lines[0])
    # lines[1] is separator
    body_rows = [convert_table_row(l) for l in lines[2:]]
    ncols = len(header)
    # Build tabular spec
    col_spec = "|" + "|".join(["l"] * ncols) + "|"
    result = []
    result.append(r"\begin{center}")
    result.append(r"\footnotesize")
    result.append(r"\begin{tabular}{" + col_spec + "}")
    result.append(r"\hline")

    def cell_fmt(cell: str) -> str:
        # Preserve internal italics/bold already converted
        # But: convert & in cell to \&, and # to \# (both are LaTeX special chars)
        out = cell.replace("&", r"\&")
        out = re.sub(r"(?<!\\)#", r"\\#", out)
        return out

    header_cells = [f"\\textbf{{{cell_fmt(c)}}}" for c in header]
    result.append(" & ".join(header_cells) + r" \\")
    result.append(r"\hline")
    for row in body_rows:
        # Pad row to ncols if needed
        while len(row) < ncols:
            row.append("")
        result.append(" & ".join(cell_fmt(c) for c in row[:ncols]) + r" \\")
        result.append(r"\hline")
    result.append(r"\end{tabular}")
    result.append(r"\end{center}")
    return "\n".join(result)


def convert_content(text: str) -> str:
    """Main conversion pipeline."""
    lines = text.split("\n")
    out_lines: list[str] = []

    i = 0
    while i < len(lines):
        line = lines[i]

        # Skip horizontal rules "---" on their own
        if line.strip() == "---":
            i += 1
            continue

        # Detect table block
        if line.strip().startswith("|") and i + 1 < len(lines) and is_table_separator(lines[i + 1]):
            # Collect full table
            table_lines = [line]
            j = i + 1
            while j < len(lines) and lines[j].strip().startswith("|"):
                table_lines.append(lines[j])
                j += 1
            # Convert the table lines' content for italics/greek first
            converted_table_lines = []
            for tl in table_lines:
                c = tl
                c = convert_smart_quotes(c)
                c = convert_dashes(c)
                c = convert_arrows_and_symbols(c)
                c = convert_subscripted_labels(c)
                c = convert_markdown_emphasis(c)
                c = wrap_greek_runs(c)
                converted_table_lines.append(c)
            out_lines.append(convert_table(converted_table_lines))
            i = j
            continue

        # Headings
        if line.startswith("# ") and not line.startswith("## "):
            title = line[2:].strip()
            title = convert_subscripted_labels(title)
            title = convert_markdown_emphasis(title)
            title = wrap_greek_runs(title)
            title = convert_smart_quotes(title)
            out_lines.append(f"\\section*{{{title}}}")
            i += 1
            continue

        if line.startswith("## "):
            title = line[3:].strip()
            title = convert_subscripted_labels(title)
            title = convert_markdown_emphasis(title)
            title = wrap_greek_runs(title)
            title = convert_smart_quotes(title)
            out_lines.append(f"\\subsection*{{{title}}}")
            i += 1
            continue

        if line.startswith("### "):
            title = line[4:].strip()
            title = convert_subscripted_labels(title)
            title = convert_markdown_emphasis(title)
            title = wrap_greek_runs(title)
            title = convert_smart_quotes(title)
            out_lines.append(f"\\subsubsection*{{{title}}}")
            i += 1
            continue

        # Ordinary content line
        c = line
        c = convert_smart_quotes(c)
        c = convert_dashes(c)
        c = convert_arrows_and_symbols(c)
        c = convert_subscripted_labels(c)
        c = convert_markdown_emphasis(c)
        c = wrap_greek_runs(c)
        # Escape only # at start of inline word (not headings, those handled above)
        out_lines.append(c)
        i += 1

    # Handle the "# VALIDATION APPENDIX" stray heading that may have been left
    # inside a paragraph (in raw MD it lives attached at end of Section 8 content).
    result = "\n".join(out_lines)
    result = result.replace(
        "# VALIDATION APPENDIX",
        "\n\\section*{Validation Appendix}\n",
    )

    # Floating \footnote{...} that is on its own line needs an anchor so LaTeX
    # has something to attach it to. We convert these to \footnotetext{} inside
    # a \protect\footnotemark anchor sentence.
    result = re.sub(
        r"^(\\footnote\{)",
        r"\\noindent\\textit{(Deferral note)}\\footnote{",
        result,
        flags=re.MULTILINE,
    )

    return result


PREAMBLE = r"""% A0: Motion and Time as First Actuality — LaTeX export from god-write Run 3d
% Generated: 2026-04-23
% Source: tmp/a0-god-write-output-v3d-raw-2026-04-23.md
%
% Greek-text macro \gk{...} wraps inline Greek passages.
% If your preamble does not already define \gk{}, add one of:
%
%   \usepackage{fontspec}
%   \newcommand{\gk}[1]{{\fontspec{GFS Didot}#1}}
%
% or (pdfLaTeX with babel):
%
%   \usepackage[greek,english]{babel}
%   \newcommand{\gk}[1]{\foreignlanguage{greek}{#1}}
%
% This file is a SELF-CONTAINED BODY: drop the content between the
% \begin{document}...\end{document} markers into your dissertation document,
% OR compile this file directly.

"""


WRAPPER_START = r"""\documentclass[12pt]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{geometry}
\geometry{margin=1in}
\usepackage{setspace}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{hyperref}
\usepackage[greek,english]{babel}
\newcommand{\gk}[1]{\foreignlanguage{greek}{#1}}
\setstretch{1.15}

\begin{document}

"""

WRAPPER_END = r"""

\end{document}
"""


def main():
    raw = INPUT.read_text(encoding="utf-8")
    converted = convert_content(raw)
    output = PREAMBLE + WRAPPER_START + converted + WRAPPER_END
    OUTPUT.write_text(output, encoding="utf-8")
    print(f"Wrote: {OUTPUT}")
    print(f"Size: {len(output)} chars, {len(output.splitlines())} lines")


if __name__ == "__main__":
    main()
