// EVCCaptureCore_Windows.cpp - Windows Voice Capture DSP capture with echo cancellation.
// See AEC/EVCCaptureCore.h. Added 2026-09-18 (awsTutorial voice-echo fix).
//
// The Voice Capture DSP (CLSID_CWMAudioAEC) runs in source mode: it opens the chosen microphone
// itself and cancels echo against a loopback of the render device the game plays to (UE's XAudio2
// output = the default multimedia render device). It produces 16 kHz mono PCM; this file upsamples
// x3 to 48 kHz and re-blocks to the plugin's frame size, so the plugin sees exactly what it saw
// from RtAudio before (48 kHz mono float, 480-frame blocks) minus the echo.
//
// Everything runs on one worker thread (COM MTA): DSP creation, ProcessOutput polling every 10 ms,
// and re-binding when the default render device or the chosen microphone changes.
//
// Measured 2026-09-18 (probes/probe_win.cpp): in AEC mode the DSP delivers NO audio while nothing
// plays on the render device (WMAAECMA_E_NO_ACTIVE_RENDER_STREAM; WASAPI loopback is silent when the
// endpoint is idle). The worker therefore keeps a silent shared-mode render stream running on the
// same endpoint, so the microphone never depends on the game producing sound.

#include "AEC/EVCCaptureCore.h"

#if EVC_AEC_WINDOWS

#if defined(__has_include)
	#if __has_include("Windows/AllowWindowsPlatformTypes.h")
		#define EVC_UE_WINDOWS_TYPES 1
	#endif
#endif
#ifndef EVC_UE_WINDOWS_TYPES
	#define EVC_UE_WINDOWS_TYPES 0
#endif

#include <atomic>
#include <chrono>
#include <cmath>
#include <cstdarg>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <future>
#include <mutex>
#include <thread>

// The rest of the file stays inside Allow/HideWindowsPlatformTypes (closed at the end): it uses TRUE,
// FALSE, UINT and DWORD, which the Hide header undefines.
#if EVC_UE_WINDOWS_TYPES
	#include "Windows/AllowWindowsPlatformTypes.h"
#endif
#ifdef THIRD_PARTY_INCLUDES_START
	THIRD_PARTY_INCLUDES_START
#endif
#ifndef NOMINMAX
	#define NOMINMAX
#endif
#include <windows.h>
#include <objbase.h>
#include <mmdeviceapi.h>
#include <audioclient.h>
#include <audiopolicy.h>
#include <mmreg.h>
#include <dmo.h>
#include <wmcodecdsp.h>
#ifdef THIRD_PARTY_INCLUDES_END
	THIRD_PARTY_INCLUDES_END
#endif

namespace EVCAec
{
namespace
{
	// Defined locally (values from the Windows 10.0.22621 SDK) so no extra GUID libraries are needed.
	const CLSID EVC_CLSID_CWMAudioAEC = { 0x745057c7, 0xf353, 0x4f2d, { 0xa7, 0xee, 0x58, 0x43, 0x44, 0x77, 0x73, 0x0e } };
	const GUID EVC_MEDIATYPE_Audio = { 0x73647561, 0x0000, 0x0010, { 0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71 } };
	const GUID EVC_MEDIASUBTYPE_PCM = { 0x00000001, 0x0000, 0x0010, { 0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71 } };
	const GUID EVC_FORMAT_WaveFormatEx = { 0x05589f81, 0xc356, 0x11ce, { 0xbf, 0x01, 0x00, 0xaa, 0x00, 0x55, 0x59, 0x5a } };
	const PROPERTYKEY EVC_PKEY_Device_FriendlyName = { { 0xa45c254e, 0xdf1c, 0x4efd, { 0x80, 0x20, 0x67, 0xd1, 0x46, 0xa8, 0x50, 0xe0 } }, 14 };
	const PROPERTYKEY EVC_PKEY_AudioEngine_DeviceFormat = { { 0xf19f064d, 0x082c, 0x4e27, { 0xbc, 0x73, 0x68, 0x82, 0xa1, 0xbb, 0x8e, 0x4c } }, 0 };

	constexpr int DspSampleRate = 16000;
	constexpr DWORD MediaBufferBytes = DspSampleRate * 2 * 2; // 2 s of 16-bit mono

	std::string Format(const char* Fmt, ...)
	{
		char Buffer[1024];
		va_list Args;
		va_start(Args, Fmt);
		vsnprintf(Buffer, sizeof(Buffer), Fmt, Args);
		va_end(Args);
		return std::string(Buffer);
	}

	std::wstring Widen(const std::string& Utf8)
	{
		if (Utf8.empty())
		{
			return std::wstring();
		}
		const int Needed = MultiByteToWideChar(CP_UTF8, 0, Utf8.c_str(), static_cast<int>(Utf8.size()), nullptr, 0);
		if (Needed <= 0)
		{
			return std::wstring();
		}
		std::wstring Out(static_cast<size_t>(Needed), L'\0');
		MultiByteToWideChar(CP_UTF8, 0, Utf8.c_str(), static_cast<int>(Utf8.size()), &Out[0], Needed);
		return Out;
	}

