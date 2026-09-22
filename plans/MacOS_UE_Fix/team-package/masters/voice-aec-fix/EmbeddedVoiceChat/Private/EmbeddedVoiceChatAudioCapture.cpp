/* Copyright (C) Siqi.Wu - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Written by Siqi.Wu <lion547016@gmail.com>, Jan 2023
 */

#include "EmbeddedVoiceChatAudioCapture.h"
#include "EmbeddedVoiceChatGlobals.h"
#include "AEC/EVCAECCaptureStream.h"

#include "Async/Async.h"
#include "Math/UnrealMathUtility.h"
#include "UObject/WeakObjectPtr.h"

#if WITH_EMBEDDEDVOICECHAT

#include "EmbeddedVoiceChat/EmbeddedVoiceChatCommon.h"

#endif

namespace
{
    FEmbeddedVoiceChatAudioCaptureDeviceInfo ToBlueprintInfo(const Audio::FCaptureDeviceInfo& Info, bool bEchoCancelling) {
        FEmbeddedVoiceChatAudioCaptureDeviceInfo Out;
        Out.DeviceName = FName(*Info.DeviceName);
        Out.NumInputChannels = Info.InputChannels;
        Out.SampleRate = Info.PreferredSampleRate;
        Out.DeviceId = Info.DeviceId;
        // Known value, not Info.bSupportsHardwareAEC: the engine back-ends never initialize that field.
        Out.bSupportsHardwareAEC = bEchoCancelling;
        return Out;
    }
}

UEmbeddedVoiceChatAudioCapture::UEmbeddedVoiceChatAudioCapture() {
#if WITH_EMBEDDEDVOICECHAT
    this->EmbeddedVoiceChatDevice = std::make_shared<EmbeddedVoiceChat::AbstractCaptureDevice>();
#endif
}

UEmbeddedVoiceChatAudioCapture::~UEmbeddedVoiceChatAudioCapture() {
    // Stop the platform audio thread before the capture callback's `this` goes away.
    if (CaptureStream.IsValid() && CaptureStream->IsStreamOpen()) {
        CaptureStream->StopStream();
        CaptureStream->CloseStream();
    }
}

Audio::IAudioCaptureStream* UEmbeddedVoiceChatAudioCapture::GetCaptureStream() {
    if (!bCaptureStreamResolved && !HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject)) {
        bCaptureStreamResolved = true;
        CaptureStream = EmbeddedVoiceChatAEC::CreateCaptureStream(CaptureBackendName, bEchoCancellingBackend);
        UE_LOG(LogTemp, Log, TEXT("[VoiceChat] Capture back-end: %s"), *CaptureBackendName);
        if (bEchoCancellingBackend && CaptureStream.IsValid()) {
            // The Mac opens VoiceProcessingIO in the background; a failure there arrives later, on
            // another thread, and is handled on the game thread (if this object still exists).
            TWeakObjectPtr<UEmbeddedVoiceChatAudioCapture> WeakThis(this);
            static_cast<EmbeddedVoiceChatAEC::FAECCaptureStream*>(CaptureStream.Get())->SetAsyncFailureHandler([WeakThis](const FString& Reason) {
                AsyncTask(ENamedThreads::GameThread, [WeakThis, Reason]() {
                    if (UEmbeddedVoiceChatAudioCapture* Self = WeakThis.Get()) {
                        Self->HandleAsyncCaptureFailure(Reason);
                    }
                });
            });
        }
    }
    return CaptureStream.Get();
}

