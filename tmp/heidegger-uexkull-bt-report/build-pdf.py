#!/usr/bin/env python3
"""Convert Heidegger-on-Uexkull report markdown to PDF using weasyprint."""
from pathlib import Path

import markdown
from weasyprint import HTML, CSS

INPUT_MD = Path(__file__).parent / "Heidegger-on-Uexkull-in-BT-and-FCM.md"
OUTPUT_PDF = Path(__file__).parent / "Heidegger-on-Uexkull-in-BT-and-FCM.pdf"
OUTPUT_HTML = Path(__file__).parent / "Heidegger-on-Uexkull-in-BT-and-FCM.html"

CSS_STYLE = """
@page {
    size: 8.5in 11in;
    margin: 0.85in 0.9in 0.85in 0.9in;
    @bottom-center {
        content: counter(page);
        font-family: "Liberation Serif", "Times New Roman", serif;
        font-size: 10pt;
        color: #444;
    }
}

body {
    font-family: "Liberation Serif", "Times New Roman", serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
    text-align: justify;
    hyphens: auto;
    -webkit-hyphens: auto;
}

/* Title block: first H1 + H2 */
body > h1:first-child {
    font-size: 20pt;
    font-weight: bold;
    text-align: center;
    margin-top: 0.4in;
    margin-bottom: 0.3em;
    color: #111;
    line-height: 1.2;
    page-break-after: avoid;
}

body > h1:first-child + h2 {
    font-size: 14pt;
    font-style: italic;
    text-align: center;
    margin-top: 0.2em;
    margin-bottom: 1.4em;
    color: #222;
    font-weight: normal;
    page-break-after: avoid;
}

/* Section headings */
h2 {
    font-size: 14pt;
    font-weight: bold;
    text-align: left;
    margin-top: 1.4em;
    margin-bottom: 0.4em;
    color: #111;
    line-height: 1.25;
    page-break-after: avoid;
    border-bottom: 1px solid #999;
    padding-bottom: 0.15em;
}

h3 {
    font-size: 12pt;
    font-weight: bold;
    text-align: left;
    margin-top: 1em;
    margin-bottom: 0.3em;
    color: #222;
    page-break-after: avoid;
}

h4 {
    font-size: 11pt;
    font-weight: bold;
    font-style: italic;
    margin-top: 0.8em;
    margin-bottom: 0.2em;
    color: #333;
    page-break-after: avoid;
}

/* Body text */
p {
    margin: 0 0 0.6em 0;
    text-indent: 0;
    orphans: 3;
    widows: 3;
}

/* Blockquotes for offset citations */
blockquote {
    margin: 0.7em 0.4in;
    padding: 0.1em 0.6em;
    font-size: 10.5pt;
    line-height: 1.4;
    border-left: 2px solid #777;
    color: #2a2a2a;
    page-break-inside: avoid;
}

blockquote p {
    margin-bottom: 0.4em;
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
    margin: 0.4em 0 0.6em 0.25in;
    padding-left: 0.25in;
}

li {
    margin-bottom: 0.2em;
}

li > p {
    margin-bottom: 0.25em;
}

/* Horizontal rules - section breaks */
hr {
    border: 0;
    border-top: 1px solid #999;
    margin: 1.2em 0;
    height: 0;
}

/* Tables */
table {
    border-collapse: collapse;
    margin: 0.8em auto;
    font-size: 9.5pt;
    width: 100%;
    page-break-inside: avoid;
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

/* Compact verdict table cells */
table td:first-child {
    width: 65%;
}

/* Compact FCM section table */
table td:nth-child(2) {
    text-align: left;
}

/* Links visible in print */
a {
    color: #1a3a6e;
    text-decoration: none;
}
"""


def convert():
    md_text = INPUT_MD.read_text(encoding="utf-8")
    md = markdown.Markdown(extensions=["extra", "smarty", "sane_lists", "tables"])
    html_body = md.convert(md_text)

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Heidegger on Uexkull in BT and FCM</title>
</head>
<body>
{html_body}
</body>
</html>
"""

    OUTPUT_HTML.write_text(full_html, encoding="utf-8")
    HTML(string=full_html).write_pdf(
        str(OUTPUT_PDF),
        stylesheets=[CSS(string=CSS_STYLE)],
    )
    print(f"Wrote {OUTPUT_PDF} ({OUTPUT_PDF.stat().st_size} bytes)")


if __name__ == "__main__":
    convert()
