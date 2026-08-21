#!/usr/bin/env bash
# activate-release.sh — atomically activate a release bundle.
#
# A release is a coordinated snapshot of every artifact's active version. This
# script never rotates per-artifact; it only swaps the whole bundle. Loader
# code reads fixed-name symlinks so no code change is needed.
#
# Failure-atomicity: all preconditions checked before any symlink is touched.
# If any check fails, no state is mutated.
#
# Usage: activate-release.sh <N>

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: $0 <release-number>" >&2
  exit 2
fi

RELEASE_N="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${SCRIPT_DIR}/../data/corpus/index"
RELEASE_FILE="${DATA_DIR}/releases/release-${RELEASE_N}.json"
MANIFEST="${DATA_DIR}/ARTIFACT-MANIFEST.json"

if [ ! -f "${RELEASE_FILE}" ]; then
  echo "ERROR: ${RELEASE_FILE} does not exist" >&2
  exit 1
fi
if [ ! -f "${MANIFEST}" ]; then
  echo "ERROR: ${MANIFEST} does not exist" >&2
  exit 1
fi

# Requires jq for atomic JSON operations
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required" >&2
  exit 1
fi

# Preflight: verify every target file exists
mapfile -t ARTIFACTS < <(jq -r '.artifacts | keys[]' "${RELEASE_FILE}")
for art in "${ARTIFACTS[@]}"; do
  target=$(jq -r ".artifacts[\"${art}\"].file" "${RELEASE_FILE}")
  if [ -z "${target}" ] || [ "${target}" = "null" ]; then
    echo "ERROR: release ${RELEASE_N} has null target for ${art}" >&2
    exit 1
  fi
  if [ ! -f "${DATA_DIR}/${target}" ]; then
    echo "ERROR: target ${DATA_DIR}/${target} for ${art} does not exist" >&2
    exit 1
  fi
done

# Preflight passed; now swap all symlinks.
# Build staging area to make swap atomic per-symlink.
TMP_DIR=$(mktemp -d "${DATA_DIR}/.activate.XXXXXX")
trap 'rm -rf "${TMP_DIR}"' EXIT

for art in "${ARTIFACTS[@]}"; do
  target=$(jq -r ".artifacts[\"${art}\"].file" "${RELEASE_FILE}")
  symlink=$(jq -r ".artifacts[\"${art}\"].symlink" "${RELEASE_FILE}")
  # Relative link so the tree is relocatable
  ln -s "${target}" "${TMP_DIR}/${symlink}"
done

# Move staged links into place (each rename is atomic on POSIX)
for art in "${ARTIFACTS[@]}"; do
  symlink=$(jq -r ".artifacts[\"${art}\"].symlink" "${RELEASE_FILE}")
  mv -f "${TMP_DIR}/${symlink}" "${DATA_DIR}/${symlink}"
done

# Update ARTIFACT-MANIFEST last: active_release pointer + per-artifact current_version
tmpfile=$(mktemp)
jq --arg n "${RELEASE_N}" --slurpfile rel "${RELEASE_FILE}" '
  .active_release = ($n | tonumber)
  | .artifacts = (.artifacts as $a | $rel[0].artifacts as $r |
      ($a | to_entries | map(.value.current_version = $r[.key].version) | from_entries))
' "${MANIFEST}" > "${tmpfile}"
mv -f "${tmpfile}" "${MANIFEST}"

# Post-swap integrity re-verify
for art in "${ARTIFACTS[@]}"; do
  symlink=$(jq -r ".artifacts[\"${art}\"].symlink" "${RELEASE_FILE}")
  if [ ! -L "${DATA_DIR}/${symlink}" ]; then
    echo "ERROR post-swap: ${DATA_DIR}/${symlink} is not a symlink" >&2
    exit 1
  fi
  if [ ! -e "${DATA_DIR}/${symlink}" ]; then
    echo "ERROR post-swap: ${DATA_DIR}/${symlink} dangles" >&2
    exit 1
  fi
done

echo "release ${RELEASE_N} activated"