bool UEmbeddedVoiceChatAudioCapture::FallBackToEngineCapture(const Audio::FCaptureDeviceInfo& Wanted, int32 NumFramesDesired) {
    // A microphone without echo cancellation beats no microphone: switch this object to the engine
    // back-end and open the same microphone there.
    CaptureStream = EmbeddedVoiceChatAEC::CreateEngineCaptureStream(CaptureBackendName, TEXT("automatic fallback: echo-cancelling capture failed to open"));
    bEchoCancellingBackend = false;
    UE_LOG(LogTemp, Log, TEXT("[VoiceChat] Capture back-end: %s"), *CaptureBackendName);
    Audio::IAudioCaptureStream* Stream = CaptureStream.Get();
    if (!Stream) {
        return false;
    }

    // The engine list has its own order: find the same microphone by name, else use the default.
    int32 FallbackIndex = Audio::DefaultDeviceIndex;
    TArray<Audio::FCaptureDeviceInfo> Devices;
    Stream->GetInputDevicesAvailable(Devices);
    for (int32 Index = 0; Index < Devices.Num(); ++Index) {
        if (Devices[Index].DeviceName == Wanted.DeviceName) {
            FallbackIndex = Index;
            break;
        }
    }
    Audio::FCaptureDeviceInfo FallbackInfo;
    return ResolveInputDevice(FallbackIndex, FallbackInfo) && OpenResolvedStream(Stream, FallbackIndex, FallbackInfo, NumFramesDesired);
}

void UEmbeddedVoiceChatAudioCapture::HandleAsyncCaptureFailure(const FString& Reason) {
    if (!bEchoCancellingBackend) {
        return;
    }
    UE_LOG(LogTemp, Error, TEXT("[VoiceChat] ❌ Echo-cancelling capture failed after opening (%s); falling back to the engine capture back-end (no echo cancellation)."), *Reason);
    if (CaptureStream.IsValid() && CaptureStream->IsStreamOpen()) {
        CaptureStream->CloseStream();
    }
    if (FallBackToEngineCapture(LastOpenedDevice, LastNumFramesDesired) && bCaptureWanted) {
        CaptureStream->StartStream(); // the voice library was already started by StartCapturingAudio()
    }
}

bool UEmbeddedVoiceChatAudioCapture::ResolveInputDevice(int32 DeviceIndex, Audio::FCaptureDeviceInfo& OutInfo) {
    Audio::IAudioCaptureStream* Stream = GetCaptureStream();
    if (!Stream) {
        return false;
    }
    // Index the SAME input-only list that OpenAudioCaptureStream indexes. The engine's
    // GetCaptureDeviceInfo(Index) counts RtAudio's input AND output devices instead, which logged
    // one device (e.g. "MacBook Air Speakers | Channels: 0") while opening another.
    if (DeviceIndex >= 0) {
        TArray<Audio::FCaptureDeviceInfo> Devices;
        Stream->GetInputDevicesAvailable(Devices);
        if (!Devices.IsValidIndex(DeviceIndex)) {
            return false;
        }
        OutInfo = Devices[DeviceIndex];
        return true;
    }
    return Stream->GetCaptureDeviceInfo(OutInfo, Audio::DefaultDeviceIndex);
}

int32 UEmbeddedVoiceChatAudioCapture::GetCaptureDevicesAvailable(TArray<FEmbeddedVoiceChatAudioCaptureDeviceInfo>& OutDevices) {
    TArray<Audio::FCaptureDeviceInfo> Devices;
    if (Audio::IAudioCaptureStream* Stream = GetCaptureStream()) {
        Stream->GetInputDevicesAvailable(Devices);
    }

    /* Logging for Audio devices discovered*/
    UE_LOG(LogTemp, Warning, TEXT("Found %d audio devices"), Devices.Num());
    if (Devices.Num() == 0) {
        UE_LOG(LogTemp, Error, TEXT("⚠️ No audio input devices found. Is mic plugged in? Are permissions granted?"));
    }

    for (const auto &device : Devices) {
        OutDevices.Add(ToBlueprintInfo(device, bEchoCancellingBackend));
    }
    return Devices.Num();
}

bool UEmbeddedVoiceChatAudioCapture::GetCaptureDeviceInfo(FEmbeddedVoiceChatAudioCaptureDeviceInfo& OutInfo, int32 DeviceIndex) {
    Audio::FCaptureDeviceInfo Info;
    if (ResolveInputDevice(DeviceIndex, Info)) {
        OutInfo = ToBlueprintInfo(Info, bEchoCancellingBackend);
        return true;
    }
    return false;
}

