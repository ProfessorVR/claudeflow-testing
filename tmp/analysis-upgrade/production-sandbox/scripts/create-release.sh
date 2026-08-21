#!/usr/bin/env bash
# create-release.sh — snapshot current artifact versions into a new release manifest.
#
# A release is declarative: it records the version of each artifact at the
# moment the release was created. Subsequent activate-release.sh <N> will swap
# the whole bundle back.
#
# Usage: create-release.sh <N> [description]

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <release-number> [description]" >&2
  exit 2
fi

RELEASE_N="$1"
DESCRIPTION="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${SCRIPT_DIR}/../data/corpus/index"
RELEASE_FILE="${DATA_DIR}/releases/release-${RELEASE_N}.json"

if [ -f "${RELEASE_FILE}" ]; then
  echo "ERROR: ${RELEASE_FILE} already exists; refusing to overwrite" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required" >&2
  exit 1
fi

# Gather current versions from ARTIFACT-MANIFEST; bail if any are null
MANIFEST="${DATA_DIR}/ARTIFACT-MANIFEST.json"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Build release JSON. Compute each artifact's versioned filename by splitting
# the symlink name at the final dot — jq's regex flavor doesn't support named
# captures reliably, so use explicit string ops instead.
jq --arg n "${RELEASE_N}" --arg ts "${TIMESTAMP}" --arg desc "${DESCRIPTION}" '
  def versioned_filename($sym; $v):
    if $v == null then null
    else
      ($sym | split("."))
      | (.[:-1] | join(".")) + ".v\($v)." + (. | last)
    end;
  {
    release: ($n | tonumber),
    created: $ts,
    description: $desc,
    artifacts: (.artifacts | to_entries | map({
      key: .key,
      value: {
        version: .value.current_version,
        symlink: .value.symlink,
        file: versioned_filename(.value.symlink; .value.current_version)
      }
    }) | from_entries)
  }
' "${MANIFEST}" > "${RELEASE_FILE}"

echo "release ${RELEASE_N} snapshot written to ${RELEASE_FILE}"
cat "${RELEASE_FILE}"
