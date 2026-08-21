#!/usr/bin/env python3
"""
build_pdf.py — Compile the Dramatistic-Involvement Analysis (DIA) document.

Converts three Markdown source files into ONE LaTeX document and compiles it
with xelatex (via latexmk). The Markdown is regular GitHub-flavoured: ATX
headings, **bold**, *italic*, `code`, pipe tables (with --- separator),
blockquotes (>), horizontal rules (--- on their own line), and -/numbered lists.

Output: Game-Behavior-Analysis-Method.pdf (in this directory).

Run:  python3 build_pdf.py
"""

import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

# Document order: (file, top-level-# becomes-this-command)
#   "chapter": the file's single leading "# Title" -> \chapter*-like \section
#   Body uses \section for the leading # so the TOC stays clean.
SOURCES = [
    ("RDR2-tutorial-DIA-analysis.md", "body"),
]

OUT_BASE = "RDR2-Tutorial-DIA-Analysis"

# ---------------------------------------------------------------------------
# Unicode handling
# ---------------------------------------------------------------------------
# Glyphs DejaVu Serif LACKS (verified via xelatex probe): the emoji/symbol set.
# Plus glyphs we deliberately route through math mode for typographic quality
# and guaranteed rendering. Everything else (ē ü § · — – … etc.) DejaVu Serif
# renders natively and we leave alone.
#
# These replacements are applied to PROSE text only (after code spans are
# protected), and the math snippets are emitted as raw LaTeX via a sentinel.

# Sentinel-wrapped raw-LaTeX replacements (so later escaping leaves them alone).
RAW_OPEN = "\x01RAW\x01"
RAW_CLOSE = "\x01/RAW\x01"


def raw(latex_snippet):
    return RAW_OPEN + latex_snippet + RAW_CLOSE


# Map of literal unicode char -> raw LaTeX (wrapped so escaper skips it).
UNICODE_MATH = {
    "→": raw(r"$\rightarrow$\allowbreak "),       # → (break point after, for tight cells)
    "↔": raw(r"$\leftrightarrow$\allowbreak "),    # ↔ (break point after)
    "≥": raw(r"$\geq$"),               # ≥
    "×": raw(r"$\times$\allowbreak "),             # × (break point after)
    "₀": raw(r"$_0$"),                 # ₀
    "₁": raw(r"$_1$"),                 # ₁
    "₂": raw(r"$_2$"),                 # ₂
    "₃": raw(r"$_3$"),                 # ₃
    "₄": raw(r"$_4$"),                 # ₄
}

# Emoji/symbol glyphs the font lacks -> text or symbol replacements.
# In the validation tables, ✅ marks an asserted/present binding and ✗ marks
# an absent one; the most legible rendering is a checkmark / cross via a font
# that has them, but to stay single-font we use a bold "yes"/"no". The task
# spec explicitly suggests ✅->"yes". For ✗ we use "no". ✓ -> a math checkmark.
UNICODE_SYMBOL = {
    "✅": raw(r"\textbf{yes}"),    # ✅
    "✗": raw(r"\textbf{no}"),     # ✗
    "✓": raw(r"\checkmark"),       # ✓ (amssymb / built-in)
}

ALL_UNICODE = {}
ALL_UNICODE.update(UNICODE_MATH)
ALL_UNICODE.update(UNICODE_SYMBOL)


def apply_unicode_map(s):
    for ch, rep in ALL_UNICODE.items():
        s = s.replace(ch, rep)
    return s


# ---------------------------------------------------------------------------
# LaTeX escaping of prose
# ---------------------------------------------------------------------------
# We escape the LaTeX specials, but must NOT touch text already inside our RAW
# sentinels (math snippets) nor inside \texttt code spans (handled separately).

_ESCAPE = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}

# Build a regex that matches any special char.
_ESCAPE_RE = re.compile("|".join(re.escape(k) for k in _ESCAPE))


def escape_latex(s):
    """Escape LaTeX specials in a plain-prose fragment (no markup)."""
    return _ESCAPE_RE.sub(lambda m: _ESCAPE[m.group(0)], s)


# ---------------------------------------------------------------------------
# Inline markup: `code`, **bold**, *italic*
# ---------------------------------------------------------------------------
# Strategy: tokenise the line into pieces, protecting code spans (which must be
# escaped differently — underscores etc. inside \texttt), then handling bold and
# italic, then escaping the remaining plain text. We use sentinels to stitch.

