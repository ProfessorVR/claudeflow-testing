#!/usr/bin/env python3
"""Post-process S3 deep-research responses (Q-016, Q-017) into proper proposals.

Deep-research returns essay-form prose with footnoted citations + a `citations` array
of URLs. We extract: full essay text, top citation URLs, derive verbatim-friendly excerpts.
"""
import json, re, subprocess, os, hashlib
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime, timezone

RESULTS = "/home/dalton/projects/claudeflow-testing/tmp/Dissertation/perplexity-fresh-2026-05-13T1439/results"
PER_SECTION = "/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section"
LOG = "/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_synthesis/perplexity-escalation-log.jsonl"
DOWNLOADS = "/home/dalton/projects/claudeflow-testing/corpus/download/dissertation-fresh-perplexity"


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def slug(s, n=100):
    s = re.sub(r"[^A-Za-z0-9._-]+", "_", s).strip("_")
    return s[:n]


def is_pdf_url(url):
    if not url:
        return False
    p = urlparse(url)
    return p.path.lower().endswith(".pdf") or "/pdf/" in p.path.lower() or "viewcontent.cgi" in p.path.lower()


def try_dl(url, out_path, timeout=60):
    if os.path.exists(out_path) and os.path.getsize(out_path) > 5000:
        return "skip-exists"
    try:
        r = subprocess.run(
            ["curl", "-sSL", "--max-time", str(timeout), "-A",
             "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
             "-o", out_path, url],
            capture_output=True, text=True, timeout=timeout + 10,
        )
        if r.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 5000:
            with open(out_path, "rb") as fp:
                head = fp.read(8)
            if head.startswith(b"%PDF"):
                return "ok-pdf"
            if head.startswith(b"<") or b"<html" in head.lower():
                html_path = out_path + ".html"
                os.rename(out_path, html_path)
                return f"html({os.path.basename(html_path)})"
            return "ok-other"
        if os.path.exists(out_path) and os.path.getsize(out_path) < 5000:
            os.remove(out_path)
        return f"fail(rc={r.returncode})"
    except Exception as e:
        return f"fail({e})"


# Queue snippet for Q-016 + Q-017
QUERIES = {
    "Q-016": {
        "gap_id": "DISS-05-G-DEEP-CRITICAL",
        "claim_id": "DISS-05-C058",
        "section": "DISS-05-A4",
        "claim_text_short": "Master synthesis: doxa-content-conditional gate + Type-3-dual-case both produce pathē because praxis-hexis cultivates fresh resolution",
        "missing_locus_or_topic": "Deep-research synthesis on Heidegger reading of Aristotle praxis-hexis cultivating fresh emotional resolution",
        "query_text_for_perplexity": "Deep research: Heidegger reading of Aristotle on praxis-hexis (NE VI.5 + GA 18 §17-18) as cultivating fresh emotional resolution rather than mechanical reflex...",
        "support_tier_original": "T4-interpretive-but-unflagged",
        "severity": "CRITICAL-DISSERTATION-NOVEL",
        "load_bearing": True,
        "expected_starting_step": "S3",
    },
    "Q-017": {
        "gap_id": "DISS-05-G-DEEP-NOVEL",
        "claim_id": "DISS-05-C074",
        "section": "DISS-05-A4",
        "claim_text_short": "Aretē-as-praxis-hexis with virtue-pathos pairings (courage-fear, magnanimity-anger, modesty-shame)",
        "missing_locus_or_topic": "Deep-research synthesis on per-virtue-pathos pairings in Aristotle's NE",
        "query_text_for_perplexity": "Deep research: per-virtue-pathos pairings in Aristotle's NE — courage/fear (NE III.7), megalopsychia/anger (NE IV.3), aidōs/shame (NE IV.9)...",
        "support_tier_original": "T4-interpretive-but-unflagged",
        "severity": "CRITICAL-DISSERTATION-NOVEL",
        "load_bearing": True,
        "expected_starting_step": "S3",
    },
}


def extract_verbatim_blocks(clean_text):
    """Find indented or quoted blocks that look like verbatim source material."""
    blocks = []
    # Look for blockquote-style ("..." paragraphs)
    quote_pattern = re.compile(r'(?:^|\n)\s*(?:>\s+|")([^"\n]{40,400})(?:"|$)', re.MULTILINE)
    for m in quote_pattern.finditer(clean_text):
        blocks.append(m.group(1).strip())
    return blocks[:10]


