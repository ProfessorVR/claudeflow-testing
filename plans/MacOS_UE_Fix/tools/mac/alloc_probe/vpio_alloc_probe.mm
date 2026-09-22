// vpio_alloc_probe.mm — does Apple's VoiceProcessingIO survive a process that replaces the global C++ allocator?
//
// Reproduces, outside Unreal, the crash seen on macOS 26.5.2 (lab MacBook Pro, 2026-09-21): the game replaces the
// global operator new/delete (Unreal's FMemory), dyld coalesces every framework's weak libc++ operators onto the
// executable's, and Apple's VoiceProcessor (vp::vx::database::v1::Database::load) frees a block through
// operator delete[] that was never allocated by operator new[] — a fatal in the engine's allocator.
//
// build_and_run.sh builds this source twice:
//   probe_visible : the replacement operators are exported (as in the Unreal executable today), so frameworks bind
//                   to them. Expect FOREIGN FREE lines during AudioUnitInitialize (the game's crash, survived here by
//                   forwarding to free()) and/or AudioComponentInstanceDispose (the macOS 15 quit crash).
//   probe_hidden  : the same code linked with -unexported_symbols_list so operator new/delete are NOT exported; dyld
//                   cannot coalesce frameworks onto them and Apple's code keeps libc++'s allocator. Expect zero
//                   foreign frees and a clean initialize / start / stop / uninitialize / dispose.
// The counters are what matters: any FOREIGN FREE in probe_hidden means the approach does not work.

#import <AudioToolbox/AudioToolbox.h>
#import <CoreAudio/CoreAudio.h>
#import <Foundation/Foundation.h>
#include <malloc/malloc.h>
#include <atomic>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <new>
#include <unordered_set>
#include <mutex>

#ifndef VARIANT_NAME
#define VARIANT_NAME "unnamed variant"
#endif

namespace
{
	// Every pointer we hand out is tagged, so "ours" vs "foreign" is unambiguous. The set's own nodes come from raw
	// malloc (RawAlloc), never from the operator new being replaced - otherwise insert() would re-enter ProbeAlloc
	// while GMutex is held and deadlock (which is exactly what the first version of this probe did).
	template <class T> struct RawAlloc
	{
		using value_type = T;
		RawAlloc() = default;
		template <class U> RawAlloc(const RawAlloc<U>&) {}
		T* allocate(size_t N) { return static_cast<T*>(malloc(N * sizeof(T))); }
		void deallocate(T* P, size_t) { free(P); }
		template <class U> bool operator==(const RawAlloc<U>&) const { return true; }
		template <class U> bool operator!=(const RawAlloc<U>&) const { return false; }
	};
	using FPtrSet = std::unordered_set<void*, std::hash<void*>, std::equal_to<void*>, RawAlloc<void*>>;
	std::mutex GMutex;
	FPtrSet* GOurs = nullptr;
	std::atomic<long> GNews{0}, GDeletes{0}, GForeign{0};

	void* ProbeAlloc(size_t Size)
	{
		void* P = malloc(Size ? Size : 1);
		std::lock_guard<std::mutex> Lock(GMutex);
		if (!GOurs) { GOurs = new (malloc(sizeof(FPtrSet))) FPtrSet(); }
		GOurs->insert(P);
		GNews.fetch_add(1);
		return P;
	}
	void ProbeFree(void* P)
	{
		if (!P) return;
		bool bOurs = false;
		{
			std::lock_guard<std::mutex> Lock(GMutex);
			if (GOurs && GOurs->erase(P)) bOurs = true;
		}
		GDeletes.fetch_add(1);
		if (!bOurs)
		{
			GForeign.fetch_add(1);
			fprintf(stderr, "  FOREIGN FREE %p (system malloc zone: %s)\n", P, malloc_zone_from_ptr(P) ? "yes" : "no");
		}
		free(P);
	}
}

// The same 24 forms Unreal replaces (ModuleBoilerplate.h).
void* operator new(size_t S) { return ProbeAlloc(S); }
void* operator new[](size_t S) { return ProbeAlloc(S); }
void* operator new(size_t S, const std::nothrow_t&) noexcept { return ProbeAlloc(S); }
void* operator new[](size_t S, const std::nothrow_t&) noexcept { return ProbeAlloc(S); }
void* operator new(size_t S, std::align_val_t) { return ProbeAlloc(S); }
void* operator new[](size_t S, std::align_val_t) { return ProbeAlloc(S); }
void* operator new(size_t S, std::align_val_t, const std::nothrow_t&) noexcept { return ProbeAlloc(S); }
void* operator new[](size_t S, std::align_val_t, const std::nothrow_t&) noexcept { return ProbeAlloc(S); }
void operator delete(void* P) noexcept { ProbeFree(P); }
void operator delete[](void* P) noexcept { ProbeFree(P); }
void operator delete(void* P, const std::nothrow_t&) noexcept { ProbeFree(P); }
void operator delete[](void* P, const std::nothrow_t&) noexcept { ProbeFree(P); }
void operator delete(void* P, size_t) noexcept { ProbeFree(P); }
void operator delete[](void* P, size_t) noexcept { ProbeFree(P); }
void operator delete(void* P, size_t, const std::nothrow_t&) noexcept { ProbeFree(P); }
void operator delete[](void* P, size_t, const std::nothrow_t&) noexcept { ProbeFree(P); }
void operator delete(void* P, std::align_val_t) noexcept { ProbeFree(P); }
void operator delete[](void* P, std::align_val_t) noexcept { ProbeFree(P); }
void operator delete(void* P, std::align_val_t, const std::nothrow_t&) noexcept { ProbeFree(P); }
void operator delete[](void* P, std::align_val_t, const std::nothrow_t&) noexcept { ProbeFree(P); }
void operator delete(void* P, size_t, std::align_val_t) noexcept { ProbeFree(P); }
void operator delete[](void* P, size_t, std::align_val_t) noexcept { ProbeFree(P); }
void operator delete(void* P, size_t, std::align_val_t, const std::nothrow_t&) noexcept { ProbeFree(P); }
void operator delete[](void* P, size_t, std::align_val_t, const std::nothrow_t&) noexcept { ProbeFree(P); }

