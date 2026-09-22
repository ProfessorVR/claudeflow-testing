// probe_mac.cpp - drives the SHIPPING Mac core (Private/Mac/EVCCaptureCore_Mac.cpp) outside Unreal.
// Speech plays through a separate kAudioUnitSubType_DefaultOutput unit (exactly how UE's mixer plays),
// while the core captures the default input the way the game does. Requires the Mac's default input
// and output to be the built-in mic and speakers (AirPods in their case).
//
//   probe_mac <result.txt> <speech.aiff>      (run inside an .app bundle so TCC grants the microphone)

#include "AEC/EVCCaptureCore.h"

#include <AudioToolbox/AudioToolbox.h>
#include <CoreAudio/CoreAudio.h>

#include <atomic>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <mutex>
#include <string>
#include <unistd.h>
#include <vector>

extern "C" bool EVCProbeRequestMicrophone(void); // probe_mac_perm.mm

static FILE* GOut = stdout;
#define OUT(...) do { std::fprintf(GOut, __VA_ARGS__); std::fflush(GOut); } while (0)

static std::vector<float> GSpeech;
static std::atomic<size_t> GPos{ 0 };

static bool LoadSpeech(const char* Path)
{
	CFURLRef Url = CFURLCreateFromFileSystemRepresentation(nullptr, reinterpret_cast<const UInt8*>(Path), static_cast<CFIndex>(std::strlen(Path)), false);
	ExtAudioFileRef File = nullptr;
	const OSStatus Status = ExtAudioFileOpenURL(Url, &File);
	CFRelease(Url);
	if (Status != noErr)
	{
		return false;
	}
	AudioStreamBasicDescription Client;
	std::memset(&Client, 0, sizeof(Client));
	Client.mSampleRate = 48000; Client.mFormatID = kAudioFormatLinearPCM; Client.mFormatFlags = kAudioFormatFlagsNativeFloatPacked;
	Client.mChannelsPerFrame = 1; Client.mBitsPerChannel = 32; Client.mBytesPerFrame = 4; Client.mFramesPerPacket = 1; Client.mBytesPerPacket = 4;
	ExtAudioFileSetProperty(File, kExtAudioFileProperty_ClientDataFormat, sizeof(Client), &Client);
	float Chunk[4096];
	for (;;)
	{
		UInt32 Frames = 4096;
		AudioBufferList List;
		List.mNumberBuffers = 1; List.mBuffers[0].mNumberChannels = 1; List.mBuffers[0].mDataByteSize = sizeof(Chunk); List.mBuffers[0].mData = Chunk;
		if (ExtAudioFileRead(File, &Frames, &List) != noErr || Frames == 0)
		{
			break;
		}
		GSpeech.insert(GSpeech.end(), Chunk, Chunk + Frames);
	}
	ExtAudioFileDispose(File);
	return !GSpeech.empty();
}

static OSStatus PlayProc(void*, AudioUnitRenderActionFlags*, const AudioTimeStamp*, UInt32, UInt32 NumFrames, AudioBufferList* Data)
{
	float* Out = static_cast<float*>(Data->mBuffers[0].mData);
	size_t Pos = GPos.load();
	for (UInt32 Index = 0; Index < NumFrames; ++Index)
	{
		Out[Index] = GSpeech[Pos++];
		if (Pos >= GSpeech.size())
		{
			Pos = 0;
		}
	}
	GPos = Pos;
	for (UInt32 Buffer = 1; Buffer < Data->mNumberBuffers; ++Buffer)
	{
		std::memcpy(Data->mBuffers[Buffer].mData, Out, NumFrames * sizeof(float));
	}
	return noErr;
}

