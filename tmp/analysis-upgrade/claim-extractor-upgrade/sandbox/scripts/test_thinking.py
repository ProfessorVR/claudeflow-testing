"""Verify opus + extended thinking works end-to-end."""
import os
from anthropic import Anthropic
env_path = '/home/dalton/projects/claudeflow-testing/.env'
for line in open(env_path):
    if line.strip() and not line.startswith('#') and '=' in line:
        k,v = line.split('=',1)
        os.environ.setdefault(k.strip(), v.strip())

client = Anthropic()
msg = client.messages.create(
    model="claude-opus-4-5",
    max_tokens=8000,
    thinking={"type": "enabled", "budget_tokens": 4000},
    messages=[{"role": "user", "content": "What is the use-mention distinction in philosophy? Answer in 2 sentences."}],
)
for b in msg.content:
    print(f"--- {b.type} ---")
    if b.type == "thinking":
        print(b.thinking[:300])
    elif b.type == "text":
        print(b.text)
print(f"usage: {msg.usage}")
