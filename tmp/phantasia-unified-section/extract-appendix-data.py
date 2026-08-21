import re

with open('tmp/phantasia-unified-section/final-cleaned.txt') as f:
    content = f.read()

# Extract all direct quotations (text in quotation marks followed by a citation)
quotes = re.findall(r'"([^"]{15,})"[^(]{0,30}\(([^)]+)\)', content)
print(f"=== QUOTATIONS WITH CITATIONS ({len(quotes)}) ===")
for i, (q, cite) in enumerate(quotes, 1):
    q_short = q[:120] + "..." if len(q) > 120 else q
    print(f"Q{i}: \"{q_short}\" -> ({cite})")

print(f"\n=== ALL PARENTHETICAL CITATIONS ===")
cites = re.findall(r'\(([A-Z][^)]*(?:p\.|pp\.)\s*\d+[^)]*)\)', content)
for i, c in enumerate(cites, 1):
    print(f"  C{i}: ({c})")

print(f"\n=== SECTION HEADINGS ===")
headings = re.findall(r'^(#{1,3} .+)', content, re.MULTILINE)
for h in headings:
    print(f"  {h}")

# Count claims per section
print(f"\n=== WORD COUNT ===")
words = len(content.split())
print(f"Total words: {words}")
