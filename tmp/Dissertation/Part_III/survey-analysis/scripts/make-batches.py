"""Split open_text.csv into coding batches of ~146 lines: batch-1.txt … batch-6.txt
Line format: rcode|item|text
"""
import csv, os

BASE = "tmp/Dissertation/Part_III/survey-analysis"
rows = list(csv.DictReader(open(f"{BASE}/data/open_text.csv", encoding="utf-8")))
os.makedirs(f"{BASE}/coding", exist_ok=True)
NB = 6
per = (len(rows) + NB - 1) // NB
for b in range(NB):
    chunk = rows[b * per:(b + 1) * per]
    with open(f"{BASE}/coding/batch-{b+1}.txt", "w", encoding="utf-8") as fh:
        for r in chunk:
            fh.write(f"{r['rcode']}|{r['item']}|{r['text']}\n")
    print(f"batch-{b+1}: {len(chunk)} lines")
print("total:", len(rows))
