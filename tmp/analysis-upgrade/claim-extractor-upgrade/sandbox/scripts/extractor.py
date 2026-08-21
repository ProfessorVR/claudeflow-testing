"""Claim extractor v1 — shared pipeline, genre-parameterized.

Usage:
    from extractor import Extractor
    ex = Extractor(genre="primary", model="claude-sonnet-4-5")
    claims = ex.extract_pdf("/path/to/DA.pdf", first_page=41, last_page=44,
                            source={"author":"Aristotle","title":"De Anima","year":"c. 350 BCE"})
"""
from __future__ import annotations
import json
import os
import re
import sys
import time
from pathlib import Path
from string import Template
from typing import Literal

from anthropic import Anthropic

from pdf_utils import (
    read_pdf_pages,
    chunk_primary_by_bekker,
    chunk_secondary_by_pages,
    nearest_bekker_before,
)
from fuzzy_match import fuzzy_locate


SCRIPT_DIR = Path(__file__).resolve().parent
PROMPT_DIR = SCRIPT_DIR / "prompts"
REPO = SCRIPT_DIR.resolve().parents[4]


def _load_env():
    env_path = REPO / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.strip() and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


_load_env()


def _robust_json_array(raw: str) -> list | None:
    """Extract a JSON array from LLM output, tolerant of markdown fences,
    preamble text, trailing commentary, trailing commas, and truncated arrays."""
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
    # Unclosed; salvage by truncating at last complete object
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