CODE_OPEN = "\x02CODE\x02"
CODE_CLOSE = "\x02/CODE\x02"
BOLD_OPEN = "\x03B\x03"
BOLD_CLOSE = "\x03/B\x03"
ITAL_OPEN = "\x04I\x04"
ITAL_CLOSE = "\x04/I\x04"


def _escape_code(s):
    """Escape content for inside \\texttt{...} and allow line breaks at separators."""
    # In \texttt, the specials still matter. Escape them.
    esc = escape_latex(s)
    # Long monospace tokens (paths, snake_case ids) overflow the right margin
    # because \texttt has no break points. Insert zero-width discretionary breaks
    # after path/identifier separators so they wrap instead of running off-page.
    brk = r"\discretionary{}{}{}"
    esc = esc.replace(r"\_", r"\_" + brk)        # after escaped underscores
    for ch in ("/", ".", "-", ":"):
        esc = esc.replace(ch, ch + brk)
    return esc


def render_inline(text):
    """Convert inline markdown (code/bold/italic) + unicode to LaTeX."""
    # 1. Protect code spans first. Capture content, stash it.
    code_store = []

    def _code_sub(m):
        code_store.append(m.group(1))
        return CODE_OPEN + str(len(code_store) - 1) + CODE_CLOSE

    # `code` (single backtick; content has no backtick)
    text = re.sub(r"`([^`]+)`", _code_sub, text)

    # 2. Bold then italic. Bold uses ** (and __); italic uses * (and _).
    #    Do ** before * so the greedy single-star doesn't eat bold markers.
    text = re.sub(r"\*\*(.+?)\*\*", lambda m: BOLD_OPEN + m.group(1) + BOLD_CLOSE, text)
    text = re.sub(r"__(.+?)__", lambda m: BOLD_OPEN + m.group(1) + BOLD_CLOSE, text)
    # Italic: single * not adjacent to another *. The bold markers are already
    # consumed (replaced by sentinels), so remaining * are italic.
    text = re.sub(r"\*(.+?)\*", lambda m: ITAL_OPEN + m.group(1) + ITAL_CLOSE, text)

    # 3. Apply unicode mapping (emits RAW sentinels for math/symbols).
    text = apply_unicode_map(text)

    # 4. Escape everything that is plain prose. We must split on our sentinels
    #    so we don't escape the RAW LaTeX or the sentinel markers themselves.
    out = _escape_outside_sentinels(text)

    # 5. Re-expand bold/italic sentinels into LaTeX commands.
    out = out.replace(BOLD_OPEN, r"\textbf{").replace(BOLD_CLOSE, "}")
    out = out.replace(ITAL_OPEN, r"\textit{").replace(ITAL_CLOSE, "}")

    # 6. Re-expand code spans into \texttt{...} with their own escaping.
    def _code_restore(m):
        idx = int(m.group(1))
        return r"\texttt{" + _escape_code(code_store[idx]) + "}"

    out = re.sub(re.escape(CODE_OPEN) + r"(\d+)" + re.escape(CODE_CLOSE), _code_restore, out)

    return out


def _escape_outside_sentinels(text):
    """Escape LaTeX specials but skip RAW-wrapped snippets and all sentinels."""
    # Split the text into segments delimited by RAW_OPEN..RAW_CLOSE and by the
    # bold/italic/code sentinels. We escape only the plain segments.
    # Tokens to treat as opaque (pass through unescaped):
    opaque_tokens = [
        (RAW_OPEN, RAW_CLOSE),  # paired raw latex
    ]
    # First handle paired RAW spans.
    result = []
    i = 0
    n = len(text)
    sentinel_singletons = [BOLD_OPEN, BOLD_CLOSE, ITAL_OPEN, ITAL_CLOSE,
                           CODE_OPEN, CODE_CLOSE]
    while i < n:
        # Check for a RAW span start.
        if text.startswith(RAW_OPEN, i):
            end = text.find(RAW_CLOSE, i + len(RAW_OPEN))
            if end == -1:
                # malformed; treat rest as raw
                result.append(text[i + len(RAW_OPEN):])
                break
            result.append(text[i + len(RAW_OPEN):end])  # raw latex, unescaped
            i = end + len(RAW_CLOSE)
            continue
        # Check for any singleton sentinel.
        matched = False
        for tok in sentinel_singletons:
            if text.startswith(tok, i):
                result.append(tok)
                i += len(tok)
                matched = True
                break
        if matched:
            continue
        # Otherwise, accumulate a run of plain text up to the next sentinel.
        # Find nearest next sentinel of any kind.
        next_positions = [text.find(RAW_OPEN, i)]
        for tok in sentinel_singletons:
            next_positions.append(text.find(tok, i))
        next_positions = [p for p in next_positions if p != -1]
        nxt = min(next_positions) if next_positions else n
        plain = text[i:nxt]
        result.append(escape_latex(plain))
        i = nxt
    return "".join(result)