static AudioUnit GPlayer = nullptr;
static bool StartPlayer()
{
	AudioComponentDescription Desc = { kAudioUnitType_Output, kAudioUnitSubType_DefaultOutput, kAudioUnitManufacturer_Apple, 0, 0 };
	if (AudioComponentInstanceNew(AudioComponentFindNext(nullptr, &Desc), &GPlayer) != noErr)
	{
		return false;
	}
	AudioStreamBasicDescription Format;
	std::memset(&Format, 0, sizeof(Format));
	Format.mSampleRate = 48000; Format.mFormatID = kAudioFormatLinearPCM; Format.mFormatFlags = kAudioFormatFlagsNativeFloatPacked;
	Format.mChannelsPerFrame = 1; Format.mBitsPerChannel = 32; Format.mBytesPerFrame = 4; Format.mFramesPerPacket = 1; Format.mBytesPerPacket = 4;
	AURenderCallbackStruct Callback = { &PlayProc, nullptr };
	GPos = 0;
	return AudioUnitSetProperty(GPlayer, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Input, 0, &Format, sizeof(Format)) == noErr
		&& AudioUnitSetProperty(GPlayer, kAudioUnitProperty_SetRenderCallback, kAudioUnitScope_Input, 0, &Callback, sizeof(Callback)) == noErr
		&& AudioUnitInitialize(GPlayer) == noErr
		&& AudioOutputUnitStart(GPlayer) == noErr;
}
static void StopPlayer()
{
	if (GPlayer)
	{
		AudioOutputUnitStop(GPlayer);
		AudioUnitUninitialize(GPlayer);
		AudioComponentInstanceDispose(GPlayer);
		GPlayer = nullptr;
	}
}

struct FStats
{
	std::mutex Mutex;
	double SumSq = 0.0;
	long long Samples = 0;
	long long Callbacks = 0;
	long long WrongSize = 0;
	bool bMeasuring = false;
};
static FStats GStats;

static void OnCapture(const float* Samples, int NumFrames)
{
	double Sum = 0.0;
	for (int Index = 0; Index < NumFrames; ++Index)
	{
		Sum += static_cast<double>(Samples[Index]) * Samples[Index];
	}
	std::lock_guard<std::mutex> Lock(GStats.Mutex);
	++GStats.Callbacks;
	if (NumFrames != 480)
	{
		++GStats.WrongSize;
	}
	if (GStats.bMeasuring)
	{
		GStats.SumSq += Sum;
		GStats.Samples += NumFrames;
	}
}

static double Db(double SumSq, long long Samples)
{
	return (Samples <= 0 || SumSq <= 0.0) ? -200.0 : 10.0 * std::log10(SumSq / static_cast<double>(Samples));
}

static void Log(EVCAec::ELogLevel Level, const std::string& Message)
{
	OUT("    [core %s] %s\n", Level == EVCAec::ELogLevel::Error ? "ERROR" : Level == EVCAec::ELogLevel::Warning ? "warn" : "info", Message.c_str());
}

struct FResult
{
	double Level = -200.0;
	long long Callbacks = 0;
	long long WrongSize = 0;
	double Seconds = 0.0;
};

