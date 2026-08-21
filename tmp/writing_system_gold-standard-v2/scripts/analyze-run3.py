import json, re, sys

raw = open('tmp/msd-dissertation-strict/output-run3.json').read().strip()
depth = 0
start = None
d = None
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
msd = r.get('multiStepDiagnostics', {})
v1 = msd.get('v1Diagnostics', {})
v2d = msd.get('v2Diagnostics', {})
pp = msd.get('preventionPlan', {})
ce = r.get('citationEnforcement', {})
qs = r.get('qualityScore', 0) or d.get('qualityScore', 0)

cit_pat = re.compile(r'\([^)]+?,\s*\*[^*]+\*[^)]*\)')
citations = len(cit_pat.findall(main_text))
author_pat = re.compile(r"\((\w[\w\s.,'-]*?),\s*\*")
author_set = set(m.strip() for m in author_pat.findall(main_text) if len(m.strip()) < 50)
main_words = len(main_text.split())

quote_pat = re.compile(r'\u201c([^\u201d]{40,})\u201d|"([^"]{40,})"')
quotations = [m[0] or m[1] for m in quote_pat.findall(main_text)]

heading_pat = re.compile(r'^\s*##\s+\d+\.?\s+\w', re.MULTILINE)
headings = heading_pat.findall(main_text)
inline_heading_pat = re.compile(r'[^\n]##\s+\d+')
inline_headings = inline_heading_pat.findall(main_text)

sections_raw = re.split(r'^\s*##\s+', main_text, flags=re.MULTILINE)
section_wc = []
for s in sections_raw[1:]:
    lines_s = s.strip().split('\n')
    heading = lines_s[0].strip()[:50] if lines_s else '?'
    words = len(s.split())
    section_wc.append((heading, words))

crit = len([i for i in v1.get('issues', []) if i.get('severity') == 'critical'])

print('=' * 60)
print('RUN 3 ANALYSIS (with all P0/P1/P2 improvements)')
print('=' * 60)
print()
print('| Metric | Run 2 | Run 3 | Delta |')
print('|--------|:-----:|:-----:|:-----:|')
print(f'| Main Text Words | 2,760 | {main_words:,} | {main_words-2760:+,} |')
print(f'| Total Words | 3,085 | {d.get("wordCount",0):,} | {d.get("wordCount",0)-3085:+,} |')
print(f'| Quality Score | 68.6% | {qs*100:.1f}% | {(qs-0.686)*100:+.1f}pp |')
print(f'| Citations | 24 | {citations} | {citations-24:+d} |')
print(f'| Citation Pass Rate | 100% | {ce.get("passRate",0)*100:.0f}% | {(ce.get("passRate",0)-1)*100:+.0f}pp |')
print(f'| Hallucinated | 0 | {ce.get("hallucinatedCitations",0)} | {ce.get("hallucinatedCitations",0):+d} |')
print(f'| Unique Authors | 9 | {len(author_set)} | {len(author_set)-9:+d} |')
print(f'| Quotations (>40ch) | 0 | {len(quotations)} | {len(quotations):+d} |')
print(f'| V1 Issues (crit) | 6 | {crit} | {crit-6:+d} |')
v1qs = v1.get('qualityScore', 0)
print(f'| V1 Quality Score | N/A | {v1qs*100:.1f}% | - |')
print()
print('### New Diagnostics')
print('| Metric | Value |')
print('|--------|:-----:|')
print(f'| Factual claims w/o cit (v1) | {v1.get("factualClaimsWithoutCitation", "?")} |')
print(f'| Interpretive claims w/o cit (v1) | {v1.get("interpretiveClaimsWithoutCitation", "?")} |')
print(f'| Blacklisted in main text (v2) | {v2d.get("blacklistedAuthorsInMainText", "?")} |')
print(f'| Blacklisted in appendix (v2) | {v2d.get("blacklistedAuthorsInAppendix", "?")} |')
print()
print('### Heading Structure')
print(f'  Standalone ## headings: {len(headings)}')
print(f'  Inline ## headings (BAD): {len(inline_headings)}')
print()
print('### Section Word Counts')
for heading, wc in section_wc:
    status = 'OK' if wc >= 350 else 'SHORT'
    print(f'  {heading}: {wc} words [{status}]')
print()
print(f'### Quotations Found ({len(quotations)})')
for i, q in enumerate(quotations[:8], 1):
    print(f'  Q{i}: "{q[:80]}..."')
print()
print('### Unique Authors Cited')
for a in sorted(author_set):
    print(f'  - {a}')
print()
if pp.get('blacklistedAuthors'):
    print('### Prevention Plan')
    print(f'  Blacklisted: {pp["blacklistedAuthors"]}')
if pp.get('strengthenedConstraints'):
    print(f'  Constraints ({len(pp["strengthenedConstraints"])}):')
    for c in pp['strengthenedConstraints']:
        print(f'    - {c[:90]}')
