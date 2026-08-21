"""Quick stats over an extractor output."""
import json
import sys
from collections import Counter
from pathlib import Path

p = Path(sys.argv[1])
claims = [json.loads(line) for line in p.read_text().splitlines() if line.strip()]
print(f"File: {p}")
print(f"Total claims: {len(claims)}")
print(f"Speakers: {dict(Counter(c.get('speaker','?') for c in claims).most_common(8))}")
print(f"Types: {dict(Counter(c.get('claim_type','?') for c in claims).most_common())}")
print(f"Stances: {dict(Counter(c.get('stance','?') for c in claims).most_common())}")
print(f"Use/mention: {dict(Counter(c.get('use_mention','?') for c in claims).most_common())}")
grounded = sum(1 for c in claims if c.get('grounding',{}).get('quote_match'))
print(f"Grounded: {grounded}/{len(claims)} ({grounded/len(claims):.1%})")
faith = Counter(c.get('faithfulness','?') for c in claims)
print(f"Faithfulness: {dict(faith)}")
bekker = sum(1 for c in claims if c.get('grounding',{}).get('extracted_anchor'))
print(f"Bekker/anchor extracted: {bekker}/{len(claims)} ({bekker/len(claims):.1%})")
