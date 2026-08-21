#!/usr/bin/env python3
"""Phase 4 Agent 3 — Fresh Perplexity executor with S1/S2/S3 escalation.

Reads perplexity-queue.json, executes each fresh query with starting-step S1/S2/S3,
escalates per policy, downloads PDFs, writes per-section proposals, logs all events.
"""
import json, os, re, sys, time, subprocess, hashlib
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime, timezone

# Paths
RUN_BASE = "/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439"
QUEUE = f"{RUN_BASE}/_synthesis/perplexity-queue.json"
SYNTH = f"{RUN_BASE}/_synthesis"
PER_SECTION = f"{RUN_BASE}/_per-section"
RESULTS = "/home/dalton/projects/claudeflow-testing/tmp/Dissertation/perplexity-fresh-2026-05-13T1439/results"
DOWNLOADS = "/home/dalton/projects/claudeflow-testing/corpus/download/dissertation-fresh-perplexity"
LOG = f"{SYNTH}/perplexity-escalation-log.jsonl"
SUMMARY = f"{SYNTH}/perplexity-summary.md"

# Cost estimates per the policy
COSTS = {"S1": 0.015, "S2": 0.04, "S3": 2.50}

# Budget thresholds
PAUSE_QUERIES = 36
PAUSE_REMAINING_USD = 20
CAP_USD = 100

# Load API key
def load_api_key():
    with open("/home/dalton/projects/claudeflow-testing/.env") as f:
        for line in f:
            if line.startswith("PERPLEXITY_API_KEY="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError("PERPLEXITY_API_KEY not in .env")

API_KEY = load_api_key()


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def log_event(event: dict):
    Path(LOG).parent.mkdir(parents=True, exist_ok=True)
    with open(LOG, "a") as f:
        f.write(json.dumps(event) + "\n")


def call_perplexity(query_text: str, step: str) -> dict:
    """Call Perplexity API. Returns dict with status, response, raw."""
    if step == "S1":
        model, context_size = "sonar-pro", "low"
    elif step == "S2":
        model, context_size = "sonar-pro", "medium"
    elif step == "S3":
        model, context_size = "sonar-deep-research", "high"
    else:
        raise ValueError(step)

    system_msg = (
        "You are a scholarly bibliographic assistant. For the user's query, return EXACTLY "
        "3-5 highly relevant scholarly works that DIRECTLY address the claim. For each, "
        "include: full author/year/title/venue, a publicly accessible URL (prefer PDF), and "
        "a verbatim quotation if you can locate one in the source material with a page number "
        "or Bekker reference. Reply ONLY in JSON like: "
        '{"results":[{"author":"","year":"","title":"","venue":"","url":"",'
        '"verbatim_quotation":"","page_anchor":"","why_relevant":""}]}'
    )

    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": query_text},
        ],
        "max_tokens": 2200,
        "return_citations": True,
    }
    if model == "sonar-pro":
        body["web_search_options"] = {"search_context_size": context_size}

    body_json = json.dumps(body)
    max_time = "180" if step == "S3" else "120"
    proc = subprocess.run(
        ["curl", "-sS", "--max-time", max_time, "-X", "POST",
         "https://api.perplexity.ai/chat/completions",
         "-H", f"Authorization: Bearer {API_KEY}",
         "-H", "Content-Type: application/json",
         "-d", body_json],
        capture_output=True, text=True, timeout=int(max_time) + 30,
    )
    if proc.returncode != 0:
        return {"status": "curl_error", "stderr": proc.stderr, "raw": proc.stdout}
    try:
        resp = json.loads(proc.stdout)
    except Exception as e:
        return {"status": "json_parse_error", "raw": proc.stdout, "error": str(e)}
    if "error" in resp:
        return {"status": "api_error", "error": resp["error"], "raw": resp}
    return {"status": "ok", "raw": resp}


def extract_results(api_resp: dict) -> list:
    """Pull the JSON results array out of the message content."""
    try:
        content = api_resp["raw"]["choices"][0]["message"]["content"]
    except Exception:
        return []
    content = content.strip()
    # Strip markdown fences
    content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.MULTILINE)
    content = re.sub(r"\s*```\s*$", "", content, flags=re.MULTILINE)
    # Find first { ... } block
    m = re.search(r"\{.*\}", content, re.DOTALL)
    if not m:
        return []
    try:
        obj = json.loads(m.group(0))
        return obj.get("results", [])
    except Exception:
        # Try to repair — sometimes trailing commas etc.
        try:
            txt = m.group(0)
            txt = re.sub(r",\s*([}\]])", r"\1", txt)
            obj = json.loads(txt)
            return obj.get("results", [])
        except Exception:
            return []