static void Report(const char* Stage)
{
	fprintf(stderr, "[%s] new=%ld delete=%ld foreign=%ld\n", Stage, GNews.load(), GDeletes.load(), GForeign.load());
}

static OSStatus Silence(void*, AudioUnitRenderActionFlags* Flags, const AudioTimeStamp*, UInt32, UInt32, AudioBufferList* Data)
{
	for (UInt32 i = 0; i < Data->mNumberBuffers; ++i) memset(Data->mBuffers[i].mData, 0, Data->mBuffers[i].mDataByteSize);
	*Flags |= kAudioUnitRenderAction_OutputIsSilence;
	return noErr;
}
static OSStatus Input(void*, AudioUnitRenderActionFlags*, const AudioTimeStamp*, UInt32, UInt32, AudioBufferList*) { return noErr; }

int main()
{
	fprintf(stderr, "variant: %s\n", VARIANT_NAME);
	// Something C++ in a framework first, to see whether frameworks bind to us at all.
	@autoreleasepool { NSMutableArray* A = [NSMutableArray array]; [A addObject:@"x"]; }
	Report("after Foundation warm-up");

	AudioComponentDescription Desc = { kAudioUnitType_Output, kAudioUnitSubType_VoiceProcessingIO, kAudioUnitManufacturer_Apple, 0, 0 };
	AudioComponent Comp = AudioComponentFindNext(nullptr, &Desc);
	if (!Comp) { fprintf(stderr, "no VoiceProcessingIO component\n"); return 2; }
	AudioUnit Unit = nullptr;
	OSStatus St = AudioComponentInstanceNew(Comp, &Unit);
	fprintf(stderr, "AudioComponentInstanceNew: %d\n", (int)St);
	Report("after InstanceNew");
	if (St != noErr) return 3;

	const UInt32 Enable = 1;
	AudioUnitSetProperty(Unit, kAudioOutputUnitProperty_EnableIO, kAudioUnitScope_Input, 1, &Enable, sizeof(Enable));
	AudioUnitSetProperty(Unit, kAudioOutputUnitProperty_EnableIO, kAudioUnitScope_Output, 0, &Enable, sizeof(Enable));
	AudioStreamBasicDescription Mono = {};
	Mono.mSampleRate = 48000; Mono.mFormatID = kAudioFormatLinearPCM; Mono.mFormatFlags = kAudioFormatFlagsNativeFloatPacked;
	Mono.mChannelsPerFrame = 1; Mono.mBitsPerChannel = 32; Mono.mBytesPerFrame = 4; Mono.mFramesPerPacket = 1; Mono.mBytesPerPacket = 4;
	AudioUnitSetProperty(Unit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Output, 1, &Mono, sizeof(Mono));
	AudioUnitSetProperty(Unit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Input, 0, &Mono, sizeof(Mono));
	AURenderCallbackStruct R = { &Silence, nullptr }, C = { &Input, nullptr };
	AudioUnitSetProperty(Unit, kAudioUnitProperty_SetRenderCallback, kAudioUnitScope_Input, 0, &R, sizeof(R));
	AudioUnitSetProperty(Unit, kAudioOutputUnitProperty_SetInputCallback, kAudioUnitScope_Global, 1, &C, sizeof(C));

	St = AudioUnitInitialize(Unit);                 // <- where the game dies on macOS 26 (VoiceProcessorCreate)
	fprintf(stderr, "AudioUnitInitialize: %d\n", (int)St);
	Report("after Initialize");
	if (St == noErr)
	{
		St = AudioOutputUnitStart(Unit);
		fprintf(stderr, "AudioOutputUnitStart: %d\n", (int)St);
		[NSThread sleepForTimeInterval:1.0];
		AudioOutputUnitStop(Unit);
		Report("after Start/Stop");
		AudioUnitUninitialize(Unit);
		Report("after Uninitialize");
	}
	AudioComponentInstanceDispose(Unit);            // <- where the game died on macOS 15 (VAD3 teardown)
	Report("after Dispose");
	fprintf(stderr, "RESULT: %s\n", GForeign.load() == 0 ? "no foreign frees - this variant is safe" : "FOREIGN FREES SEEN - this variant would crash Unreal");
	return 0;
}