# ---------------------------------------------------------------------------
# Block-level parsing
# ---------------------------------------------------------------------------

HEADING_CMD = {
    1: None,   # decided per-file (body vs appendix vs leading title)
    2: r"\subsection",
    3: r"\subsubsection",
    4: r"\paragraph",
}


def is_table_separator(line):
    """A markdown table separator row: | --- | :---: | etc."""
    s = line.strip()
    if not s.startswith("|") and "|" not in s:
        return False
    # Strip outer pipes, split, every cell must match dashes/colons/spaces.
    cells = [c.strip() for c in s.strip("|").split("|")]
    if not cells:
        return False
    for c in cells:
        if not re.fullmatch(r":?-{1,}:?", c):
            return False
    return True


def split_table_row(line):
    s = line.strip()
    # Remove a single leading and trailing pipe if present, then split.
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|"):
        s = s[:-1]
    # Split on unescaped pipes.
    cells = re.split(r"(?<!\\)\|", s)
    return [c.strip() for c in cells]


def render_table(rows, leading_file_idx):
    """rows: list of cell-lists. rows[0] = header, rest = body."""
    header = rows[0]
    body = rows[1:]
    ncols = max(len(r) for r in rows)

    # Normalise every row to ncols.
    def norm(r):
        return r + [""] * (ncols - len(r))

    header = norm(header)
    body = [norm(r) for r in body]

    # Font size by column count: many columns -> shrink.
    if ncols >= 7:
        size = r"\scriptsize"
    elif ncols >= 6:
        size = r"\footnotesize"
    elif ncols >= 4:
        size = r"\small"
    else:
        size = ""

    colspec = ">{\\RaggedRight\\arraybackslash}X" * ncols
    out = []
    out.append(r"\begin{table}[H]")
    if size:
        out.append(size)
    if ncols >= 7:
        out.append(r"\setlength{\tabcolsep}{3pt}")
    elif ncols >= 6:
        out.append(r"\setlength{\tabcolsep}{4pt}")
    out.append(r"\renewcommand{\arraystretch}{1.25}")
    out.append(r"\begin{tabularx}{\textwidth}{%s}" % colspec)
    out.append(r"\toprule")
    out.append(" & ".join(render_inline(c) for c in header) + r" \\")
    out.append(r"\midrule")
    for r in body:
        out.append(" & ".join(render_inline(c) for c in r) + r" \\")
    out.append(r"\bottomrule")
    out.append(r"\end{tabularx}")
    out.append(r"\end{table}")
    return "\n".join(out)


def render_list(items, ordered):
    env = "enumerate" if ordered else "itemize"
    out = [r"\begin{%s}" % env]
    for it in items:
        out.append(r"\item " + render_inline(it))
    out.append(r"\end{%s}" % env)
    return "\n".join(out)


