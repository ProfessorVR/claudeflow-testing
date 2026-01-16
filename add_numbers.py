def add_numbers(a: int, b: int) -> int:
    """
    Add two integers and return their sum.

    Args:
        a: The first integer to add
        b: The second integer to add

    Returns:
        The sum of a and b

    Examples:
        >>> add_numbers(2, 3)
        5
        >>> add_numbers(-1, 1)
        0
        >>> add_numbers(0, 0)
        0
    """
    return a + b


# Simple test case
if __name__ == "__main__":
    # Test case 1: Positive numbers
    result1 = add_numbers(5, 3)
    assert result1 == 8, f"Expected 8, got {result1}"
    print(f"Test 1 passed: add_numbers(5, 3) = {result1}")

    # Test case 2: Negative numbers
    result2 = add_numbers(-2, -3)
    assert result2 == -5, f"Expected -5, got {result2}"
    print(f"Test 2 passed: add_numbers(-2, -3) = {result2}")

    # Test case 3: Mixed positive and negative
    result3 = add_numbers(10, -4)
    assert result3 == 6, f"Expected 6, got {result3}"
    print(f"Test 3 passed: add_numbers(10, -4) = {result3}")

    # Test case 4: Zero
    result4 = add_numbers(0, 0)
    assert result4 == 0, f"Expected 0, got {result4}"
    print(f"Test 4 passed: add_numbers(0, 0) = {result4}")

    print("\nAll tests passed!")
