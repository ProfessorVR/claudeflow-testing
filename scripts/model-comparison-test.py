#!/usr/bin/env python3
"""
Model Comparison Test: Local AWQ vs Claude

Tests coding capabilities across multiple dimensions:
1. Code generation
2. Bug fixing
3. Code explanation
4. Algorithm implementation
5. Refactoring

Produces a comparison report with scoring.
"""

import json
import os
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

import anthropic
from openai import OpenAI

# ==================== Configuration ====================

VLLM_BASE_URL = os.environ.get("VLLM_BASE_URL", "http://localhost:8002")
VLLM_MODEL = "Qwen/Qwen2.5-Coder-32B-Instruct-AWQ"
CLAUDE_MODEL = "claude-sonnet-4-20250514"

# ==================== Test Cases ====================

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
        "evaluation_criteria": [
            "Correct implementation",
            "Handles edge cases (empty string, single char)",
            "Ignores case",
            "Ignores non-alphanumeric",
            "Has type hints",
            "Has docstring",
        ],
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
        "evaluation_criteria": [
            "Correct LRU behavior",
            "O(1) get operation",
            "O(1) put operation",
            "Handles capacity limit",
            "Uses OrderedDict or doubly-linked list",
            "Has type hints",
        ],
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
        "evaluation_criteria": [
            "Returns a list",
            "Preserves duplicate detection logic",
            "Maintains efficiency",
        ],
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
        "evaluation_criteria": [
            "Fixes increment bug (j instead of i)",
            "Adds remaining elements from list1",
            "Adds remaining elements from list2",
            "Maintains sorted order",
        ],
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
        "evaluation_criteria": [
            "Uses heap for efficiency",
            "Correct kth largest (not kth smallest)",
            "O(n log k) complexity",
            "Has type hints",
            "Handles edge cases",
        ],
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
        "evaluation_criteria": [
            "Uses 'is not None' instead of '!= None'",
            "Uses isinstance() instead of type()",
            "Uses list comprehension or more Pythonic iteration",
            "Removes range(len()) anti-pattern",
            "Maintains same functionality",
        ],
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
        "evaluation_criteria": [
            "Identifies it checks for power of 2",
            "Explains the bit manipulation",
            "Notes the n != 0 edge case",
        ],
    },
]

# ==================== Data Classes ====================

@dataclass
class TestResult:
    test_id: str
    category: str
    difficulty: str
    prompt: str
    model: str
    response: str
    latency_ms: float
    tokens_used: Optional[int] = None
    error: Optional[str] = None
    scores: dict = field(default_factory=dict)
    total_score: float = 0.0


@dataclass
class ComparisonReport:
    timestamp: str
    local_model: str
    claude_model: str
    test_results: list
    summary: dict


# ==================== API Clients ====================

def create_vllm_client():
    """Create OpenAI client pointing to vLLM server."""
    return OpenAI(
        base_url=f"{VLLM_BASE_URL}/v1",
        api_key="not-needed",
    )


def create_claude_client():
    """Create Anthropic client."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")
    return anthropic.Anthropic(api_key=api_key)


# ==================== Test Execution ====================

def run_vllm_test(client: OpenAI, test_case: dict) -> TestResult:
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

    return TestResult(
        test_id=test_case["id"],
        category=test_case["category"],
        difficulty=test_case["difficulty"],
        prompt=test_case["prompt"],
        model=f"Local AWQ ({VLLM_MODEL})",
        response=response_text,
        latency_ms=latency_ms,
        tokens_used=tokens_used,
        error=error,
    )


def run_claude_test(client: anthropic.Anthropic, test_case: dict) -> TestResult:
    """Run a single test against Claude."""
    start_time = time.time()
    error = None
    response_text = ""
    tokens_used = None

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            system="You are an expert Python programmer. Follow instructions precisely and output only what is requested.",
            messages=[
                {"role": "user", "content": test_case["prompt"]},
            ],
        )
        response_text = response.content[0].text if response.content else ""
        tokens_used = response.usage.input_tokens + response.usage.output_tokens if response.usage else None
    except Exception as e:
        error = str(e)

    latency_ms = (time.time() - start_time) * 1000

    return TestResult(
        test_id=test_case["id"],
        category=test_case["category"],
        difficulty=test_case["difficulty"],
        prompt=test_case["prompt"],
        model=f"Claude ({CLAUDE_MODEL})",
        response=response_text,
        latency_ms=latency_ms,
        tokens_used=tokens_used,
        error=error,
    )


# ==================== Evaluation ====================

def evaluate_response(response: str, criteria: list) -> dict:
    """
    Simple heuristic evaluation of response against criteria.
    Returns dict with criterion -> score (0.0 to 1.0).

    Note: This is a simplified evaluation. A real system would use
    more sophisticated methods like code execution, AST analysis, etc.
    """
    scores = {}
    response_lower = response.lower()

    for criterion in criteria:
        score = 0.0
        criterion_lower = criterion.lower()

        # Check for various indicators based on criterion type
        if "type hints" in criterion_lower:
            if "->" in response or ": int" in response or ": str" in response or ": list" in response:
                score = 1.0
        elif "docstring" in criterion_lower:
            if '"""' in response or "'''" in response:
                score = 1.0
        elif "correct" in criterion_lower or "implementation" in criterion_lower:
            # Check for key function structures
            if "def " in response and "return" in response:
                score = 0.8  # Base score for having a function
        elif "list comprehension" in criterion_lower or "pythonic" in criterion_lower:
            if "[" in response and "for" in response and "in" in response and "]" in response:
                score = 1.0
            elif "enumerate" in response or "zip" in response:
                score = 0.8
        elif "isinstance" in criterion_lower:
            if "isinstance" in response:
                score = 1.0
        elif "is not none" in criterion_lower:
            if "is not None" in response:
                score = 1.0
        elif "heap" in criterion_lower:
            if "heapq" in response or "heap" in response_lower:
                score = 1.0
        elif "o(1)" in criterion_lower:
            if "OrderedDict" in response or "dict" in response_lower:
                score = 0.8
        elif "power of 2" in criterion_lower:
            if "power" in response_lower and "2" in response:
                score = 1.0
        elif "bit" in criterion_lower:
            if "bit" in response_lower or "binary" in response_lower or "&" in response:
                score = 1.0
        elif "remaining" in criterion_lower:
            if "extend" in response or "+" in response or "while" in response:
                score = 0.8
        elif "fixes" in criterion_lower:
            # For bug fix tests, check if the fix is present
            if "j +=" in response or "j += 1" in response:
                score = 1.0
        elif "returns a list" in criterion_lower:
            if "list(" in response or "return list" in response_lower:
                score = 1.0
        else:
            # Default: check if response seems complete
            if len(response.strip()) > 50:
                score = 0.5

        scores[criterion] = score

    return scores