def convert_markdown(md_text, mode):
    """Convert one markdown document body to LaTeX.

    mode: "body" -> leading # becomes \section
          "appendix" -> leading # becomes \section (already inside appendix)
    """
    lines = md_text.split("\n")
    out = []
    i = 0
    n = len(lines)
    seen_top_heading = False

    # Buffers for list accumulation.
    list_buf = []
    list_ordered = None

    def flush_list():
        nonlocal list_buf, list_ordered
        if list_buf:
            out.append(render_list(list_buf, list_ordered))
            out.append("")
            list_buf = []
            list_ordered = None

    while i < n:
        line = lines[i]
        stripped = line.strip()

        # Blank line.
        if stripped == "":
            flush_list()
            out.append("")
            i += 1
            continue

        # Horizontal rule: --- (or ***, ___) on its own line.
        if re.fullmatch(r"(-{3,}|\*{3,}|_{3,})", stripped):
            flush_list()
            out.append(r"\vspace{0.4em}\hrule\vspace{0.8em}")
            out.append("")
            i += 1
            continue

        # Heading.
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            flush_list()
            level = len(m.group(1))
            title = m.group(2).strip()
            # Strip trailing hashes if any.
            title = re.sub(r"\s+#+\s*$", "", title)
            rendered_title = render_inline(title)
            if level == 1:
                # The single leading top heading of each file.
                if mode == "body":
                    out.append(r"\section{%s}" % rendered_title)
                else:  # appendix
                    out.append(r"\section{%s}" % rendered_title)
                seen_top_heading = True
            else:
                cmd = HEADING_CMD.get(level, r"\paragraph")
                if level == 4:
                    # \paragraph runs into text; add a trailing manual break feel.
                    out.append(r"%s{%s}" % (cmd, rendered_title))
                else:
                    out.append(r"%s{%s}" % (cmd, rendered_title))
            out.append("")
            i += 1
            continue

        # Blockquote: one or more consecutive lines starting with >.
        if stripped.startswith(">"):
            flush_list()
            quote_lines = []
            while i < n and lines[i].strip().startswith(">"):
                q = re.sub(r"^\s*>\s?", "", lines[i])
                quote_lines.append(q)
                i += 1
            # Join quote lines into a paragraph (preserve blank lines as breaks).
            joined = "\n".join(quote_lines).strip()
            # Render each paragraph within the quote.
            paras = re.split(r"\n\s*\n", joined)
            out.append(r"\begin{diabox}")
            for p in paras:
                p_one = " ".join(seg.strip() for seg in p.split("\n"))
                out.append(render_inline(p_one))
                out.append("")
            out.append(r"\end{diabox}")
            out.append("")
            continue

        # Table: a header row, then a separator row.
        if "|" in line and (i + 1) < n and is_table_separator(lines[i + 1]):
            flush_list()
            tbl_rows = [split_table_row(line)]
            i += 1  # move to separator
            i += 1  # skip separator
            while i < n and "|" in lines[i] and lines[i].strip() != "":
                # Stop if we hit something that's clearly not a row (heading/hr).
                if re.match(r"^#{1,6}\s", lines[i]):
                    break
                tbl_rows.append(split_table_row(lines[i]))
                i += 1
            out.append(render_table(tbl_rows, 0))
            out.append("")
            continue

        # Unordered list item.
        mul = re.match(r"^[-*+]\s+(.*)$", line)
        if mul:
            if list_ordered is True:
                flush_list()
            list_ordered = False
            list_buf.append(mul.group(1))
            i += 1
            # Gather continuation lines (indented) into the same item.
            while i < n and re.match(r"^\s{2,}\S", lines[i]) and not re.match(r"^\s*[-*+]\s+", lines[i]) and not re.match(r"^\s*\d+\.\s+", lines[i]):
                list_buf[-1] += " " + lines[i].strip()
                i += 1
            continue

        # Ordered list item.
        mol = re.match(r"^\d+\.\s+(.*)$", line)
        if mol:
            if list_ordered is False:
                flush_list()
            list_ordered = True
            list_buf.append(mol.group(1))
            i += 1
            while i < n and re.match(r"^\s{2,}\S", lines[i]) and not re.match(r"^\s*[-*+]\s+", lines[i]) and not re.match(r"^\s*\d+\.\s+", lines[i]):
                list_buf[-1] += " " + lines[i].strip()
                i += 1
            continue

        # Plain paragraph: gather consecutive non-blank, non-special lines.
        flush_list()
        para_lines = [line]
        i += 1
        while i < n:
            nxt = lines[i]
            if nxt.strip() == "":
                break
            if re.match(r"^#{1,6}\s", nxt):
                break
            if re.fullmatch(r"(-{3,}|\*{3,}|_{3,})", nxt.strip()):
                break
            if nxt.strip().startswith(">"):
                break
            if re.match(r"^[-*+]\s+", nxt) or re.match(r"^\d+\.\s+", nxt):
                break
            if "|" in nxt and (i + 1) < n and is_table_separator(lines[i + 1]):
                break
            para_lines.append(nxt)
            i += 1
        para = " ".join(pl.strip() for pl in para_lines)
        out.append(render_inline(para))
        out.append("")

    flush_list()
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Preamble + title page + assembly
# ---------------------------------------------------------------------------

