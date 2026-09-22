// EVCAECCaptureStream.h - Audio::IAudioCaptureStream over the echo-cancelling platform cores.
// Added 2026-09-18 (awsTutorial voice-echo fix). See EVCCaptureCore.h.

#pragma once

#include "CoreMinimal.h"
#include "AudioCaptureDeviceInterface.h"
#include "AEC/EVCCaptureCore.h"

#include <atomic>

namespace EmbeddedVoiceChatAEC
{
	class FAECCaptureStream final : public Audio::IAudioCaptureStream
	{
	public:
		explicit FAECCaptureStream(std::unique_ptr<EVCAec::ICaptureCore> InCore);
		virtual ~FAECCaptureStream();

		// Begin IAudioCaptureStream
		virtual bool GetCaptureDeviceInfo(Audio::FCaptureDeviceInfo& OutInfo, int32 DeviceIndex) override;
		virtual bool OpenAudioCaptureStream(const Audio::FAudioCaptureDeviceParams& InParams, Audio::FOnAudioCaptureFunction InOnCapture, uint32 NumFramesDesired) override;
		virtual bool CloseStream() override;
		virtual bool StartStream() override;
		virtual bool StopStream() override;
		virtual bool AbortStream() override;
		virtual bool GetStreamTime(double& OutStreamTime) override;
		virtual int32 GetSampleRate() const override;
		virtual bool IsStreamOpen() const override;
		virtual bool IsCapturing() const override;
		virtual void OnAudioCapture(void* InBuffer, uint32 InBufferFrames, double StreamTime, bool bOverflow) override;
		virtual bool GetInputDevicesAvailable(TArray<Audio::FCaptureDeviceInfo>& OutDevices) override;
		// End IAudioCaptureStream

		// Called from a background thread if the device fails after OpenAudioCaptureStream returned true
		// (the Mac opens VoiceProcessingIO in the background). Set before opening.
		void SetAsyncFailureHandler(TFunction<void(const FString&)> Handler);

	private:
		// Keeps the echo reference on the speakers the engine plays on (speaker selection, device changes).
		void FollowEngineOutputDevice();

		std::unique_ptr<EVCAec::ICaptureCore> Core;
		FDelegateHandle DeviceSwitchedHandle;
		Audio::FOnAudioCaptureFunction OnCapture;
		std::atomic<uint64> FramesDelivered{ 0 };
	};

	// Creates this platform's capture stream. Echo-cancelling on Mac and Windows unless rolled back with
	// the console variable EmbeddedVoiceChat.CaptureBackend=1 or the command-line switch -EVCEngineCapture,
	// which restore the engine back-end (RtAudio/WASAPI, no echo cancellation - the pre-fix behaviour).
	// bOutIsEchoCancelling tells the caller which kind it got.
	TUniquePtr<Audio::IAudioCaptureStream> CreateCaptureStream(FString& OutBackendName, bool& bOutIsEchoCancelling);

	// The engine back-end only (RtAudio/WASAPI). Used for rollback and as the automatic fallback when the
	// echo-cancelling capture fails to open. Reason is recorded in OutBackendName.
	TUniquePtr<Audio::IAudioCaptureStream> CreateEngineCaptureStream(FString& OutBackendName, const TCHAR* Reason);
}
