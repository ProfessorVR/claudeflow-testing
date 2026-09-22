/* Copyright (C) Siqi.Wu - All Rights Reserved
* Written by Siqi.Wu<lion547016@gmail.com>, Jan 2023
*/

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "UObject/NoExportTypes.h"
#include "Generators/AudioGenerator.h"
#include "AudioCaptureCore.h"
#include "AudioResampler.h"

#if WITH_EMBEDDEDVOICECHAT

#include "EmbeddedVoiceChat/EmbeddedVoiceChatDevice.h"

#endif

#include "EmbeddedVoiceChatAudioCapture.generated.h"

// Struct defining the time synth global quantization settings
USTRUCT(BlueprintType)
struct EMBEDDEDVOICECHAT_API FEmbeddedVoiceChatAudioCaptureDeviceInfo {
    GENERATED_USTRUCT_BODY()

    // The name of the audio capture device
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "AudioCapture")
    FName DeviceName;

    // The name of the audio capture device
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "AudioCapture")
    FString DeviceId;

    // The number of input channels
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "AudioCapture")
    int32 NumInputChannels = 0;

    // The sample rate of the audio capture device
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "AudioCapture")
    int32 SampleRate = 0;

    // The sample rate of the audio capture device
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "AudioCapture")
    bool bSupportsHardwareAEC = false;
};

// Class which opens up a handle to an audio capture device.
// Allows other objects to get audio buffers from the capture device.
// Based on unreal engine audio capture core.
// 2026-09-18: on Mac and Windows the microphone is captured through the OS voice processing
// (echo cancellation), see Private/AEC. Device indices everywhere refer to the same input-device
// list; with the echo-cancelling back-end its entry 0 is the OS default input device. If that
// back-end fails to open, the object falls back to the engine back-end (RtAudio/WASAPI order).
// @TODO: sample rate and channel
UCLASS(BlueprintType, ClassGroup = (Custom), meta = (BlueprintSpawnableComponent))
class EMBEDDEDVOICECHAT_API UEmbeddedVoiceChatAudioCapture : public UAudioGenerator {
    GENERATED_BODY()

public:
#if WITH_EMBEDDEDVOICECHAT
    std::shared_ptr<EmbeddedVoiceChat::AbstractCaptureDevice> EmbeddedVoiceChatDevice;
#endif

    UEmbeddedVoiceChatAudioCapture();
    ~UEmbeddedVoiceChatAudioCapture();

    // Returns the total amount of audio devices.
    UFUNCTION(BlueprintCallable, Category = "Embedded Voice Chat")
    int32 GetCaptureDevicesAvailable(TArray<FEmbeddedVoiceChatAudioCaptureDeviceInfo>& OutDevices);

    // Returns the audio capture device information at the given Id.
    UFUNCTION(BlueprintCallable, Category = "Embedded Voice Chat")
    bool GetCaptureDeviceInfo(FEmbeddedVoiceChatAudioCaptureDeviceInfo& OutInfo, int32 DeviceIndex = -1);

    // Opens the audio capture stream with the given parameters
    // @Param: DeviceIndex: index into GetCaptureDevicesAvailable; 0 (or -1) means the OS default input device.
    // @Param: NumFramesDesired: don't change it if you don't know what it is.
    UFUNCTION(BlueprintCallable, Category = "Embedded Voice Chat")
    bool OpenCaptureStream(int32 DeviceIndex = -1, int32 NumFramesDesired = 480);

    // Closes the audio capture stream
    UFUNCTION(BlueprintCallable, Category = "Embedded Voice Chat")
    bool CloseStream();

    // Starts capturing audio
    UFUNCTION(BlueprintCallable, Category = "Embedded Voice Chat")
    void StartCapturingAudio();

    // Stops capturing audio
    UFUNCTION(BlueprintCallable, Category = "Embedded Voice Chat")
    void StopCapturingAudio();

    // Returns true if capturing audio
    UFUNCTION(BlueprintCallable, Category = "Embedded Voice Chat")
    bool IsCapturingAudio();

    // Returns true if capturing audio
    UFUNCTION(BlueprintCallable, Category = "Embedded Voice Chat")
    bool IsTalking();

protected:

    // The capture stream (echo-cancelling on Mac/Windows, see Private/AEC), created on first use.
    Audio::IAudioCaptureStream* GetCaptureStream();
    // Looks up DeviceIndex in the same input-device list OpenAudioCaptureStream indexes.
    bool ResolveInputDevice(int32 DeviceIndex, Audio::FCaptureDeviceInfo& OutInfo);
    // Opens Stream on an already-resolved device and prepares format/resampling.
    bool OpenResolvedStream(Audio::IAudioCaptureStream* Stream, int32 DeviceIndex, const Audio::FCaptureDeviceInfo& Info, int32 NumFramesDesired);
    // The audio-thread callback feeding the voice library.
    Audio::FOnAudioCaptureFunction MakeCaptureCallback();
    // Switches this object to the engine back-end and opens the same microphone there.
    bool FallBackToEngineCapture(const Audio::FCaptureDeviceInfo& Wanted, int32 NumFramesDesired);
    // Game thread: the echo-cancelling capture failed after OpenCaptureStream had returned true.
    void HandleAsyncCaptureFailure(const FString& Reason);

    Audio::FCaptureDeviceInfo LastOpenedDevice;
    int32 LastNumFramesDesired = 480;
    bool bCaptureWanted = false;

    TUniquePtr<Audio::IAudioCaptureStream> CaptureStream;
    FString CaptureBackendName;
    bool bCaptureStreamResolved = false;
    bool bEchoCancellingBackend = false;
    Audio::FResampler Resampler;
};