PREAMBLE = r"""\documentclass[11pt]{report}

\usepackage{fontspec}
\usepackage[margin=1.1in]{geometry}
\usepackage{booktabs}
\usepackage{tabularx}
\usepackage{longtable}
\usepackage{array}
\usepackage{ragged2e}
\usepackage{float}
\usepackage{graphicx}
\usepackage{xcolor}
\usepackage{amssymb}
\usepackage{titlesec}
\usepackage{setspace}
\usepackage{enumitem}
\usepackage[most]{tcolorbox}
\IfFileExists{microtype.sty}{\usepackage{microtype}}{}
\usepackage[hidelinks,bookmarks=true,bookmarksnumbered=true]{hyperref}

% --- Fonts (xelatex) ---
\setmainfont{DejaVu Serif}[
  Ligatures=TeX,
  Scale=0.96
]
\newfontfamily\headingfont{DejaVu Sans}[Scale=0.96]
\setmonofont{DejaVu Sans Mono}[Scale=0.86]

% --- Paragraph style: space between, no indent (modern look) ---
\usepackage{parskip}
\onehalfspacing
\setlength{\emergencystretch}{3em}

% --- Colours ---
\definecolor{diaaccent}{HTML}{2C3E66}
\definecolor{diarule}{HTML}{8896B8}
\definecolor{diaboxbg}{HTML}{F2F4F9}

% --- Heading style (clean, sans, accented) ---
\titleformat{\section}
  {\headingfont\Large\bfseries\color{diaaccent}}
  {\thesection}{0.7em}{}
\titleformat{\subsection}
  {\headingfont\large\bfseries\color{diaaccent}}
  {\thesubsection}{0.6em}{}
\titleformat{\subsubsection}
  {\headingfont\normalsize\bfseries\color{diaaccent}}
  {\thesubsubsection}{0.5em}{}
\titleformat{\paragraph}[runin]
  {\headingfont\normalsize\bfseries\color{diaaccent}}
  {}{0em}{}[.\quad]
\titlespacing*{\paragraph}{0pt}{0.6em}{0.5em}

% Chapter title styling for the appendix opener.
\titleformat{\chapter}[display]
  {\headingfont\huge\bfseries\color{diaaccent}}
  {\chaptertitlename\ \thechapter}{12pt}{\Huge}

% --- Blockquote box ---
\newtcolorbox{diabox}{
  colback=diaboxbg,
  colframe=diarule,
  boxrule=0.4pt,
  leftrule=3pt,
  arc=2pt,
  left=8pt, right=8pt, top=6pt, bottom=6pt,
  breakable
}

% Spacing for tables a touch more open.
\setlength{\tabcolsep}{5pt}

\hypersetup{
  pdftitle={DIA Analysis of the RDR2 Tutorial},
  pdfauthor={DIA Method applied to Red Dead Redemption 2},
  pdfsubject={Burke pentad x Calleja PIM x Aristotelian-Heideggerian A0-A4 chain applied to the RDR2 tutorial arc},
  colorlinks=false,
  linkcolor=diaaccent,
  urlcolor=diaaccent
}

\begin{document}
"""

TITLE_PAGE = r"""
\begin{titlepage}
\centering
\vspace*{2.2cm}

{\headingfont\bfseries\color{diaaccent}\fontsize{26}{32}\selectfont
DIA Analysis of the\\[0.18em]
\textit{Red Dead Redemption 2} Tutorial\par}

\vspace{1.0cm}
{\color{diarule}\rule{0.72\textwidth}{1pt}\par}
\vspace{1.0cm}

{\headingfont\Large
Chapter 1 (Colter) and the Opening of\\[0.20em]
Chapter 2 (Horseshoe Overlook)\\[0.50em]
Through the Burke $\times$ Calleja $\times$ A$_0$--A$_4$ Method\par}

\vspace{2.0cm}

{\large
Burke's Dramatistic Pentad\\[0.30em]
(\textit{A Grammar of Motives} 1945 + \textit{A Rhetoric of Motives} 1950)\\[0.50em]
$\times$\\[0.50em]
Calleja's Player Involvement Model\\[0.30em]
(\textit{In-Game} 2011)\\[0.50em]
$\times$\\[0.50em]
the Aristotelian-Heideggerian A$_0$--A$_4$ Actualization Chain\\[0.30em]
(dissertation \S\S 1.0--1.5 v3)\par}

\vfill

{\large\headingfont 2026-05-28\par}
\vspace{0.4em}
{\small\itshape source corpus: user's RDR2 ChatGPT.pdf notes (112 pp., 2026-01-10)\par}
\vspace{1.0cm}
\end{titlepage}
"""