def calculate_total_score(scores: dict) -> float:
    """Calculate average score from all criteria."""
    if not scores:
        return 0.0
    return sum(scores.values()) / len(scores)


# ==================== Report Generation ====================

def generate_report(local_results: list, claude_results: list) -> ComparisonReport:
    """Generate comparison report from test results."""
    all_results = []

    # Pair up results
    for local, claude in zip(local_results, claude_results):
        all_results.append({
            "test_id": local.test_id,
            "category": local.category,
            "difficulty": local.difficulty,
            "local": {
                "response": local.response[:500] + "..." if len(local.response) > 500 else local.response,
                "latency_ms": local.latency_ms,
                "tokens_used": local.tokens_used,
                "error": local.error,
                "scores": local.scores,
                "total_score": local.total_score,
            },
            "claude": {
                "response": claude.response[:500] + "..." if len(claude.response) > 500 else claude.response,
                "latency_ms": claude.latency_ms,
                "tokens_used": claude.tokens_used,
                "error": claude.error,
                "scores": claude.scores,
                "total_score": claude.total_score,
            },
        })

    # Calculate summary statistics
    local_scores = [r.total_score for r in local_results if not r.error]
    claude_scores = [r.total_score for r in claude_results if not r.error]
    local_latencies = [r.latency_ms for r in local_results if not r.error]
    claude_latencies = [r.latency_ms for r in claude_results if not r.error]

    summary = {
        "total_tests": len(TEST_CASES),
        "local_model": {
            "name": VLLM_MODEL,
            "avg_score": sum(local_scores) / len(local_scores) if local_scores else 0,
            "avg_latency_ms": sum(local_latencies) / len(local_latencies) if local_latencies else 0,
            "errors": sum(1 for r in local_results if r.error),
            "scores_by_category": {},
        },
        "claude_model": {
            "name": CLAUDE_MODEL,
            "avg_score": sum(claude_scores) / len(claude_scores) if claude_scores else 0,
            "avg_latency_ms": sum(claude_latencies) / len(claude_latencies) if claude_latencies else 0,
            "errors": sum(1 for r in claude_results if r.error),
            "scores_by_category": {},
        },
    }

    # Scores by category
    for category in set(t["category"] for t in TEST_CASES):
        local_cat_scores = [r.total_score for r in local_results if r.category == category and not r.error]
        claude_cat_scores = [r.total_score for r in claude_results if r.category == category and not r.error]

        summary["local_model"]["scores_by_category"][category] = (
            sum(local_cat_scores) / len(local_cat_scores) if local_cat_scores else 0
        )
        summary["claude_model"]["scores_by_category"][category] = (
            sum(claude_cat_scores) / len(claude_cat_scores) if claude_cat_scores else 0
        )

    return ComparisonReport(
        timestamp=datetime.now().isoformat(),
        local_model=VLLM_MODEL,
        claude_model=CLAUDE_MODEL,
        test_results=all_results,
        summary=summary,
    )


