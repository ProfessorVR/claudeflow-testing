#!/usr/bin/env python3
"""Parse Perplexity result JSONs and download accessible PDFs."""
import json, os, re, glob, time, hashlib, subprocess
from urllib.parse import urlparse

RESULTS_DIR = "/home/dalton/projects/claudeflow-testing/tmp/Pathe/citations/perplexity-results"
DOWNLOAD_DIR = "/home/dalton/projects/claudeflow-testing/corpus/download"
MANIFEST = "/home/dalton/projects/claudeflow-testing/corpus/download/MANIFEST.json"

os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def parse_results():
    all_results = []
    for f in sorted(glob.glob(RESULTS_DIR + "/*.json")):
        qid = os.path.splitext(os.path.basename(f))[0]
        try:
            d = json.load(open(f))
            content = d.get("choices", [{}])[0].get("message", {}).get("content", "")
            citations = d.get("citations", [])
            # The content may include code-fences
            content_clean = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip(), flags=re.MULTILINE)
            # Find { ... } block
            m = re.search(r"\{.*\}", content_clean, re.DOTALL)
            if m:
                try:
                    obj = json.loads(m.group(0))
                    for r in obj.get("results", []):
                        r["query_id"] = qid
                        r["citation_pool"] = citations
                        all_results.append(r)
                except Exception as e:
                    pass
        except Exception as e:
            print(f"PARSE FAIL {f}: {e}")
    return all_results

def slugify(s, maxlen=140):
    s = re.sub(r"[^A-Za-z0-9._-]+", "_", s).strip("_")
    return s[:maxlen]

def safe_filename(author, year, title, url):
    base = slugify(f"{author}_{year}_{title}")
    ext = ".pdf"
    p = urlparse(url)
    if p.path.lower().endswith(".pdf"):
        ext = ".pdf"
    elif p.path.lower().endswith(".html") or p.path.lower().endswith(".htm"):
        ext = ".html"
    elif "/pdf/" in p.path:
        ext = ".pdf"
    return base + ext

def is_pdf_url(url):
    if not url:
        return False
    p = urlparse(url)
    if p.path.lower().endswith(".pdf"):
        return True
    if "/pdf/" in p.path.lower() or "viewcontent.cgi" in p.path.lower() or "pdfname=" in (p.query or ""):
        return True
    return False

def download(url, out_path, timeout=90):
    if os.path.exists(out_path) and os.path.getsize(out_path) > 5000:
        return "skip-exists"
    try:
        r = subprocess.run(
            ["curl", "-sSL", "--max-time", str(timeout), "-A",
             "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
             "-o", out_path, url],
            capture_output=True, text=True, timeout=timeout+10)
        if r.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 5000:
            # Check if it's actually a PDF
            with open(out_path, "rb") as fp:
                head = fp.read(8)
            if head.startswith(b"%PDF"):
                return "ok-pdf"
            elif head.startswith(b"<") or b"<html" in head.lower():
                # HTML returned, rename to .html for inspection
                html_path = out_path + ".html"
                os.rename(out_path, html_path)
                return f"html({os.path.basename(html_path)})"
            else:
                return "ok-other"
        else:
            if os.path.exists(out_path) and os.path.getsize(out_path) < 5000:
                os.remove(out_path)
            return f"fail(rc={r.returncode})"
    except subprocess.TimeoutExpired:
        return "fail(timeout)"
    except Exception as e:
        return f"fail({e})"

def main():
    results = parse_results()
    print(f"Total results parsed: {len(results)}")
    # Dedupe by URL
    seen_urls = set()
    unique = []
    for r in results:
        u = (r.get("url") or "").strip()
        if not u or u in seen_urls:
            continue
        seen_urls.add(u)
        unique.append(r)
    print(f"Unique URLs: {len(unique)}")

    manifest = []
    pdf_count = 0
    for i, r in enumerate(unique):
        url = r["url"]
        author = r.get("author", "anon")
        year = r.get("year", "ny")
        title = r.get("title", "untitled")
        # Only attempt PDF downloads on PDF-looking URLs first; collect others as candidates
        fname = safe_filename(author, year, title, url)
        out = os.path.join(DOWNLOAD_DIR, fname)
        likely_pdf = is_pdf_url(url)
        status = "candidate-only"
        if likely_pdf:
            status = download(url, out)
            if status.startswith("ok-pdf"):
                pdf_count += 1
        entry = {
            "qid": r.get("query_id"),
            "author": author,
            "year": year,
            "title": title,
            "venue": r.get("venue", ""),
            "url": url,
            "why_relevant": r.get("why_relevant", ""),
            "filename": fname if likely_pdf else None,
            "status": status,
        }
        manifest.append(entry)
        print(f"[{i+1:02d}] {status:30s} {author} {year} - {title[:60]}")

    print(f"\nPDFs successfully downloaded: {pdf_count}/{len(unique)}")

    # Also harvest URLs from the citation_pool that look like PDFs and aren't covered
    extra_pdfs = set()
    for f in sorted(glob.glob(RESULTS_DIR + "/*.json")):
        d = json.load(open(f))
        for c in d.get("citations", []):
            if is_pdf_url(c) and c not in seen_urls:
                extra_pdfs.add(c)
    print(f"\nExtra PDF URLs from citation pool: {len(extra_pdfs)}")
    for url in sorted(extra_pdfs):
        try:
            p = urlparse(url)
            base = slugify(os.path.basename(p.path).replace(".pdf", ""))[:80]
            fname = f"_extra_{base}.pdf"
            out = os.path.join(DOWNLOAD_DIR, fname)
            status = download(url, out)
            entry = {
                "qid": "_pool",
                "author": "(citation pool)",
                "year": "",
                "title": base,
                "venue": "",
                "url": url,
                "why_relevant": "found in Perplexity citation pool",
                "filename": fname,
                "status": status,
            }
            manifest.append(entry)
            if status.startswith("ok-pdf"):
                pdf_count += 1
            print(f"[pool] {status:30s} {url[:80]}")
        except Exception as e:
            print(f"[pool] ERR {e} {url}")

    json.dump(manifest, open(MANIFEST, "w"), indent=2)
    print(f"\nManifest saved: {MANIFEST}")
    print(f"Total PDFs in corpus/download/: {pdf_count}")

if __name__ == "__main__":
    main()
