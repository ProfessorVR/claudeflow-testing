#!/usr/bin/env bash
# =============================================================================
#  apply-mac-project-fixes.sh
#  Applies the Mac-side PROJECT fixes to a freshly migrated Windows project.
#
#  WHY THIS EXISTS
#      These fixes live in the project's Config/ and Build/Mac/ — NOT in the
#      engine. They were historically applied by hand to the copy sitting on the
#      Mac, so they exist ONLY there. Migrate a fresh zip from Windows and you
#      lose every one of them, and packaging dies at the very last step with:
#          error: Signing for "<Project>" requires selecting either a
#          development team or a provisioning profile.  ** BUILD FAILED **
#      after a full cook + 12-minute build. (Observed 2026-08-25.)
#
#  WHAT IT APPLIES        (all idempotent — safe to re-run; CRLF files keep their line endings)
#      1. 11a  bMacSignToRunLocally=True        ad-hoc signing, no Apple team (key rewritten/inserted in the
#                                              XcodeProjectSettings section whatever its current spelling)
#      2. 11b  PremadeMacEntitlements + ShippingSpecificMacEntitlements (each checked on its own)
#      3. 11b  Build/Mac/Resources/NoSandbox.entitlements   (CEF needs no sandbox) — copied from masters/project-mac
#      4. 11e  NSMicrophoneUsageDescription in Info.Template.plist — plist copied from masters/project-mac when absent
#      5.      NSHighResolutionCapable in the same plist (Retina rendering, graphics-autoconfig 2026-09-18)
#
#  ⭐ ALSO PUSH THESE BACK TO THE WINDOWS SOURCE PROJECT. Until you do, every
#     future migration has to run this script again.
#
#  USAGE
#      ./apply-mac-project-fixes.sh [/path/to/Project]
#      (default /Volumes/UnrealEngine/Unreal_Projects/awsTutorial)
# =============================================================================
set -uo pipefail

PROJ="${1:-/Volumes/UnrealEngine/Unreal_Projects/awsTutorial}"
INI="$PROJ/Config/DefaultEngine.ini"
RES="$PROJ/Build/Mac/Resources"
PLIST="$RES/Info.Template.plist"
ENT="$RES/NoSandbox.entitlements"
SECTION='[/Script/MacTargetPlatform.XcodeProjectSettings]'
TS="$(date +%Y%m%dT%H%M%S)"

[ -f "$INI" ] || { echo "FATAL: $INI not found — is '$PROJ' a project root?"; exit 1; }
mkdir -p "$RES/.backups"

echo "project: $PROJ"
echo

# ---- 1 + 2. DefaultEngine.ini ------------------------------------------------
# One CRLF-aware edit (2026-09-21): a zip made on Windows has a CRLF DefaultEngine.ini; the old perl/python edits
# left mixed line endings or failed on the '\r' after the section header. The file's own EOL is detected and kept.
if grep -q '^bMacSignToRunLocally=True' "$INI" && grep -q '^PremadeMacEntitlements=' "$INI" \
   && grep -q '^ShippingSpecificMacEntitlements=' "$INI"; then
  echo "  [ok]  11a bMacSignToRunLocally already True"
  echo "  [ok]  11b entitlements INI lines already present"
else
  cp -p "$INI" "$RES/.backups/DefaultEngine.ini.$TS.bak"
  python3 - "$INI" "$SECTION" <<'PY' || { echo "  [!!]  11a/11b DefaultEngine.ini edit failed (see the message above)"; exit 1; }
import sys
ini, section = sys.argv[1], sys.argv[2]
raw = open(ini, 'rb').read().decode('utf-8', errors='surrogateescape')
eol = '\r\n' if '\r\n' in raw else '\n'
lines = raw.replace('\r\n', '\n').split('\n')
changed = []
def key_of(l):
    return l.split('=', 1)[0].strip() if '=' in l and not l.lstrip().startswith(';') else None
def find_key(name):
    # scoped to the XcodeProjectSettings section: the same key in another section must not count (2026-09-22 review)
    i, j = section_end()
    for k in range(i + 1, j):
        if key_of(lines[k]) == name:
            return k
    return -1
