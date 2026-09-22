#!/usr/bin/env python3
"""Speaker selection: put the staged sources into a project (Windows via /mnt/c, or a Mac project path).
  - EmbeddedVoiceChat plugin: the 4 patched AEC files (echo reference follows the game's output device).
  - Source/awsTutorial: AudioOutputSelectorSubsystem.{h,cpp} (CRLF, like the other project sources).
  - awsTutorial.Build.cs: AudioMixer + AudioMixerCore; CoreAudio framework on Mac.
Idempotent. Usage: apply_audio_output_src.py <project dir>"""
import pathlib
import shutil
import sys

HERE = pathlib.Path(__file__).resolve().parent
STAGED_PLUGIN = HERE.parent / "voice-aec-fix" / "EmbeddedVoiceChat"
PLUGIN_FILES = ["Private/AEC/EVCCaptureCore.h", "Private/Windows/EVCCaptureCore_Windows.cpp",
                "Private/AEC/EVCAECCaptureStream.h", "Private/AEC/EVCAECCaptureStream.cpp"]

proj = pathlib.Path(sys.argv[1])
if not (proj / "awsTutorial.uproject").is_file():
    sys.exit(f"not a project dir: {proj}")
plugin = proj / "Plugins/UltimateMultiplayerServicesPlugin/Source/EmbeddedVoiceChat"
src = proj / "Source/awsTutorial"

for rel in PLUGIN_FILES:
    shutil.copyfile(STAGED_PLUGIN / rel, plugin / rel)
    print("plugin", rel)

for name in ["AudioOutputSelectorSubsystem.h", "AudioOutputSelectorSubsystem.cpp"]:
    text = (HERE / "src" / name).read_text(encoding="utf-8").replace("\r\n", "\n")
    (src / name).write_bytes(text.replace("\n", "\r\n").encode("utf-8"))
    print("source", name)

build = src / "awsTutorial.Build.cs"
raw = build.read_bytes().decode("utf-8")
crlf = "\r\n" in raw
s = raw.replace("\r\n", "\n")
anchor = """		PrivateDependencyModuleNames.AddRange(new string[] { "Slate", "SlateCore", "UMG", "RHI", "RenderCore", "ApplicationCore" });
"""
addition = """
		// AudioOutputSelectorSubsystem (2026-09-19): output device list and switching (AudioMixer, AudioMixerCore);
		// on Mac the system default output (Core Audio).
		PrivateDependencyModuleNames.AddRange(new string[] { "AudioMixer", "AudioMixerCore" });
		if (Target.Platform == UnrealTargetPlatform.Mac)
		{
			PublicFrameworks.Add("CoreAudio");
		}
"""
if "AudioOutputSelectorSubsystem" not in s:
    if s.count(anchor) != 1:
        sys.exit("Build.cs anchor not found exactly once")
    s = s.replace(anchor, anchor + addition)
    build.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
    print("Build.cs patched")
else:
    print("Build.cs already patched")
