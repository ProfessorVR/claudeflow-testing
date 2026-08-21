#!/usr/bin/env python3
"""A/B comparison of god-write outputs: baseline vs structural-edge-enhanced."""

import re
import sys

def analyze_document(path, label):
    with open(path) as f:
        text = f.read()

    parts = re.split(r'(?:^|\n)(?:---\s*\n)?#\s*VALIDATION APPENDIX', text, maxsplit=1)
    main_text = parts[0] if parts else text

    words = main_text.split()
    word_count = len(words)
    sections = re.findall(r'^##\s+\d+\.', main_text, re.MULTILINE)
    quotations = re.findall(r'"[^"]{20,}"', main_text)
    author_citations = re.findall(r'\(([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*\*', main_text)
    unique_authors = sorted(set(author_citations))
    all_citations = re.findall(r'\([A-Z][a-z].*?\)', main_text)
    greek_terms = re.findall(r'[κχφπαιοεηωυδμνρστλξβγζθ]{3,}', main_text)

    struct_patterns = {
        'depends_on': len(re.findall(r'depends?\s+(?:on|upon)', main_text, re.I)),
        'presupposes': len(re.findall(r'presuppos', main_text, re.I)),
        'contrasts_with': len(re.findall(r'contrasts?\s+with|in\s+contrast\s+to', main_text, re.I)),
        'co-dependent': len(re.findall(r'co-depend|codepend|mutual.*depend|reciprocal', main_text, re.I)),
        'operationalizes': len(re.findall(r'operationaliz', main_text, re.I)),
    }

    edge_checks = {
        'kinesis_presupposes_chronos': bool(re.search(r'kinēsis.*presuppos.*chronos|motion.*presuppos.*time|kinēsis.*prior.*chronos', main_text, re.I)),
        'chronos_depends_kinesis': bool(re.search(r'time.*depend.*motion|chronos.*depend.*kinēsis|time.*cannot.*without.*motion', main_text, re.I)),
        'phantasia_contrasts_aisthesis': bool(re.search(r'phantasia.*contrast.*aisthēsis|phantasia.*distinct.*perception|phantasia.*differ.*aisthēsis', main_text, re.I)),
        'phantasia_as_kinesis': bool(re.search(r'phantasia.*(?:is|itself).*(?:a\s+)?(?:kind\s+of\s+)?(?:motion|kinēsis)', main_text, re.I)),
        'aisthesis_depends_kinesis': bool(re.search(r'perception.*depend.*motion|aisthēsis.*depend.*kinēsis|perception.*species.*motion', main_text, re.I)),
    }

    sentences = re.split(r'[.!?]+\s', main_text)
    valid_sentences = [s for s in sentences if len(s.split()) > 3]
    avg_sentence_len = sum(len(s.split()) for s in valid_sentences) / max(len(valid_sentences), 1)

    transitions = re.findall(r'\b(?:thus|indeed|hence|accordingly|subsequently|similarly|specifically|moreover|furthermore|consequently)\b', main_text, re.I)

    paragraphs = [p.strip() for p in main_text.split('\n\n') if len(p.strip()) > 50 and not p.strip().startswith('#')]
    avg_para_len = sum(len(p.split()) for p in paragraphs) / max(len(paragraphs), 1)

    corpus_authors = {'aristotle', 'heidegger', 'burke', 'rickert', 'hawhee', 'bowin',
                      "o'gorman", 'ogorman', 'papachristou', 'caston', 'gonzalez', 'frede',
                      'nussbaum', 'gross', 'white', 'kim', 'uexkull', 'von uexkull', 'multiple'}
    non_corpus = [a for a in unique_authors if a.lower() not in corpus_authors]

    return {
        'label': label,
        'word_count': word_count,
        'sections': len(sections),
        'quotations': len(quotations),
        'unique_authors': unique_authors,
        'unique_author_count': len(unique_authors),
        'total_citations': len(all_citations),
        'greek_terms': len(greek_terms),
        'struct_patterns': struct_patterns,
        'edge_checks': edge_checks,
        'edge_score': sum(edge_checks.values()),
        'avg_sentence_len': round(avg_sentence_len, 1),
        'transitions': len(transitions),
        'paragraph_count': len(paragraphs),
        'avg_para_len': round(avg_para_len, 1),
        'non_corpus_authors': non_corpus,
    }