static FResult Phase(const char* Tag, bool bBypass, bool bAgc, bool bPlay)
{
	OUT("\n[%s] bypass=%d agc=%d playback=%s\n", Tag, bBypass ? 1 : 0, bAgc ? 1 : 0, bPlay ? "speech via separate DefaultOutput unit" : "silence");
	FResult Result;
	EVCAec::FOptions Options;
	Options.bBypassVoiceProcessing = bBypass;
	Options.bAutomaticGainControl = bAgc;
	std::unique_ptr<EVCAec::ICaptureCore> Core = EVCAec::CreatePlatformCaptureCore(&Log, Options);
	if (!Core || !Core->Open(0, 480, &OnCapture) || !Core->Start())
	{
		OUT("    PHASE FAILED to open/start\n");
		return Result;
	}
	{
		std::lock_guard<std::mutex> Lock(GStats.Mutex);
		GStats.SumSq = 0; GStats.Samples = 0; GStats.Callbacks = 0; GStats.WrongSize = 0; GStats.bMeasuring = false;
	}
	usleep(800000);
	if (bPlay && !StartPlayer())
	{
		OUT("    player failed\n");
	}
	usleep(2500000);
	{
		std::lock_guard<std::mutex> Lock(GStats.Mutex);
		GStats.SumSq = 0; GStats.Samples = 0; GStats.Callbacks = 0; GStats.WrongSize = 0; GStats.bMeasuring = true;
	}
	usleep(5000000);
	{
		std::lock_guard<std::mutex> Lock(GStats.Mutex);
		GStats.bMeasuring = false;
		Result.Level = Db(GStats.SumSq, GStats.Samples);
		Result.Callbacks = GStats.Callbacks;
		Result.WrongSize = GStats.WrongSize;
		Result.Seconds = GStats.Samples / 48000.0;
	}
	StopPlayer();
	Core->Stop();
	Core->Close();
	OUT("    RESULT level=%7.1f dBFS | %lld callbacks in 5 s (%.2f s of audio), %lld not 480 frames\n", Result.Level, Result.Callbacks, Result.Seconds, Result.WrongSize);
	usleep(800000);
	return Result;
}

// Timing mode: Open() must return at once (VoiceProcessingIO is created in the background), capture must
// begin after Start() once creation finishes, and Close() during creation must be safe.
static std::atomic<long long> GTimingCallbacks{ 0 };
static std::atomic<long long> GFirstCallbackUs{ -1 };
static std::chrono::steady_clock::time_point GT0;
static void OnTimingCapture(const float* /*Samples*/, int NumFrames)
{
	if (GTimingCallbacks.fetch_add(1) == 0)
	{
		GFirstCallbackUs = std::chrono::duration_cast<std::chrono::microseconds>(std::chrono::steady_clock::now() - GT0).count();
	}
	(void)NumFrames;
}
static double MsSince(std::chrono::steady_clock::time_point T)
{
	return std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - T).count();
}
static int RunTiming()
{
	int Failures = 0;
	for (int Round = 0; Round < 2; ++Round)
	{
		std::unique_ptr<EVCAec::ICaptureCore> Core = EVCAec::CreatePlatformCaptureCore(&Log);
		GTimingCallbacks = 0;
		GFirstCallbackUs = -1;
		GT0 = std::chrono::steady_clock::now();
		const bool bOpened = Core->Open(0, 480, &OnTimingCapture);
		const double OpenMs = MsSince(GT0);
		const bool bStarted = Core->Start();
		const bool bRunningEarly = Core->IsRunning();
		usleep(5000000);
		const long long Count = GTimingCallbacks.load();
		const double FirstMs = GFirstCallbackUs.load() / 1000.0;
		Core->Stop();
		const auto TClose = std::chrono::steady_clock::now();
		Core->Close();
		OUT("[T%d] Open() returned %s in %.1f ms; Start()=%d; IsRunning() right after Start()=%d; first callback %.0f ms after Open; %lld callbacks in 5 s; Close %.1f ms\n",
			Round, bOpened ? "true" : "FALSE", OpenMs, bStarted ? 1 : 0, bRunningEarly ? 1 : 0, FirstMs, Count, MsSince(TClose));
		Failures += (bOpened && OpenMs < 200.0 && Count > 150) ? 0 : 1;
	}
	{
		std::unique_ptr<EVCAec::ICaptureCore> Core = EVCAec::CreatePlatformCaptureCore(&Log);
		const auto T = std::chrono::steady_clock::now();
		Core->Open(0, 480, &OnTimingCapture);
		Core->Start();
		usleep(100000);
		const auto TClose = std::chrono::steady_clock::now();
		Core->Close();
		OUT("[T-close-early] Close() 100 ms after Open() took %.1f ms (waits for the background creation); total %.1f ms\n", MsSince(TClose), MsSince(T));
	}
	{
		std::unique_ptr<EVCAec::ICaptureCore> Core = EVCAec::CreatePlatformCaptureCore(&Log);
		Core->Open(0, 480, &OnTimingCapture);
		const auto T = std::chrono::steady_clock::now();
		Core.reset(); // destroy immediately: the queued creation must find the core gone
		OUT("[T-destroy-now] destroying right after Open() took %.1f ms\n", MsSince(T));
		usleep(3500000); // let the orphaned creation job run; a use-after-free would crash here
		OUT("[T-destroy-now] survived the queued creation job\n");
	}
	OUT("timing checks failed: %d\n", Failures);
	return Failures;
}

