// EVCCaptureCore.h - echo-cancelling OS voice capture for the EmbeddedVoiceChat plugin.
//
// Added 2026-09-18 (awsTutorial voice-echo fix). Neither desktop capture back-end in UE 5.4 cancels
// echo: RtAudio has no AEC and WASAPI hard-codes bSupportsHardwareAEC = false. These cores use the
// operating system's own voice processing instead:
//
//   Mac     - VoiceProcessingIO AudioUnit. Measured 2026-09-18 on the MacBook Air: it removes 32.7 dB
//             of speech played by a SEPARATE output unit on the same device (= UE's mixer), the same
//             as audio played through its own output bus (29.2 dB).
//   Windows - Voice Capture DSP (CLSID_CWMAudioAEC) in source mode: the DSP opens the microphone
//             itself and cancels against a loopback of the render device the game plays to.
//
// This header and the platform sources deliberately include no Unreal headers, so the exact code
// that ships also builds into the standalone probes (plans/MacOS_UE_Fix/voice-aec-fix/probes).
//
// Device list contract: the OS default input device is ALWAYS index 0 (the plugin documents
// "0 means default device"). Open() indexes the same list; an index < 0 also means the default.
// Audio is delivered mono float32 at 48 kHz in blocks of exactly FramesPerCallback frames.

#pragma once

#if defined(__APPLE__)
	#include <TargetConditionals.h>
#endif

// WITH_EMBEDDEDVOICECHAT comes from EmbeddedVoiceChat.Build.cs (0 for servers). Standalone probe
// builds leave it undefined.
#if defined(WITH_EMBEDDEDVOICECHAT) && !WITH_EMBEDDEDVOICECHAT
	#define EVC_AEC_MAC 0
	#define EVC_AEC_WINDOWS 0
#elif defined(__APPLE__) && TARGET_OS_OSX
	#define EVC_AEC_MAC 1
	#define EVC_AEC_WINDOWS 0
#elif defined(_WIN32)
	#define EVC_AEC_MAC 0
	#define EVC_AEC_WINDOWS 1
#else
	#define EVC_AEC_MAC 0
	#define EVC_AEC_WINDOWS 0
#endif

#include <functional>
#include <memory>
#include <string>
#include <vector>

namespace EVCAec
{
	struct FDeviceInfo
	{
		std::string Name;
		std::string Id;               // stable OS identifier (CoreAudio UID / MMDevice endpoint ID)
		int NumChannels = 0;          // the device's input channels
		int NativeSampleRate = 0;     // the device's own rate; delivery is always 48 kHz
		bool bIsDefault = false;
	};

	enum class ELogLevel { Info, Warning, Error };

	// Log sink. May be called from any thread.
	using FLogFn = std::function<void(ELogLevel, const std::string&)>;

	// Called on the platform audio thread with mono float32 at 48 kHz, exactly FramesPerCallback frames.
	using FCaptureFn = std::function<void(const float* Samples, int NumFrames)>;

	// Called at most once per Open(), from a background thread, when a core that returned true from
	// Open() fails to bring capture up afterwards (asynchronous open failure).
	using FFailureFn = std::function<void(const std::string& Reason)>;

	struct FOptions
	{
		// Test-only: run the same path with voice processing bypassed (raw microphone).
		bool bBypassVoiceProcessing = false;
		// Mac: VoiceProcessingIO AGC. Voice processing lowers the microphone level by roughly 20 dB
		// (measured), so AGC stays on or Mac users sound faint. Windows keeps the DSP defaults.
		bool bAutomaticGainControl = true;
	};

	class ICaptureCore
	{
	public:
		static constexpr int DeliveredSampleRate = 48000;

		virtual ~ICaptureCore() = default;
		virtual const char* BackendName() const = 0;
		// Input devices, OS default first.
		virtual bool EnumerateInputs(std::vector<FDeviceInfo>& Out) = 0;
		// May return before the device is running (Mac: VoiceProcessingIO takes ~2.5 s to initialize, so
		// it is created on a background queue and Start() takes effect once it is ready). A later failure
		// is reported through the handler set with SetAsyncFailureHandler().
		virtual bool Open(int DeviceIndex, int FramesPerCallback, FCaptureFn OnCapture) = 0;
		virtual void SetAsyncFailureHandler(FFailureFn /*Handler*/) {}
		// The speakers the game plays on, used as the echo reference: the platform endpoint ID (Windows: IMMDevice
		// ID, UTF-8). Empty = the system default. Thread-safe; a running core rebinds. The Mac core ignores it:
		// VoiceProcessingIO always uses the system default output, which the Mac speaker selection changes.
		virtual void SetRenderEndpoint(const std::string& /*EndpointId*/) {}
		virtual bool Start() = 0;
		virtual bool Stop() = 0;
		virtual void Close() = 0;
		virtual bool IsOpen() const = 0;
		virtual bool IsRunning() const = 0;
		virtual FDeviceInfo OpenedDevice() const = 0;
	};

	// nullptr when this platform has no core; the plugin then uses the engine's capture back-end.
	std::unique_ptr<ICaptureCore> CreatePlatformCaptureCore(FLogFn Log, const FOptions& Options = FOptions());

	namespace Detail
	{
		// Re-blocks arbitrary callback sizes into fixed FramesPerCallback blocks. Audio thread only.
		class FReblocker
		{
		public:
			void Reset(int InBlockFrames)
			{
				BlockFrames = InBlockFrames > 0 ? InBlockFrames : 480;
				Block.assign(static_cast<size_t>(BlockFrames), 0.0f);
				Fill = 0;
			}
			template <typename SinkType>
			void Push(const float* Samples, int NumFrames, SinkType&& Sink)
			{
				while (NumFrames > 0)
				{
					const int Take = (BlockFrames - Fill) < NumFrames ? (BlockFrames - Fill) : NumFrames;
					for (int Index = 0; Index < Take; ++Index)
					{
						Block[static_cast<size_t>(Fill + Index)] = Samples[Index];
					}
					Fill += Take;
					Samples += Take;
					NumFrames -= Take;
					if (Fill == BlockFrames)
					{
						Sink(Block.data(), BlockFrames);
						Fill = 0;
					}
				}
			}
		private:
			std::vector<float> Block;
			int BlockFrames = 480;
			int Fill = 0;
		};
	}
}
