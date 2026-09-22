#!/usr/bin/env python3
"""Speaker selection support in the staged plugin adapter (FAECCaptureStream): tell the capture core which speakers
the engine plays on (its echo reference) when the stream opens, and again whenever the engine switches output
device (UAudioDeviceNotificationSubsystem::DeviceSwitchedNative, broadcast on the game thread). Idempotent."""
import pathlib
import sys

ROOT = pathlib.Path("/home/dalton/projects/claudeflow-testing/plans/MacOS_UE_Fix/voice-aec-fix/EmbeddedVoiceChat")


def patch(rel, edits):
    p = ROOT / rel
    raw = p.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    s = raw.replace("\r\n", "\n")
    for old, new, marker in edits:
        if marker in s:
            continue
        if s.count(old) != 1:
            sys.exit(f"{rel}: anchor not found exactly once: {old[:70]!r}")
        s = s.replace(old, new)
    p.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
    print("patched", rel)


patch("Private/AEC/EVCAECCaptureStream.h", [
    ("""	private:
		std::unique_ptr<EVCAec::ICaptureCore> Core;""",
     """	private:
		// Keeps the echo reference on the speakers the engine plays on (speaker selection, device changes).
		void FollowEngineOutputDevice();

		std::unique_ptr<EVCAec::ICaptureCore> Core;
		FDelegateHandle DeviceSwitchedHandle;""",
     "FollowEngineOutputDevice"),
])

patch("Private/AEC/EVCAECCaptureStream.cpp", [
    ("""#include "Engine/Engine.h"
""",
     """#include "AudioDevice.h"
#include "AudioDeviceNotificationSubsystem.h"
#include "AudioMixerDevice.h"
#include "Engine/Engine.h"
""",
     '#include "AudioDeviceNotificationSubsystem.h"'),
    ("""	FAECCaptureStream::FAECCaptureStream(std::unique_ptr<EVCAec::ICaptureCore> InCore)
		: Core(std::move(InCore))
	{
	}

	FAECCaptureStream::~FAECCaptureStream()
	{
		if (Core)""",
     """	namespace
	{
		// The output device the engine's main audio device renders to (Windows: IMMDevice ID). Game thread.
		FString EngineOutputDeviceId()
		{
			if (!GEngine)
			{
				return FString();
			}
			FAudioDeviceHandle Handle = GEngine->GetMainAudioDevice();
			FAudioDevice* Device = Handle.GetAudioDevice();
			if (!Device)
			{
				return FString();
			}
			Audio::IAudioMixerPlatformInterface* Platform = static_cast<Audio::FMixerDevice*>(Device)->GetAudioMixerPlatform();
			return Platform ? Platform->GetPlatformDeviceInfo().DeviceId : FString();
		}
	}

	FAECCaptureStream::FAECCaptureStream(std::unique_ptr<EVCAec::ICaptureCore> InCore)
		: Core(std::move(InCore))
	{
	}

	void FAECCaptureStream::FollowEngineOutputDevice()
	{
		Core->SetRenderEndpoint(TCHAR_TO_UTF8(*EngineOutputDeviceId()));
		if (!DeviceSwitchedHandle.IsValid() && GEngine)
		{
			if (UAudioDeviceNotificationSubsystem* Notifications = UAudioDeviceNotificationSubsystem::Get())
			{
				// Broadcast on the game thread (AsyncTask in OnDeviceSwitched), where this stream is also destroyed.
				DeviceSwitchedHandle = Notifications->DeviceSwitchedNative.AddLambda([this](FString DeviceId)
				{
					UE_LOG(LogEmbeddedVoiceChatAEC, Log, TEXT("Game audio moved to output device %s; echo reference follows"), *DeviceId);
					Core->SetRenderEndpoint(TCHAR_TO_UTF8(*DeviceId));
				});
			}
		}
	}

	FAECCaptureStream::~FAECCaptureStream()
	{
		if (DeviceSwitchedHandle.IsValid() && GEngine)
		{
			if (UAudioDeviceNotificationSubsystem* Notifications = UAudioDeviceNotificationSubsystem::Get())
			{
				Notifications->DeviceSwitchedNative.Remove(DeviceSwitchedHandle);
			}
		}
		if (Core)""",
     "void FAECCaptureStream::FollowEngineOutputDevice()"),
    ("""		OnCapture = MoveTemp(InOnCapture);
		FramesDelivered = 0;""",
     """		OnCapture = MoveTemp(InOnCapture);
		FramesDelivered = 0;
		FollowEngineOutputDevice();""",
     "		FollowEngineOutputDevice();\n"),
])
