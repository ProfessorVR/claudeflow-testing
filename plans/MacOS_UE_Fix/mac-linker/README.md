# mac-linker — the macOS allocator conflict with Apple's VoiceProcessingIO (builds 41–42, 2026-09-21)

## The problem

Unreal replaces all 24 global C++ `operator new`/`operator delete` forms in the primary game module
(`REPLACEMENT_OPERATOR_NEW_AND_DELETE`, ModuleBoilerplate.h) and the macOS game executable exports them. dyld then
binds every image in the process — libc++ and Apple's frameworks — to those operators, so the whole process allocates
through `FMemory` (FMallocBinned2, memory mapped by the engine itself). Apple's VoiceProcessingIO (the echo canceller)
frees blocks it obtained from `malloc()` through `operator delete[]`:

- macOS 15 (Air): at unit **disposal** (`AUAnomalyDetectionFactory → VAD3ConfigurationInterface`) → the quit crash of
  build 32 (`report/quit-crash-and-window-repair-2026-09-20.md` §2), worked around in build 33 by parking units.
- macOS 26 (lab MacBook Pro): at unit **creation** (`VoiceProcessor!vp::vx::database::v1::Database::load`) → a crash
  9–20 s after launch (`mac-next-phase-implementation-plan-2026-09-21.md` §2a), which parking cannot help.

Both are `FMallocBinned2` "unrecognized block" fatals. The requirement is echo cancellation on every Apple-silicon
macOS (M1–M5, macOS 15 → 26+), so the conflict had to be resolved, not gated.

## Build 41 — hiding the operators (FAILED, reverted)

`-Wl,-unexported_symbols_list` with `__Zn*`/`__Zd*` kept the operators out of the export table, so Apple's frameworks
stayed on libc++'s allocator. The standalone probe (`tools/mac/alloc_probe/vpio_alloc_probe.mm`) passed (0 foreign frees)
because it never exercised libc++'s *out-of-line* code. The game did, at once: `Aws::InitAPI → UnrealLogSystem::LogStream →
std::string::append → __grow_by_and_replace` (inside libc++.dylib) → `BUG_IN_CLIENT_OF_LIBMALLOC_POINTER_BEING_FREED_WAS_NOT_ALLOCATED`.
The executable's *inline* libc++ code (the string's first allocation) went through FMemory; the dylib's out-of-line
code freed it through the system allocator. Same crash on the lab Mac (macOS 26) and on the Air (macOS 15), at startup,
every time. Lesson: the operators must stay exported — libc++ itself is a C++ boundary, and its objects cross it.

## Build 42 — the fix that ships: foreign blocks go back to free()

`FMemory` on macOS never hands out a pointer that belongs to a malloc zone: FMallocBinned2 maps its own regions
(`FApplePlatformMemory::BinnedAllocFromOS`, mmap). So in the game's `operator delete`, a pointer that
`malloc_zone_from_ptr()` recognizes cannot be ours — it is a system-malloc block a framework is freeing through us —
and it goes to `free()`; everything else goes to `FMemory::Free` as before. The engine has the same test
(`FApplePlatformMemory::PtrIsOSMalloc`). The probe confirmed every foreign block VoiceProcessingIO frees is in a system
zone (`FOREIGN FREE … system malloc zone: yes`, all three). Cost, measured on the lab Mac (`zone_check_cost.mm`):
about 9 ns per delete for either kind of pointer.

Implementation: `Source/awsTutorial/awsTutorial.cpp` (both projects) expands `IMPLEMENT_PRIMARY_GAME_MODULE` by hand on
macOS — the UE 5.4.1 macro verbatim (`ModuleManager.h`, PLATFORM_DESKTOP, monolithic) except that every `operator
delete` and `StdFree` call `AwsTutorialFree()`, which does the zone check. Windows and every other platform keep the
stock `IMPLEMENT_PRIMARY_GAME_MODULE`. `awsTutorial.Target.cs` is back to stock (a comment records build 41). With this,
`EVCAECCaptureStream.cpp` no longer gates the voice back-end on the OS version (build 40's gate stays removed);
`EmbeddedVoiceChat.CaptureBackend=1` remains the manual escape hatch. The unit parking in `EVCCaptureCore_Mac.cpp`
stays — harmless, and it spares a unit re-creation per level.

If the engine is ever upgraded, re-derive the hand expansion from the new `IMPLEMENT_PRIMARY_GAME_MODULE`.

**Monolithic only (2026-09-21 late evening).** The hand expansion is guarded by `PLATFORM_MAC && IS_MONOLITHIC`. In
the modular editor target (`awsTutorialEditor`) every module's `IMPLEMENT_MODULE` already emits the replacement
operators, so the expansion was a redefinition there — found when the lab MacBook Pro compiled the editor target
from the migrated project (`awsTutorial.cpp:56: error: redefinition of 'operator delete'`); the Air had not rebuilt
its editor target since build 42 (dylib of 2026-09-19 13:51), so the cook there ran a pre-42 game module. The editor
keeps the stock macro (it is not shipped; on macOS 26 a PIE session with the voice unit could still hit the VPIO
free — dev-only). The packaged game is monolithic and unchanged, so builds 42–44 stay valid; no new build number.

## Files

- `awsTutorial.cpp` — master of the project's module file; copied to `<project>/Source/awsTutorial/awsTutorial.cpp`
  (both projects, identical).
- `awsTutorial.Target.cs` — master, stock + comment; copied to `<project>/Source/awsTutorial.Target.cs`.
- `unexported_operators.txt` — build 41's symbol list, kept for the record only; removed from both projects' `Build/Mac/`.
- `../tools/mac/alloc_probe/` — `vpio_alloc_probe.mm` (the foreign-free probe), `zone_check_cost.mm` (the timing).