int main(int argc, char** argv)
{
	if (argc > 1 && std::string(argv[1]) == "timing")
	{
		return RunTiming();
	}
	if (argc > 1)
	{
		FILE* File = std::fopen(argv[1], "w");
		if (File)
		{
			GOut = File;
		}
	}
	const char* SpeechPath = argc > 2 ? argv[2] : "/tmp/aecprobe/speech.aiff";
	if (!EVCProbeRequestMicrophone())
	{
		OUT("!! microphone permission not granted - results would be silence\n");
		return 2;
	}
	OUT("microphone permission: AUTHORIZED\n");
	if (!LoadSpeech(SpeechPath))
	{
		OUT("!! cannot load %s\n", SpeechPath);
		return 1;
	}
	std::unique_ptr<EVCAec::ICaptureCore> Lister = EVCAec::CreatePlatformCaptureCore(&Log);
	std::vector<EVCAec::FDeviceInfo> Devices;
	Lister->EnumerateInputs(Devices);
	OUT("backend: %s\ninput devices (index 0 must be the OS default):\n", Lister->BackendName());
	for (size_t Index = 0; Index < Devices.size(); ++Index)
	{
		OUT("  [%zu] %s%s | %d ch @ %d Hz | %s\n", Index, Devices[Index].Name.c_str(), Devices[Index].bIsDefault ? " (DEFAULT)" : "", Devices[Index].NumChannels, Devices[Index].NativeSampleRate, Devices[Index].Id.c_str());
	}

	const FResult Floor = Phase("S0 shipping config, silence", false, true, false);
	const FResult Bypass = Phase("S1 bypass, AGC off, speech", true, false, true);
	const FResult Aec = Phase("S2 AEC on, AGC off, speech", false, false, true);
	const FResult Ship = Phase("S3 SHIPPING (AEC on, AGC on), speech", false, true, true);

	OUT("\n[S4] robustness: 3 x open/start/stop/close, then Start/Stop toggling\n");
	int Failures = 0;
	for (int Cycle = 0; Cycle < 3; ++Cycle)
	{
		std::unique_ptr<EVCAec::ICaptureCore> Core = EVCAec::CreatePlatformCaptureCore(&Log);
		const bool bOk = Core->Open(0, 480, &OnCapture) && Core->Start();
		usleep(300000);
		Core->Stop();
		Core->Start();
		usleep(200000);
		Core->Close();
		Failures += bOk ? 0 : 1;
	}
	OUT("    cycles failed: %d\n", Failures);

	OUT("\n=== SUMMARY (dBFS, delivered 48 kHz mono)\n");
	OUT("  S0 shipping, silence            %7.1f\n", Floor.Level);
	OUT("  S1 bypass, speech (raw echo)    %7.1f\n", Bypass.Level);
	OUT("  S2 AEC, AGC off, speech         %7.1f   -> echo removed: %.1f dB\n", Aec.Level, Bypass.Level - Aec.Level);
	OUT("  S3 SHIPPING, speech             %7.1f   -> above shipping silence floor by %.1f dB\n", Ship.Level, Ship.Level - Floor.Level);
	OUT("  block size: %s\n", (Floor.WrongSize + Bypass.WrongSize + Aec.WrongSize + Ship.WrongSize) == 0 ? "all callbacks exactly 480 frames" : "SOME CALLBACKS NOT 480 FRAMES");
	OUT("DONE\n");
	return 0;
}
