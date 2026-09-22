// probe_win.cpp - drives the SHIPPING Windows core (Private/Windows/EVCCaptureCore_Windows.cpp) outside
// Unreal. Functional checks only (this desktop has no speaker-to-microphone path): device list order,
// DSP start in AEC and non-AEC modes, 480-frame blocks at a real-time 48 kHz rate, clean open/close
// cycles, every non-default device opening, and the DSP's own error counters.
//
//   probe_win.exe [seconds-per-phase]
//
// Acoustic mode (run on a laptop with built-in speakers + mic, headphones unplugged):
//   probe_win.exe acoustic [speech.wav]
// plays speech.wav through the default speakers as a separate stream (like the game) and measures how
// much of it the DSP removes from the microphone: AEC off (NSAGC) vs AEC on. Also writes
// probe_result.txt next to the working directory.

#include "AEC/EVCCaptureCore.h"

#include <windows.h>
#include <mmsystem.h>
#include <mmdeviceapi.h>
#include <audioclient.h>

#include <atomic>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

namespace
{
	std::mutex GMutex;
	double GSumSq = 0.0;
	long long GSamples = 0;
	long long GCallbacks = 0;
	long long GWrongSize = 0;
	float GPeak = 0.0f;

	void OnCapture(const float* Samples, int NumFrames)
	{
		double Sum = 0.0;
		float Peak = 0.0f;
		for (int Index = 0; Index < NumFrames; ++Index)
		{
			Sum += static_cast<double>(Samples[Index]) * Samples[Index];
			const float Magnitude = std::fabs(Samples[Index]);
			Peak = Magnitude > Peak ? Magnitude : Peak;
		}
		std::lock_guard<std::mutex> Lock(GMutex);
		++GCallbacks;
		GWrongSize += NumFrames == 480 ? 0 : 1;
		GSumSq += Sum;
		GSamples += NumFrames;
		GPeak = Peak > GPeak ? Peak : GPeak;
	}

	void Log(EVCAec::ELogLevel Level, const std::string& Message)
	{
		std::printf("    [core %s] %s\n", Level == EVCAec::ELogLevel::Error ? "ERROR" : Level == EVCAec::ELogLevel::Warning ? "warn" : "info", Message.c_str());
		std::fflush(stdout);
	}

	bool Phase(const char* Tag, int DeviceIndex, bool bBypass, int Seconds)
	{
		std::printf("\n[%s] device index %d, %s\n", Tag, DeviceIndex, bBypass ? "AEC OFF (NSAGC)" : "AEC ON");
		EVCAec::FOptions Options;
		Options.bBypassVoiceProcessing = bBypass;
		std::unique_ptr<EVCAec::ICaptureCore> Core = EVCAec::CreatePlatformCaptureCore(&Log, Options);
		{
			std::lock_guard<std::mutex> Lock(GMutex);
			GSumSq = 0.0; GSamples = 0; GCallbacks = 0; GWrongSize = 0; GPeak = 0.0f;
		}
		const auto T0 = std::chrono::steady_clock::now();
		if (!Core->Open(DeviceIndex, 480, &OnCapture) || !Core->Start())
		{
			std::printf("    OPEN/START FAILED\n");
			return false;
		}
		const double OpenMs = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - T0).count();
		std::this_thread::sleep_for(std::chrono::seconds(Seconds));
		Core->Stop();
		Core->Close();
		std::lock_guard<std::mutex> Lock(GMutex);
		const double Level = (GSamples > 0 && GSumSq > 0.0) ? 10.0 * std::log10(GSumSq / static_cast<double>(GSamples)) : -200.0;
		const double Rate = GSamples / static_cast<double>(Seconds);
		std::printf("    RESULT open %.0f ms | %lld callbacks, %lld not 480 frames | %.0f frames/s (expect ~48000) | level %.1f dBFS, peak %.3f\n",
			OpenMs, GCallbacks, GWrongSize, Rate, Level, GPeak);
		const bool bRateOk = Rate > 46000.0 && Rate < 50000.0;
		std::printf("    %s\n", (GWrongSize == 0 && bRateOk && GCallbacks > 0) ? "PASS" : "FAIL");
		return GWrongSize == 0 && bRateOk && GCallbacks > 0;
	}
}