Audio::FOnAudioCaptureFunction UEmbeddedVoiceChatAudioCapture::MakeCaptureCallback() {
    return [this](const void* AudioData, int32 NumFrames, int32 InNumChannels, int32 InSampleRate, double StreamTime, bool bOverFlow) {
        LOG_EMBEDDEDVOICECHAT_VERYVERBOSE(FString::Printf(TEXT("captured %d frames in %d sample rate"), NumFrames, InSampleRate));
#if WITH_EMBEDDEDVOICECHAT
        if (this->EmbeddedVoiceChatDevice) {
            float* firstChannelAudioData = (float*)malloc(NumFrames * sizeof(float));
            for (int i = 0; i < NumFrames; i++) {
                firstChannelAudioData[i] = ((const float*)AudioData)[i * InNumChannels];
            }

            int frameCount = NumFrames;

            if (InSampleRate != 0 && InSampleRate != EmbeddedVoiceChat::sampleRate) {
                LOG_EMBEDDEDVOICECHAT_VERYVERBOSE(FString::Printf(TEXT("resample sample rate for captured %d frames"), frameCount));

                int32 MaxOutputFrames = FMath::CeilToInt((float)frameCount * (float)EmbeddedVoiceChat::sampleRate / (float)InSampleRate) + 16;
                float* resampled = (float*)malloc(MaxOutputFrames * sizeof(float));
                int32 NumResampledFrames = frameCount;

                Resampler.ProcessAudio(firstChannelAudioData, frameCount, false, resampled, MaxOutputFrames, NumResampledFrames);

                this->EmbeddedVoiceChatDevice->processAudio(resampled, NumResampledFrames);

                free(resampled);
            } else {
                LOG_EMBEDDEDVOICECHAT_VERYVERBOSE(FString::Printf(TEXT("process captured %d frames without resampling"), frameCount));
                this->EmbeddedVoiceChatDevice->processAudio(firstChannelAudioData, frameCount);
            }

            free(firstChannelAudioData);
        }
#endif
        OnGeneratedAudio((const float*)AudioData, NumFrames * InNumChannels);
    };
}

bool UEmbeddedVoiceChatAudioCapture::OpenResolvedStream(Audio::IAudioCaptureStream* Stream, int32 DeviceIndex, const Audio::FCaptureDeviceInfo& Info, int32 NumFramesDesired) {
    UE_LOG(LogTemp, Log, TEXT("[VoiceChat] Opening capture device [%d]: %s | ID: %s | Channels: %d | SampleRate: %d | AEC: %s | Backend: %s"),
        DeviceIndex,
        *Info.DeviceName,
        *Info.DeviceId,
        Info.InputChannels,
        Info.PreferredSampleRate,
        bEchoCancellingBackend ? TEXT("Yes") : TEXT("No"),
        *CaptureBackendName
    );

    // Start the stream here to avoid hitching the audio render thread.
    Audio::FAudioCaptureDeviceParams Params;
    Params.DeviceIndex = DeviceIndex;
    // Explicit. Was Info.bSupportsHardwareAEC, a field the engine back-ends never initialize.
    Params.bUseHardwareAEC = true;

    if (!Stream->OpenAudioCaptureStream(Params, MakeCaptureCallback(), NumFramesDesired)) {
        UE_LOG(LogTemp, Error, TEXT("[VoiceChat] ❌ Failed to open audio capture stream. DeviceIndex=%d | SampleRate=%d | Channels=%d | Backend=%s"),
            DeviceIndex,
            Info.PreferredSampleRate,
            Info.InputChannels,
            *CaptureBackendName
        );
        return false;
    }

    const int32 StreamSampleRate = Stream->GetSampleRate();
    const int32 StreamChannels = bEchoCancellingBackend ? 1 : Info.InputChannels;
    UE_LOG(LogTemp, Log, TEXT("[VoiceChat] ✅ Opened audio capture stream on device index %d (%d Hz, %d ch)"), DeviceIndex, StreamSampleRate, StreamChannels);

    Init(StreamSampleRate > 0 ? StreamSampleRate : Info.PreferredSampleRate, StreamChannels);

#if WITH_EMBEDDEDVOICECHAT
    if (StreamSampleRate != 0 && StreamSampleRate != EmbeddedVoiceChat::sampleRate) {
        // Float ratio: the former integer division made 48000/44100 == 1 (no resampling at all).
        Resampler.Init(Audio::EResamplingMethod::Linear, (float)EmbeddedVoiceChat::sampleRate / (float)StreamSampleRate, 1);
    }
#endif
    return true;
}

