#!/usr/bin/env python3
"""Find DA III.3 phantasia section + peek at BCAP and Caston."""
import fitz

print("== DA III.3 phantasia search ==")
d = fitz.open('/home/dalton/projects/claudeflow-testing/corpus/rhetorical_ontology/Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf')
for i in range(d.page_count):
    t = d[i].get_text()
    if 'phantasia' in t.lower() or 'imagination' in t.lower():
        # Look for 427b or 428a markers
        if '427' in t or '428' in t or '429' in t:
            print(f"Page {i+1} (likely III.3 area)")
            print(t[:300])
            print()
            if i > 40: break

print("\n\n== BCAP inspection (pages 10-12) ==")
d2 = fitz.open('/home/dalton/projects/claudeflow-testing/corpus/rhetorical_ontology/Heidegger, Martin - Basic Concepts of Aristotelian Philosophy_(2009)_[Clean Copy].pdf')
for i in [10, 25, 50]:
    print(f"--- BCAP PAGE {i+1} ---")
    print(d2[i].get_text()[:700])
    print()

print("\n\n== Caston (pages 2-5) ==")
d3 = fitz.open('/home/dalton/projects/claudeflow-testing/corpus/rhetorical_ontology/Caston, Victor - Why Aristotle Needs Imagination_(1995)_[Clean Copy].pdf')
print(f"Caston pages: {d3.page_count}")
for i in [1, 2, 3]:
    print(f"--- CASTON PAGE {i+1} ---")
    print(d3[i].get_text()[:600])
    print()