	std::string Narrow(const wchar_t* Wide)
	{
		if (!Wide || !*Wide)
		{
			return std::string();
		}
		const int Needed = WideCharToMultiByte(CP_UTF8, 0, Wide, -1, nullptr, 0, nullptr, nullptr);
		if (Needed <= 1)
		{
			return std::string();
		}
		std::string Result(static_cast<size_t>(Needed - 1), '\0');
		WideCharToMultiByte(CP_UTF8, 0, Wide, -1, &Result[0], Needed, nullptr, nullptr);
		return Result;
	}

	template <typename T>
	class TCom
	{
	public:
		TCom() = default;
		~TCom() { Reset(); }
		TCom(const TCom&) = delete;
		TCom& operator=(const TCom&) = delete;
		void Reset()
		{
			if (Ptr)
			{
				Ptr->Release();
				Ptr = nullptr;
			}
		}
		T** Put()
		{
			Reset();
			return &Ptr;
		}
		void** PutVoid() { return reinterpret_cast<void**>(Put()); }
		T* Get() const { return Ptr; }
		T* operator->() const { return Ptr; }
		explicit operator bool() const { return Ptr != nullptr; }
	private:
		T* Ptr = nullptr;
	};

	class FScopedCom
	{
	public:
		FScopedCom() : bUninitialize(SUCCEEDED(CoInitializeEx(nullptr, COINIT_MULTITHREADED))) {}
		~FScopedCom()
		{
			if (bUninitialize)
			{
				CoUninitialize();
			}
		}
		FScopedCom(const FScopedCom&) = delete;
		FScopedCom& operator=(const FScopedCom&) = delete;
	private:
		bool bUninitialize;
	};

	struct FEndpoint
	{
		std::wstring WideId;
		UINT NativeIndex = 0; // position in EnumAudioEndpoints(..., DEVICE_STATE_ACTIVE): the DSP's device index
		FDeviceInfo Info;
	};

	bool CreateEnumerator(TCom<IMMDeviceEnumerator>& Out)
	{
		return SUCCEEDED(CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL, __uuidof(IMMDeviceEnumerator), Out.PutVoid()));
	}

	// Active endpoints of one direction, default first. Capture uses the console-role default (as the
	// engine's capture back-ends do); render uses the multimedia-role default, which is where UE's
	// XAudio2 mixer plays (AudioMixerPlatformXAudio2.cpp), so the echo reference is the game's device.
	bool EnumerateEndpoints(IMMDeviceEnumerator* Enumerator, EDataFlow Flow, std::vector<FEndpoint>& Out)
	{
		Out.clear();
		std::wstring DefaultId;
		{
			TCom<IMMDevice> Default;
			if (SUCCEEDED(Enumerator->GetDefaultAudioEndpoint(Flow, Flow == eRender ? eMultimedia : eConsole, Default.Put())))
			{
				LPWSTR Id = nullptr;
				if (SUCCEEDED(Default->GetId(&Id)) && Id)
				{
					DefaultId = Id;
					CoTaskMemFree(Id);
				}
			}
		}
		TCom<IMMDeviceCollection> Collection;
		if (FAILED(Enumerator->EnumAudioEndpoints(Flow, DEVICE_STATE_ACTIVE, Collection.Put())))
		{
			return false;
		}
		UINT Count = 0;
		Collection->GetCount(&Count);
		for (UINT Index = 0; Index < Count; ++Index)
		{
			TCom<IMMDevice> Device;
			if (FAILED(Collection->Item(Index, Device.Put())))
			{
				continue;
			}
			FEndpoint Endpoint;
			Endpoint.NativeIndex = Index;
			LPWSTR Id = nullptr;
			if (SUCCEEDED(Device->GetId(&Id)) && Id)
			{
				Endpoint.WideId = Id;
				CoTaskMemFree(Id);
			}
			TCom<IPropertyStore> Store;
			if (SUCCEEDED(Device->OpenPropertyStore(STGM_READ, Store.Put())))
			{
				PROPVARIANT Value;
				PropVariantInit(&Value);
				if (SUCCEEDED(Store->GetValue(EVC_PKEY_Device_FriendlyName, &Value)) && Value.vt == VT_LPWSTR)
				{
					Endpoint.Info.Name = Narrow(Value.pwszVal);
				}
				PropVariantClear(&Value);
				if (SUCCEEDED(Store->GetValue(EVC_PKEY_AudioEngine_DeviceFormat, &Value)) && Value.vt == VT_BLOB && Value.blob.cbSize >= sizeof(WAVEFORMATEX))
				{
					const WAVEFORMATEX* Wave = reinterpret_cast<const WAVEFORMATEX*>(Value.blob.pBlobData);
					Endpoint.Info.NumChannels = Wave->nChannels;
					Endpoint.Info.NativeSampleRate = static_cast<int>(Wave->nSamplesPerSec);
				}
				PropVariantClear(&Value);
			}
			Endpoint.Info.Id = Narrow(Endpoint.WideId.c_str());
			Endpoint.Info.bIsDefault = !DefaultId.empty() && Endpoint.WideId == DefaultId;
			if (Endpoint.Info.bIsDefault)
			{
				Out.insert(Out.begin(), Endpoint);
			}
			else
			{
				Out.push_back(Endpoint);
			}
		}
		return true;
	}

	const FEndpoint* FindById(const std::vector<FEndpoint>& Endpoints, const std::wstring& Id)
	{
		for (const FEndpoint& Endpoint : Endpoints)
		{
			if (Endpoint.WideId == Id)
			{
				return &Endpoint;
			}
		}
		return nullptr;
	}

