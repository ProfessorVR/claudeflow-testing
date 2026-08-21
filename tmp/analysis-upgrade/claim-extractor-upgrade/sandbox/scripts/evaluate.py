"""Auto-label gold set and compute evaluation metrics using Opus + extended thinking.

Two passes:
  1. PRECISION audit — for each extractor claim, judge correctness across 5 dims.
  2. RECALL audit — for each chunk, opus independently enumerates gold claims.

Outputs:
  gold/<slug>-precision.jsonl   (one judgment per extractor claim)
  gold/<slug>-recall.jsonl      (one opus-gold claim per entry)
  gold/<slug>-metrics.json      (P/R/F1 + per-dimension accuracy)
  gold/<slug>-flagged.jsonl     (claims with confidence < 0.7 or disagreement)
"""
from __future__ import annotations
import json
import os
import re
import sys
import time
from pathlib import Path
from string import Template
from typing import Any

from anthropic import Anthropic

SCRIPT_DIR = Path(__file__).resolve().parent
PROMPT_DIR = SCRIPT_DIR / "prompts"
GOLD_DIR = SCRIPT_DIR.parent / "gold"
OUTPUT_DIR = SCRIPT_DIR.parent / "output"
REPO = SCRIPT_DIR.resolve().parents[4]

GOLD_DIR.mkdir(parents=True, exist_ok=True)

# Load env
env_path = REPO / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.strip() and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

JUDGE_MODEL = "claude-opus-4-5"
THINKING_BUDGET = 6000  # extended thinking budget per call
JUDGE_MAX_TOKENS = 12000  # total response budget (thinking + output)

client = Anthropic()


def _robust_json_array(raw: str) -> list | None:
    s = raw.strip()
    s = re.sub(r"^```(?:json)?\s*", "", s)
    s = re.sub(r"\s*```$", "", s)
    try:
        obj = json.loads(s)
        if isinstance(obj, list):
            return obj
    except Exception:
        pass
    start = s.find("[")
    if start < 0:
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(s)):
        ch = s[i]
        if esc:
            esc = False
            continue
        if ch == "\\":
            esc = True
            continue
        if ch == '"':
            in_str = not in_str
            continue
        if in_str:
            continue
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                candidate = s[start : i + 1]
                try:
                    return json.loads(candidate)
                except Exception:
                    fixed = re.sub(r",(\s*[\]\}])", r"\1", candidate)
                    try:
                        return json.loads(fixed)
                    except Exception:
                        return None
    last = s.rfind("},")
    if last > start:
        candidate = s[start : last + 1] + "]"
        try:
            return json.loads(candidate)
        except Exception:
            try:
                return json.loads(re.sub(r",(\s*[\]\}])", r"\1", candidate))
            except Exception:
                return None
    return None


