import json, re

raw = open('tmp/msd-dissertation-strict/output-run5.json').read().strip()
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
section_texts = {}
for s in sections_raw[1:]:
    lines_s = s.strip().split('\n')
    heading = lines_s[0].strip()[:55] if lines_s else '?'
    words = len(s.split())
    section_wc.append((heading, words))
    section_texts[heading.lower()[:20]] = s

# Count primary vs secondary citations per section
aristotle_cit = len(re.findall(r'\(Aristotle,', main_text))
heidegger_cit = len(re.findall(r'\(Heidegger,', main_text))
secondary_cit = citations - aristotle_cit - heidegger_cit

# Check for phantasia internal distinctions
phantasia_section = ''
for k, v in section_texts.items():
    if 'phantasia' in k or 'imagination' in k:
        phantasia_section = v
phantasia_keywords = ['deliberative', 'sensory', 'belief', 'doxa', 'voluntar', 'grades']
phantasia_depth = sum(1 for kw in phantasia_keywords if kw in phantasia_section.lower())

# Check Heidegger link-backs
heidegger_section = ''
for k, v in section_texts.items():
    if 'heidegger' in k:
        heidegger_section = v
linkback_terms = ['kinesis', 'motion', 'time', 'chronos', 'aisthesis', 'perception', 'phantasia', 'imagination', 'befindlichkeit', 'dasein']
heidegger_linkbacks = sum(1 for t in linkback_terms if t in heidegger_section.lower())

print('=' * 60)
print('RUN 5 ANALYSIS (primary-text priority + phantasia depth + Heidegger link-backs)')
print('=' * 60)
print()
print('| Metric | Run 4 | Run 5 | Delta |')
print('|--------|:-----:|:-----:|:-----:|')
print(f'| Main Text Words | 3,082 | {main_words:,} | {main_words-3082:+,} |')
print(f'| Quality Score | 68.8% | {qs*100:.1f}% | {(qs-0.688)*100:+.1f}pp |')
print(f'| Citations | 23 | {citations} | {citations-23:+d} |')
print(f'| Hallucinated | 0 | {ce.get("hallucinatedCitations",0)} | {ce.get("hallucinatedCitations",0):+d} |')
print(f'| Citation Pass Rate | 100% | {ce.get("passRate",0)*100:.0f}% | — |')
print(f'| Quotations (>30ch) | 21 | {len(quotations)} | {len(quotations)-21:+d} |')
print(f'| Unique Authors | 7 | {len(author_set)} | {len(author_set)-7:+d} |')
print(f'| Aristotle cits | ? | {aristotle_cit} | — |')
print(f'| Heidegger cits | ? | {heidegger_cit} | — |')
print(f'| Secondary cits | ? | {secondary_cit} | — |')
print()
print('### PRIMARY-TEXT DENSITY')
primary_ratio = (aristotle_cit + heidegger_cit) / max(citations, 1) * 100
print(f'  Primary citations (Aristotle + Heidegger): {aristotle_cit + heidegger_cit}/{citations} ({primary_ratio:.0f}%)')
print(f'  Secondary citations: {secondary_cit}/{citations} ({100-primary_ratio:.0f}%)')
print()
print('### PHANTASIA SECTION DEPTH')
print(f'  Keywords found ({phantasia_depth}/6): ', end='')
for kw in phantasia_keywords:
    found = kw in phantasia_section.lower()
    print(f'{kw}={"YES" if found else "no"} ', end='')
print()
print()
print('### HEIDEGGER LINK-BACKS')
print(f'  Concept terms in Heidegger section ({heidegger_linkbacks}/10): ', end='')
for t in linkback_terms:
    found = t in heidegger_section.lower()
    print(f'{t}={"YES" if found else "no"} ', end='')
print()
print()
print('### Section Word Counts')
for heading, wc in section_wc:
    status = 'OK' if wc >= 200 else 'SHORT'
    print(f'  {heading}: {wc} words [{status}]')
print()
print(f'### Quotations ({len(quotations)})')
for i, q in enumerate(quotations[:15], 1):
    print(f'  Q{i}: "{q[:90]}..."')
print()
print('### Unique Authors Cited')
for a in sorted(author_set):
    print(f'  - {a}')
print()
print('### V2 Diagnostics')
print(f'  Blacklisted in main text: {v2d.get("blacklistedAuthorsInMainText", "?")}')
print(f'  Blacklisted in appendix: {v2d.get("blacklistedAuthorsInAppendix", "?")}')
print(f'  Factual claims w/o cit (v1): {v1.get("factualClaimsWithoutCitation", "?")}')
print(f'  Interpretive claims w/o cit (v1): {v1.get("interpretiveClaimsWithoutCitation", "?")}')