	// Minimal IMediaBuffer for IMediaObject::ProcessOutput.
	class FMediaBuffer final : public IMediaBuffer
	{
	public:
		explicit FMediaBuffer(DWORD Capacity) : Storage(Capacity) {}
		HRESULT STDMETHODCALLTYPE QueryInterface(REFIID Riid, void** Out) override
		{
			if (!Out)
			{
				return E_POINTER;
			}
			if (Riid == __uuidof(IUnknown) || Riid == __uuidof(IMediaBuffer))
			{
				*Out = static_cast<IMediaBuffer*>(this);
				AddRef();
				return S_OK;
			}
			*Out = nullptr;
			return E_NOINTERFACE;
		}
		ULONG STDMETHODCALLTYPE AddRef() override { return ++Refs; }
		ULONG STDMETHODCALLTYPE Release() override
		{
			const ULONG Remaining = --Refs;
			if (Remaining == 0)
			{
				delete this;
			}
			return Remaining;
		}
		HRESULT STDMETHODCALLTYPE SetLength(DWORD NewLength) override
		{
			if (NewLength > Storage.size())
			{
				return E_INVALIDARG;
			}
			Length = NewLength;
			return S_OK;
		}
		HRESULT STDMETHODCALLTYPE GetMaxLength(DWORD* OutMax) override
		{
			if (!OutMax)
			{
				return E_POINTER;
			}
			*OutMax = static_cast<DWORD>(Storage.size());
			return S_OK;
		}
		HRESULT STDMETHODCALLTYPE GetBufferAndLength(BYTE** OutBuffer, DWORD* OutLength) override
		{
			if (OutBuffer)
			{
				*OutBuffer = Storage.data();
			}
			if (OutLength)
			{
				*OutLength = Length;
			}
			return S_OK;
		}
	private:
		std::vector<BYTE> Storage;
		DWORD Length = 0;
		std::atomic<ULONG> Refs{ 1 };
	};

	// Flags any default-device or device-state change; the worker re-checks its bindings.
	class FDeviceNotifications final : public IMMNotificationClient
	{
	public:
		HRESULT STDMETHODCALLTYPE QueryInterface(REFIID Riid, void** Out) override
		{
			if (!Out)
			{
				return E_POINTER;
			}
			if (Riid == __uuidof(IUnknown) || Riid == __uuidof(IMMNotificationClient))
			{
				*Out = static_cast<IMMNotificationClient*>(this);
				AddRef();
				return S_OK;
			}
			*Out = nullptr;
			return E_NOINTERFACE;
		}
		ULONG STDMETHODCALLTYPE AddRef() override { return ++Refs; }
		ULONG STDMETHODCALLTYPE Release() override
		{
			const ULONG Remaining = --Refs;
			if (Remaining == 0)
			{
				delete this;
			}
			return Remaining;
		}
		HRESULT STDMETHODCALLTYPE OnDefaultDeviceChanged(EDataFlow /*Flow*/, ERole Role, LPCWSTR /*DeviceId*/) override
		{
			if (Role == eConsole || Role == eMultimedia)
			{
				bChanged = true;
			}
			return S_OK;
		}
		HRESULT STDMETHODCALLTYPE OnDeviceStateChanged(LPCWSTR /*DeviceId*/, DWORD /*NewState*/) override
		{
			bChanged = true;
			return S_OK;
		}
		HRESULT STDMETHODCALLTYPE OnDeviceAdded(LPCWSTR /*DeviceId*/) override { return S_OK; }
		HRESULT STDMETHODCALLTYPE OnDeviceRemoved(LPCWSTR /*DeviceId*/) override
		{
			bChanged = true;
			return S_OK;
		}
		HRESULT STDMETHODCALLTYPE OnPropertyValueChanged(LPCWSTR /*DeviceId*/, const PROPERTYKEY /*Key*/) override { return S_OK; }
		bool Consume() { return bChanged.exchange(false); }
	private:
		std::atomic<ULONG> Refs{ 1 };
		std::atomic<bool> bChanged{ false };
	};

	// 16 kHz -> 48 kHz, polyphase windowed-sinc (72 taps, Blackman, cutoff 7.2 kHz).
	class FUpsampleBy3
	{
	public:
		FUpsampleBy3()
		{
			const double Pi = 3.14159265358979323846;
			const double Cutoff = 7200.0 / 48000.0;
			double Sum = 0.0;
			for (int Index = 0; Index < NumTaps; ++Index)
			{
				const double Offset = Index - (NumTaps - 1) / 2.0;
				const double Sinc = Offset == 0.0 ? 2.0 * Cutoff : std::sin(2.0 * Pi * Cutoff * Offset) / (Pi * Offset);
				const double Window = 0.42 - 0.5 * std::cos(2.0 * Pi * Index / (NumTaps - 1)) + 0.08 * std::cos(4.0 * Pi * Index / (NumTaps - 1));
				Taps[Index] = Sinc * Window;
				Sum += Taps[Index];
			}
			for (int Index = 0; Index < NumTaps; ++Index)
			{
				Taps[Index] *= 3.0 / Sum; // each of the 3 phases then has unity DC gain
			}
			Reset();
		}
		void Reset()
		{
			for (int Index = 0; Index < PhaseTaps; ++Index)
			{
				History[Index] = 0.0;
			}
		}
		void Push(float Sample, float* Out3)
		{
			for (int Index = PhaseTaps - 1; Index > 0; --Index)
			{
				History[Index] = History[Index - 1];
			}
			History[0] = Sample;
			for (int Phase = 0; Phase < 3; ++Phase)
			{
				double Acc = 0.0;
				for (int Tap = 0; Tap < PhaseTaps; ++Tap)
				{
					Acc += Taps[Phase + 3 * Tap] * History[Tap];
				}
				Out3[Phase] = static_cast<float>(Acc);
			}
		}
	private:
		static constexpr int NumTaps = 72;
		static constexpr int PhaseTaps = NumTaps / 3;
		double Taps[NumTaps];
		double History[PhaseTaps];
	};

