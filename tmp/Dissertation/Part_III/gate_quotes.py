#!/usr/bin/env python
"""Gate quotation candidates against archon-cli-v3. EXACT or it does not pass.

Procedure, forced by two observed tool behaviors:
  1. unrestricted verify-quote first;
  2. on anything short of exact, retry restricted to each document mapped to that
     unit -- hyphens break the FTS query parser, and unrestricted search has been
     seen to miss a quotation that is present;
  3. only then is it a real mismatch.

Writes TSV: unit, verdict, similarity, doc, page_start, page_end, quote
"""
import json
import subprocess
import sys

ARCHON = "/home/dalton/projects/archon-cli-v3/target/release/archon"
CWD = "/home/dalton/projects/archon-cli-v3"

DOCS = {
    "bor-sec-07": ["doc-7b4409b6-8e74-4a53-8e61-2d7ea223b7aa"],   # Gibbs
    "bor-sec-10": ["doc-a478090c-b3af-4eb4-8adc-a4d87b6d7be7"],   # Quaranta
    "bor-sec-11": ["doc-c6a9d67f-3f61-47af-a01e-4796933e3c24"],   # Hernandez Albarracin
    "bor-sec-18": ["doc-a6967eb2-cc50-4950-8aa7-04d3dfb8cbc1"],   # Mansikka
    "bor-sec-19": ["doc-bd86b6bb-4a4f-4fcf-92d3-69c8971e6241"],   # Thomson
    "bor-sec-25": ["doc-23f28860-c323-4d39-a7c5-e5fcee4d49ce"],   # Elpidorou, Guiding Mind
    "bor-sec-26": ["doc-e2d98bca-2a86-47c4-b98a-ca664df4121a"],   # Elpidorou, Good of Boredom
    "bor-sec-27": ["doc-e3a94d1b-0e09-459f-b143-46bf1df83efc"],   # Barry
    "bor-sec-28": ["doc-7b32556c-da47-4705-bdee-a6c06f9914bb"],   # Kim, Joochan (NOT Jaegwon)
    "bor-sec-29": ["doc-204cc5ca-7e44-4957-8efd-59e4f25533f9"],   # Miyauchi & Kawasaki
    "bor-sec-30": ["doc-61498135-1568-42a2-aa0a-dc1f4b81f7b0"],   # Perone
    "bor-sec-32": ["doc-c5b43ab1-419f-48c9-b553-6f42d7b18ee7",    # Yakobi -- DUPLICATE
                   "doc-51dc7375-e6ec-415d-a067-e79fd81488b4"],   #   ingestion, both tried
    "bor-sec-33": ["doc-8211b862-13e1-43dc-9f66-3543e0fb55e9"],   # Yuvaraj
    "bor-sec-36": ["doc-2f74668d-4b53-44ae-95ce-75a7bec8336e"],   # Holmqvist
    "bor-sec-38": ["doc-351220f1-f9c0-4d91-9741-8a5701a7080f"],   # Scharinger
    "bor-sec-44": ["doc-b0513b0a-3e34-4727-829f-ec08cdc4adc1"],   # Nacke & Craig
}


def call(quote, doc=None):
    cmd = [ARCHON, "docs", "verify-quote", quote, "--json", "--limit", "4"]
    if doc:
        cmd += ["--doc", doc]
    try:
        p = subprocess.run(cmd, cwd=CWD, capture_output=True, text=True, timeout=240)
    except subprocess.TimeoutExpired:
        return None
    if p.returncode != 0:
        return None
    try:
        return json.loads(p.stdout)
    except Exception:
        return None


def best_exact(d):
    if not d:
        return None
    for l in d.get("locations") or []:
        if l.get("match_kind") == "exact":
            return l
    return None


def main(inp, outp):
    rows = []
    with open(inp, encoding="utf-8") as fh:
        for line in fh:
            if not line.strip() or line.startswith("#"):
                continue
            u, q = line.rstrip("\n").split("\t", 1)
            rows.append((u.strip(), q.strip()))

    out = open(outp, "w", encoding="utf-8")
    out.write("unit\tverdict\tsim\tdoc\tpage_start\tpage_end\tquote\n")
    n_ok = n_bad = 0
    for i, (unit, quote) in enumerate(rows, 1):
        hit = best_exact(call(quote))
        how = "unrestricted"
        if hit is None:
            for doc in DOCS.get(unit, []):
                hit = best_exact(call(quote, doc))
                if hit is not None:
                    how = "doc-restricted"
                    break
        if hit is None:
            n_bad += 1
            out.write(f"{unit}\tFAIL\t\t\t\t\t{quote}\n")
        else:
            n_ok += 1
            src = hit["source_path"].rsplit("/", 1)[-1]
            out.write(f"{unit}\tEXACT({how})\t{hit.get('similarity', 1.0):.3f}\t{src}\t"
                      f"{hit.get('page_start')}\t{hit.get('page_end')}\t{quote}\n")
        out.flush()
        if i % 25 == 0:
            print(f"  {i}/{len(rows)}  exact={n_ok} fail={n_bad}", flush=True)
    out.close()
    print(f"DONE  exact={n_ok}  fail={n_bad}  of {len(rows)}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
