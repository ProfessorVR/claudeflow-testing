#!/usr/bin/env python3
"""Extract Nussbaum 1985 text + sectioned claims via Claude Sonnet 4.6."""
import json, os, sys, re, time
from pathlib import Path
import fitz  # pymupdf
from anthropic import Anthropic

REPO = Path(__file__).resolve().parents[4]
SANDBOX = Path(__file__).resolve().parents[1]
PDF = REPO / "corpus" / "rhetorical_ontology" / "Nussbaum, Martha - The Role of Phantasia in Aristotle's Explanation of Action_(1985)_[My Copy].pdf"
OUTDIR = SANDBOX / "corpus" / "index" / "Nussbaum 1985"
OUTDIR.mkdir(parents=True, exist_ok=True)
TEXT_OUT = OUTDIR / "nussbaum-1985-text.txt"
CLAIMS_OUT = OUTDIR / "nussbaum-1985-claims.jsonl"

# Load .env for ANTHROPIC_API_KEY
env_path = REPO / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.strip() and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

client = Anthropic()
MODEL = "claude-sonnet-4-5"  # use available stable Sonnet (4.6 if available, else 4.5)

FIRST_ESSAY_PDF_PAGE = 9   # Essay 5 begins at PDF page 9 (book p. 221)
def extract_pdf_text():
    if TEXT_OUT.exists():
        return TEXT_OUT.read_text()
    doc = fitz.open(str(PDF))
    chunks = []
    for i, page in enumerate(doc):
        chunks.append(f"=== PAGE {i+1} ===\n{page.get_text()}")
    text = "\n\n".join(chunks)
    TEXT_OUT.write_text(text)
    return text

def get_essay_pages():
    """Return list of (page_no, page_text) tuples, skipping front-matter."""
    raw = extract_pdf_text()
    parts = raw.split("=== PAGE ")
    pages = []
    for p in parts:
        if not p.strip(): continue
        first_nl = p.find("\n")
        if first_nl < 0: continue
        try:
            n = int(p[:p.find(" ===")] if " ===" in p[:first_nl+5] else p[:first_nl].split()[0])
        except ValueError:
            continue
        body = p[first_nl+1:]
        # strip trailing markers
        body = body.split("=== PAGE ")[0]
        pages.append((n, body))
    pages = [(n, b) for (n, b) in pages if n >= FIRST_ESSAY_PDF_PAGE]
    return pages

EXTRACT_PROMPT = """You are extracting argumentative claims from Martha Nussbaum's "The Role of Phantasia in Aristotle's Explanation of Action" (Essay 5 of her 1978 *Aristotle's De Motu Animalium*).

The text below is OCR'd from a 1978 print and contains character noise (e.g., '\\IARTHA' for 'MARTHA', 'pb,111ti1sia' for 'phantasia'). Read through the noise and extract substantive claims.

For EACH distinct argumentative move in this section, extract:
- claim: the core proposition (1 sentence, paraphrased)
- ground: the evidence or argument she gives (1 sentence; "" if pure assertion)
- warrant: the bridging principle ("" if not inferable)
- qualifier: scope markers like "in animals only" ("" if none)
- rebuttal: counter-position she addresses ("" if none)
- citation: nearest Bekker number or page (e.g. "DA 433a9", "Met 1029a", or "p. 230"; "" if none)
- author_position: "Nussbaum" if she endorses; "Aristotle" if exegetical; "Wedin" / "Schofield" / "Freudenthal" / "Hamlyn" / etc. if she's reporting another scholar
- key_concepts: 2-6 short terms (mix Greek + English: e.g. ["phantasia","orexis","desire","animal action"])

Aim for 5-15 claims per section. Skip purely transitional sentences. Return STRICT JSON array, no prose around it. If genuinely nothing extractable, return [].

Section title: {title}
Section text:
\"\"\"
{text}
\"\"\"
"""

PAGES_PER_CHUNK = 6
def split_sections(text):
    """Slice essay into N-page chunks, labeling each with PDF page range."""
    pages = get_essay_pages()
    chunks = []
    for i in range(0, len(pages), PAGES_PER_CHUNK):
        group = pages[i:i+PAGES_PER_CHUNK]
        first, last = group[0][0], group[-1][0]
        body = "\n\n".join(f"[PDF p.{n}]\n{b}" for n, b in group)
        chunks.append((f"Essay 5, PDF pages {first}-{last} (book pp ~{220+(first-9)}-{220+(last-9)})", body))
    return chunks

def extract_claims(title, text):
    if len(text) > 14000:
        text = text[:14000] + "\n[...truncated for prompt budget]"
    msg = client.messages.create(
        model=MODEL,
        max_tokens=4000,
        messages=[{"role":"user","content": EXTRACT_PROMPT.format(title=title, text=text)}],
    )
    raw = msg.content[0].text.strip()
    # strip markdown code fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  WARN parse error in section '{title}': {e}", file=sys.stderr)
        # try to salvage: find first [ and last ]
        m = re.search(r"\[.*\]", raw, re.DOTALL)
        if m:
            try: return json.loads(m.group())
            except: return []
        return []

def main():
    print(f"[extract_nussbaum] reading PDF {PDF.name}")
    text = extract_pdf_text()
    print(f"  {len(text):,} chars")
    # delete stale empty claims file
    if CLAIMS_OUT.exists() and CLAIMS_OUT.stat().st_size == 0:
        CLAIMS_OUT.unlink()
    sections = split_sections(text)
    print(f"  {len(sections)} sections (essay starts PDF p.{FIRST_ESSAY_PDF_PAGE})")
    all_claims = []
    for i, (title, sec) in enumerate(sections):
        print(f"  [{i+1}/{len(sections)}] {title} ({len(sec):,} chars)")
        t0 = time.time()
        claims = extract_claims(title, sec)
        for c in claims:
            c["section"] = title
            c["author"] = "Nussbaum, Martha"
            c["title"] = "The Role of Phantasia in Aristotle's Explanation of Action"
            c["year"] = 1985
            c["id"] = f"claim-nussbaum-1985-{len(all_claims)+1:03d}"
            all_claims.append(c)
        print(f"    +{len(claims)} claims  ({time.time()-t0:.1f}s)")
    CLAIMS_OUT.write_text("\n".join(json.dumps(c) for c in all_claims))
    print(f"[extract_nussbaum] wrote {len(all_claims)} claims to {CLAIMS_OUT}")

if __name__ == "__main__":
    main()