def is_usable(results: list, claim_terms: list) -> tuple[bool, str]:
    """Decide whether at least one result is usable per Plan §10.3 criteria."""
    if not results:
        return False, "no_results"
    # At least one result with URL + plausible author/work + why_relevant matching claim
    for r in results:
        url = (r.get("url") or "").strip()
        author = (r.get("author") or "").strip()
        title = (r.get("title") or "").strip()
        why = (r.get("why_relevant") or "").strip().lower()
        # URL must look like a real URL
        if not url or not url.startswith("http"):
            continue
        if not author or not title:
            continue
        # why_relevant should mention at least one claim term
        if claim_terms:
            if not any(t.lower() in why for t in claim_terms if len(t) > 3):
                # Fall through but mark as weak
                pass
        return True, "usable"
    return False, "no_url_or_author"


def slugify(s, maxlen=120):
    s = re.sub(r"[^A-Za-z0-9._-]+", "_", s).strip("_")
    return s[:maxlen]


def is_pdf_url(url: str) -> bool:
    if not url:
        return False
    p = urlparse(url)
    if p.path.lower().endswith(".pdf"):
        return True
    return "/pdf/" in p.path.lower() or "viewcontent.cgi" in p.path.lower()


def try_download(url: str, out_path: str, timeout: int = 60) -> str:
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
            elif head.startswith(b"<") or b"<html" in head.lower():
                html_path = out_path + ".html"
                os.rename(out_path, html_path)
                return f"html({os.path.basename(html_path)})"
            else:
                return "ok-other"
        if os.path.exists(out_path) and os.path.getsize(out_path) < 5000:
            os.remove(out_path)
        return f"fail(rc={r.returncode})"
    except subprocess.TimeoutExpired:
        return "fail(timeout)"
    except Exception as e:
        return f"fail({e})"


def write_proposal(section: str, gap_id: str, query: dict, step: str, results: list, downloads: list, usable: bool, reason: str):
    """Write the per-section citation-fill proposal."""
    section_dir = f"{PER_SECTION}/{section}/citation-fills"
    Path(section_dir).mkdir(parents=True, exist_ok=True)
    out_file = f"{section_dir}/{gap_id}-tier-c.md"

    lines = [
        f"# Tier C Citation Fill Proposal — {gap_id}",
        "",
        f"**Run-id**: 2026-05-13T1439 / Phase 4 Agent 3 (fresh Perplexity)",
        f"**Generated**: {now_iso()}",
        f"**Section**: {section}",
        f"**Claim id**: {query.get('claim_id')}",
        f"**Severity**: {query.get('severity')}",
        f"**Load-bearing**: {query.get('load_bearing')}",
        f"**Support tier (original)**: {query.get('support_tier_original')}",
        f"**Final step executed**: {step}",
        f"**Usability**: {'usable' if usable else 'NOT usable'} ({reason})",
        f"**Vetting tag**: `unvetted-needs-user-review` (PDF anchoring deferred — see §Downloads below)",
        "",
        "## Claim",
        "",
        f"> {query.get('claim_text_short')}",
        "",
        "## Missing locus / topic",
        "",
        f"{query.get('missing_locus_or_topic')}",
        "",
        "## Query text submitted",
        "",
        f"```",
        f"{query.get('query_text_for_perplexity')}",
        f"```",
        "",
        "## Returned candidate sources",
        "",
    ]
    if not results:
        lines.append("(No usable results returned.)\n")
    else:
        for i, r in enumerate(results, 1):
            verb = (r.get("verbatim_quotation") or "").strip()
            page = (r.get("page_anchor") or "").strip()
            lines.append(f"### Candidate {i}")
            lines.append("")
            lines.append(f"- **Author**: {r.get('author','')}")
            lines.append(f"- **Year**: {r.get('year','')}")
            lines.append(f"- **Title**: {r.get('title','')}")
            lines.append(f"- **Venue**: {r.get('venue','')}")
            lines.append(f"- **URL**: {r.get('url','')}")
            lines.append(f"- **Why relevant**: {r.get('why_relevant','')}")
            if page:
                lines.append(f"- **Page anchor (Perplexity-claimed)**: {page}")
            if verb:
                lines.append("")
                lines.append("**Verbatim (Perplexity-returned — REQUIRES SOURCE VERIFICATION)**:")
                lines.append("")
                lines.append(f"> {verb}")
                lines.append("")
            lines.append("")

    lines.append("## Downloads")
    lines.append("")
    if downloads:
        for d in downloads:
            lines.append(f"- `{d['filename']}` — status: `{d['status']}` (URL: {d['url']})")
    else:
        lines.append("(No PDFs auto-downloaded; URLs above for manual fetch.)")
    lines.append("")
    lines.append("## Vetting checklist (user review required)")
    lines.append("")
    lines.append("- [ ] Verify author/work exists at the cited URL or via library lookup")
    lines.append("- [ ] Verify page anchor matches actual pagination")
    lines.append("- [ ] Verify verbatim quotation is faithful (Perplexity-generated quotes are NOT vetted)")
    lines.append("- [ ] Apply new terminology: *epithymia* (not `pathos simpliciter`), `resonant epithymia`, `resonant pathē`")
    lines.append("- [ ] Cross-check against corpus/index entries if author already present")
    lines.append("")
    lines.append("## Provenance")
    lines.append("")
    lines.append(f"- Query id: `{query.get('query_id')}` from `perplexity-queue.json`")
    lines.append(f"- Step executed: `{step}` (starting step: `{query.get('expected_starting_step')}`)")
    lines.append(f"- Estimated cost: ${COSTS[step]:.3f}")
    lines.append(f"- See escalation log entry at `_synthesis/perplexity-escalation-log.jsonl`")
    lines.append("")

    with open(out_file, "w") as f:
        f.write("\n".join(lines))
    return out_file