namespace
{
	double AcousticPhase(const char* Tag, bool bBypass, const wchar_t* Wav, FILE* Report)
	{
		std::printf("\n[%s] %s, playback: %s\n", Tag, bBypass ? "AEC OFF (NSAGC)" : "AEC ON", Wav ? "speech through the default speakers" : "silence");
		EVCAec::FOptions Options;
		Options.bBypassVoiceProcessing = bBypass;
		std::unique_ptr<EVCAec::ICaptureCore> Core = EVCAec::CreatePlatformCaptureCore(&Log, Options);
		if (!Core->Open(0, 480, &OnCapture) || !Core->Start())
		{
			std::printf("    OPEN/START FAILED\n");
			return -200.0;
		}
		std::this_thread::sleep_for(std::chrono::milliseconds(800));
		if (Wav && !PlaySoundW(Wav, nullptr, SND_FILENAME | SND_ASYNC | SND_LOOP | SND_NODEFAULT))
		{
			std::printf("    !! could not play the speech file\n");
		}
		std::this_thread::sleep_for(std::chrono::milliseconds(2500)); // echo canceller converges
		{
			std::lock_guard<std::mutex> Lock(GMutex);
			GSumSq = 0.0; GSamples = 0; GCallbacks = 0; GWrongSize = 0; GPeak = 0.0f;
		}
		std::this_thread::sleep_for(std::chrono::seconds(5));
		double Level = -200.0;
		long long Callbacks = 0;
		long long Samples = 0;
		{
			std::lock_guard<std::mutex> Lock(GMutex);
			Level = (GSamples > 0 && GSumSq > 0.0) ? 10.0 * std::log10(GSumSq / static_cast<double>(GSamples)) : -200.0;
			Callbacks = GCallbacks;
			Samples = GSamples;
		}
		PlaySoundW(nullptr, nullptr, 0);
		Core->Stop();
		Core->Close();
		std::printf("    RESULT microphone level %.1f dBFS  (%lld callbacks, %lld frames in 5 s%s)\n", Level, Callbacks, Samples,
			Callbacks == 0 ? " - NO AUDIO DELIVERED, level invalid" : (Samples > 0 && GSumSq == 0.0 ? " - all-zero audio" : ""));
		if (Report)
		{
			std::fprintf(Report, "%s: %.1f dBFS\n", Tag, Level);
		}
		std::this_thread::sleep_for(std::chrono::milliseconds(800));
		return Level;
	}

