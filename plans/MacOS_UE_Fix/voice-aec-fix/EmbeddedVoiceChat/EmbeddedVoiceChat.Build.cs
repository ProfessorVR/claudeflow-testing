/* Copyright (C) Siqi.Wu - All Rights Reserved
 * Written by Siqi.Wu <lion547016@gmail.com>, Feb 2022
 */

using UnrealBuildTool;
using System.IO;

public class EmbeddedVoiceChat : ModuleRules
{
    public EmbeddedVoiceChat(ReadOnlyTargetRules Target) : base(Target)
    {
        CppStandard = CppStandardVersion.Cpp17;

        PrivatePCHHeaderFile = "Private/EmbeddedVoiceChatPrivatePCH.h";

        bEnableExceptions = true;

        PublicDependencyModuleNames.AddRange(new string[] { "Engine", "Core", "CoreUObject", "InputCore", "Projects", "ApplicationCore", "AudioMixer", "AudioExtensions", "AudioCaptureCore", "AudioPlatformConfiguration", "EmbeddedVoiceChatLibrary" });
        PrivateDependencyModuleNames.AddRange(new string[] { });

        PublicIncludePaths.Add(Path.Combine(ModuleDirectory, "Public"));
        PrivateIncludePaths.Add(Path.Combine(ModuleDirectory, "Private"));

        PublicDefinitions.Add("Allow_Voice_Debug=0");

        if (Target.Type != TargetRules.TargetType.Server)
        {
            if (Target.Platform == UnrealTargetPlatform.Linux || Target.Platform == UnrealTargetPlatform.Android || Target.Platform == UnrealTargetPlatform.Win64 || Target.Platform == UnrealTargetPlatform.Mac || Target.Platform == UnrealTargetPlatform.IOS)
            {
                PublicDefinitions.Add("WITH_EMBEDDEDVOICECHAT=1");
            }
            else
            {
                PublicDefinitions.Add("WITH_EMBEDDEDVOICECHAT=0");
            }

            if (Target.Platform.IsInGroup(UnrealPlatformGroup.Windows) ||
            	Target.Platform == UnrealTargetPlatform.Mac)
            {
                PrivateDependencyModuleNames.Add("AudioCaptureRtAudio");
            }
            else if (Target.Platform == UnrealTargetPlatform.IOS)
            {
                PrivateDependencyModuleNames.Add("AudioCaptureAudioUnit");
            }
            else if (Target.Platform == UnrealTargetPlatform.Android)
            {
                PrivateDependencyModuleNames.Add("AudioCaptureAndroid");
            }

            // 2026-09-18 voice-echo fix: echo-cancelling OS capture (Private/AEC, Private/Mac, Private/Windows).
            // The engine capture modules above stay as the rollback path (EmbeddedVoiceChat.CaptureBackend=1).
            if (Target.Platform == UnrealTargetPlatform.Mac)
            {
                PublicFrameworks.AddRange(new string[] { "AudioToolbox", "CoreAudio" });
            }
            else if (Target.Platform.IsInGroup(UnrealPlatformGroup.Windows))
            {
                PublicSystemLibraries.Add("ole32.lib");
            }

            if (Target.Platform.IsInGroup(UnrealPlatformGroup.Windows))
            {
                PrivateDependencyModuleNames.Add("AudioMixerXAudio2");
            }
            else if (Target.Platform == UnrealTargetPlatform.Mac)
            {
                PrivateDependencyModuleNames.Add("AudioMixerCoreAudio");
            }
            else if (Target.Platform == UnrealTargetPlatform.IOS)
            {
                PrivateDependencyModuleNames.Add("AudioMixerAudioUnit");
            }
            else if (Target.Platform == UnrealTargetPlatform.Android)
            {
                PrivateDependencyModuleNames.Add("AudioMixerAndroid");
            }
            else if (Target.Platform.IsInGroup(UnrealPlatformGroup.Linux))
            {
                PrivateDependencyModuleNames.Add("AudioMixerSDL");
            }
        }
        else
        {
            PublicDefinitions.Add("WITH_EMBEDDEDVOICECHAT=0");
        }
    }
}