def section_end():
    # index just past the last non-blank line of the XcodeProjectSettings section (headers compared stripped)
    i = -1
    for k, l in enumerate(lines):
        if l.strip() == section:
            i = k; break
    if i < 0:
        sys.exit("section %s not found in %s" % (section, ini))
    j = i + 1
    while j < len(lines) and not lines[j].lstrip().startswith('['):
        j += 1
    while j > i + 1 and lines[j-1].strip() == '':
        j -= 1
    return i, j
# 11a — ad-hoc signing: rewrite the key whatever its current value/spacing; insert it when absent (2026-09-21 review)
k = find_key('bMacSignToRunLocally')
if k >= 0 and lines[k].rstrip() == 'bMacSignToRunLocally=True':   # exact: the shell post-check greps ^bMacSignToRunLocally=True
    pass
else:
    new = ['; Ad-hoc sign the .app locally so packaging needs no Apple Developer team/cert.',
           '; (Distribution/notarization later requires a paid Developer ID + bUseAutomaticCodeSigning.)',
           'bMacSignToRunLocally=True']
    if k >= 0:
        lines[k:k+1] = new
    else:
        i, j = section_end()
        lines[i+1:i+1] = new
    changed.append('11a bMacSignToRunLocally -> True')
# 11b — the two entitlement keys, each checked on its own, appended at the end of the section
ent = '(FilePath="/Game/Build/Mac/Resources/NoSandbox.entitlements")'
missing = [n for n in ('PremadeMacEntitlements', 'ShippingSpecificMacEntitlements') if find_key(n) < 0]
if missing:
    i, j = section_end()
    add = []
    if len(missing) == 2:
        add += ['; Non-sandbox entitlements: the App Sandbox makes CEF/Chromium (WebBrowserWidget,',
                '; used by the Cognito Hosted-UI login) hard-crash at cef_initialize. Ship unsandboxed.']
    add += ['%s=%s' % (n, ent) for n in missing]
    lines[j:j] = add
    changed.append('11b entitlements INI lines added (%s)' % ', '.join(missing))
open(ini, 'wb').write(eol.join(lines).encode('utf-8', errors='surrogateescape'))
for c in changed:
    print('  [FIX] ' + c + ('  (CRLF kept)' if eol == '\r\n' else ''))
PY
  grep -q '^bMacSignToRunLocally=True' "$INI" || { echo "  [!!]  11a could not set bMacSignToRunLocally"; exit 1; }
  grep -q '^PremadeMacEntitlements=' "$INI"    || { echo "  [!!]  11b could not add entitlement lines"; exit 1; }
fi

# ---- 3. NoSandbox.entitlements ----------------------------------------------
# 2026-09-21: a zip made on Windows has no Build/Mac/Resources at all (review M9). The two Mac-only files are
# mastered in masters/project-mac/ beside this script and copied in when absent; the edits below stay idempotent.
MASTERS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/masters/project-mac/Build/Mac/Resources"
mkdir -p "$RES"
if [ -f "$ENT" ]; then
  echo "  [ok]  11b NoSandbox.entitlements exists"
elif [ -f "$MASTERS/NoSandbox.entitlements" ]; then
  cp "$MASTERS/NoSandbox.entitlements" "$ENT" && echo "  [FIX] 11b NoSandbox.entitlements copied from masters/project-mac"
else
  cat > "$ENT" <<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- No com.apple.security.app-sandbox: CEF/Chromium (WebBrowserWidget, used by the
         Cognito Hosted-UI login) cannot initialize inside the macOS App Sandbox.
         Without the sandbox, network access is unrestricted; the network keys are
         harmless and kept for clarity. get-task-allow suits Development/local builds;
         drop it for a notarized Developer ID distribution build. -->
    <key>com.apple.security.get-task-allow</key><true/>
    <key>com.apple.security.network.client</key><true/>
    <key>com.apple.security.network.server</key><true/>
</dict>
</plist>
XML
  echo "  [FIX] 11b NoSandbox.entitlements created"
fi

