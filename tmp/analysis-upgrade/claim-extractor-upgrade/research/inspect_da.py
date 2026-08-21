#!/usr/bin/env python3
"""Inspect De Anima PDF to find Bekker markers and OCR layout."""
import fitz
d = fitz.open('/home/dalton/projects/claudeflow-testing/corpus/rhetorical_ontology/Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf')
print(f"Pages: {d.page_count}")
for i in [5, 15, 25, 35, 45]:
    print(f"\n===== DA PAGE {i+1} =====")
    txt = d[i].get_text()
    print(txt[:900])