def call_opus(prompt: str, max_tokens: int = JUDGE_MAX_TOKENS, thinking: bool = True) -> tuple[str, dict]:
    """Invoke Opus with extended thinking. Returns (text, usage)."""
    kwargs: dict[str, Any] = {
        "model": JUDGE_MODEL,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    if thinking:
        kwargs["thinking"] = {"type": "enabled", "budget_tokens": THINKING_BUDGET}
        # When thinking is on, temperature must be default (1.0) — do not set
    msg = client.messages.create(**kwargs)
    # Concatenate text blocks (thinking blocks are separate and not included)
    parts = []
    for b in msg.content:
        if b.type == "text":
            parts.append(b.text)
    return "\n".join(parts), {
        "input_tokens": msg.usage.input_tokens,
        "output_tokens": msg.usage.output_tokens,
        "stop_reason": msg.stop_reason,
    }


def load_extractor_claims(slug: str) -> list[dict]:
    path = OUTPUT_DIR / f"{slug}-v1.jsonl"
    return [json.loads(l) for l in path.read_text().splitlines() if l.strip()]


def group_by_chunk(claims: list[dict]) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = {}
    for c in claims:
        groups.setdefault(c["chunk_id"], []).append(c)
    return groups


def rebuild_chunk_text(claims_in_chunk: list[dict], genre: str) -> str:
    """Reconstruct chunk text by reading the PDF pages."""
    # Use pdf_pages from the first claim
    first = claims_in_chunk[0]
    pdf_pages = first["pdf_pages"]
    # Need to know the PDF path from source — we stored source.slug, but not the pdf path.
    # Simpler: precompute chunk text maps from the extractor chunks.
    raise NotImplementedError("use cached chunk_text_map instead")


def compute_chunk_text_cache(slug: str, pdf_path: Path, first_page: int, last_page: int, genre: str) -> dict[str, str]:
    """Recompute chunks (deterministic) to get chunk_id → text."""
    from pdf_utils import read_pdf_pages, chunk_primary_by_bekker, chunk_secondary_by_pages
    pages = read_pdf_pages(pdf_path, first_page, last_page)
    if genre == "primary":
        chunks = chunk_primary_by_bekker(pages, target_chars=2500)
    else:
        chunks = chunk_secondary_by_pages(pages, pages_per_chunk=3)
    return {c["id"]: c["text"] for c in chunks}


def judge_precision(
    author: str,
    title: str,
    year: str,
    genre: str,
    chunk_text: str,
    claims: list[dict],
    batch_size: int = 10,
) -> list[dict]:
    """Run precision audit on a chunk's claims with Opus+thinking, batched."""
    tpl = Template((PROMPT_DIR / "judge_precision.md").read_text())
    all_judgments: list[dict] = []
    for i in range(0, len(claims), batch_size):
        batch = claims[i : i + batch_size]
        claims_slim = [
            {
                "id": c["id"],
                "quote": c.get("quote", ""),
                "claim": c.get("claim", ""),
                "claim_type": c.get("claim_type", ""),
                "stance": c.get("stance", ""),
                "use_mention": c.get("use_mention", ""),
                "speaker": c.get("speaker", ""),
            }
            for c in batch
        ]
        prompt = tpl.safe_substitute(
            author=author, title=title, year=year, genre=genre,
            chunk_text=chunk_text,
            claims_json=json.dumps(claims_slim, indent=2),
        )
        t0 = time.time()
        try:
            text, usage = call_opus(prompt)
            arr = _robust_json_array(text) or []
            print(
                f"    precision batch {i//batch_size+1}: {len(arr)}/{len(batch)} judged  "
                f"({time.time()-t0:.1f}s  {usage['input_tokens']}in/{usage['output_tokens']}out)"
            )
            all_judgments.extend(arr)
        except Exception as e:
            print(f"    ERR: {type(e).__name__}: {e}", file=sys.stderr)
    return all_judgments


def opus_gold_enumerate(
    author: str, title: str, year: str, genre: str, chunk_id: str, chunk_text: str
) -> list[dict]:
    tpl = Template((PROMPT_DIR / "judge_recall.md").read_text())
    prompt = tpl.safe_substitute(
        author=author, title=title, year=year, genre=genre, chunk_text=chunk_text
    )
    t0 = time.time()
    text, usage = call_opus(prompt)
    arr = _robust_json_array(text) or []
    # attribute chunk_id
    for a in arr:
        a["chunk_id"] = chunk_id
    print(
        f"    gold-recall {chunk_id}: {len(arr)} claims  "
        f"({time.time()-t0:.1f}s  {usage['input_tokens']}in/{usage['output_tokens']}out)"
    )
    return arr


def semantic_match(extracted: dict, gold: dict) -> bool:
    """Simple semantic match: quote substring overlap + claim token overlap."""
    eq = (extracted.get("quote") or "").lower()
    gq = (gold.get("quote") or "").lower()
    if len(eq) > 15 and len(gq) > 15:
        # Quote overlap of ~40% of shorter quote is a strong signal
        shorter = eq if len(eq) < len(gq) else gq
        longer = gq if shorter is eq else eq
        # find longest common substring of reasonable length
        if any(shorter[i:i+40] in longer for i in range(0, len(shorter)-40, 10)) or shorter[:30] in longer or longer[:30] in shorter:
            return True
    # fallback: claim token Jaccard
    ec = set(re.findall(r"\w+", (extracted.get("claim") or "").lower()))
    gc = set(re.findall(r"\w+", (gold.get("claim") or "").lower()))
    if len(ec) > 3 and len(gc) > 3:
        inter = ec & gc
        union = ec | gc
        if len(inter) / len(union) > 0.35:
            return True
    return False


def compute_metrics(
    claims: list[dict], precision_judgments: list[dict], gold_claims: list[dict]
) -> dict:
    # precision: fraction of claims where is_claim AND claim_paraphrase_ok
    pj = {j["id"]: j for j in precision_judgments}
    n_pj = len(pj)
    good = sum(1 for j in pj.values() if j.get("is_claim") and j.get("claim_paraphrase_ok"))
    precision = good / n_pj if n_pj else 0.0

    # per-dim accuracy (over claims judged)
    def frac(field):
        return sum(1 for j in pj.values() if j.get(field)) / n_pj if n_pj else 0.0

    type_acc = frac("claim_type_ok")
    stance_acc = frac("stance_ok")
    use_mention_acc = frac("use_mention_ok")
    speaker_acc = frac("speaker_ok")

    # recall: fraction of gold claims that have a semantic match in extractor claims
    matched_gold = 0
    for g in gold_claims:
        for c in claims:
            if c.get("chunk_id") == g.get("chunk_id") and semantic_match(c, g):
                matched_gold += 1
                break
    recall = matched_gold / len(gold_claims) if gold_claims else 0.0

    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0

    grounded = sum(1 for c in claims if c.get("grounding", {}).get("quote_match"))
    grounding_rate = grounded / len(claims) if claims else 0.0

    low_conf = sum(1 for j in pj.values() if (j.get("confidence") or 1.0) < 0.7)

    return {
        "n_extracted": len(claims),
        "n_judged": n_pj,
        "n_gold": len(gold_claims),
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1": round(f1, 3),
        "type_accuracy": round(type_acc, 3),
        "stance_accuracy": round(stance_acc, 3),
        "use_mention_accuracy": round(use_mention_acc, 3),
        "speaker_accuracy": round(speaker_acc, 3),
        "grounding_rate": round(grounding_rate, 3),
        "low_confidence_claims": low_conf,
    }


def flag_uncertain(
    claims: list[dict], precision_judgments: list[dict]
) -> list[dict]:
    """Produce a list of flagged items for human review."""
    claims_by_id = {c["id"]: c for c in claims}
    flagged = []
    for j in precision_judgments:
        cid = j.get("id")
        c = claims_by_id.get(cid)
        if not c:
            continue
        reasons = []
        conf = j.get("confidence", 1.0)
        if conf < 0.7:
            reasons.append(f"low_confidence={conf}")
        for dim in ("is_claim", "claim_paraphrase_ok", "claim_type_ok", "stance_ok", "use_mention_ok", "speaker_ok"):
            if j.get(dim) is False:
                reasons.append(f"bad_{dim}")
        if c.get("faithfulness") == "unsupported":
            reasons.append("unsupported_quote")
        if reasons:
            flagged.append({
                "claim_id": cid,
                "reasons": reasons,
                "judge_note": j.get("note", ""),
                "extractor_quote": c.get("quote"),
                "extractor_claim": c.get("claim"),
                "extractor_speaker": c.get("speaker"),
                "extractor_claim_type": c.get("claim_type"),
                "extractor_stance": c.get("stance"),
                "extractor_use_mention": c.get("use_mention"),
                "judge_corrections": {
                    "claim_type": j.get("claim_type_correct"),
                    "stance": j.get("stance_correct"),
                    "use_mention": j.get("use_mention_correct"),
                    "speaker": j.get("speaker_correct"),
                },
            })
    return flagged


SETTINGS = {
    "da-3.3": {
        "slug": "aristotle-da-3.3",
        "pdf": "/home/dalton/projects/claudeflow-testing/corpus/rhetorical_ontology/Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf",
        "first_page": 41, "last_page": 44, "genre": "primary",
        "author": "Aristotle", "title": "De Anima", "year": "c. 350 BCE",
    },
    "caston-1995": {
        "slug": "caston-1995",
        "pdf": "/home/dalton/projects/claudeflow-testing/corpus/rhetorical_ontology/Caston, Victor - Why Aristotle Needs Imagination_(1995)_[Clean Copy].pdf",
        "first_page": 2, "last_page": 7, "genre": "secondary",
        "author": "Caston, Victor", "title": "Why Aristotle Needs Imagination", "year": "1995",
    },
    "bcap": {
        "slug": "heidegger-bcap",
        "pdf": "/home/dalton/projects/claudeflow-testing/corpus/rhetorical_ontology/Heidegger, Martin - Basic Concepts of Aristotelian Philosophy_(2009)_[Clean Copy].pdf",
        "first_page": 25, "last_page": 30, "genre": "primary",
        "author": "Heidegger, Martin", "title": "Basic Concepts of Aristotelian Philosophy", "year": "2009",
    },
}


def evaluate_passage(key: str, do_recall: bool = True) -> dict:
    s = SETTINGS[key]
    print(f"\n=== EVALUATE {key} ({s['slug']}) ===")
    claims = load_extractor_claims(s["slug"])
    chunk_texts = compute_chunk_text_cache(
        s["slug"], Path(s["pdf"]), s["first_page"], s["last_page"], s["genre"]
    )
    chunks = group_by_chunk(claims)

    # Precision audit per chunk
    all_precision: list[dict] = []
    for chunk_id, chunk_claims in chunks.items():
        print(f"  precision audit: {chunk_id} ({len(chunk_claims)} claims)")
        chtext = chunk_texts.get(chunk_id, "")
        judgments = judge_precision(
            s["author"], s["title"], s["year"], s["genre"],
            chtext, chunk_claims,
        )
        all_precision.extend(judgments)

    (GOLD_DIR / f"{s['slug']}-precision.jsonl").write_text(
        "\n".join(json.dumps(j) for j in all_precision)
    )

    # Recall audit (opus independently enumerates gold claims)
    gold_claims: list[dict] = []
    if do_recall:
        for chunk_id, chtext in chunk_texts.items():
            print(f"  recall audit: {chunk_id}")
            gc = opus_gold_enumerate(
                s["author"], s["title"], s["year"], s["genre"], chunk_id, chtext
            )
            gold_claims.extend(gc)
        (GOLD_DIR / f"{s['slug']}-recall.jsonl").write_text(
            "\n".join(json.dumps(g) for g in gold_claims)
        )

    # Metrics
    metrics = compute_metrics(claims, all_precision, gold_claims)
    (GOLD_DIR / f"{s['slug']}-metrics.json").write_text(json.dumps(metrics, indent=2))

    # Flag uncertain
    flagged = flag_uncertain(claims, all_precision)
    (GOLD_DIR / f"{s['slug']}-flagged.jsonl").write_text(
        "\n".join(json.dumps(f) for f in flagged)
    )
    print(f"  metrics: {metrics}")
    print(f"  flagged: {len(flagged)} items")
    return metrics


if __name__ == "__main__":
    keys = sys.argv[1:] or list(SETTINGS.keys())
    results = {}
    for k in keys:
        results[k] = evaluate_passage(k)
    print("\n=== FINAL SUMMARY ===")
    for k, m in results.items():
        print(f"{k}: {m}")