	// Keeps a render endpoint active by playing silence, so the DSP's loopback reference never starves.
	class FSilentRenderKeepAlive
	{
	public:
		HRESULT Start(IMMDeviceEnumerator* Enumerator, const std::wstring& RenderId)
		{
			Stop();
			TCom<IMMDevice> Device;
			HRESULT Hr = Enumerator->GetDevice(RenderId.c_str(), Device.Put());
			if (SUCCEEDED(Hr))
			{
				Hr = Device->Activate(__uuidof(IAudioClient), CLSCTX_ALL, nullptr, Client.PutVoid());
			}
			WAVEFORMATEX* MixFormat = nullptr;
			if (SUCCEEDED(Hr))
			{
				Hr = Client->GetMixFormat(&MixFormat);
			}
			if (SUCCEEDED(Hr))
			{
				Hr = Client->Initialize(AUDCLNT_SHAREMODE_SHARED, 0, 1000000 /* 100 ms */, 0, MixFormat, nullptr);
			}
			if (MixFormat)
			{
				CoTaskMemFree(MixFormat);
			}
			if (SUCCEEDED(Hr))
			{
				Hr = Client->GetBufferSize(&BufferFrames);
			}
			if (SUCCEEDED(Hr))
			{
				Hr = Client->GetService(__uuidof(IAudioRenderClient), Render.PutVoid());
			}
			if (SUCCEEDED(Hr))
			{
				Pump();
				Hr = Client->Start();
			}
			if (FAILED(Hr))
			{
				Stop();
			}
			return Hr;
		}

		// Tops the endpoint buffer up with silence. Worker loop, every ~10 ms. False when the stream is
		// broken (e.g. AUDCLNT_E_DEVICE_INVALIDATED after a device format change); true if not running.
		bool Pump()
		{
			if (!Client || !Render)
			{
				return true;
			}
			UINT32 Padding = 0;
			if (FAILED(Client->GetCurrentPadding(&Padding)))
			{
				return false;
			}
			if (Padding >= BufferFrames)
			{
				return true;
			}
			const UINT32 Available = BufferFrames - Padding;
			BYTE* Data = nullptr;
			if (FAILED(Render->GetBuffer(Available, &Data)))
			{
				return false;
			}
			Render->ReleaseBuffer(Available, AUDCLNT_BUFFERFLAGS_SILENT);
			return true;
		}

		void Stop()
		{
			if (Client)
			{
				Client->Stop();
			}
			Render.Reset();
			Client.Reset();
			BufferFrames = 0;
		}

	private:
		TCom<IAudioClient> Client;
		TCom<IAudioRenderClient> Render;
		UINT32 BufferFrames = 0;
	};

	class FWindowsVoiceCaptureDspCore final : public ICaptureCore
	{
	public:
		FWindowsVoiceCaptureDspCore(FLogFn InLog, const FOptions& InOptions)
			: Log(std::move(InLog))
			, Options(InOptions)
		{
		}

		~FWindowsVoiceCaptureDspCore() override
		{
			Close();
		}

		const char* BackendName() const override
		{
			return Options.bBypassVoiceProcessing ? "Windows Voice Capture DSP (AEC OFF - test only)" : "Windows Voice Capture DSP (AEC)";
		}

		bool EnumerateInputs(std::vector<FDeviceInfo>& Out) override
		{
			Out.clear();
			FScopedCom Com;
			TCom<IMMDeviceEnumerator> Enumerator;
			std::vector<FEndpoint> Endpoints;
			if (!CreateEnumerator(Enumerator) || !EnumerateEndpoints(Enumerator.Get(), eCapture, Endpoints))
			{
				Emit(ELogLevel::Error, "could not enumerate capture endpoints");
				return false;
			}
			for (const FEndpoint& Endpoint : Endpoints)
			{
				Out.push_back(Endpoint.Info);
			}
			return true;
		}

