#!/usr/bin/env bash
#
# validate-gold-notes.sh — mechanical validator for gold-set annotation conventions.
#
# Enforces:
#   1. Em-dash character: U+2014 only; flags  --  |  -  |  –  |  ―
#   2. Em-dash padding: exactly one space on each side of — in flag-block position
#   3. Pipe padding: exactly one space on each side of | when used as compound-flag separator
#   4. Sentinel-bracket well-formedness in CONVENTIONS.md (BEGIN/END pairs match)
#
# Scope: data/gold/resolver-gold-dev.jsonl, data/gold/resolver-gold-holdout.jsonl,
#        plus data/gold/CONVENTIONS.md for sentinel check.
#
# Day-one output format: file:line — violation description
# (Structured found/expected/fix format deferred per CONVENTIONS §9.)
#
# Exit code: 0 on clean; 1 on any violation.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
GOLD_DIR="${SANDBOX_DIR}/data/gold"

VIOLATIONS=0

emit() {
    echo "$1"
    VIOLATIONS=$((VIOLATIONS + 1))
}

# ----------------------------------------------------------------------
# Target file discovery
# ----------------------------------------------------------------------
GOLD_FILES=()
for f in "${GOLD_DIR}/resolver-gold-dev.jsonl" "${GOLD_DIR}/resolver-gold-holdout.jsonl"; do
    [[ -f "$f" ]] && GOLD_FILES+=("$f")
done