# Quick-reference card summarising the 8 DIA steps (Step 0 through Step 7).
QUICKREF = r"""
\begin{tcolorbox}[
  colback=diaboxbg, colframe=diaaccent, boxrule=0.8pt, arc=3pt,
  left=10pt, right=10pt, top=8pt, bottom=8pt,
  title={\headingfont\bfseries Quick-Reference Card --- The Augmented 9-Step DIA Protocol (with A$_0$--A$_4$ wiring)},
  coltitle=white, colbacktitle=diaaccent, fonttitle=\bfseries
]
\setlist[description]{leftmargin=6.6em, style=sameline, font=\bfseries\color{diaaccent}}
\begin{description}[itemsep=2pt, topsep=2pt]
  \item[Step 0] Scope \& circumference --- boundary, anecdote, entry point (A$_1$/A$_2$/A$_3$), synchronic/diachronic.
  \item[Step 1] Involvement profile (Axis I) --- six PIM dimensions $\times$ macro/micro with A-node anchoring per cell.
  \item[Step 2] Motive grammar (Axis M) --- six pentad terms; featured term(s); each term at anticipated/ratified/enacted level.
  \item[Step 3] Ratio dynamics --- dominant ratio + transition-of-instantiation (which $M_n\!\to\!A_{n+1}$ it operates at).
  \item[Step 4] Crosswalk binding --- fuse Axis M to Axis I via validated crosswalk + chain-locus tags.
  \item[Step 5] Identification \& consubstantiation --- the keystone as A$_3$$\to$A$_4$ substantial union; rubric R1--R5 with chain loci.
  \item[Step 6] Attitude \& hexis-bivalence --- register + technē-hexis or ethical-hexis status; the cultivated disposition.
  \item[Step 7] Diagnosis \& ends --- dominant action-type (Type 1/2/3/4); chain-locus weight; keystone state.
  \item[Step 8] Recursion \& diachronic outlook --- hexis sedimented, Stimmung deposited, settled doxai, next entry point.
\end{description}
\end{tcolorbox}
"""


def main():
    parts = [PREAMBLE, TITLE_PAGE]

    # Front matter: TOC.
    parts.append(r"\hypersetup{linkcolor=diaaccent}")
    parts.append(r"\renewcommand{\contentsname}{Contents}")
    parts.append(r"\tableofcontents")
    parts.append(r"\clearpage")

    # Quick-reference card near the front.
    parts.append(QUICKREF)
    parts.append(r"\clearpage")

    # Body parts 1 and 2.
    for fname, mode in SOURCES:
        if mode == "appendix":
            continue
        path = os.path.join(HERE, fname)
        with open(path, encoding="utf-8") as fh:
            md = fh.read()
        parts.append("%% ==== source: %s ====" % fname)
        parts.append(convert_markdown(md, mode))
        parts.append(r"\clearpage")

    parts.append(r"\end{document}")

    tex = "\n".join(parts) + "\n"
    tex_path = os.path.join(HERE, OUT_BASE + ".tex")
    with open(tex_path, "w", encoding="utf-8") as fh:
        fh.write(tex)
    print("Wrote %s (%d bytes)" % (tex_path, len(tex)))

    # Compile with latexmk + xelatex.
    cmd = [
        "latexmk", "-xelatex", "-interaction=nonstopmode",
        "-halt-on-error", "-f", OUT_BASE + ".tex",
    ]
    proc = subprocess.run(cmd, cwd=HERE, capture_output=True, text=True)
    print("latexmk exit code:", proc.returncode)
    # Surface a short tail of stdout for diagnostics.
    tail = proc.stdout.strip().splitlines()[-15:]
    print("\n".join(tail))
    if proc.returncode != 0:
        print("=== STDERR tail ===")
        print("\n".join(proc.stderr.strip().splitlines()[-15:]))
    return proc.returncode


if __name__ == "__main__":
    sys.exit(main())