		bool Open(int DeviceIndex, int FramesPerCallback, FCaptureFn OnCapture) override
		{
			if (bOpen.load())
			{
				Emit(ELogLevel::Warning, "Open: a stream is already open");
				return false;
			}
			std::vector<FEndpoint> Captures;
			{
				FScopedCom Com;
				TCom<IMMDeviceEnumerator> Enumerator;
				if (!CreateEnumerator(Enumerator) || !EnumerateEndpoints(Enumerator.Get(), eCapture, Captures))
				{
					Emit(ELogLevel::Error, "Open: could not enumerate capture endpoints");
					return false;
				}
			}
			if (Captures.empty())
			{
				Emit(ELogLevel::Error, "Open: no input devices");
				return false;
			}
			const size_t Chosen = DeviceIndex < 0 ? 0 : static_cast<size_t>(DeviceIndex);
			if (Chosen >= Captures.size())
			{
				Emit(ELogLevel::Error, Format("Open: device index %d out of range (%d input devices)", DeviceIndex, static_cast<int>(Captures.size())));
				return false;
			}
			{
				std::lock_guard<std::mutex> Lock(StateMutex);
				Opened = Captures[Chosen].Info;
				CaptureId = Captures[Chosen].WideId;
			}
			bFollowDefaultInput = Captures[Chosen].Info.bIsDefault;
			DeliveredFrames = 0;
			ProcessErrors = 0;
			NoRenderStream = 0;
			LastError = 0;
			Rebinds = 0;
			Stalls = 0;
			Callback = std::move(OnCapture);
			Reblocker.Reset(FramesPerCallback);
			bQuit = false;
			bRunning = false;
			std::shared_ptr<std::promise<bool>> Ready = std::make_shared<std::promise<bool>>();
			std::future<bool> ReadyResult = Ready->get_future();
			Worker = std::thread([this, Ready]() { WorkerMain(Ready); });
			if (ReadyResult.wait_for(std::chrono::seconds(5)) != std::future_status::ready)
			{
				Emit(ELogLevel::Warning, "Voice Capture DSP is slow to start (>5 s); still waiting");
			}
			if (!ReadyResult.get())
			{
				bQuit = true;
				Worker.join();
				Callback = nullptr;
				return false;
			}
			bOpen = true;
			const FDeviceInfo Device = OpenedDevice();
			Emit(ELogLevel::Info, Format("opened '%s' (%d ch @ %d Hz native) -> DSP 16000 Hz -> 48000 Hz mono, %d-frame blocks; AEC %s%s",
				Device.Name.c_str(), Device.NumChannels, Device.NativeSampleRate, FramesPerCallback,
				Options.bBypassVoiceProcessing ? "OFF" : "ON", bFollowDefaultInput.load() ? ", following the default input" : ""));
			return true;
		}

		bool Start() override
		{
			if (!bOpen.load())
			{
				return false;
			}
			bRunning = true; // the DSP already streams; delivery is gated here
			return true;
		}

		bool Stop() override
		{
			bRunning = false;
			return bOpen.load();
		}

		void Close() override
		{
			bRunning = false;
			if (Worker.joinable())
			{
				bQuit = true;
				Worker.join();
			}
			if (bOpen.exchange(false))
			{
				Emit(ELogLevel::Info, Format("closed: %llu frames delivered, %llu ProcessOutput errors (last 0x%08lX), %llu no-render-stream reports, %d re-binds, %d stall restarts",
					DeliveredFrames.load(), ProcessErrors.load(), static_cast<unsigned long>(LastError.load()), NoRenderStream.load(), Rebinds.load(), Stalls.load()));
			}
			Callback = nullptr;
		}

		bool IsOpen() const override { return bOpen.load(); }
		bool IsRunning() const override { return bRunning.load(); }

		void SetRenderEndpoint(const std::string& EndpointId) override
		{
			const std::wstring Wanted = Widen(EndpointId);
			{
				std::lock_guard<std::mutex> Lock(StateMutex);
				if (Wanted == PreferredRenderId)
				{
					return;
				}
				PreferredRenderId = Wanted;
			}
			bRenderPreferenceChanged = true;
			Emit(ELogLevel::Info, Wanted.empty() ? std::string("echo reference: the default speakers")
				: Format("echo reference: speakers %s", EndpointId.c_str()));
		}

		FDeviceInfo OpenedDevice() const override
		{
			std::lock_guard<std::mutex> Lock(StateMutex);
			return Opened;
		}

	private:
		void WorkerMain(std::shared_ptr<std::promise<bool>> Ready)
		{
			FScopedCom Com;
			TCom<IMMDeviceEnumerator> Enumerator;
			FDeviceNotifications* Notifications = nullptr;
			bool bStarted = CreateEnumerator(Enumerator);
			if (bStarted)
			{
				Notifications = new FDeviceNotifications();
				if (FAILED(Enumerator->RegisterEndpointNotificationCallback(Notifications)))
				{
					Emit(ELogLevel::Warning, "could not watch device changes; device switches need a stream reopen");
					Notifications->Release();
					Notifications = nullptr;
				}
				bStarted = StartDsp(Enumerator.Get());
			}
			else
			{
				Emit(ELogLevel::Error, "could not create the MMDevice enumerator");
			}
			Ready->set_value(bStarted);
			if (bStarted)
			{
				RunLoop(Enumerator.Get(), Notifications);
			}
			StopDsp();
			if (Notifications)
			{
				Enumerator->UnregisterEndpointNotificationCallback(Notifications);
				Notifications->Release();
			}
		}

		bool Fail(const char* What, HRESULT Hr)
		{
			Emit(ELogLevel::Error, Format("Voice Capture DSP: %s failed (0x%08lX)", What, static_cast<unsigned long>(Hr)));
			return false;
		}

		bool SetProperty(const PROPERTYKEY& Key, VARTYPE Type, LONG IntValue, const char* What)
		{
			PROPVARIANT Value;
			PropVariantInit(&Value);
			Value.vt = Type;
			if (Type == VT_BOOL)
			{
				Value.boolVal = IntValue ? VARIANT_TRUE : VARIANT_FALSE;
			}
			else
			{
				Value.lVal = IntValue;
			}
			const HRESULT Hr = Properties->SetValue(Key, Value);
			PropVariantClear(&Value);
			return SUCCEEDED(Hr) || Fail(What, Hr);
		}