def append_log(entry):
    with open(LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")


def process_query(qid):
    info = QUERIES[qid]
    raw_path = f"{RESULTS}/{qid}-S3.json"
    d = json.load(open(raw_path))
    content = d["choices"][0]["message"]["content"]
    cost = d.get("usage", {}).get("cost", {}).get("total_cost", "unknown")
    citations = d.get("citations", [])
    search_results = d.get("search_results", [])

    # Strip <think>
    clean = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()

    # Build a citation list with metadata from search_results if available
    cit_meta = []
    for i, url in enumerate(citations):
        meta = {"url": url, "index": i + 1}
        # Try to find matching search_result
        for sr in search_results:
            if sr.get("url") == url:
                meta["title"] = sr.get("title", "")
                meta["snippet"] = sr.get("snippet", "")
                break
        cit_meta.append(meta)

    # Try downloads on PDF URLs
    downloads = []
    seen_dl = set()
    for cm in cit_meta:
        url = cm["url"]
        if url in seen_dl:
            continue
        seen_dl.add(url)
        if is_pdf_url(url):
            fname = f"{qid}_cit{cm['index']:02d}_{slug(cm.get('title','untitled')[:60])}.pdf"
            out_path = f"{DOWNLOADS}/{fname}"
            Path(DOWNLOADS).mkdir(parents=True, exist_ok=True)
            status = try_dl(url, out_path)
            downloads.append({"filename": fname, "url": url, "status": status, "title": cm.get("title","")})
        if len(downloads) >= 15:
            break

    verbatim_blocks = extract_verbatim_blocks(clean)

    # Append escalation-log entry (mark usable=True now that we've processed)
    append_log({
        "query_id": qid, "gap_id": info["gap_id"], "step": "S3",
        "cost": cost if isinstance(cost, (int, float)) else 1.0,
        "success": True, "reason": "deep_research_essay_postprocessed",
        "n_citations": len(citations), "n_downloads_ok": sum(1 for d in downloads if d["status"].startswith("ok-pdf")),
        "timestamp": now(), "note": "Post-processed: original parser flagged as not-usable because sonar-deep-research returns essay form, not JSON. Manually extracted citations + verbatim blocks."
    })

    # Write proposal
    section_dir = f"{PER_SECTION}/{info['section']}/citation-fills"
    Path(section_dir).mkdir(parents=True, exist_ok=True)
    out_file = f"{section_dir}/{info['gap_id']}-tier-c.md"

    lines = []
    lines.append(f"# Tier C Citation Fill Proposal — {info['gap_id']} (Deep Research, post-processed)")
    lines.append("")
    lines.append(f"**Run-id**: 2026-05-13T1439 / Phase 4 Agent 3 (fresh Perplexity, S3 deep-research)")
    lines.append(f"**Generated**: {now()}")
    lines.append(f"**Section**: {info['section']}")
    lines.append(f"**Claim id**: {info['claim_id']}")
    lines.append(f"**Severity**: {info['severity']}")
    lines.append(f"**Load-bearing**: {info['load_bearing']}")
    lines.append(f"**Step executed**: S3 (sonar-deep-research) — successful (essay form)")
    lines.append(f"**Reported cost**: ${cost:.3f}" if isinstance(cost, (int, float)) else f"**Reported cost**: {cost}")
    lines.append(f"**Vetting tag**: `unvetted-needs-user-review` (deep-research essay returned; citations need source verification)")
    lines.append("")
    lines.append("## Claim")
    lines.append("")
    lines.append(f"> {info['claim_text_short']}")
    lines.append("")
    lines.append("## Missing locus / topic")
    lines.append("")
    lines.append(info["missing_locus_or_topic"])
    lines.append("")
    lines.append("## Query text submitted")
    lines.append("")
    lines.append("```")
    lines.append(info["query_text_for_perplexity"])
    lines.append("```")
    lines.append("")
    lines.append("## Deep-research essay (Perplexity-generated — NOT verbatim source material)")
    lines.append("")
    lines.append("> **Caveat**: This is a Perplexity sonar-deep-research synthesis essay. It is NOT itself a primary or secondary source. Treat every claim as a *lead* requiring verification against the cited sources below.")
    lines.append("")
    lines.append("<details>")
    lines.append("<summary>Click to expand essay text</summary>")
    lines.append("")
    lines.append(clean)
    lines.append("")
    lines.append("</details>")
    lines.append("")
    lines.append(f"## Citations returned ({len(cit_meta)} total)")
    lines.append("")
    for cm in cit_meta:
        title = cm.get("title", "").strip() or "(no title)"
        url = cm["url"]
        snippet = (cm.get("snippet", "") or "")[:200]
        lines.append(f"### [{cm['index']}] {title}")
        lines.append(f"- URL: {url}")
        if snippet:
            lines.append(f"- Snippet: _{snippet}_")
        lines.append("")
    lines.append("## Verbatim-candidate blocks extracted from essay")
    lines.append("")
    lines.append("(Sentences appearing in quotes within the essay. Each requires source verification before use.)")
    lines.append("")
    if verbatim_blocks:
        for i, b in enumerate(verbatim_blocks, 1):
            lines.append(f"{i}. > {b}")
            lines.append("")
    else:
        lines.append("(No quoted blocks found in essay; consult cited works directly for verbatim material.)")
    lines.append("")
    lines.append("## PDF downloads attempted")
    lines.append("")
    if downloads:
        for d in downloads:
            lines.append(f"- `{d['filename']}` — status: `{d['status']}` — {d.get('title','')}")
            lines.append(f"  - URL: {d['url']}")
    else:
        lines.append("(No PDF-looking URLs in citation pool; manual retrieval required for cited works.)")
    lines.append("")
    lines.append("## Vetting checklist (user review required)")
    lines.append("")
    lines.append("- [ ] Verify each citation in essay maps to a real, published work at the URL given")
    lines.append("- [ ] Cross-check Sherman 1989 / Aubenque 1963 / Sheehan / McNeill / Kisiel / Pöggeler / Costache claims against actual texts")
    lines.append("- [ ] Locate verbatim quotation in primary source (Aristotle Bekker line; Heidegger GA paginations) before insertion")
    lines.append("- [ ] Treat ALL Perplexity-generated prose as paraphrase, not source")
    lines.append("- [ ] Apply new terminology: *epithymia* (not `pathos simpliciter`), `resonant epithymia`, `resonant pathē`")
    lines.append("- [ ] If essay leads to a usable source, register that source in `corpus/download/dissertation-fresh-perplexity/MANIFEST.json` for re-ingest")
    lines.append("")
    lines.append("## Provenance")
    lines.append("")
    lines.append(f"- Query id: `{qid}` from `perplexity-queue.json`")
    lines.append(f"- Step: `S3` (sonar-deep-research, started at S3 per queue)")
    lines.append(f"- Raw response: `tmp/Dissertation/perplexity-fresh-2026-05-13T1439/results/{qid}-S3.json`")
    lines.append(f"- Total citation tokens charged: from usage record above")
    lines.append("")

    with open(out_file, "w") as f:
        f.write("\n".join(lines))
    print(f"Wrote {out_file} (essay {len(clean)} chars, {len(cit_meta)} citations, {len(downloads)} download attempts, {sum(1 for d in downloads if d['status'].startswith('ok-pdf'))} PDF ok)")
    return {
        "qid": qid, "section": info["section"], "gap_id": info["gap_id"],
        "essay_chars": len(clean), "n_citations": len(cit_meta),
        "n_downloads": len(downloads),
        "n_pdf_ok": sum(1 for d in downloads if d["status"].startswith("ok-pdf")),
        "proposal_file": out_file, "cost": cost,
    }


outcomes = []
for qid in ("Q-016", "Q-017"):
    outcomes.append(process_query(qid))

print("\nSummary:")
total_cost = sum(o['cost'] if isinstance(o['cost'], (int, float)) else 0 for o in outcomes)
print(f"  Total S3 actual cost (combined): ${total_cost:.3f}")
print(f"  Total citations harvested: {sum(o['n_citations'] for o in outcomes)}")
print(f"  Total PDF downloads ok: {sum(o['n_pdf_ok'] for o in outcomes)}")
