#!/usr/bin/env bash
set -euo pipefail
ROOT=$(dirname "$0")
RESULTS="$ROOT/results"
mkdir -p "$RESULTS"
for f in "$ROOT/tests"/*.robot; do
  echo "Running $(basename "$f")"
  robot -d "$RESULTS" "$f" || echo "Test $(basename "$f") failed"
done
echo "All tests executed. Results: $RESULTS"