# ---- 4. NSMicrophoneUsageDescription (+ NSHighResolutionCapable, 2026-09-18 Retina rendering) ----------------
if [ ! -f "$PLIST" ]; then
  if [ -f "$MASTERS/Info.Template.plist" ]; then
    cp "$MASTERS/Info.Template.plist" "$PLIST" && echo "  [FIX] 11e Info.Template.plist copied from masters/project-mac (mic key, Retina flag, ATS)"
  else
    # Fall back to the engine's template so the keys below have a file to land in.
    ETPL="${UE_ENGINE:-/Volumes/UnrealEngine/UE_5_4_1}/Engine/Build/Mac/Resources/Info.Template.plist"
    if [ -f "$ETPL" ]; then cp "$ETPL" "$PLIST" && echo "  [FIX] 11e Info.Template.plist created from the engine template $ETPL"
    else echo "  [!!]  11e $PLIST missing and no master/engine template found — skipping mic key"; fi
  fi
fi
if [ ! -f "$PLIST" ]; then
  :
elif grep -q 'NSMicrophoneUsageDescription' "$PLIST"; then
  echo "  [ok]  11e NSMicrophoneUsageDescription already present"
else
  cp -p "$PLIST" "$RES/.backups/Info.Template.plist.$TS.bak"
  perl -0pi -e 's|(<dict>)|$1\n\t<key>NSMicrophoneUsageDescription</key>\n\t<string>awsTutorial uses your microphone for in-game proximity voice chat.</string>|' "$PLIST"
  grep -q 'NSMicrophoneUsageDescription' "$PLIST" \
    && echo "  [FIX] 11e NSMicrophoneUsageDescription added" \
    || echo "  [!!]  11e could not add mic key"
fi
if [ -f "$PLIST" ]; then
  if grep -q 'NSHighResolutionCapable' "$PLIST"; then
    echo "  [ok]  Retina NSHighResolutionCapable present"
  else
    cp -p "$PLIST" "$RES/.backups/Info.Template.plist.$TS.hidpi.bak"
    perl -0pi -e 's|(<dict>)|$1\n\t<key>NSHighResolutionCapable</key>\n\t<true/>|' "$PLIST"
    grep -q 'NSHighResolutionCapable' "$PLIST" && echo "  [FIX] Retina NSHighResolutionCapable added (the game renders at panel resolution; graphics-autoconfig 2026-09-18)" || echo "  [!!]  could not add NSHighResolutionCapable"
  fi
fi
grep -q '^bAllowHighDPIInGameMode=True' "$INI" || echo "  NOTE: DefaultEngine.ini lacks bAllowHighDPIInGameMode=True — add it by hand after DesignScreenSize= in [/Script/Engine.UserInterfaceSettings] (the current project already has it)"

# ---- verify ------------------------------------------------------------------
echo
echo "==== verification ===="
fail=0
grep -q 'NSHighResolutionCapable' "$PLIST" 2>/dev/null          || { echo "  MISSING NSHighResolutionCapable"; fail=1; }
grep -q '^bMacSignToRunLocally=True' "$INI"                || { echo "  MISSING bMacSignToRunLocally=True"; fail=1; }
grep -q '^PremadeMacEntitlements='  "$INI"                 || { echo "  MISSING PremadeMacEntitlements"; fail=1; }
grep -q '^ShippingSpecificMacEntitlements=' "$INI"         || { echo "  MISSING ShippingSpecificMacEntitlements"; fail=1; }
[ -f "$ENT" ]                                              || { echo "  MISSING NoSandbox.entitlements"; fail=1; }
grep -q 'NSMicrophoneUsageDescription' "$PLIST" 2>/dev/null || { echo "  MISSING NSMicrophoneUsageDescription"; fail=1; }
grep -q 'NSAllowsArbitraryLoads' "$PLIST" 2>/dev/null       || echo "  NOTE: no NSAllowsArbitraryLoads — plaintext-HTTP CloudFront streams may be blocked (ATS)"
if [ $fail -eq 0 ]; then
  echo "  ALL MAC PROJECT FIXES PRESENT — safe to package."
else
  echo "  INCOMPLETE — do not package yet."
  exit 1
fi
