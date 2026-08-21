#!/usr/bin/env python3
"""Convert A0 console draft to print-ready LaTeX using XeLaTeX (fontspec).

Outputs a self-contained .tex file that compiles to a clean printable PDF:
- 12pt, 1-inch margins, 1.3 line spacing
- Page numbers
- Unicode Greek handled natively via fontspec (no babel needed)
- Title, section numbers, proper typography
"""
import re
from pathlib import Path

INPUT = Path("/home/dalton/projects/claudeflow-testing/tmp/a3-phantasma-console-draft-2026-04-23.md")
OUTPUT_TEX = Path("/home/dalton/projects/claudeflow-testing/tmp/a3-phantasma-console-draft-2026-04-23.tex")

GREEK_RANGES = [(0x0370, 0x03FF), (0x1F00, 0x1FFF)]


def is_greek_char(ch):
    cp = ord(ch)
    return any(lo <= cp <= hi for lo, hi in GREEK_RANGES)


SUBSCRIPT_MAP = {
    "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
    "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
    "₍": "(", "₎": ")", "ₙ": "n", "ₐ": "a",
}


def convert_subscripted_labels(text):
    pattern = re.compile(r"([A-Za-z])([₀-₉₍₎ₙₐ]+)")
    def replace(m):
        base, subs = m.group(1), m.group(2)
        converted = "".join(SUBSCRIPT_MAP.get(c, c) for c in subs)
        if len(converted) > 1 or not converted[0].isdigit():
            return f"${base}_{{{converted}}}$"
        return f"${base}_{converted}$"
    return pattern.sub(replace, text)


def wrap_greek_runs(text):
    """For XeLaTeX with fontspec, Greek characters work natively without \\gk{}.
    But to aid switching to a Greek-optimized font, we still wrap runs — using
    \\textgreek{} so the Greek font can be configured in the preamble.
    """
    result = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if is_greek_char(ch):
            start = i
            while i < n:
                c = text[i]
                if is_greek_char(c):
                    i += 1
                elif c == " " and i + 1 < n and is_greek_char(text[i + 1]):
                    i += 1
                elif c in "́̀͂̓̔̈ͅ":
                    i += 1
                else:
                    break
            greek = text[start:i]
            result.append(f"\\gk{{{greek}}}")
        else:
            result.append(ch)
            i += 1
    return "".join(result)


def convert_markdown_emphasis(text):
    text = re.sub(r"\*\*([^*\n]+?)\*\*", r"\\textbf{\1}", text)
    text = re.sub(r"\*([^*\n]+?)\*", r"\\textit{\1}", text)
    return text


def convert_dashes(text):
    return text.replace("—", "---").replace("–", "--")


def convert_arrows_and_symbols(text):
    repl = [
        ("→", r"$\to$"), ("←", r"$\leftarrow$"),
        ("↔", r"$\leftrightarrow$"), ("⇒", r"$\Rightarrow$"),
        ("⇐", r"$\Leftarrow$"), ("≈", r"$\approx$"),
        ("≠", r"$\neq$"), ("≤", r"$\leq$"), ("≥", r"$\geq$"),
        ("×", r"$\times$"), ("·", r"$\cdot$"),
    ]
    for a, b in repl:
        text = text.replace(a, b)
    return text


def convert_smart_quotes(text):
    return (text.replace("“", "``").replace("”", "''")
                .replace("‘", "`").replace("’", "'"))


def convert_footnote_marker(text):
    """Convert markdown footnote syntax [^1]: ... and inline [^1] to \\footnote{}.

    The console draft has:
      - inline marker: [^1]
      - definition:    [^1]: content...
    We convert inline [^1] to a \\footnote{content} by looking up the definition.
    """
    # Find all footnote definitions
    fn_defs = {}
    fn_def_pattern = re.compile(r"^\[\^(\w+)\]:\s*(.+?)(?=^\[\^|\Z)", re.MULTILINE | re.DOTALL)
    for m in fn_def_pattern.finditer(text):
        fn_id = m.group(1)
        fn_content = m.group(2).strip()
        fn_defs[fn_id] = fn_content

    # Remove footnote definitions from text
    text = fn_def_pattern.sub("", text)

    # Replace inline [^X] with \footnote{content}
    def replace_inline(m):
        fn_id = m.group(1)
        content = fn_defs.get(fn_id, "")
        # Content may contain its own markup — we assume it's already been
        # processed by the main pipeline. But footnotes are processed BEFORE
        # other conversions, so we apply them here.
        content = convert_smart_quotes(content)
        content = convert_dashes(content)
        content = convert_arrows_and_symbols(content)
        content = convert_subscripted_labels(content)
        content = convert_markdown_emphasis(content)
        content = wrap_greek_runs(content)
        return "\\footnote{" + content + "}"

    text = re.sub(r"\[\^(\w+)\]", replace_inline, text)
    return text


