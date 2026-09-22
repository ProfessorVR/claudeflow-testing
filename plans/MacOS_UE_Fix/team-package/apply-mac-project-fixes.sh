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
#  WHAT IT APPLIES        (all idempotent — safe to re-run)
#      1. 11a  bMacSignToRunLocally=True        ad-hoc signing, no Apple team
#      2. 11b  PremadeMacEntitlements + ShippingSpecificMacEntitlements
#      3. 11b  Build/Mac/Resources/NoSandbox.entitlements   (CEF needs no sandbox)
#      4. 11e  NSMicrophoneUsageDescription in Info.Template.plist
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
cp -p "$INI" "$RES/.backups/DefaultEngine.ini.$TS.bak"

if grep -q '^bMacSignToRunLocally=True' "$INI"; then
  echo "  [ok]  11a bMacSignToRunLocally already True"
else
  perl -pi -e 's/^bMacSignToRunLocally=False/; Ad-hoc sign the .app locally so packaging needs no Apple Developer team\/cert.\n; (Distribution\/notarization later requires a paid Developer ID + bUseAutomaticCodeSigning.)\nbMacSignToRunLocally=True/' "$INI"
  grep -q '^bMacSignToRunLocally=True' "$INI" \
    && echo "  [FIX] 11a bMacSignToRunLocally -> True" \
    || { echo "  [!!]  11a could not set bMacSignToRunLocally"; exit 1; }
fi

if grep -q '^PremadeMacEntitlements=' "$INI"; then
  echo "  [ok]  11b entitlements INI lines already present"
else
  python3 - "$INI" "$SECTION" <<'PY'
import sys
ini, section = sys.argv[1], sys.argv[2]
lines = open(ini, encoding='utf-8', errors='replace').read().split('\n')
add = ['; Non-sandbox entitlements: the App Sandbox makes CEF/Chromium (WebBrowserWidget,',
       '; used by the Cognito Hosted-UI login) hard-crash at cef_initialize. Ship unsandboxed.',
       'PremadeMacEntitlements=(FilePath="/Game/Build/Mac/Resources/NoSandbox.entitlements")',
       'ShippingSpecificMacEntitlements=(FilePath="/Game/Build/Mac/Resources/NoSandbox.entitlements")']
i = lines.index(section)
j = i + 1
while j < len(lines) and not lines[j].startswith('['):
    j += 1
while j > i + 1 and lines[j-1].strip() == '':
    j -= 1
lines[j:j] = add
open(ini, 'w', encoding='utf-8').write('\n'.join(lines))
PY
  grep -q '^PremadeMacEntitlements=' "$INI" \
    && echo "  [FIX] 11b entitlements INI lines added" \
    || { echo "  [!!]  11b could not add entitlement lines"; exit 1; }
fi

# ---- 3. NoSandbox.entitlements ----------------------------------------------
if [ -f "$ENT" ]; then
  echo "  [ok]  11b NoSandbox.entitlements exists"
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

# ---- 4. NSMicrophoneUsageDescription ----------------------------------------
if [ ! -f "$PLIST" ]; then
  echo "  [!!]  11e $PLIST missing — skipping mic key"
elif grep -q 'NSMicrophoneUsageDescription' "$PLIST"; then
  echo "  [ok]  11e NSMicrophoneUsageDescription already present"
else
  cp -p "$PLIST" "$RES/.backups/Info.Template.plist.$TS.bak"
  perl -0pi -e 's|(<dict>)|$1\n\t<key>NSMicrophoneUsageDescription</key>\n\t<string>awsTutorial uses your microphone for in-game proximity voice chat.</string>|' "$PLIST"
  grep -q 'NSMicrophoneUsageDescription' "$PLIST" \
    && echo "  [FIX] 11e NSMicrophoneUsageDescription added" \
    || echo "  [!!]  11e could not add mic key"
fi

# ---- verify ------------------------------------------------------------------
echo
echo "==== verification ===="
fail=0
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
