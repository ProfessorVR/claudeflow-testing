# Adversarial review — the awsTutorial Mac automation (2026-09-21, 23:15–23:50)

Goal set by the operator: resolve every error so the team package can be trusted and easily updated. Method: three
parallel read-only reviewers, each owning a slice (R1 engine script + project fixes; R2 sync/masters/zip tooling;
R3 packaging/test scripts + the documents that name them), reporting file:line, failure scenario and CONFIRMED /
PLAUSIBLE. Every CONFIRMED finding and every PLAUSIBLE one with a cheap fix was fixed; each fix was tested on WSL
and, where the behaviour is macOS-specific, on the Air or the lab MBP — see "Round 1 — corrections" below for the
rows that were trace-only when first written and what has been run since. Backup before the fixes:
`.backups/pre-script-review-20260921T231859/masters.tar`. Shellcheck (`~/.local/bin/shellcheck -S warning`) ran
before and after: after the fixes only two intentional notes remain (SC2088 literal `~` for a remote path, SC2034
unused loop variables).

Legend for "Test": WSL = run here; Air / MBP = run over ssh on that Mac; log = evidence in a named log.

## R1 — `run-ue541-mac.sh`, `apply-mac-project-fixes.sh`

| # | Sev | Finding (file:line as reviewed) | Fix | Test |
| --- | --- | --- | --- | --- |
| 1 | High | `$BK` used in the DONE heredoc but defined only in step 5, which `UE_SKIP_ENGINE=1` skips → `BK: unbound variable` after the DONE banner, exit 1 | `BK` defined in step 3 with `ENGINE_ROOT` | CONFIRMED in the MBP log `run-ue541-20260921-2312.log` line 483; rerun `…-2340-resume.log` prints the whole message |
| 2 | High | `apply-mac-project-fixes.sh` python edit `split('\n')` + `lines.index(section)` fails on a CRLF `DefaultEngine.ini` (every Windows-made zip); the perl edit left mixed endings | one CRLF-aware python edit for 11a + 11b that detects and keeps the file's EOL, checked exit code | WSL on a copy of the Windows ini: 208/208 lines CRLF after the edit, keys present, second run all `[ok]` |
| 3 | High | `SETUP_ARGS=()` expanded under `set -u` — Apple `/bin/bash` 3.2 treats an empty array as unbound → every interactive run dies at step 7 | plain string `SETUP_FORCE` | both Macs report bash 3.2.57; `bash -n`; non-interactive path exercised on the MBP |
| 4 | High | Homebrew absent from PATH in non-login shells → non-interactive run would try to install Homebrew and die | `export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"` at the top | MBP rerun without a manual PATH export |
| 5 | High | `git clone` and `cd "$ENGINE_ROOT"` unchecked → half-clone leaves the script editing relative paths in the wrong cwd | `|| die` on both; `FRESH_CLONE` flag | `bash -n`; logic traced |
| 6 | Med | 6a only warns when the backport does not apply, and `APPLIED.txt` claimed "6a … applied" regardless (the MBP's file said so while the log said "does not apply cleanly") | per-step outcomes (`present/present-modified/applied/unverified` after round 2) recorded; on a fresh clone a failed 6a dies | MBP `APPLIED.txt` now gets `6a=unverified` on its hand-edited tree |
| 7 | Med | `py_edit` assert failures (anchor not found) ignored, "applied" logged anyway | `|| die` on 6b/6e/6f; 6d dies when the key is missing | traced |
| 8 | Med | a re-run after a step-13 failure moved the 5 GB project aside and re-extracted; "resume" was false for step 12 | `.migrated-from` marker (zip md5 + name) written after extraction; same zip → keep | MBP resume rerun: "was extracted from this very zip … keeping it", no `_superseded_` copy |
| 9 | Med | two zips beside the script → the alphabetically first was migrated silently | die with the list unless `UE_PROJECT_ZIP` is set; `make-project-zip.sh` parks the previous zip in `old-zips/` | traced; README/runbook updated |
| 10 | Med | `python3.11 Setup.py` fallback is bogus (no such file) and buried the real error | removed; `die` with a resume hint | MBP run-1 log shows the bogus error; gone in later runs |
| 11 | Med | Xcode license never verified; non-interactive `sudo` fails silently | `xcodebuild -license check` before and after the attempt; die when still unaccepted | MBP: "Xcode license already accepted." |
| 12 | Med | 6h "already applied" = one grep of the fallback string; a hand-edited tree with one of the two hunks passed and the second never landed | already-applied = `git apply --reverse --check` OR both hunks present (`grep -c ≥ 2`); the gate requires both | Air (2 hunks) and MBP (2 hunks) pass |
| 13 | Med | `git ls-remote … | grep -q` under `pipefail` can fail on SIGPIPE | output captured into a variable first | MBP: "EpicGames access confirmed." |
| 14 | Low | helper scripts executed directly (need the exec bit; ExFAT drops it) | invoked with `bash` | MBP rerun |
| 15 | Low | disk guard warn-only when unattended | die when unattended AND no engine present | traced |
| — | note | step 13 ran without `caffeinate` on the skip route | one `caffeinate -dimsu -w $$` for the whole run, step 10's removed | MBP rerun |

## R2 — `sync_team_package.sh`, `verify-/apply-project-masters.sh`, `make-project-zip.sh`, `check_engine_patch.sh`, `backup_step.sh`, `apply_autotune_src.sh`

| # | Sev | Finding | Fix | Test |
| --- | --- | --- | --- | --- |
| 1 | High | `apply_autotune_src.sh` used sed `\r`, which BSD sed does not interpret (GNU-only) — the Mac conversion never worked (not destructive: BSD sed treated it as a no-op, verified on the Air) | `tr -d '\r'` / `perl -pe 's/\n/\r\n/'`; file list derived from `src/` | WSL: CRLF module → 1999/1999 CRLF lines, CR-stripped md5 = master; LF module byte-identical; Air (BSD tools): same results |
| 2 | High | `make-project-zip.sh` masters guard `verify … | tail -1 || die` could never fire (pipeline status) | output captured, `$?` tested; `set -o pipefail`; read-back checks now fail closed | `bash -n`; logic traced (a full zip run is 3 min and was not repeated) |
| 3 | High | second dated zip beside the script → the oldest picked | see R1-9 | — |
| 4 | Med | rsync without `--delete`; verify only walked `PACKAGE.md5` → renamed/removed files survived on every mirror and passed | `rsync --delete` with excludes; every copied tree/file removed before copying on WSL; remote verify also lists **extras** | push: `51 files, 0 mismatches, 0 extras` on both mirrors |
| 5 | Med | UTC timestamp in `MANIFEST.tsv` changed `PACKAGE.md5` on every no-op sync | timestamp removed | manifest stable across two syncs |
| 6 | Med | tuner file list hard-coded in the manifest (and in `apply_autotune_src.sh`) while `src/` is copied whole | both derived from `find src` | manifest = 18 files, same content |
| 7 | Med | `apply-project-masters.sh` hid `apply_autotune_src.sh` failures (`| tail -3`) | `set -o pipefail`, full output, exit 1 on failure | `bash -n`; traced |
| 8 | Med | `'*/Binaries/*'` also drops plugin binaries — correct today (all plugins have `Source/`) | kept; the zip script now lists plugins without `Source/` before zipping | traced |
| 9 | Med | step 12c treated verify's exit 2 (no manifest) as "project differs" | branch on `$?`: 2 = package incomplete | traced |
| 10 | Low | no per-mirror verification / rollback on a partial push | per-mirror rsync + verify; final line only when both pass | push output |
| 11 | Low | only five `~/gfx_autotune/` scripts refreshed | all eight refreshed and md5-compared | push output |
| 12 | Low | `check_engine_patch.sh` blind to a revert that keeps the marker comment | also requires the two fixed assignment lines verbatim | Air + MBP engines pass; the stock `.orig-preresfix` fails |
| 13 | Low | `backup_step.sh` `tar -T` list without `./` prefix | `./`-prefixed paths | Air: `BACKUP OK … 98 files` |
| 14 | Low | `docs/` accumulated old handoff copies | `docs/` cleaned before copying (R2-4) | — |

## R3 — `package_mac_gfx.sh`, `package_mac_shipping.sh`, `build_mac_editor.sh`, `package-awsTutorial-mac.sh`, `mac_runtime_test.sh`, `build_survey.sh`, documents

| # | Sev | Finding | Fix | Test |
| --- | --- | --- | --- | --- |
| 1 | High | `build_mac_editor.sh` guard `bash "$GUARD" … | tee … || …` — tee's status, the build always started | guard output captured, status tested; paths passed as `bash -c` arguments, not interpolated | `bash -n`; traced |
| 2 | High | `package_mac_gfx.sh` ran Shipping after a failed Development (from whatever old cook was on disk) and always ended `ALL_DONE` with exit 0 | `SHIP_SKIPPED` + `ALL_DONE` + exit 1 when `DEV_EXIT≠0`; exit 1 when `SHIP_EXIT≠0`; verify block guards a missing app / pak | `bash -n`; traced |
| 3 | Med | `package-awsTutorial-mac.sh` accepted `Success - N error(s)` for any N | requires `Success - 0 error(s)`; N>0 with "commandlet took" = COOK FAILED | traced |
| 4 | Med | `pkill -f 'UnrealEditor.*-run=Cook'` killed any project's cook | patterns include the `.uproject` basename | traced |
| 5 | Med | env-var naming: `package-awsTutorial-mac.sh`/`apply-electra-override-mac.sh` read `UE_PROJECT` (.uproject) while the runbook said every script takes `UE_PROJECT_DIR` | both scripts accept `UE_PROJECT_DIR` too; runbook §9 corrected | `bash -n` |
| 6 | Med | `package_mac_shipping.sh` exited with the verify block's status (always 0) even on `BUILD FAILED` | `exit "$UAT_RC"`; `set -u`; missing-app message | traced |
| 7 | Med | `mac_runtime_test.sh` searched one crash folder; macOS DiagnosticReports and the game's own `Saved/Crashes` were never listed | all three locations | Air/MBP smoke runs earlier used the old list; new list traced |
| 8 | Low | `screencapture` over ssh is a stale frame, unremarked | comment in the script | — |
| 9 | Low | `build_survey.sh` exported `SDKROOT` and passed `--sdk` | `--sdk` only | Air compile earlier |
| 10 | Med | docs: runbook §2 command lacked the resume story and named a zip that does not exist; expected-line table lacked the "moved aside" and "no MacWindow line on relaunch" cases; `chmod +x *.sh` missed nested scripts | runbook §1/§2/§5/§9 and README updated | read-through |
| 11 | Low | HANDOFF §10 A did not say which Shipping the MBP sign-off used | clarified (self-built) | — |

Not changed, by decision: `-clientconfig=Development` hard-coded in `package-awsTutorial-mac.sh` (Shipping has its own
script); the `'*/Binaries/*'` zip exclusion (correct for this project, now visible in the zip script's output);
the Windows project's `DefaultEngine.ini` signing lines (step 12b applies them on the Mac — and now does so on a
CRLF file too).

## Round 1 — corrections to the "Test" column (found by round 2)

Round 2's regression reviewer checked every "Test" claim above against the session evidence. At the time round 1
was written, these were **traced only**, not run: R1-6 (`6a=unverified` in `APPLIED.txt`), R1-11 (license line),
R1-12 on the MBP, R2-1's LF/byte-identical case on the Air (only the CRLF branch ran there), R3-9 after the SDK
change, the `.migrated-from` *write* path, and every change to `package_mac_gfx.sh`, `package_mac_shipping.sh`,
`build_mac_editor.sh`, `package-awsTutorial-mac.sh`, `mac_runtime_test.sh`. Since then (2026-09-22 00:00–00:25) the
MBP ran the full route twice (`run-ue541-20260921-2355-full.log`, `…-20260922-0020-full.log`: step 6 executed with
honest outcomes, license line printed, resume path), `build_survey.sh` compiled post-fix, and `mac_runtime_test.sh`
ran with the override. Still trace-only: the Shipping/editor/cook script changes (they need a real packaging run;
the next `package_mac_gfx.sh` on either Mac exercises them) and the marker *write* path (needs a fresh migration).

## Round 2 (2026-09-22 00:00–00:30) — two fresh reviewers + one regression reviewer, 31 findings

| # | Sev | Finding | Fix | Test |
| --- | --- | --- | --- | --- |
| E1 | High | disk guard ran before the ExFAT→sparse-bundle redirect and looked for the engine at the raw drive path → an engine inside the image on a nearly full ExFAT drive read as "no engine" (unattended: refuse; interactive: prompt) | guard moved after the final `ENGINE_ROOT`, skipped under `UE_SKIP_ENGINE=1` | traced; MBP full run |
| E2 | High | `confirm`/`ask` treated EOF on stdin as "yes"/default → an interactive run under `nohup`/ssh without `UE_NONINTERACTIVE=1` answered every question yes with no safeguards on | `need_tty`: die when stdin is not a terminal and not non-interactive; failed `read` = no | MBP: `[x] stdin is not a terminal …` |
| E3 | Med | 6a's fresh-clone `die` protected one run; the re-run downgraded it to a warning | 6a presence decided by its key effect (`Apple_SDK.json` accepts a 16.x SDK); die when neither applicable nor present AND no built editor exists | Air + MBP engines match (16.9.0), stock 15.9.0 does not; MBP run: `6a=present-modified` |
| E4 | Med | 6a "present" by reverse-check fails on every whitespace-fixed/hand-edited tree (both Macs) — reviewer suspected an overlap with 6b; the diff does not touch `MacToolChain.cs` (checked on the Air), the real cause is `AppleToolChain.cs:474` | same as E3 | same |
| E5 | Med | `apply-mac-project-fixes.sh` 11b keyed on `PremadeMacEntitlements` alone → an ini with one of the two keys was left as is and the run died at 12b for ever | each key checked and inserted independently | WSL case D |
| E6 | Med | 11a matched only the exact line `bMacSignToRunLocally=False` → `=True   `, `=false`, key absent, header with trailing space all hard-failed | key matched by name with `strip()`, rewritten whatever its value, inserted after the header when absent; headers compared stripped | WSL cases A–G |
| E7 | Med | zip existence and its top-level `.uproject` validated only at step 12, after the multi-hour build | validated in step 1 right after the prompt | MBP: `[x] Project zip not found` in step 1 |
| E8 | Med | the "exactly one zip" glob also matched AppleDouble `._*.zip` sidecars from the ExFAT drive | sidecars skipped | MBP: two real zips refused, `._fake.zip` ignored |
| E9 | Med | `diskutil info` on a plain subfolder fails ("Could not find disk", confirmed on the Air) → every ExFAT guard silently reported "unknown (assuming APFS)" | `fs_of()` resolves the mount point with `df` first | MBP run: `filesystem: APFS` |
| E10 | Low | DONE banner ran `package_mac_gfx.sh` directly (needs the exec bit) | `nohup bash …` | MBP DONE message |
| E11 | Low | a step-6 `die` never reached `APPLIED.txt` (only successes recorded) | EXIT trap writes the block marked INCOMPLETE | traced; MBP: complete block written once |
| E12 | Low | `.uproject` detection could pick `._awsTutorial.uproject` | `grep -v '^\._'` | traced |
| E13 | Low | first contact with github.com stalled on the host-key prompt and was reported as an Epic-access problem | `StrictHostKeyChecking=accept-new`, ssh's stderr shown on failure | MBP: access confirmed, no temp file left |
| E14 | Low | `UE_KEEP_EXISTING=1` logged "Extracted from" without extracting; the next plain run moved the kept project aside | origin logged from the marker; "Extracted from" only when extracting | MBP run: `Project present at …` |
| T1 | Med | `mac_runtime_test.sh`: `exit 2` inside `{ … } | tee` → script always exit 0 (the panel matrix would proceed after an ABORT) | `set -o pipefail` | MBP: bad project dir → rc 2 |
| T2 | Med | `package-awsTutorial-mac.sh` timeout branch killed only `caffeinate` (`$UAT`), leaving the cook and UAT running | both `pkill` patterns before `kill` on the timeout and failure paths | traced |
| T3 | Med | sync: a failed mirror backup (`tar`) was ignored and `rsync --delete` ran anyway | backup fails closed (`BACKUP FAILED`, nothing pushed) | push output (success path) |
| T4 | Med | sync: three hand-maintained files (`apply-electra-override-mac.sh`, `set_electra_override.py`, `verify_media_overrides.py`) missing from the presence check → a loss on WSL would propagate to every mirror via `--delete` | added to the check | push output |
| T5 | Med | `apply_autotune_src.sh` and `backup_step.sh` listed `._*` sidecars → binary "sources" installed from an ExFAT copy | `! -name '._*'` | WSL: 4 installed, 0 sidecars |
| T6 | Med | `mac_runtime_test.sh` crash search used `-newer <folder>` (mtime bumped by files created inside) → reports written early were hidden | `.start` file as the reference | MBP 30 s run |
| T7 | Low | `apply_autotune_src.sh` awk anchor accepted a multi-line `AddRange(` and inserted inside the initializer | anchor must be a one-line `AddRange(...);`, else refuse | WSL: refused with message |
| T8 | Low | `package_mac_gfx.sh first` with an existing backup name moved the app INTO the old backup app | refuse, tell the operator to use `rebuild` | MBP: refused, apps untouched |
| T9 | Low | `stage_gat_ini.sh set` on an ini without a `[GraphicsAutoTune]` section was a silent no-op | section appended; `UE_GUS_INI` override for tests | WSL |
| T10 | Low | sync: an rsync failure aborted without naming the mirror; an unmounted mirror printed "FAILED" with no reason | `RSYNC FAILED -> <mirror>`, `NO MIRROR at …` | traced |
| D1–D14 | — | documents: README/runbook/SOP/HANDOFF stale after round 1 (resume semantics, `Setup.py`, `UE_PROJECT_DIR` for the test script, "Air is the only build machine", HANDOFF §8 rules, §10 B/C/G, §3 scp note); the report's Test column (above) | all edited | read-through |

Not changed, by decision (round 2): `*/Binaries/*` zip exclusion (visible in the zip script's output); `caffeinate`
signal forwarding relied on by `package_mac_shipping.sh`/`build_mac_editor.sh` (they run UAT in the foreground of the
wrapper, the wrapper is what a caller kills).

## Round 3 (2026-09-22 00:45–01:15, final: two fresh reviewers + a commit auditor) — 9 code findings, 25 document items, all fixed

| # | Sev | Finding | Fix | Test |
| --- | --- | --- | --- | --- |
| F1 | High | round 2's disk-guard move made it measure the sparse **image** (nominal 600 GB free), not the ExFAT drive underneath | `RAW_PARENT` saved before the redirect; the guard takes the smaller of the two `df -g` values | traced; MBP full run (APFS path) |
| F2 | Med | `fs_of()` took the last `df` word → a mount point with a space (`/Volumes/My SSD`) became `SSD` | `mount_of()` = everything after the Capacity `%` column | MBP: `mount_of ~/Downloads` → `/System/Volumes/Data` |
| F3 | Med | `BatchMode=yes` at step 4 broke interactive users with a passphrase-protected key (same error text as a missing Epic link) | BatchMode only when unattended or stdin is not a tty | MBP full run (unattended path) |
| F4 | Med | `apply-mac-project-fixes.sh` matched keys file-wide → a key in another section was "fixed" there and the Xcode section stayed empty; UAT signing error after a full cook | `find_key` scoped to the XcodeProjectSettings section | WSL case H |
| F5 | Med | a relative `UE_PROJECT_ZIP`/`UE_ENGINE_PARENT`/`UE_PROJECT_DEST` passed step 1 and failed after step 5's `cd` | `abspath()` right after each prompt | MBP full run with `UE_PROJECT_ZIP=./…zip` |
| F6 | Low | BSD `nohup` keeps stdin, so a backgrounded interactive run passed `[ -t 0 ]` and stopped silently on SIGTTIN | `need_tty` also requires the foreground process group | traced |
| F7 | Low | an indented `  bMacSignToRunLocally=True` passed python but failed the shell post-check for ever | exact-line test; otherwise rewritten | WSL cases I, J |
| F8 | Low | `package_mac_gfx.sh rebuild` with a mistyped/unknown backup name deleted the apps with no copy parked | refuse when the backup folder is absent and an app exists | MBP: refused, apps present |
| F9 | Low | sync: a `~/gfx_autotune/` rsync failure aborted without a summary | named failure, `ALL_OK=0` | traced |
| D | — | 25 document items (README engine-parent variables in the skip command, `bash ./run-…` everywhere, Homebrew/cmake and the zip's location + md5 check in §0, map choice and launch prerequisites, build_mac_editor returns at once, Electra script env, `Result:` line shape, §9 override table, SOP "eight fixes"/6h both hunks, HANDOFF title/§5/§3 audio-output note, report wording); script headers (`run-ue541-mac.sh` default path, `apply-mac-project-fixes.sh` fix list and NOTE) | all edited | read-through |
| C | — | commit audit: the remote is **public**; engine diffs were already committed in `e59785a84` (pre-existing EULA exposure — operator informed); the new patch copies add no new engine lines; the lab GitHub account name redacted from the handoff (kept in local memory); 88 MB of stale ssh screenshots and a duplicate backup excluded from the commit | — | — |

## Rules this review adds to the standing list (HANDOFF §8/§9)

- Apple's `/bin/bash` is 3.2: no empty-array expansion under `set -u`, no bash-4 syntax in anything that runs on a Mac.
- A command whose exit status matters is never piped into `tee`, `tail` or `grep -q` without `pipefail` — or its
  output is captured first.
- sed `\r` is GNU-only; convert line endings with `tr`/`perl`.
- Run helper scripts with `bash …`; ExFAT (the lab drive) keeps no exec bits.
- Every mirror check must list extras, not only mismatches; every verify script must fail closed on a missing input.