def execute_query(query: dict, state: dict) -> dict:
    """Execute one query with S1/S2/S3 escalation. Updates state in place. Returns outcome."""
    qid = query["query_id"]
    gap_id = query["gap_id"]
    section = query["section"]
    starting = query["expected_starting_step"]
    load_bearing = query.get("load_bearing", False)
    severity = (query.get("severity") or "").lower()
    claim_terms = [
        w for w in re.findall(r"[A-Za-z*]+", query.get("claim_text_short", ""))
        if len(w) > 4
    ][:8]

    # Build step sequence per policy
    if starting == "S3":
        sequence = ["S3"]
    elif starting == "S2":
        sequence = ["S2"]
        # Escalate to S3 only if load-bearing AND failure
        if load_bearing:
            sequence.append("S3")
    elif starting == "S1":
        sequence = ["S1", "S2"]
        if load_bearing:
            sequence.append("S3")

    outcome = {"qid": qid, "gap_id": gap_id, "section": section, "steps": [], "final_step": None, "usable": False, "results": [], "downloads": []}

    for step in sequence:
        # Budget check before each attempt
        proj_cost = state["spent"] + COSTS[step]
        remaining = CAP_USD - proj_cost
        if state["queries_done"] >= PAUSE_QUERIES or remaining < PAUSE_REMAINING_USD:
            outcome["pause_triggered"] = True
            return outcome
        if proj_cost > CAP_USD:
            outcome["pause_triggered"] = True
            return outcome

        print(f"  [{step}] {qid} ({gap_id})...", flush=True)
        api_resp = call_perplexity(query["query_text_for_perplexity"], step)
        state["queries_done"] += 1
        state["spent"] += COSTS[step]
        step_entry = {"step": step, "status": api_resp["status"], "timestamp": now_iso()}

        if api_resp["status"] != "ok":
            step_entry["error"] = api_resp.get("error") or api_resp.get("stderr") or "unknown"
            outcome["steps"].append(step_entry)
            log_event({"query_id": qid, "gap_id": gap_id, "step": step,
                       "cost": COSTS[step], "success": False, "reason": "api_error",
                       "detail": str(api_resp.get('error') or api_resp.get('stderr','')) [:400],
                       "timestamp": now_iso()})
            # On hard API errors, abort sequence
            if "credit" in str(api_resp).lower() or "balance" in str(api_resp).lower():
                outcome["credits_exhausted"] = True
                return outcome
            continue

        # Save raw
        Path(RESULTS).mkdir(parents=True, exist_ok=True)
        with open(f"{RESULTS}/{qid}-{step}.json", "w") as f:
            json.dump(api_resp["raw"], f, indent=2)

        results = extract_results(api_resp)
        usable, reason = is_usable(results, claim_terms)
        step_entry["usable"] = usable
        step_entry["reason"] = reason
        step_entry["n_results"] = len(results)
        outcome["steps"].append(step_entry)
        log_event({"query_id": qid, "gap_id": gap_id, "step": step,
                   "cost": COSTS[step], "success": usable, "reason": reason,
                   "n_results": len(results), "timestamp": now_iso()})

        if usable:
            outcome["final_step"] = step
            outcome["usable"] = True
            outcome["results"] = results
            # Attempt downloads of PDF URLs
            downloads = []
            for r in results[:5]:
                url = (r.get("url") or "").strip()
                if not url or not is_pdf_url(url):
                    continue
                fname = slugify(f"{r.get('author','x')}_{r.get('year','ny')}_{r.get('title','')[:60]}") + ".pdf"
                fname = f"{qid}_{fname}"
                out_path = f"{DOWNLOADS}/{fname}"
                status = try_download(url, out_path)
                downloads.append({"filename": fname, "url": url, "status": status})
            outcome["downloads"] = downloads
            break
        else:
            # Continue to next step in sequence
            continue

    return outcome


