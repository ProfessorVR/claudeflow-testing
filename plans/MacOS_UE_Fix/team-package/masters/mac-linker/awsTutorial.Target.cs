// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;
using System.Collections.Generic;

public class awsTutorialTarget : TargetRules
{
	public awsTutorialTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		bValidateFormatStrings = true;
		DefaultBuildSettings = BuildSettingsVersion.V5;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_4;
		ExtraModuleNames.Add("awsTutorial");

		// macOS note (2026-09-21): build 41 hid the engine's replacement operator new/delete from dyld here
		// (-Wl,-unexported_symbols_list) to keep Apple's VoiceProcessingIO on libc++'s allocator. It crashed at the
		// first std::string growth inside libc++.dylib: the executable's inline libc++ code allocates through FMemory,
		// the dylib's out-of-line code frees through the system allocator. The operators must stay exported; the
		// allocator conflict is handled in Source/awsTutorial/awsTutorial.cpp instead (plans/MacOS_UE_Fix/mac-linker/README.md).
	}
}