		void OptOutOfDucking(IMMDeviceEnumerator* Enumerator, const std::wstring& Id)
		{
			// Windows turns other audio down by 80% (default setting) while a communications stream
			// runs; opt out so the game's own sound keeps its level.
			TCom<IMMDevice> Device;
			TCom<IAudioSessionManager2> Manager;
			TCom<IAudioSessionControl> Control;
			TCom<IAudioSessionControl2> Control2;
			const char* Step = "GetDevice";
			HRESULT Hr = Enumerator->GetDevice(Id.c_str(), Device.Put());
			if (SUCCEEDED(Hr))
			{
				Step = "Activate(IAudioSessionManager2)";
				Hr = Device->Activate(__uuidof(IAudioSessionManager2), CLSCTX_ALL, nullptr, Manager.PutVoid());
			}
			if (SUCCEEDED(Hr))
			{
				Step = "GetAudioSessionControl";
				Hr = Manager->GetAudioSessionControl(nullptr, 0, Control.Put());
			}
			if (SUCCEEDED(Hr))
			{
				Step = "QueryInterface(IAudioSessionControl2)";
				Hr = Control->QueryInterface(__uuidof(IAudioSessionControl2), Control2.PutVoid());
			}
			if (SUCCEEDED(Hr))
			{
				Step = "SetDuckingPreference";
				Hr = Control2->SetDuckingPreference(TRUE);
			}
			if (FAILED(Hr))
			{
				Emit(ELogLevel::Warning, Format("could not opt out of Windows communications ducking: %s failed (0x%08lX)", Step, static_cast<unsigned long>(Hr)));
			}
		}

		// The speakers the game plays on (SetRenderEndpoint), else the default render device.
		const FEndpoint* ChooseRender(const std::vector<FEndpoint>& Renders) const
		{
			std::wstring Wanted;
			{
				std::lock_guard<std::mutex> Lock(StateMutex);
				Wanted = PreferredRenderId;
			}
			if (!Wanted.empty())
			{
				if (const FEndpoint* Found = FindById(Renders, Wanted))
				{
					return Found;
				}
			}
			return (!Renders.empty() && Renders[0].Info.bIsDefault) ? &Renders[0] : nullptr;
		}

		// Worker thread. Binds the DSP to the chosen microphone and to the game's speakers (the echo reference).
		bool StartDsp(IMMDeviceEnumerator* Enumerator)
		{
			std::vector<FEndpoint> Captures;
			std::vector<FEndpoint> Renders;
			if (!EnumerateEndpoints(Enumerator, eCapture, Captures) || !EnumerateEndpoints(Enumerator, eRender, Renders))
			{
				Emit(ELogLevel::Error, "Voice Capture DSP: endpoint enumeration failed");
				return false;
			}
			std::wstring WantedCapture;
			{
				std::lock_guard<std::mutex> Lock(StateMutex);
				WantedCapture = CaptureId;
			}
			const FEndpoint* Capture = FindById(Captures, WantedCapture);
			if ((!Capture || bFollowDefaultInput.load()) && !Captures.empty() && Captures[0].Info.bIsDefault)
			{
				if (!Capture)
				{
					bFollowDefaultInput = true; // the chosen microphone went away: fall back to the default
				}
				Capture = &Captures[0];
			}
			if (!Capture)
			{
				Emit(ELogLevel::Error, "Voice Capture DSP: no usable microphone");
				return false;
			}
			const FEndpoint* RenderChoice = ChooseRender(Renders);
			if (!RenderChoice)
			{
				Emit(ELogLevel::Error, "Voice Capture DSP: no render device to use as the echo reference");
				return false;
			}
			const FEndpoint& Render = *RenderChoice;
			{
				std::lock_guard<std::mutex> Lock(StateMutex);
				Opened = Capture->Info;
				CaptureId = Capture->WideId;
			}
			BoundRenderId = Render.WideId;

			// On the render session: a capture session returns AUDCLNT_E_WRONG_ENDPOINT_TYPE (measured).
			OptOutOfDucking(Enumerator, Render.WideId);

			ConsecutiveFaults = 0;
			const HRESULT KeepAliveHr = KeepAlive.Start(Enumerator, Render.WideId);
			if (FAILED(KeepAliveHr))
			{
				Emit(ELogLevel::Warning, Format("could not start the silent keep-alive stream on '%s' (0x%08lX); the microphone may pause while nothing plays",
					Render.Info.Name.c_str(), static_cast<unsigned long>(KeepAliveHr)));
			}

			HRESULT Hr = CoCreateInstance(EVC_CLSID_CWMAudioAEC, nullptr, CLSCTX_INPROC_SERVER, __uuidof(IMediaObject), Dmo.PutVoid());
			if (FAILED(Hr))
			{
				return Fail("CoCreateInstance(CLSID_CWMAudioAEC)", Hr);
			}
			Hr = Dmo->QueryInterface(__uuidof(IPropertyStore), Properties.PutVoid());
			if (FAILED(Hr))
			{
				return Fail("QueryInterface(IPropertyStore)", Hr);
			}
			const LONG Mode = Options.bBypassVoiceProcessing ? SINGLE_CHANNEL_NSAGC : SINGLE_CHANNEL_AEC;
			const LONG Indexes = static_cast<LONG>((Render.NativeIndex << 16) | (Capture->NativeIndex & 0xFFFF));
			if (!SetProperty(MFPKEY_WMAAECMA_SYSTEM_MODE, VT_I4, Mode, "set SYSTEM_MODE")
				|| !SetProperty(MFPKEY_WMAAECMA_DMO_SOURCE_MODE, VT_BOOL, 1, "set DMO_SOURCE_MODE")
				|| !SetProperty(MFPKEY_WMAAECMA_DEVICE_INDEXES, VT_I4, Indexes, "set DEVICE_INDEXES"))
			{
				return false;
			}

			WAVEFORMATEX Wave;
			std::memset(&Wave, 0, sizeof(Wave));
			Wave.wFormatTag = WAVE_FORMAT_PCM;
			Wave.nChannels = 1;
			Wave.nSamplesPerSec = DspSampleRate;
			Wave.wBitsPerSample = 16;
			Wave.nBlockAlign = 2;
			Wave.nAvgBytesPerSec = DspSampleRate * 2;
			DMO_MEDIA_TYPE Type;
			std::memset(&Type, 0, sizeof(Type));
			Type.majortype = EVC_MEDIATYPE_Audio;
			Type.subtype = EVC_MEDIASUBTYPE_PCM;
			Type.bFixedSizeSamples = TRUE;
			Type.bTemporalCompression = FALSE;
			Type.lSampleSize = 0;
			Type.formattype = EVC_FORMAT_WaveFormatEx;
			Type.cbFormat = sizeof(Wave);
			Type.pbFormat = reinterpret_cast<BYTE*>(&Wave); // SetOutputType copies the type
			Hr = Dmo->SetOutputType(0, &Type, 0);
			if (FAILED(Hr))
			{
				return Fail("SetOutputType(16 kHz mono PCM16)", Hr);
			}
			Hr = Dmo->AllocateStreamingResources();
			if (FAILED(Hr))
			{
				return Fail("AllocateStreamingResources", Hr);
			}
			Upsampler.Reset();
			Emit(ELogLevel::Info, Format("Voice Capture DSP bound: microphone '%s' [index %u], echo reference '%s' [index %u], mode %s",
				Capture->Info.Name.c_str(), Capture->NativeIndex, Render.Info.Name.c_str(), Render.NativeIndex,
				Options.bBypassVoiceProcessing ? "SINGLE_CHANNEL_NSAGC (no AEC)" : "SINGLE_CHANNEL_AEC"));
			return true;
		}