if [[ ${#GOLD_FILES[@]} -eq 0 ]]; then
    echo "validate-gold-notes.sh: no gold files found yet (expected resolver-gold-dev.jsonl / resolver-gold-holdout.jsonl)"
    echo "validate-gold-notes.sh: this is expected during initial annotation; running sentinel check on CONVENTIONS.md only"
fi

# ----------------------------------------------------------------------
# Check 1: em-dash character substitutes inside notes fields
# ----------------------------------------------------------------------
# Look only inside a "notes":"..." field to avoid false positives on
# legitimate hyphens elsewhere in the JSON. Each JSONL line is one object.
for f in "${GOLD_FILES[@]}"; do
    # Extract notes field per line; flag substitute characters where em-dash is expected.
    # Patterns checked:
    #   --    (double hyphen ASCII)
    #   ␣-␣   (space hyphen space, the ambiguous case)
    #   –     (U+2013 en-dash)
    #   ―     (U+2015 horizontal bar)
    # jq safely extracts the notes field; sed/grep operate on extracted content.
    lineno=0
    while IFS= read -r line; do
        lineno=$((lineno + 1))
        notes="$(echo "$line" | jq -r '.notes // ""' 2>/dev/null)"
        [[ -z "$notes" ]] && continue

        # Only apply em-dash checks if the notes field carries flag syntax (AF: or PL:).
        # Pure-prose unflagged notes may legitimately use -- or - in content.
        if [[ "$notes" =~ (AF[0-9]+:|PL:) ]]; then
            if echo "$notes" | grep -qE -- '--'; then
                emit "${f}:${lineno} — em-dash violation: ASCII '--' in flagged notes; use U+2014 '—'"
            fi
            if echo "$notes" | grep -qE ' - '; then
                emit "${f}:${lineno} — em-dash violation: space-hyphen-space ' - ' in flagged notes; use ' — '"
            fi
            if echo "$notes" | grep -qE $'\xe2\x80\x93'; then
                emit "${f}:${lineno} — em-dash violation: en-dash '–' (U+2013) in flagged notes; use '—' (U+2014)"
            fi
            if echo "$notes" | grep -qE $'\xe2\x80\x95'; then
                emit "${f}:${lineno} — em-dash violation: horizontal bar '―' (U+2015) in flagged notes; use '—' (U+2014)"
            fi
        fi
    done < "$f"
done

# ----------------------------------------------------------------------
# Check 2: em-dash padding (must be ␣—␣, not ␣—X or X—␣ or X—X)
# ----------------------------------------------------------------------
for f in "${GOLD_FILES[@]}"; do
    lineno=0
    while IFS= read -r line; do
        lineno=$((lineno + 1))
        notes="$(echo "$line" | jq -r '.notes // ""' 2>/dev/null)"
        [[ -z "$notes" ]] && continue
        [[ ! "$notes" =~ (AF[0-9]+:|PL:) ]] && continue

        # Unpadded em-dash: character adjacent to non-space on either side.
        # We check for  X—  ,  —X  , where X is any non-space character.
        if echo "$notes" | grep -qP '\S—'; then
            emit "${f}:${lineno} — em-dash padding violation: missing space before '—' (must be ' — ' with single spaces both sides)"
        fi
        if echo "$notes" | grep -qP '—\S'; then
            emit "${f}:${lineno} — em-dash padding violation: missing space after '—' (must be ' — ' with single spaces both sides)"
        fi
    done < "$f"
done

# ----------------------------------------------------------------------
# Check 3: pipe padding on compound-flag separator
# ----------------------------------------------------------------------
# Only enforce pipe padding when pipe appears in a notes field that also
# carries flag syntax (otherwise pipes in prose are not compound separators).
for f in "${GOLD_FILES[@]}"; do
    lineno=0
    while IFS= read -r line; do
        lineno=$((lineno + 1))
        notes="$(echo "$line" | jq -r '.notes // ""' 2>/dev/null)"
        [[ -z "$notes" ]] && continue
        [[ ! "$notes" =~ (AF[0-9]+:|PL:) ]] && continue
        # Does notes contain a pipe?
        if echo "$notes" | grep -qF '|'; then
            # Pipe must be surrounded by single spaces on both sides.
            if echo "$notes" | grep -qP '\S\|'; then
                emit "${f}:${lineno} — pipe padding violation: missing space before '|' (compound-flag separator must be ' | ')"
            fi
            if echo "$notes" | grep -qP '\|\S'; then
                emit "${f}:${lineno} — pipe padding violation: missing space after '|' (compound-flag separator must be ' | ')"
            fi
        fi
    done < "$f"
done

# ----------------------------------------------------------------------
# Check 4: sentinel brackets in CONVENTIONS.md
# ----------------------------------------------------------------------
CONV="${GOLD_DIR}/CONVENTIONS.md"
if [[ -f "$CONV" ]]; then
    # Count BEGIN and END markers; they must pair.
    begin_count=$(grep -cE '<!-- BEGIN auto-generated:' "$CONV" || true)
    end_count=$(grep -cE '<!-- END auto-generated:' "$CONV" || true)
    if [[ "$begin_count" -ne "$end_count" ]]; then
        emit "${CONV} — sentinel mismatch: ${begin_count} BEGIN markers vs ${end_count} END markers"
    fi
    # Each BEGIN must have a matching END with the same label (simple ordered check).
    # Extract labels in order and ensure BEGIN<label> is followed by END<label> before any other BEGIN.
    python3 -c "
import re, sys
text = open('$CONV').read()
pattern = re.compile(r'<!-- (BEGIN|END) auto-generated:([^ >-]+) -->')
stack = []
violations = []
for m in pattern.finditer(text):
    kind, label = m.group(1), m.group(2)
    if kind == 'BEGIN':
        stack.append(label)
    else:
        if not stack:
            violations.append(f'END:{label} with no open BEGIN')
        elif stack[-1] != label:
            violations.append(f'END:{label} closes BEGIN:{stack[-1]} (mismatched label)')
        else:
            stack.pop()
if stack:
    violations.append(f'unclosed BEGIN blocks: {stack}')
for v in violations:
    print(v)
sys.exit(1 if violations else 0)
" 2>&1 | while IFS= read -r v; do
        [[ -n "$v" ]] && emit "${CONV} — sentinel structure: $v"
    done
fi

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
if [[ "$VIOLATIONS" -eq 0 ]]; then
    echo "validate-gold-notes.sh: OK (0 violations)"
    exit 0
else
    echo ""
    echo "validate-gold-notes.sh: ${VIOLATIONS} violation(s) — commit blocked"
    exit 1
fi