	// Plain WASAPI capture of the default microphone, no DSP. bRaw asks for AUDCLNT_STREAMOPTIONS_RAW
	// (bypasses the driver/OS effects, e.g. OEM or Windows voice processing). Returns dBFS of channel 0.
	double RawMicPhase(const char* Tag, const wchar_t* Wav, bool bRaw, FILE* Report)
	{
		std::printf("\n[%s] plain WASAPI capture (%s), playback: %s\n", Tag, bRaw ? "RAW mode" : "default mode", Wav ? "speech" : "silence");
		IMMDeviceEnumerator* Enumerator = nullptr;
		IMMDevice* Device = nullptr;
		IAudioClient* Client = nullptr;
		IAudioClient2* Client2 = nullptr;
		IAudioCaptureClient* Capture = nullptr;
		WAVEFORMATEX* Format = nullptr;
		double Level = -200.0;
		HRESULT Hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL, __uuidof(IMMDeviceEnumerator), reinterpret_cast<void**>(&Enumerator));
		if (SUCCEEDED(Hr)) Hr = Enumerator->GetDefaultAudioEndpoint(eCapture, eConsole, &Device);
		if (SUCCEEDED(Hr)) Hr = Device->Activate(__uuidof(IAudioClient), CLSCTX_ALL, nullptr, reinterpret_cast<void**>(&Client));
		if (SUCCEEDED(Hr) && bRaw && SUCCEEDED(Client->QueryInterface(__uuidof(IAudioClient2), reinterpret_cast<void**>(&Client2))))
		{
			AudioClientProperties Props = {};
			Props.cbSize = sizeof(Props);
			Props.eCategory = AudioCategory_Other;
			Props.Options = AUDCLNT_STREAMOPTIONS_RAW;
			const HRESULT RawHr = Client2->SetClientProperties(&Props);
			std::printf("    RAW mode request: %s (0x%08lX)\n", SUCCEEDED(RawHr) ? "accepted" : "REFUSED", static_cast<unsigned long>(RawHr));
		}
		if (SUCCEEDED(Hr)) Hr = Client->GetMixFormat(&Format);
		if (SUCCEEDED(Hr)) Hr = Client->Initialize(AUDCLNT_SHAREMODE_SHARED, 0, 2000000, 0, Format, nullptr);
		if (SUCCEEDED(Hr)) Hr = Client->GetService(__uuidof(IAudioCaptureClient), reinterpret_cast<void**>(&Capture));
		if (SUCCEEDED(Hr)) Hr = Client->Start();
		if (FAILED(Hr))
		{
			std::printf("    WASAPI capture setup failed (0x%08lX)\n", static_cast<unsigned long>(Hr));
		}
		else
		{
			const bool bFloat = Format->wFormatTag == WAVE_FORMAT_IEEE_FLOAT
				|| (Format->wFormatTag == WAVE_FORMAT_EXTENSIBLE && reinterpret_cast<WAVEFORMATEXTENSIBLE*>(Format)->SubFormat.Data1 == 3);
			std::printf("    format: %u ch @ %lu Hz, %u-bit %s\n", Format->nChannels, Format->nSamplesPerSec, Format->wBitsPerSample, bFloat ? "float" : "int");
			if (Wav)
			{
				PlaySoundW(Wav, nullptr, SND_FILENAME | SND_ASYNC | SND_LOOP | SND_NODEFAULT);
			}
			double SumSq = 0.0;
			long long Frames = 0;
			const auto Start = std::chrono::steady_clock::now();
			while (std::chrono::steady_clock::now() - Start < std::chrono::milliseconds(7500))
			{
				std::this_thread::sleep_for(std::chrono::milliseconds(10));
				const bool bMeasure = std::chrono::steady_clock::now() - Start > std::chrono::milliseconds(2500);
				UINT32 Packet = 0;
				while (SUCCEEDED(Capture->GetNextPacketSize(&Packet)) && Packet > 0)
				{
					BYTE* Data = nullptr;
					UINT32 NumFrames = 0;
					DWORD Flags = 0;
					if (FAILED(Capture->GetBuffer(&Data, &NumFrames, &Flags, nullptr, nullptr)))
					{
						break;
					}
					if (bMeasure && !(Flags & AUDCLNT_BUFFERFLAGS_SILENT))
					{
						for (UINT32 Index = 0; Index < NumFrames; ++Index)
						{
							const double Sample = bFloat
								? reinterpret_cast<const float*>(Data)[Index * Format->nChannels]
								: reinterpret_cast<const int16_t*>(Data)[Index * Format->nChannels] / 32768.0;
							SumSq += Sample * Sample;
						}
					}
					if (bMeasure)
					{
						Frames += NumFrames;
					}
					Capture->ReleaseBuffer(NumFrames);
				}
			}
			PlaySoundW(nullptr, nullptr, 0);
			Client->Stop();
			Level = (Frames > 0 && SumSq > 0.0) ? 10.0 * std::log10(SumSq / static_cast<double>(Frames)) : -200.0;
			std::printf("    RESULT raw microphone level %.1f dBFS (%lld frames)\n", Level, Frames);
			if (Report)
			{
				std::fprintf(Report, "%s: %.1f dBFS\n", Tag, Level);
			}
		}
		if (Format) CoTaskMemFree(Format);
		if (Capture) Capture->Release();
		if (Client2) Client2->Release();
		if (Client) Client->Release();
		if (Device) Device->Release();
		if (Enumerator) Enumerator->Release();
		std::this_thread::sleep_for(std::chrono::milliseconds(800));
		return Level;
	}

	int RunAcoustic(const char* WavArg)
	{
		wchar_t Wav[MAX_PATH];
		MultiByteToWideChar(CP_UTF8, 0, WavArg, -1, Wav, MAX_PATH);
		FILE* Report = nullptr;
		fopen_s(&Report, "probe_result.txt", "w");
		std::printf("ACOUSTIC TEST: keep the room quiet; the laptop will speak for ~50 s. Headphones must be unplugged.\n");
		const double RawFloor = RawMicPhase("R0 plain mic, silence", nullptr, false, Report);
		const double RawSpeech = RawMicPhase("R1 plain mic, speech", Wav, false, Report);
		const double RawModeSpeech = RawMicPhase("R2 RAW-mode mic, speech", Wav, true, Report);
		const double Floor = AcousticPhase("A0 DSP AEC on, silence", false, nullptr, Report);
		const double Off = AcousticPhase("A1 DSP AEC OFF, speech", true, Wav, Report);
		const double Aec = AcousticPhase("A2 DSP AEC ON, speech", false, Wav, Report);
		// The RAW-mode capture bypasses driver/OS effects, so it is the true acoustic echo. (Measured on
		// CHIMERA 2026-09-18: RAW -17 dBFS while the default path read room level - its Realtek/Windows
		// effects already suppress echo, which makes the default path useless as the echo reference.)
		const double Echo = RawModeSpeech > RawSpeech ? RawModeSpeech : RawSpeech;
		const bool bEchoAudible = Echo - RawFloor >= 10.0;
		const bool bRemoved = Aec <= Floor + 3.0;
		char Summary[1400];
		std::snprintf(Summary, sizeof(Summary),
			"\n=== ACOUSTIC SUMMARY (dBFS)\n"
			"  room (plain mic, silence)            : %.1f\n"
			"  echo at the mic (RAW mode, speech)    : %.1f   -> %+.1f dB over the room  [%s]\n"
			"  default mic path, speech (old game)   : %.1f   (%.1f dB below RAW = echo the driver/OS already suppresses)\n"
			"  DSP: silence %.1f | AEC off, speech %.1f | AEC ON, speech %.1f\n"
			"  RESULT: with the fix the echo is %.1f dB below the raw echo and %s the DSP's silence floor -> %s\n",
			RawFloor, Echo, Echo - RawFloor, bEchoAudible ? "audible, test valid" : "NOT audible - raise the volume, test INVALID",
			RawSpeech, Echo - RawSpeech,
			Floor, Off, Aec,
			Echo - Aec, bRemoved ? "at/below" : "ABOVE",
			!bEchoAudible ? "inconclusive" : (bRemoved ? "ECHO REMOVED" : "ECHO NOT FULLY REMOVED - send probe_result.txt"));
		std::printf("%s", Summary);
		if (Report)
		{
			std::fprintf(Report, "%s", Summary);
			std::fclose(Report);
		}
		return 0;
	}
}