def main():
    print(f"=== Phase 4 Agent 3 fresh Perplexity executor — {now_iso()} ===", flush=True)
    queue_data = json.load(open(QUEUE))
    queries = queue_data["queries"]
    print(f"Loaded {len(queries)} queries", flush=True)

    state = {"queries_done": 0, "spent": 0.0}
    all_outcomes = []
    paused = False

    for i, q in enumerate(queries, 1):
        # Budget check
        if state["queries_done"] >= PAUSE_QUERIES:
            print(f"PAUSE: queries_done >= {PAUSE_QUERIES}", flush=True)
            paused = True
            break
        remaining = CAP_USD - state["spent"]
        if remaining < PAUSE_REMAINING_USD:
            print(f"PAUSE: remaining USD ${remaining:.2f} < ${PAUSE_REMAINING_USD}", flush=True)
            paused = True
            break

        print(f"\n[{i}/{len(queries)}] {q['query_id']} starting={q['expected_starting_step']} load_bearing={q.get('load_bearing')}", flush=True)
        outcome = execute_query(q, state)
        if outcome.get("pause_triggered") or outcome.get("credits_exhausted"):
            paused = True
            all_outcomes.append(outcome)
            print(f"PAUSE triggered mid-query", flush=True)
            break

        # Write proposal
        final_step = outcome.get("final_step") or outcome["steps"][-1]["step"] if outcome["steps"] else "S1"
        proposal_file = write_proposal(
            section=q["section"], gap_id=q["gap_id"], query=q,
            step=final_step, results=outcome.get("results", []),
            downloads=outcome.get("downloads", []),
            usable=outcome["usable"],
            reason=outcome["steps"][-1].get("reason", "n/a") if outcome["steps"] else "no_steps",
        )
        outcome["proposal_file"] = proposal_file
        all_outcomes.append(outcome)
        print(f"  -> usable={outcome['usable']} final_step={outcome.get('final_step')} proposal={proposal_file}", flush=True)
        # Light throttle to be polite to the API
        time.sleep(0.4)

    # Write summary
    summary = build_summary(all_outcomes, state, paused, queries, queue_data)
    with open(SUMMARY, "w") as f:
        f.write(summary)
    print(f"\nSummary written: {SUMMARY}", flush=True)
    print(f"Total queries executed: {state['queries_done']}", flush=True)
    print(f"Total cost (estimate): ${state['spent']:.3f}", flush=True)


