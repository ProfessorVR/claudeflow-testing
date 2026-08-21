#!/usr/bin/env python3
"""FCDP quote-ID substitution (Stage D2 -> Gate G-B).

Replaces «Qnn» markers in a draft with character-exact text from the pack's
quotation bank, so the model never generates quoted text token-by-token.

Bank format (JSON): { "Q1": {"text": "...", "cite": "(Gross 4)"}, ... }
  - "text" is substituted verbatim (already carrying LaTeX ``...'' markup).
  - "cite" is appended after the text iff the marker is written «Q1+».
  - «Q1@» substitutes the CITE ONLY (for \\footnote{«Q1@».} constructions).

Usage: substitute-quote-ids.py <draft.md> <bank.json> <out.md>
Exit 1 on unknown IDs (gate failure); reports unused bank entries to stderr.
"""
import json, re, sys

draft_path, bank_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
draft = open(draft_path).read()
bank = json.load(open(bank_path))

used, unknown = set(), []

def sub(m):
    qid, mode = m.group(1), m.group(2)
    if qid not in bank:
        unknown.append(qid)
        return m.group(0)
    used.add(qid)
    e = bank[qid]
    if mode == '@':
        return e.get('cite', '')
    return e['text'] + ((' ' + e['cite']) if mode == '+' and e.get('cite') else '')

result = re.sub(r'«([A-Z]\d+)([+@]?)»', sub, draft)
open(out_path, 'w').write(result)

unused = sorted(set(bank) - used)
if unused:
    print(f'UNUSED bank entries: {", ".join(unused)}', file=sys.stderr)
if unknown:
    print(f'GATE FAIL — unknown quote IDs in draft: {", ".join(sorted(set(unknown)))}', file=sys.stderr)
    sys.exit(1)
print(f'OK — {len(used)} quotes substituted; {len(unused)} bank entries unused')
