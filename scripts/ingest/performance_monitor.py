#!/usr/bin/env python3
"""
Performance Monitor — Timing and metrics collection for ingestion pipeline.

Provides a context-manager interface for timing operations and generating
summary reports with per-operation statistics.

Interface contract (from run_ingest_phase2.py):
    from performance_monitor import PerformanceMonitor
    monitor = PerformanceMonitor(config={})
    with monitor.operation("embedding", {"batch_size": 8}):
        ...
    report = monitor.get_report()
"""

import time
import statistics
from collections import defaultdict
from typing import Any, Dict, List, Optional
from contextlib import contextmanager


class PerformanceMonitor:
    """Collects timing metrics for pipeline operations."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self._config = config or {}
        self._operations: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self._start_time = time.time()

    @contextmanager
    def operation(self, name: str, metadata: Optional[Dict[str, Any]] = None):
        """Context manager that times an operation.

        Usage:
            with monitor.operation("ocr_extraction", {"pages": 10}) as op:
                ...  # do work
                op['extracted_pages'] = 10  # can store additional data
        """
        entry: Dict[str, Any] = dict(metadata or {})
        t0 = time.time()
        try:
            yield entry
        finally:
            elapsed = time.time() - t0
            entry["elapsed_s"] = elapsed
            entry["timestamp"] = t0
            self._operations[name].append(entry)

    def get_report(self) -> Dict[str, Any]:
        """Generate a summary report of all collected metrics."""
        total_elapsed = time.time() - self._start_time
        report: Dict[str, Any] = {
            "total_elapsed_s": round(total_elapsed, 3),
            "operations": {},
        }

        for op_name, entries in self._operations.items():
            times = [e["elapsed_s"] for e in entries]
            stats: Dict[str, Any] = {
                "count": len(times),
                "total": round(sum(times), 3),
                "mean": round(statistics.mean(times), 3) if times else 0,
                "min": round(min(times), 3) if times else 0,
                "max": round(max(times), 3) if times else 0,
            }
            if len(times) >= 2:
                stats["stdev"] = round(statistics.stdev(times), 3)
            report["operations"][op_name] = stats

        return report