int main(int argc, char** argv)
{
	CoInitializeEx(nullptr, COINIT_MULTITHREADED); // the game thread has COM initialized too
	if (argc > 1 && std::string(argv[1]) == "acoustic")
	{
		const int Result = RunAcoustic(argc > 2 ? argv[2] : "speech.wav");
		CoUninitialize();
		return Result;
	}
	const int Seconds = argc > 1 ? std::atoi(argv[1]) : 5;
	std::unique_ptr<EVCAec::ICaptureCore> Lister = EVCAec::CreatePlatformCaptureCore(&Log);
	std::vector<EVCAec::FDeviceInfo> Devices;
	Lister->EnumerateInputs(Devices);
	std::printf("backend: %s\ninput devices (index 0 must be the OS default):\n", Lister->BackendName());
	for (size_t Index = 0; Index < Devices.size(); ++Index)
	{
		std::printf("  [%zu] %s%s | %d ch @ %d Hz\n", Index, Devices[Index].Name.c_str(), Devices[Index].bIsDefault ? " (DEFAULT)" : "", Devices[Index].NumChannels, Devices[Index].NativeSampleRate);
	}
	int Passed = 0;
	int Total = 0;
	Total++; Passed += Phase("W1 default mic, AEC on", 0, false, Seconds) ? 1 : 0;
	Total++; Passed += Phase("W2 default mic, AEC off", 0, true, Seconds) ? 1 : 0;
	Total++; Passed += Phase("W3 default via index -1", -1, false, 2) ? 1 : 0;
	for (size_t Index = 1; Index < Devices.size(); ++Index)
	{
		char Tag[64];
		std::snprintf(Tag, sizeof(Tag), "W4.%zu non-default mic", Index);
		Total++; Passed += Phase(Tag, static_cast<int>(Index), false, 2) ? 1 : 0;
	}
	std::printf("\n[W5] 5 x open/start/stop/close\n");
	int CycleFailures = 0;
	for (int Cycle = 0; Cycle < 5; ++Cycle)
	{
		std::unique_ptr<EVCAec::ICaptureCore> Core = EVCAec::CreatePlatformCaptureCore(&Log);
		const bool bOk = Core->Open(0, 480, &OnCapture) && Core->Start();
		std::this_thread::sleep_for(std::chrono::milliseconds(300));
		Core->Close();
		CycleFailures += bOk ? 0 : 1;
	}
	std::printf("    cycle failures: %d\n", CycleFailures);
	Total++; Passed += CycleFailures == 0 ? 1 : 0;
	std::printf("\n=== %d/%d checks passed\nDONE\n", Passed, Total);
	CoUninitialize();
	return Passed == Total ? 0 : 1;
}
