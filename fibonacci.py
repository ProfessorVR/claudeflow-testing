"""
Fibonacci Sequence Implementations

This module provides both iterative and recursive implementations
of the Fibonacci sequence calculation.
"""

from functools import lru_cache


def fibonacci_iterative(n: int) -> int:
    """
    Calculate the nth Fibonacci number using an iterative approach.

    This implementation uses O(n) time complexity and O(1) space complexity,
    making it efficient for large values of n.

    Args:
        n: The position in the Fibonacci sequence (0-indexed).
           Must be a non-negative integer.

    Returns:
        The nth Fibonacci number.

    Raises:
        ValueError: If n is negative.

    Examples:
        >>> fibonacci_iterative(0)
        0
        >>> fibonacci_iterative(1)
        1
        >>> fibonacci_iterative(10)
        55
    """
    if n < 0:
        raise ValueError("n must be a non-negative integer")

    if n <= 1:
        return n

    prev, curr = 0, 1
    for _ in range(2, n + 1):
        prev, curr = curr, prev + curr

    return curr


def fibonacci_recursive(n: int) -> int:
    """
    Calculate the nth Fibonacci number using a recursive approach.

    This is a naive recursive implementation with O(2^n) time complexity.
    It demonstrates the mathematical definition but is inefficient for large n.

    Args:
        n: The position in the Fibonacci sequence (0-indexed).
           Must be a non-negative integer.

    Returns:
        The nth Fibonacci number.

    Raises:
        ValueError: If n is negative.

    Examples:
        >>> fibonacci_recursive(0)
        0
        >>> fibonacci_recursive(1)
        1
        >>> fibonacci_recursive(10)
        55
    """
    if n < 0:
        raise ValueError("n must be a non-negative integer")

    if n <= 1:
        return n

    return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2)


@lru_cache(maxsize=None)
def fibonacci_recursive_memoized(n: int) -> int:
    """
    Calculate the nth Fibonacci number using memoized recursion.

    This implementation uses Python's lru_cache decorator to cache results,
    achieving O(n) time complexity while maintaining the recursive structure.

    Args:
        n: The position in the Fibonacci sequence (0-indexed).
           Must be a non-negative integer.

    Returns:
        The nth Fibonacci number.

    Raises:
        ValueError: If n is negative.

    Examples:
        >>> fibonacci_recursive_memoized(0)
        0
        >>> fibonacci_recursive_memoized(1)
        1
        >>> fibonacci_recursive_memoized(50)
        12586269025
    """
    if n < 0:
        raise ValueError("n must be a non-negative integer")

    if n <= 1:
        return n

    return fibonacci_recursive_memoized(n - 1) + fibonacci_recursive_memoized(n - 2)


# Example usage
if __name__ == "__main__":
    print("Fibonacci Sequence Examples")
    print("=" * 40)

    # Display first 15 Fibonacci numbers
    print("\nFirst 15 Fibonacci numbers:")
    print("n\tIterative\tRecursive\tMemoized")
    print("-" * 50)

    for i in range(15):
        iter_result = fibonacci_iterative(i)
        recur_result = fibonacci_recursive(i)
        memo_result = fibonacci_recursive_memoized(i)
        print(f"{i}\t{iter_result}\t\t{recur_result}\t\t{memo_result}")

    # Performance comparison for larger values
    print("\n" + "=" * 40)
    print("Larger values (iterative and memoized only):")
    print("-" * 40)

    large_values = [20, 30, 40, 50]
    for n in large_values:
        iter_result = fibonacci_iterative(n)
        memo_result = fibonacci_recursive_memoized(n)
        print(f"F({n}) = {iter_result}")

    # Error handling demonstration
    print("\n" + "=" * 40)
    print("Error handling demonstration:")
    print("-" * 40)

    try:
        fibonacci_iterative(-1)
    except ValueError as e:
        print(f"fibonacci_iterative(-1) raised ValueError: {e}")