		void StopDsp()
		{
			if (Dmo)
			{
				Dmo->FreeStreamingResources();
			}
			Properties.Reset();
			Dmo.Reset();
			KeepAlive.Stop();
		}

		// Worker thread: true when the bound devices no longer match what should be bound.
		bool BindingIsStale(IMMDeviceEnumerator* Enumerator)
		{
			std::vector<FEndpoint> Captures;
			std::vector<FEndpoint> Renders;
			if (!EnumerateEndpoints(Enumerator, eCapture, Captures) || !EnumerateEndpoints(Enumerator, eRender, Renders))
			{
				return false;
			}
			std::wstring CurrentCapture;
			{
				std::lock_guard<std::mutex> Lock(StateMutex);
				CurrentCapture = CaptureId;
			}
			const FEndpoint* WantedRender = ChooseRender(Renders);
			const bool bRenderMoved = WantedRender && WantedRender->WideId != BoundRenderId;
			const bool bCaptureGone = FindById(Captures, CurrentCapture) == nullptr;
			const bool bDefaultInputMoved = bFollowDefaultInput.load() && !Captures.empty() && Captures[0].Info.bIsDefault && Captures[0].WideId != CurrentCapture;
			return bRenderMoved || bCaptureGone || bDefaultInputMoved;
		}

		void RunLoop(IMMDeviceEnumerator* Enumerator, FDeviceNotifications* Notifications)
		{
			FMediaBuffer* Buffer = new FMediaBuffer(MediaBufferBytes);
			std::vector<float> Scratch;
			bool bDspUp = true;
			int FailedRestarts = 0;
			std::chrono::steady_clock::time_point LastRetry = std::chrono::steady_clock::now();
			while (!bQuit.load())
			{
				Sleep(10);
				const bool bDeviceEvent = Notifications && Notifications->Consume();
				const bool bChanged = bRenderPreferenceChanged.exchange(false) || bDeviceEvent;
				if (bDspUp && bChanged && BindingIsStale(Enumerator))
				{
					StopDsp();
					bDspUp = StartDsp(Enumerator);
					++Rebinds;
					LastRetry = std::chrono::steady_clock::now();
				}
				else if (!bDspUp && (bChanged || std::chrono::steady_clock::now() - LastRetry > std::chrono::seconds(1)))
				{
					// Log the 1st failed restart and then one in 60 (about a minute), not every second.
					bQuietErrors = FailedRestarts > 0 && FailedRestarts % 60 != 0;
					StopDsp();
					bDspUp = StartDsp(Enumerator);
					bQuietErrors = false;
					LastRetry = std::chrono::steady_clock::now();
					if (bDspUp)
					{
						Emit(ELogLevel::Info, Format("Voice Capture DSP restarted after %d failed attempt(s)", FailedRestarts));
						FailedRestarts = 0;
					}
					else
					{
						++FailedRestarts;
					}
				}
				if (bDspUp)
				{
					const bool bKeepAliveOk = KeepAlive.Pump();
					const bool bDrainOk = Drain(Buffer, Scratch);
					ConsecutiveFaults = (bKeepAliveOk && bDrainOk) ? 0 : ConsecutiveFaults + 1;
					// ~0.5 s of continuous faults (broken keep-alive, ProcessOutput errors, or the DSP
					// starved of its render reference): tear down and restart instead of staying silent.
					if (ConsecutiveFaults >= 50)
					{
						++Stalls;
						if (Stalls <= 3 || Stalls % 60 == 0)
						{
							Emit(ELogLevel::Warning, Format("Voice Capture DSP stalled (#%d; keep-alive %s, last ProcessOutput error 0x%08lX); restarting",
								Stalls.load(), bKeepAliveOk ? "ok" : "broken", static_cast<unsigned long>(LastError.load())));
						}
						ConsecutiveFaults = 0;
						StopDsp();
						bDspUp = false;
						LastRetry = std::chrono::steady_clock::time_point();
					}
				}
			}
			Buffer->Release();
		}