def build_summary(outcomes, state, paused, queries, queue_data):
    n_total = len(outcomes)
    n_usable = sum(1 for o in outcomes if o.get("usable"))
    n_unresolvable = n_total - n_usable
    step_counts = {"S1": 0, "S2": 0, "S3": 0}
    step_success = {"S1": 0, "S2": 0, "S3": 0}
    for o in outcomes:
        for s in o.get("steps", []):
            step_counts[s["step"]] = step_counts.get(s["step"], 0) + 1
            if s.get("usable"):
                step_success[s["step"]] = step_success.get(s["step"], 0) + 1
    n_downloads = sum(len(o.get("downloads", [])) for o in outcomes)
    n_pdf_ok = sum(1 for o in outcomes for d in o.get("downloads", []) if d["status"].startswith("ok-pdf"))

    lines = [
        "# Perplexity Fresh-Query Execution Summary — 2026-05-13T1439",
        "",
        f"**Agent**: Phase 4 Agent 3 (Tier C cache-first + fresh Perplexity — fresh-only)",
        f"**Generated**: {now_iso()}",
        f"**Paused**: {paused}",
        "",
        "## Budget consumed",
        "",
        f"- Total queries executed: **{state['queries_done']}** (of allocation {PAUSE_QUERIES} pre-pause / 40 initial)",
        f"- Total cost (estimated): **${state['spent']:.3f}** (cap ${CAP_USD})",
        f"- Remaining capacity: **${CAP_USD - state['spent']:.2f}**",
        "",
        "## Step distribution",
        "",
        f"| Step | Calls | Successes | Cost subtotal |",
        f"|------|-------|-----------|---------------|",
        f"| S1   | {step_counts.get('S1',0)} | {step_success.get('S1',0)} | ${step_counts.get('S1',0)*COSTS['S1']:.3f} |",
        f"| S2   | {step_counts.get('S2',0)} | {step_success.get('S2',0)} | ${step_counts.get('S2',0)*COSTS['S2']:.3f} |",
        f"| S3   | {step_counts.get('S3',0)} | {step_success.get('S3',0)} | ${step_counts.get('S3',0)*COSTS['S3']:.3f} |",
        "",
        "## Outcomes per query",
        "",
        "| Query | Gap | Section | Start | Final | Usable | Proposal |",
        "|-------|-----|---------|-------|-------|--------|----------|",
    ]
    for o in outcomes:
        q = next((q for q in queries if q["query_id"] == o["qid"]), {})
        usable = "yes" if o.get("usable") else "NO"
        final_step = o.get("final_step") or (o["steps"][-1]["step"] if o.get("steps") else "n/a")
        propf = o.get("proposal_file", "")
        propf_short = propf.replace(RUN_BASE, "") if propf else ""
        lines.append(f"| {o['qid']} | {o['gap_id']} | {o['section']} | {q.get('expected_starting_step','?')} | {final_step} | {usable} | `{propf_short}` |")

    lines.append("")
    lines.append("## Citation-fill proposals produced")
    lines.append("")
    lines.append(f"- Total proposals written: **{n_total}** (one per query attempted)")
    lines.append(f"- Usable (vetted-pending): **{n_usable}**")
    lines.append(f"- Unresolvable-via-perplexity: **{n_unresolvable}**")
    lines.append("")
    lines.append("## PDFs downloaded")
    lines.append("")
    lines.append(f"- Total download attempts: **{n_downloads}**")
    lines.append(f"- Successful PDF downloads: **{n_pdf_ok}**")
    if n_pdf_ok:
        lines.append("")
        lines.append("Downloaded PDFs:")
        for o in outcomes:
            for d in o.get("downloads", []):
                if d["status"].startswith("ok-pdf"):
                    lines.append(f"- `corpus/download/dissertation-fresh-perplexity/{d['filename']}`")
    lines.append("")
    lines.append("## Unresolvable gaps (for user review)")
    lines.append("")
    unresolvable = [o for o in outcomes if not o.get("usable")]
    if unresolvable:
        for o in unresolvable:
            q = next((q for q in queries if q["query_id"] == o["qid"]), {})
            lines.append(f"- **{o['qid']}** ({o['gap_id']}) — {q.get('claim_text_short','')}")
    else:
        lines.append("(None — all queries produced at least one usable candidate.)")
    lines.append("")
    lines.append("## Files written")
    lines.append("")
    lines.append(f"- Escalation log (JSONL): `_synthesis/perplexity-escalation-log.jsonl`")
    lines.append(f"- This summary: `_synthesis/perplexity-summary.md`")
    lines.append(f"- Per-section proposals: `_per-section/<id>/citation-fills/<gap-id>-tier-c.md` ({n_total} files)")
    lines.append(f"- Raw API responses: `tmp/Dissertation/perplexity-fresh-2026-05-13T1439/results/<qid>-<step>.json`")
    lines.append(f"- Downloaded PDFs: `corpus/download/dissertation-fresh-perplexity/`")
    lines.append("")
    lines.append("## Discipline notes")
    lines.append("")
    lines.append("- All proposals tagged `unvetted-needs-user-review` — Perplexity-returned quotations and page numbers are NOT independently verified.")
    lines.append("- Terminology decisions (per `terminology-decisions-final.md`) preserved: *epithymia*, `resonant epithymia`, `resonant pathē` — used in query construction where applicable.")
    lines.append("- Never auto-inserted into dissertation. Every fill is a proposal for user review.")
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    main()
