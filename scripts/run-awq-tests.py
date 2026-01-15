#!/usr/bin/env python3
"""Run tests against the local AWQ model and save results."""

import json
import os
import time
from datetime import datetime
from pathlib import Path

from openai import OpenAI

VLLM_BASE_URL = os.environ.get("VLLM_BASE_URL", "http://localhost:8002")
VLLM_MODEL = "Qwen/Qwen2.5-Coder-32B-Instruct-AWQ"

TEST_CASES = [
    {
        "id": "code_gen_1",
        "category": "Code Generation",
        "difficulty": "Easy",
        "prompt": """Write a Python function called `is_palindrome` that checks if a string is a palindrome.
Requirements:
- Ignore case and non-alphanumeric characters
- Return True if palindrome, False otherwise
- Include type hints
- Add a docstring

Only output the code, no explanations.""",
    },
    {
        "id": "code_gen_2",
        "category": "Code Generation",
        "difficulty": "Medium",
        "prompt": """Write a Python class called `LRUCache` that implements a Least Recently Used cache.
Requirements:
- Constructor takes `capacity: int`
- `get(key: int) -> int` returns value or -1 if not found
- `put(key: int, value: int) -> None` inserts/updates value
- Both operations should be O(1)
- Use type hints

Only output the code, no explanations.""",
    },
    {
        "id": "bug_fix_1",
        "category": "Bug Fixing",
        "difficulty": "Easy",
        "prompt": """Fix the bug in this Python function:

```python
def find_duplicates(nums):
    seen = set()
    duplicates = set()
    for num in nums:
        if num in seen:
            duplicates.add(num)
        seen.add(num)
    return duplicates
```

The function should return a LIST of duplicates, not a set.
Only output the corrected code, no explanations.""",
    },
    {
        "id": "bug_fix_2",
        "category": "Bug Fixing",
        "difficulty": "Medium",
        "prompt": """Fix the bugs in this Python function that's supposed to merge two sorted lists:

```python
def merge_sorted(list1, list2):
    result = []
    i = j = 0
    while i < len(list1) and j < len(list2):
        if list1[i] < list2[j]:
            result.append(list1[i])
            i += 1
        else:
            result.append(list2[j])
            i += 1  # BUG: should increment j
    # BUG: Missing remaining elements
    return result
```

Only output the corrected code, no explanations.""",
    },
    {
        "id": "algorithm_1",
        "category": "Algorithm",
        "difficulty": "Medium",
        "prompt": """Implement a Python function `find_kth_largest(nums: list[int], k: int) -> int`
that finds the kth largest element in an unsorted list.

Requirements:
- Must be more efficient than sorting the entire list (hint: use a heap)
- Handle edge cases
- Include type hints

Only output the code, no explanations.""",
    },
    {
        "id": "refactor_1",
        "category": "Refactoring",
        "difficulty": "Medium",
        "prompt": """Refactor this code to be more Pythonic and efficient:

```python
def process_data(data):
    result = []
    for i in range(len(data)):
        if data[i] != None:
            if type(data[i]) == str:
                result.append(data[i].upper())
            elif type(data[i]) == int:
                result.append(data[i] * 2)
    return result
```

Only output the refactored code, no explanations.""",
    },
    {
        "id": "explanation_1",
        "category": "Code Explanation",
        "difficulty": "Easy",
        "prompt": """Explain what this Python code does in 2-3 sentences:

```python
def mystery(n):
    return n & (n - 1) == 0 and n != 0
```

Be concise but complete.""",
    },
]


def run_test(client, test_case):
    """Run a single test against the local vLLM model."""
    start_time = time.time()
    error = None
    response_text = ""
    tokens_used = None

    try:
        response = client.chat.completions.create(
            model=VLLM_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert Python programmer. Follow instructions precisely and output only what is requested."},
                {"role": "user", "content": test_case["prompt"]},
            ],
            max_tokens=1024,
            temperature=0.1,
        )
        response_text = response.choices[0].message.content or ""
        tokens_used = response.usage.total_tokens if response.usage else None
    except Exception as e:
        error = str(e)

    latency_ms = (time.time() - start_time) * 1000

    return {
        "test_id": test_case["id"],
        "category": test_case["category"],
        "difficulty": test_case["difficulty"],
        "prompt": test_case["prompt"],
        "response": response_text,
        "latency_ms": latency_ms,
        "tokens_used": tokens_used,
        "error": error,
    }


def main():
    print("=" * 80)
    print("LOCAL AWQ MODEL TEST")
    print(f"Model: {VLLM_MODEL}")
    print(f"Server: {VLLM_BASE_URL}")
    print("=" * 80)

    client = OpenAI(base_url=f"{VLLM_BASE_URL}/v1", api_key="not-needed")

    results = []
    for i, test_case in enumerate(TEST_CASES):
        print(f"\n[{i+1}/{len(TEST_CASES)}] {test_case['id']}: {test_case['category']}")
        result = run_test(client, test_case)
        results.append(result)

        if result["error"]:
            print(f"  ERROR: {result['error']}")
        else:
            print(f"  Latency: {result['latency_ms']:.0f}ms, Tokens: {result['tokens_used']}")
            print(f"  Response preview: {result['response'][:100]}...")

    # Save results
    output_dir = Path(__file__).parent.parent / "reports"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"awq-test-results-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"

    with open(output_file, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "model": VLLM_MODEL,
            "server": VLLM_BASE_URL,
            "results": results,
        }, f, indent=2)

    print(f"\n\nResults saved to: {output_file}")

    # Print full responses for manual review
    print("\n" + "=" * 80)
    print("FULL RESPONSES")
    print("=" * 80)

    for result in results:
        print(f"\n--- {result['test_id']} ({result['category']}) ---")
        print(f"Latency: {result['latency_ms']:.0f}ms")
        print("\nResponse:")
        print(result['response'])
        print()

    return results


if __name__ == "__main__":
    main()
