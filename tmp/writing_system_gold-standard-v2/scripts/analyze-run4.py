import json, re

raw = open('tmp/msd-dissertation-strict/output-run4.json').read().strip()
depth = 0; start = None
for i, c in enumerate(raw):
    if c == '{':
        if depth == 0: start = i
        depth += 1
    elif c == '}':
        depth -= 1
        if depth == 0 and start is not None:
            d = json.loads(raw[start:i+1])
            break

r = d.get('result', {})
content = r.get('content', '')
main_text = content.split('# VALIDATION APPENDIX')[0]
msd = r.get('multiStepDiagnostics', {}) or {}
v1 = msd.get('v1Diagnostics', {}) or {}
v2d = msd.get('v2Diagnostics', {}) or {}
pp = msd.get('preventionPlan', {}) or {}
ce = r.get('citationEnforcement', {}) or {}
qs = r.get('qualityScore', 0) or d.get('qualityScore', 0)

cit_pat = re.compile(r'\([^)]+?,\s*\*[^*]+\*[^)]*\)')
citations = len(cit_pat.findall(main_text))
author_pat = re.compile(r"\((\w[\w\s.,'-]*?),\s*\*")
author_set = set(m.strip() for m in author_pat.findall(main_text) if len(m.strip()) < 50)
main_words = len(main_text.split())

quote_pat = re.compile(r'\u201c([^\u201d]{30,})\u201d|"([^"]{30,})"')
quotations = [m[0] or m[1] for m in quote_pat.findall(main_text)]

heading_pat = re.compile(r'^\s*##\s+\d+\.?\s+\w', re.MULTILINE)
headings = heading_pat.findall(main_text)

sections_raw = re.split(r'^\s*##\s+', main_text, flags=re.MULTILINE)
section_wc = []
for s in sections_raw[1:]:
    lines_s = s.strip().split('\n')
    heading = lines_s[0].strip()[:55] if lines_s else '?'
    words = len(s.split())
    section_wc.append((heading, words))

crit = len([i for i in v1.get('issues', []) if i.get('severity') == 'critical'])

print('=' * 60)
print('RUN 4 ANALYSIS (user prompt, multi-step)')
print('=' * 60)
print()
print('| Metric | Value |')
print('|--------|:-----:|')
print(f'| Main Text Words | {main_words:,} |')
print(f'| Total Words | {d.get("wordCount",0):,} |')
print(f'| Quality Score | {qs*100:.1f}% |')
print(f'| Citations (main text) | {citations} |')
print(f'| Citation Pass Rate | {ce.get("passRate",0)*100:.0f}% |')
print(f'| Hallucinated Citations | {ce.get("hallucinatedCitations",0)} |')
print(f'| Unique Authors Cited | {len(author_set)} |')
print(f'| Quotations (>30ch) | {len(quotations)} |')
print(f'| Standalone ## Headings | {len(headings)} |')
print()
print('### V1 Investigation Summary')
print(f'| V1 Metric | Value |')
print(f'|-----------|:-----:|')
print(f'| V1 Word Count | {v1.get("wordCount", "?")} |')
print(f'| V1 Citations | {v1.get("citationCount", "?")} |')
print(f'| V1 Quotations | {v1.get("quotationCount", "?")} |')
print(f'| V1 Quality Score | {v1.get("qualityScore",0)*100:.1f}% |' if v1.get("qualityScore") else '| V1 Quality Score | ? |')
print(f'| V1 Critical Issues | {crit} |')
print(f'| Factual claims w/o cit | {v1.get("factualClaimsWithoutCitation", "?")} |')
print(f'| Interpretive claims w/o cit | {v1.get("interpretiveClaimsWithoutCitation", "?")} |')
print(f'| Blacklisted Authors | {pp.get("blacklistedAuthors", [])} |')
print(f'| Blacklisted in main text (v2) | {v2d.get("blacklistedAuthorsInMainText", "?")} |')
print(f'| Blacklisted in appendix (v2) | {v2d.get("blacklistedAuthorsInAppendix", "?")} |')
print()
print('### Section Word Counts')
for heading, wc in section_wc:
    status = 'OK' if wc >= 200 else 'SHORT'
    print(f'  {heading}: {wc} words [{status}]')
print()
print(f'### Quotations Found ({len(quotations)})')
for i, q in enumerate(quotations[:12], 1):
    print(f'  Q{i}: "{q[:85]}..."')
print()
print('### Unique Authors Cited')
for a in sorted(author_set):
    print(f'  - {a}')
print()
if pp.get('strengthenedConstraints'):
    print(f'### Prevention Plan Constraints ({len(pp["strengthenedConstraints"])})')
    for c in pp['strengthenedConstraints']:
        print(f'  - {c[:95]}')