def print_report(report: ComparisonReport):
    """Print formatted report to console."""
    print("\n" + "=" * 80)
    print("MODEL COMPARISON REPORT")
    print("=" * 80)
    print(f"Timestamp: {report.timestamp}")
    print(f"Local Model: {report.local_model}")
    print(f"Claude Model: {report.claude_model}")
    print()

    # Summary
    print("-" * 80)
    print("SUMMARY")
    print("-" * 80)
    s = report.summary

    print(f"\n{'Metric':<30} {'Local AWQ':<20} {'Claude':<20}")
    print("-" * 70)
    print(f"{'Average Score':<30} {s['local_model']['avg_score']:.2%:<20} {s['claude_model']['avg_score']:.2%:<20}")
    print(f"{'Average Latency (ms)':<30} {s['local_model']['avg_latency_ms']:.0f:<20} {s['claude_model']['avg_latency_ms']:.0f:<20}")
    print(f"{'Errors':<30} {s['local_model']['errors']:<20} {s['claude_model']['errors']:<20}")

    print("\nScores by Category:")
    for category in s['local_model']['scores_by_category']:
        local_score = s['local_model']['scores_by_category'][category]
        claude_score = s['claude_model']['scores_by_category'][category]
        print(f"  {category:<28} {local_score:.2%:<20} {claude_score:.2%:<20}")

    # Individual test results
    print("\n" + "-" * 80)
    print("INDIVIDUAL TEST RESULTS")
    print("-" * 80)

    for result in report.test_results:
        print(f"\n[{result['test_id']}] {result['category']} ({result['difficulty']})")
        print(f"  Local AWQ:  Score={result['local']['total_score']:.2%}, Latency={result['local']['latency_ms']:.0f}ms")
        print(f"  Claude:     Score={result['claude']['total_score']:.2%}, Latency={result['claude']['latency_ms']:.0f}ms")

        if result['local']['error']:
            print(f"  Local Error: {result['local']['error']}")
        if result['claude']['error']:
            print(f"  Claude Error: {result['claude']['error']}")

    # Winner determination
    print("\n" + "=" * 80)
    print("CONCLUSION")
    print("=" * 80)

    local_avg = s['local_model']['avg_score']
    claude_avg = s['claude_model']['avg_score']
    local_latency = s['local_model']['avg_latency_ms']
    claude_latency = s['claude_model']['avg_latency_ms']

    print(f"\nQuality Score: ", end="")
    if local_avg > claude_avg + 0.05:
        print("Local AWQ wins by significant margin")
    elif claude_avg > local_avg + 0.05:
        print("Claude wins by significant margin")
    else:
        print("Roughly equivalent quality")

    print(f"Speed: ", end="")
    if local_latency < claude_latency * 0.5:
        print(f"Local AWQ is {claude_latency/local_latency:.1f}x faster")
    elif claude_latency < local_latency * 0.5:
        print(f"Claude is {local_latency/claude_latency:.1f}x faster")
    else:
        print("Similar latency")

    print(f"\nCost: Local AWQ = $0 (local), Claude = ~$0.003-0.015 per test")

    print("\n" + "=" * 80)


def save_report(report: ComparisonReport, output_dir: Path):
    """Save report to JSON file."""
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"model-comparison-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"

    with open(output_file, "w") as f:
        json.dump({
            "timestamp": report.timestamp,
            "local_model": report.local_model,
            "claude_model": report.claude_model,
            "test_results": report.test_results,
            "summary": report.summary,
        }, f, indent=2)

    print(f"\nReport saved to: {output_file}")
    return output_file


# ==================== Main ====================

def main():
    print("=" * 80)
    print("MODEL COMPARISON TEST")
    print("Local AWQ (Qwen2.5-Coder-32B-Instruct-AWQ) vs Claude (claude-sonnet-4)")
    print("=" * 80)

    # Initialize clients
    print("\nInitializing clients...")
    vllm_client = create_vllm_client()
    claude_client = create_claude_client()

    # Run tests
    local_results = []
    claude_results = []

    print(f"\nRunning {len(TEST_CASES)} tests...")

    for i, test_case in enumerate(TEST_CASES):
        print(f"\n[{i+1}/{len(TEST_CASES)}] {test_case['id']}: {test_case['category']}")

        # Run on local AWQ
        print("  Testing Local AWQ...", end=" ", flush=True)
        local_result = run_vllm_test(vllm_client, test_case)
        if not local_result.error:
            local_result.scores = evaluate_response(local_result.response, test_case["evaluation_criteria"])
            local_result.total_score = calculate_total_score(local_result.scores)
        print(f"Done ({local_result.latency_ms:.0f}ms, score={local_result.total_score:.2%})")
        local_results.append(local_result)

        # Run on Claude
        print("  Testing Claude...", end=" ", flush=True)
        claude_result = run_claude_test(claude_client, test_case)
        if not claude_result.error:
            claude_result.scores = evaluate_response(claude_result.response, test_case["evaluation_criteria"])
            claude_result.total_score = calculate_total_score(claude_result.scores)
        print(f"Done ({claude_result.latency_ms:.0f}ms, score={claude_result.total_score:.2%})")
        claude_results.append(claude_result)

    # Generate report
    report = generate_report(local_results, claude_results)

    # Print report
    print_report(report)

    # Save report
    output_dir = Path(__file__).parent.parent / "reports"
    save_report(report, output_dir)

    return report


if __name__ == "__main__":
    main()