bool UEmbeddedVoiceChatAudioCapture::OpenCaptureStream(int32 DeviceIndex, int32 NumFramesDesired) {
    Audio::IAudioCaptureStream* Stream = GetCaptureStream();
    if (!Stream) {
        UE_LOG(LogTemp, Error, TEXT("[VoiceChat] ❌ No audio capture back-end (%s)."), *CaptureBackendName);
        return false;
    }

    if (Stream->IsStreamOpen()) {
        UE_LOG(LogTemp, Warning, TEXT("[VoiceChat] ⚠️ Attempted to open stream, but one is already open."));
        return false;
    }

    Audio::FCaptureDeviceInfo Info;
    if (!ResolveInputDevice(DeviceIndex, Info)) {
        UE_LOG(LogTemp, Error, TEXT("[VoiceChat] ❌ No capture device at index %d. No microphone?"), DeviceIndex);
        return false;
    }

    LastOpenedDevice = Info;
    LastNumFramesDesired = NumFramesDesired;
    if (OpenResolvedStream(Stream, DeviceIndex, Info, NumFramesDesired)) {
        return true;
    }

    if (!bEchoCancellingBackend) {
        return false;
    }

    // The echo-cancelling capture could not open (e.g. no output device to cancel against, a missing
    // Windows media component, an unusual macOS device).
    UE_LOG(LogTemp, Error, TEXT("[VoiceChat] ❌ Echo-cancelling capture failed to open; falling back to the engine capture back-end (no echo cancellation)."));
    return FallBackToEngineCapture(Info, NumFramesDesired);
}

bool UEmbeddedVoiceChatAudioCapture::CloseStream() {
    Audio::IAudioCaptureStream* Stream = GetCaptureStream();
    if (Stream && Stream->IsStreamOpen()) {
        return Stream->CloseStream();
    }

    return false;
}

void UEmbeddedVoiceChatAudioCapture::StartCapturingAudio() {
    Audio::IAudioCaptureStream* Stream = GetCaptureStream();
    if (Stream && Stream->IsStreamOpen()) {
        bCaptureWanted = true;
#if WITH_EMBEDDEDVOICECHAT
        if (this->EmbeddedVoiceChatDevice) {
            this->EmbeddedVoiceChatDevice->start();
        }
#endif
        Stream->StartStream();
    }
}

void UEmbeddedVoiceChatAudioCapture::StopCapturingAudio() {
    Audio::IAudioCaptureStream* Stream = GetCaptureStream();
    if (Stream && Stream->IsStreamOpen()) {
        bCaptureWanted = false;
#if WITH_EMBEDDEDVOICECHAT
        if (this->EmbeddedVoiceChatDevice) {
            this->EmbeddedVoiceChatDevice->stop();
        }
#endif
        Stream->StopStream();
    }
}

bool UEmbeddedVoiceChatAudioCapture::IsCapturingAudio() {
    Audio::IAudioCaptureStream* Stream = GetCaptureStream();
    return Stream && Stream->IsCapturing();
}

bool UEmbeddedVoiceChatAudioCapture::IsTalking() {
#if WITH_EMBEDDEDVOICECHAT
	if (this->EmbeddedVoiceChatDevice) {
		return this->EmbeddedVoiceChatDevice->isTalking();
	}
#endif
    return false;
}