class Extractor:
    def __init__(
        self,
        genre: Literal["primary", "secondary"] = "primary",
        model: str = "claude-sonnet-4-5",
        max_tokens: int = 8000,
        verify: bool = True,
    ):
        self.genre = genre
        self.model = model
        self.max_tokens = max_tokens
        self.verify = verify
        self.client = Anthropic()
        self._prompt_cand = Template((PROMPT_DIR / f"candidate_{genre}.md").read_text())
        self._prompt_verify = Template((PROMPT_DIR / "verify_faithfulness.md").read_text())
        self._cost_total = 0.0
        self._api_calls = 0

    # ----- stage 1: chunk -----
    def chunk_pdf(self, pdf_path: Path, first: int, last: int) -> list[dict]:
        pages = read_pdf_pages(pdf_path, first, last)
        if self.genre == "primary":
            return chunk_primary_by_bekker(pages, target_chars=2500)
        return chunk_secondary_by_pages(pages, pages_per_chunk=2)

    # ----- stage 2-5: combined extraction via LLM -----
    def extract_chunk(self, chunk: dict, source: dict) -> list[dict]:
        prompt = self._prompt_cand.safe_substitute(
            author=source.get("author", "Unknown"),
            title=source.get("title", "Unknown"),
            year=source.get("year", "Unknown"),
            book_chapter=chunk.get("book_chapter", "") or "",
            bekker_range=chunk.get("bekker_range", "") or "",
            pdf_pages=str(chunk.get("pdf_pages", [])),
            section_header=chunk.get("section_header", "") or "",
            chunk_text=chunk["text"],
        )
        t0 = time.time()
        msg = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        self._api_calls += 1
        dt = time.time() - t0
        # rough cost model (sonnet-4.5: $3/M in, $15/M out)
        usage = msg.usage
        in_cost = usage.input_tokens * 3 / 1_000_000
        out_cost = usage.output_tokens * 15 / 1_000_000
        self._cost_total += in_cost + out_cost
        raw = msg.content[0].text.strip()
        claims = _robust_json_array(raw)
        if claims is None:
            # dump for debugging
            dbg = Path(f"/tmp/extractor_debug_{chunk['id']}.txt")
            dbg.write_text(raw)
            print(
                f"[WARN] chunk {chunk['id']}: JSON parse failed (stop_reason={msg.stop_reason}, "
                f"out_tokens={usage.output_tokens}). Raw saved to {dbg}",
                file=sys.stderr,
            )
            return []
        print(
            f"  chunk {chunk['id']}: {len(claims)} claims  "
            f"({dt:.1f}s  {usage.input_tokens}in/{usage.output_tokens}out  ${in_cost+out_cost:.4f})"
        )
        return claims

    # ----- stage 6a: verify grounding (Python fuzzy-match) -----
    def verify_grounding(self, claim: dict, chunk: dict) -> dict:
        res = fuzzy_locate(claim.get("quote", ""), chunk["text"])
        anchor = None
        if res["found"] and res["char_start"] is not None:
            anchor = nearest_bekker_before(chunk["text"], res["char_start"])
        return {
            "quote_match": res["found"],
            "match_ratio": res["ratio"],
            "char_start": res["char_start"],
            "char_end": res["char_end"],
            "matched_span": res["matched_span"],
            "extracted_anchor": anchor,
        }

    # ----- stage 6b: verify faithfulness (LLM-as-judge, batched) -----
    def verify_faithfulness(self, claims_with_quotes: list[dict], batch_size: int = 20) -> dict[str, dict]:
        if not claims_with_quotes:
            return {}
        verdicts: dict[str, dict] = {}
        for i in range(0, len(claims_with_quotes), batch_size):
            batch = claims_with_quotes[i : i + batch_size]
            items = "\n".join(
                f'- id: {c["id"]}\n  quote: "{c["quote"]}"\n  claim: "{c["claim"]}"'
                for c in batch
            )
            prompt = self._prompt_verify.safe_substitute(items=items)
            t0 = time.time()
            msg = self.client.messages.create(
                model=self.model,
                max_tokens=3000,
                messages=[{"role": "user", "content": prompt}],
            )
            self._api_calls += 1
            usage = msg.usage
            in_cost = usage.input_tokens * 3 / 1_000_000
            out_cost = usage.output_tokens * 15 / 1_000_000
            self._cost_total += in_cost + out_cost
            raw = msg.content[0].text.strip()
            arr = _robust_json_array(raw) or []
            for r in arr:
                verdicts[r["id"]] = r
            print(
                f"  verify batch {i // batch_size + 1}: {len(arr)}/{len(batch)} judged  "
                f"({time.time()-t0:.1f}s  ${in_cost+out_cost:.4f})"
            )
        return verdicts

    # ----- top-level -----
    def extract_pdf(
        self,
        pdf_path: Path,
        first_page: int,
        last_page: int,
        source: dict,
    ) -> list[dict]:
        chunks = self.chunk_pdf(Path(pdf_path), first_page, last_page)
        print(f"[extract] {len(chunks)} chunks from pages {first_page}-{last_page}")
        all_claims = []
        for chunk in chunks:
            raw_claims = self.extract_chunk(chunk, source)
            for j, c in enumerate(raw_claims):
                cid = f"claim-{source.get('slug','src')}-{len(all_claims)+1:03d}"
                c["id"] = cid
                c["source"] = source
                c["chunk_id"] = chunk["id"]
                c["pdf_pages"] = chunk["pdf_pages"]
                # stage 6a: grounding
                c["grounding"] = self.verify_grounding(c, chunk)
                all_claims.append(c)

        # stage 6b: faithfulness (only on grounding-verified)
        if self.verify:
            grounded = [c for c in all_claims if c["grounding"]["quote_match"]]
            verdicts = self.verify_faithfulness(grounded)
            for c in all_claims:
                v = verdicts.get(c["id"])
                c["faithfulness"] = v["faithfulness"] if v else "unchecked"
                c["faithfulness_note"] = v["note"] if v else ""

        print(
            f"[extract] done. {len(all_claims)} claims.  "
            f"${self._cost_total:.3f} total, {self._api_calls} API calls."
        )
        return all_claims


# CLI
if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--pdf", required=True)
    p.add_argument("--first-page", type=int, required=True)
    p.add_argument("--last-page", type=int, required=True)
    p.add_argument("--genre", choices=["primary", "secondary"], required=True)
    p.add_argument("--author", required=True)
    p.add_argument("--title", required=True)
    p.add_argument("--year", required=True)
    p.add_argument("--slug", required=True, help="short id for claim ids")
    p.add_argument("--out", required=True)
    p.add_argument("--model", default="claude-sonnet-4-5")
    p.add_argument("--no-verify", action="store_true")
    args = p.parse_args()

    ex = Extractor(genre=args.genre, model=args.model, verify=not args.no_verify)
    claims = ex.extract_pdf(
        args.pdf, args.first_page, args.last_page,
        source={"author": args.author, "title": args.title,
                "year": args.year, "slug": args.slug}
    )
    Path(args.out).write_text("\n".join(json.dumps(c) for c in claims))
    print(f"wrote {len(claims)} claims → {args.out}")