def convert_content(text):
    # Handle footnotes first (so their content is processed along with the main text)
    text = convert_footnote_marker(text)

    lines = text.split("\n")
    out = []
    for line in lines:
        if line.strip() == "---":
            continue  # horizontal rules become nothing
        if line.startswith("# ") and not line.startswith("## "):
            title = line[2:].strip()
            title = convert_subscripted_labels(title)
            title = convert_markdown_emphasis(title)
            title = wrap_greek_runs(title)
            title = convert_smart_quotes(title)
            out.append(f"\\section*{{{title}}}")
            continue
        if line.startswith("## "):
            title = line[3:].strip()
            title = convert_subscripted_labels(title)
            title = convert_markdown_emphasis(title)
            title = wrap_greek_runs(title)
            title = convert_smart_quotes(title)
            out.append(f"\\subsection*{{{title}}}")
            continue
        if line.startswith("### "):
            title = line[4:].strip()
            title = convert_subscripted_labels(title)
            title = convert_markdown_emphasis(title)
            title = wrap_greek_runs(title)
            title = convert_smart_quotes(title)
            out.append(f"\\subsubsection*{{{title}}}")
            continue
        c = line
        c = convert_smart_quotes(c)
        c = convert_dashes(c)
        c = convert_arrows_and_symbols(c)
        c = convert_subscripted_labels(c)
        c = convert_markdown_emphasis(c)
        c = wrap_greek_runs(c)
        out.append(c)
    return "\n".join(out)


PREAMBLE = r"""\documentclass[12pt]{article}
\usepackage[letterpaper,margin=1in]{geometry}
\usepackage{fontspec}
\usepackage{setspace}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{microtype}
\usepackage{xcolor}
\usepackage{fancyhdr}
\usepackage{titlesec}
\usepackage{parskip}
\usepackage{hyperref}
\hypersetup{
  colorlinks=true,
  linkcolor=blue!50!black,
  urlcolor=blue!50!black,
  citecolor=blue!50!black,
  pdftitle={M2 to A3: The Phantastic Motion and the Phantasma Proper},
  pdfauthor={Dalton Salvo},
  pdfsubject={Dissertation -- Aristotelian Actualization Chain}
}

% Main font: Linux Libertine if available, otherwise default serif
\IfFontExistsTF{Linux Libertine O}{%
  \setmainfont{Linux Libertine O}[Numbers=OldStyle]%
}{%
  \IfFontExistsTF{TeX Gyre Pagella}{%
    \setmainfont{TeX Gyre Pagella}%
  }{}%
}

% Greek wrapping: try dedicated Greek font, else fall back to main font
\IfFontExistsTF{GFS Didot}{%
  \newfontfamily{\greekfont}{GFS Didot}%
  \newcommand{\gk}[1]{{\greekfont #1}}%
}{%
  \IfFontExistsTF{DejaVu Serif}{%
    \newfontfamily{\greekfont}{DejaVu Serif}%
    \newcommand{\gk}[1]{{\greekfont #1}}%
  }{%
    % Last resort: use main font (works if it has Greek glyphs)
    \newcommand{\gk}[1]{#1}%
  }
}

% Line spacing and paragraph style
\setstretch{1.3}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0.8em}

% Section titles: generous spacing, clean typography
\titleformat{\section}{\Large\bfseries}{}{0pt}{}
\titleformat{\subsection}{\large\bfseries}{}{0pt}{}
\titlespacing*{\section}{0pt}{2em}{1em}
\titlespacing*{\subsection}{0pt}{1.5em}{0.6em}

% Footnote style: slightly tighter
\usepackage[hang,flushmargin]{footmisc}

% Page header/footer
\setlength{\headheight}{14pt}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\small\itshape M\textsubscript{2}$\to$A\textsubscript{3}: Phantasma Proper}
\fancyhead[R]{\small\itshape Draft — \today}
\fancyfoot[C]{\thepage}
\renewcommand{\headrulewidth}{0.4pt}
\renewcommand{\footrulewidth}{0pt}

% Title page content
\title{\vspace{-2em}\textbf{$M_2 \to A_3$: The Phantastic Motion and the Phantasma Proper}\\[0.5em]
       \large\normalfont A Dissertation Section (Console Draft)}
\author{Dalton Salvo}
\date{April 2026 — Draft for Review}

\begin{document}
\maketitle

\thispagestyle{fancy}

"""

WRAPPER_END = r"""

\end{document}
"""


def main():
    raw = INPUT.read_text(encoding="utf-8")
    # Strip the leading "# M₂→A₃: ..." header since we use \maketitle instead
    raw = re.sub(r"^#\s+M₂→A₃:\s+The\s+Phantastic\s+Motion\s+and\s+the\s+Phantasma\s+Proper\s*\n+",
                 "", raw, count=1, flags=re.MULTILINE)

    converted = convert_content(raw)
    output = PREAMBLE + converted + WRAPPER_END
    OUTPUT_TEX.write_text(output, encoding="utf-8")
    print(f"Wrote LaTeX: {OUTPUT_TEX}")
    print(f"Size: {len(output)} chars, {len(output.splitlines())} lines")


if __name__ == "__main__":
    main()