baseline = analyze_document('tmp/aristotle-motion-time-phantasia.md', 'BASELINE (pre-edges)')
new = analyze_document('tmp/aristotle-motion-time-v2-edges.md', 'NEW (with structural edges)')

print("=" * 80)
print("A/B COMPARISON: Motion & Time God-Write Output")
print("=" * 80)

metrics = [
    ('Main Text Words', 'word_count'),
    ('Sections', 'sections'),
    ('Quotations (verbatim)', 'quotations'),
    ('Unique Authors Cited', 'unique_author_count'),
    ('Total Citations', 'total_citations'),
    ('Greek Terms Used', 'greek_terms'),
    ('Avg Sentence Length', 'avg_sentence_len'),
    ('Transition Words', 'transitions'),
    ('Paragraphs', 'paragraph_count'),
    ('Avg Paragraph Length', 'avg_para_len'),
]

print()
print(f"{'Metric':<30} {'Baseline':>12} {'New':>12} {'Change':>12}")
print("-" * 66)
for name, key in metrics:
    b = baseline[key]
    n = new[key]
    if isinstance(b, (int, float)) and isinstance(n, (int, float)):
        diff = n - b
        pct = f"({diff/b*100:+.0f}%)" if b > 0 else ""
        print(f"{name:<30} {b:>12} {n:>12} {diff:>+8} {pct}")
    else:
        print(f"{name:<30} {b:>12} {n:>12}")

print()
print("Authors Cited:")
print(f"  Baseline: {', '.join(baseline['unique_authors'])}")
print(f"  New:      {', '.join(new['unique_authors'])}")

print()
print("Non-Corpus Authors (hallucinated):")
print(f"  Baseline: {baseline['non_corpus_authors'] or 'None'}")
print(f"  New:      {new['non_corpus_authors'] or 'None'}")

print()
print("Structural Relationship Assertions:")
print(f"  {'Pattern':<25} {'Baseline':>10} {'New':>10}")
print(f"  {'-'*45}")
for pat in baseline['struct_patterns']:
    b = baseline['struct_patterns'][pat]
    n = new['struct_patterns'][pat]
    marker = " <--" if n > b else ""
    print(f"  {pat:<25} {b:>10} {n:>10}{marker}")

print()
print("Edge Constraint Compliance (5 key edges from reasoning graph):")
print(f"  {'Edge':<40} {'Baseline':>10} {'New':>10}")
print(f"  {'-'*60}")
for edge in baseline['edge_checks']:
    b = 'YES' if baseline['edge_checks'][edge] else 'no'
    n = 'YES' if new['edge_checks'][edge] else 'no'
    name = edge.replace('_', ' ').replace('kinesis', 'kinesis').replace('chronos', 'chronos')
    print(f"  {name:<40} {b:>10} {n:>10}")
print(f"\n  Edge compliance score: Baseline {baseline['edge_score']}/5, New {new['edge_score']}/5")

print()
print("=" * 80)
print("VERDICT")
print("=" * 80)
improvements = 0
regressions = 0
for name, key in metrics:
    b = baseline[key]
    n = new[key]
    if isinstance(b, (int, float)) and isinstance(n, (int, float)):
        if key in ('non_corpus_authors',):
            if n < b: improvements += 1
            elif n > b: regressions += 1
        else:
            if n > b: improvements += 1
            elif n < b: regressions += 1

edge_improvement = new['edge_score'] - baseline['edge_score']
if edge_improvement > 0: improvements += 1
elif edge_improvement < 0: regressions += 1

print(f"  Metrics improved: {improvements}")
print(f"  Metrics regressed: {regressions}")
print(f"  Edge compliance: {baseline['edge_score']}/5 -> {new['edge_score']}/5")