		// False when ProcessOutput failed or reported the render reference missing.
		bool Drain(FMediaBuffer* Buffer, std::vector<float>& Scratch)
		{
			for (int Guard = 0; Guard < 100; ++Guard)
			{
				Buffer->SetLength(0);
				DMO_OUTPUT_DATA_BUFFER Output;
				std::memset(&Output, 0, sizeof(Output));
				Output.pBuffer = Buffer;
				DWORD Status = 0;
				const HRESULT Hr = Dmo->ProcessOutput(0, 1, &Output, &Status);
				bool bHealthy = true;
				if (Hr == static_cast<HRESULT>(WMAAECMA_E_NO_ACTIVE_RENDER_STREAM))
				{
					++NoRenderStream; // render endpoint idle: the DSP outputs nothing (the keep-alive exists to prevent this)
					bHealthy = false;
				}
				else if (FAILED(Hr))
				{
					++ProcessErrors;
					LastError = Hr;
					return false;
				}
				BYTE* Data = nullptr;
				DWORD Length = 0;
				Buffer->GetBufferAndLength(&Data, &Length);
				const int Samples = static_cast<int>(Length / sizeof(int16_t));
				if (Samples > 0)
				{
					Deliver(reinterpret_cast<const int16_t*>(Data), Samples, Scratch);
				}
				if ((Output.dwStatus & DMO_OUTPUT_DATA_BUFFERF_INCOMPLETE) == 0)
				{
					return bHealthy;
				}
			}
			return true;
		}

		void Deliver(const int16_t* Pcm, int NumSamples, std::vector<float>& Scratch)
		{
			Scratch.resize(static_cast<size_t>(NumSamples) * 3);
			for (int Index = 0; Index < NumSamples; ++Index)
			{
				Upsampler.Push(Pcm[Index] / 32768.0f, &Scratch[static_cast<size_t>(Index) * 3]);
			}
			if (bRunning.load() && Callback)
			{
				const FCaptureFn& Sink = Callback;
				Reblocker.Push(Scratch.data(), NumSamples * 3, [this, &Sink](const float* Samples, int Frames)
				{
					Sink(Samples, Frames);
					DeliveredFrames += static_cast<unsigned long long>(Frames);
				});
			}
		}

		void Emit(ELogLevel Level, const std::string& Message) const
		{
			if (Log && !(bQuietErrors.load() && Level != ELogLevel::Info))
			{
				Log(Level, Message);
			}
		}

		FLogFn Log;
		FOptions Options;
		mutable std::mutex StateMutex;
		FDeviceInfo Opened;
		std::wstring CaptureId;
		std::wstring BoundRenderId;       // worker thread only
		std::wstring PreferredRenderId;   // guarded by StateMutex; empty = the default render device
		std::atomic<bool> bRenderPreferenceChanged{ false };
		std::atomic<bool> bFollowDefaultInput{ false };
		FCaptureFn Callback;
		std::thread Worker;
		std::atomic<bool> bQuit{ false };
		std::atomic<bool> bOpen{ false };
		std::atomic<bool> bRunning{ false };
		TCom<IMediaObject> Dmo;           // worker thread only
		TCom<IPropertyStore> Properties;  // worker thread only
		FUpsampleBy3 Upsampler;           // worker thread only
		FSilentRenderKeepAlive KeepAlive; // worker thread only
		int ConsecutiveFaults = 0;        // worker thread only
		std::atomic<bool> bQuietErrors{ false }; // set by the worker while retrying a failed restart
		Detail::FReblocker Reblocker;     // worker thread only
		std::atomic<unsigned long long> DeliveredFrames{ 0 };
		std::atomic<unsigned long long> ProcessErrors{ 0 };
		std::atomic<unsigned long long> NoRenderStream{ 0 };
		std::atomic<long> LastError{ 0 };
		std::atomic<int> Rebinds{ 0 };
		std::atomic<int> Stalls{ 0 };
	};
} // namespace

std::unique_ptr<ICaptureCore> CreatePlatformCaptureCore(FLogFn Log, const FOptions& Options)
{
	return std::unique_ptr<ICaptureCore>(new FWindowsVoiceCaptureDspCore(std::move(Log), Options));
}

} // namespace EVCAec

#if EVC_UE_WINDOWS_TYPES
	#include "Windows/HideWindowsPlatformTypes.h"
#endif

#endif // EVC_AEC_WINDOWS
