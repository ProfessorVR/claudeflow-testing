#!/usr/bin/env python3
"""Convert markdown report to PDF using weasyprint with academic styling."""
import sys
import re
from pathlib import Path

import markdown
from weasyprint import HTML, CSS

INPUT_MD = Path(__file__).parent / "Uexkull-Tones-and-Umwelt.md"
OUTPUT_PDF = Path(__file__).parent / "Uexkull-Tones-and-Umwelt.pdf"

CSS_STYLE = """
@page {
    size: 8.5in 11in;
    margin: 1in 1in 1in 1in;
    @bottom-center {
        content: counter(page);
        font-family: "Liberation Serif", "Times New Roman", serif;
        font-size: 10pt;
        color: #444;
    }
}

@page :first {
    @bottom-center {
        content: counter(page);
    }
}

body {
    font-family: "Liberation Serif", "Times New Roman", serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #1a1a1a;
    text-align: justify;
    hyphens: auto;
    -webkit-hyphens: auto;
}

/* Headings */
h1 {
    font-size: 22pt;
    font-weight: bold;
    text-align: center;
    margin-top: 0;
    margin-bottom: 0.4em;
    page-break-after: avoid;
    color: #111;
    line-height: 1.2;
}

h2 {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    margin-top: 0.5em;
    margin-bottom: 0.3em;
    page-break-after: avoid;
    color: #111;
    line-height: 1.3;
}

h3 {
    font-size: 13pt;
    font-weight: bold;
    text-align: center;
    margin-top: 0.5em;
    margin-bottom: 0.4em;
    page-break-after: avoid;
    font-style: italic;
    color: #222;
}

h2:not(:first-of-type) + p,
h2 + p,
.section-divider + h2 {
    page-break-before: auto;
}

/* Use h2 with ## numbering as "section heading" - hanging numbered */
body > h2[id^="-"] {
    text-align: left;
    font-size: 14pt;
    margin-top: 1.5em;
    page-break-before: auto;
}

/* Section subheadings */
h3 {
    text-align: left;
    font-style: normal;
    font-size: 12pt;
    color: #333;
}

h4 {
    font-size: 11pt;
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.3em;
    page-break-after: avoid;
    color: #444;
}

/* Body text */
p {
    margin: 0 0 0.7em 0;
    text-indent: 0;
    orphans: 3;
    widows: 3;
}

/* First paragraph after heading no indent (already default) */

/* Blockquotes for offset citations */
blockquote {
    margin: 0.8em 0.5in;
    padding: 0 0.3em;
    font-size: 10.5pt;
    line-height: 1.45;
    border-left: 2px solid #888;
    padding-left: 0.6em;
    color: #2a2a2a;
    page-break-inside: avoid;
}

/* Italic and emphasis */
em, i { font-style: italic; }
strong, b { font-weight: bold; }

/* Inline code (Greek transliterations etc) */
code {
    font-family: "Liberation Serif", serif;
    font-style: italic;
    font-size: inherit;
}

/* Lists */
ul, ol {
    margin: 0.5em 0 0.7em 0.3in;
    padding-left: 0.3in;
}

li {
    margin-bottom: 0.25em;
}

li > p {
    margin-bottom: 0.3em;
}

/* Horizontal rules - section breaks */
hr {
    border: 0;
    border-top: 1px solid #999;
    margin: 1.5em 0;
    height: 0;
}

/* Table styling */
table {
    border-collapse: collapse;
    margin: 0.8em auto;
    font-size: 10pt;
    width: 95%;
}

th, td {
    border: 1px solid #555;
    padding: 0.3em 0.5em;
    text-align: left;
    vertical-align: top;
}

th {
    background: #efefef;
    font-weight: bold;
}

/* Title block - first three headings */
body > h1:first-child {
    margin-top: 1in;
}

body > h1:first-child + h2 {
    margin-top: 0.6em;
    font-style: italic;
    font-size: 14pt;
}

body > h1:first-child + h2 + h3 {
    text-align: center;
    font-style: italic;
    font-size: 12pt;
    font-weight: normal;
    margin-bottom: 1.5em;
}

/* Italic source/citation block at top */
body > h1:first-child + h2 + h3 + p > em {
    font-size: 10.5pt;
}

body > h1:first-child + h2 + h3 + p {
    font-size: 10.5pt;
    text-align: center;
    margin-bottom: 2em;
    color: #444;
}

/* Centered "End of report" */
hr + p > em:only-child {
    display: block;
    text-align: center;
    margin: 2em 0;
}
"""


def convert():
    md_text = INPUT_MD.read_text(encoding="utf-8")
    # Convert MD to HTML
    md = markdown.Markdown(extensions=["extra", "smarty", "sane_lists", "tables"])
    html_body = md.convert(md_text)

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Uexküll on Tones and Umwelt</title>
</head>
<body>
{html_body}
</body>
</html>
"""

    # Save HTML alongside for debugging
    (Path(__file__).parent / "Uexkull-Tones-and-Umwelt.html").write_text(full_html, encoding="utf-8")

    HTML(string=full_html).write_pdf(
        str(OUTPUT_PDF),
        stylesheets=[CSS(string=CSS_STYLE)],
    )
    print(f"Wrote {OUTPUT_PDF} ({OUTPUT_PDF.stat().st_size} bytes)")


if __name__ == "__main__":
    convert()
