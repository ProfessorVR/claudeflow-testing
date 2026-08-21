import re

with open('tmp/phantasia-unified-section/final-cleaned.txt') as f:
    content = f.read()

# Split into sections by headings
sections = re.split(r'^(#{1,3} .+)', content, flags=re.MULTILINE)

current_section = "Preamble"
claims = []
claim_id = 0

for i, part in enumerate(sections):
    if re.match(r'^#{1,3} ', part):
        current_section = part.strip().lstrip('#').strip()
        continue

    # Find all sentences/clauses that end with a parenthetical citation
    # Pattern: text ending with (Author, Work, p. XX)
    cite_pattern = r'([^.;]*?\([A-Z][^)]*(?:p\.|pp\.)\s*\d+[^)]*\))'
    matches = re.findall(cite_pattern, part)

    for m in matches:
        claim_id += 1
        # Extract the citation part
        cite_match = re.search(r'\(([^)]+)\)\s*$', m.strip().rstrip('.'))
        if cite_match:
            cite = cite_match.group(1)
            claim_text = m[:m.rfind('(')].strip().rstrip(',').rstrip(';').strip()
            # Clean up claim text - take last sentence-like chunk
            if len(claim_text) > 200:
                # Find last sentence break
                for sep in ['. ', '; ']:
                    idx = claim_text.rfind(sep)
                    if idx > len(claim_text) // 2:
                        claim_text = claim_text[idx+2:]
                        break
            claim_text = claim_text[:180]
            claims.append((claim_id, claim_text, cite, current_section))

print(f"=== CLAIMS WITH CITATIONS ({len(claims)}) ===")
for cid, text, cite, sec in claims:
    print(f"{cid}|{text}|{cite}|{sec}")
