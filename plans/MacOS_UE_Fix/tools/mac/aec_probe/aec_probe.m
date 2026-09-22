// aec_probe.m — does macOS VoiceProcessingIO cancel audio played by a DIFFERENT output unit?
//
// Written 2026-09-18 for the awsTutorial voice-echo fix. UE's Mac mixer plays through its own
// kAudioUnitSubType_DefaultOutput unit (AudioMixerPlatformCoreAudio.cpp:131); the capture fix
// would use a separate VoiceProcessingIO unit for input. If VPIO's echo canceller only references
// audio rendered through VPIO itself, the port would "turn AEC on" and cancel nothing.
//
// Method: a raw HAL input unit records the built-in mic for the whole run (acoustic truth, includes
// any ducking). Per phase, a VPIO unit records the same mic while speech plays from the built-in
// speakers, either from another process (afplay) or from an in-process DefaultOutput unit (= UE).
// delta = VPIO level - raw level. Bypass phases give the baseline delta; the AEC attenuation is
// (VP-on delta) - (bypass delta). AGC is off so gain doesn't masquerade as cancellation. The test
// signal is speech (not noise) so the noise suppressor can't masquerade as cancellation either.
//
// Usage (inside AECProbe.app so TCC can grant the microphone):
//   open -W -n AECProbe.app --args <result.txt> <speech.aiff>

#import <AVFoundation/AVFoundation.h>
#include <AudioToolbox/AudioToolbox.h>
#include <CoreAudio/CoreAudio.h>
#include <math.h>
#include <pthread.h>
#include <signal.h>
#include <spawn.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

extern char **environ;

static FILE *gOut;
#define LOG(...) do { fprintf(gOut, __VA_ARGS__); fflush(gOut); } while (0)

// ---------------------------------------------------------------- measurement
typedef struct { double sumsq; long n; long nonzero; } Acc;
static pthread_mutex_t gMx = PTHREAD_MUTEX_INITIALIZER;
static Acc gRaw, gVp;
static volatile int gMeasuring;

static void acc_add(Acc *a, const float *x, UInt32 n)
{
    double s = 0; long nz = 0;
    for (UInt32 i = 0; i < n; i++) { s += (double)x[i] * x[i]; if (x[i] != 0.0f) nz++; }
    pthread_mutex_lock(&gMx);
    if (gMeasuring) { a->sumsq += s; a->n += n; }
    a->nonzero += nz;
    pthread_mutex_unlock(&gMx);
}
static double acc_db(Acc a) { return (a.n == 0 || a.sumsq <= 0) ? -200.0 : 10.0 * log10(a.sumsq / a.n); }

static AudioStreamBasicDescription mono(double rate)
{
    AudioStreamBasicDescription f = {0};
    f.mSampleRate = rate; f.mFormatID = kAudioFormatLinearPCM;
    f.mFormatFlags = kAudioFormatFlagsNativeFloatPacked;
    f.mChannelsPerFrame = 1; f.mBitsPerChannel = 32; f.mBytesPerFrame = 4;
    f.mFramesPerPacket = 1; f.mBytesPerPacket = 4;
    return f;
}

// ---------------------------------------------------------------- devices
static AudioDeviceID gMic, gSpk, gOldIn, gOldOut;

static AudioDeviceID get_default(AudioObjectPropertySelector sel)
{
    AudioObjectPropertyAddress a = { sel, kAudioObjectPropertyScopeGlobal, kAudioObjectPropertyElementMain };
    AudioDeviceID d = 0; UInt32 sz = sizeof(d);
    AudioObjectGetPropertyData(kAudioObjectSystemObject, &a, 0, NULL, &sz, &d);
    return d;
}
static OSStatus set_default(AudioObjectPropertySelector sel, AudioDeviceID d)
{
    AudioObjectPropertyAddress a = { sel, kAudioObjectPropertyScopeGlobal, kAudioObjectPropertyElementMain };
    return AudioObjectSetPropertyData(kAudioObjectSystemObject, &a, 0, NULL, sizeof(d), &d);
}
static void dev_name(AudioDeviceID d, char *buf, size_t n)
{
    AudioObjectPropertyAddress a = { kAudioObjectPropertyName, kAudioObjectPropertyScopeGlobal, kAudioObjectPropertyElementMain };
    CFStringRef s = NULL; UInt32 sz = sizeof(s);
    buf[0] = 0;
    if (AudioObjectGetPropertyData(d, &a, 0, NULL, &sz, &s) == noErr && s) { CFStringGetCString(s, buf, n, kCFStringEncodingUTF8); CFRelease(s); }
}
static UInt32 stream_count(AudioDeviceID d, AudioObjectPropertyScope scope)
{
    AudioObjectPropertyAddress a = { kAudioDevicePropertyStreams, scope, kAudioObjectPropertyElementMain };
    UInt32 sz = 0;
    return AudioObjectGetPropertyDataSize(d, &a, 0, NULL, &sz) == noErr ? sz / sizeof(AudioStreamID) : 0;
}
static double nominal_rate(AudioDeviceID d)
{
    AudioObjectPropertyAddress a = { kAudioDevicePropertyNominalSampleRate, kAudioObjectPropertyScopeGlobal, kAudioObjectPropertyElementMain };
    Float64 r = 0; UInt32 sz = sizeof(r);
    AudioObjectGetPropertyData(d, &a, 0, NULL, &sz, &r);
    return r;
}
static void find_builtin(void)
{
    AudioObjectPropertyAddress a = { kAudioHardwarePropertyDevices, kAudioObjectPropertyScopeGlobal, kAudioObjectPropertyElementMain };
    UInt32 sz = 0;
    AudioObjectGetPropertyDataSize(kAudioObjectSystemObject, &a, 0, NULL, &sz);
    int n = sz / sizeof(AudioDeviceID);
    AudioDeviceID *ids = calloc(n, sizeof(AudioDeviceID));
    AudioObjectGetPropertyData(kAudioObjectSystemObject, &a, 0, NULL, &sz, ids);
    for (int i = 0; i < n; i++) {
        AudioObjectPropertyAddress t = { kAudioDevicePropertyTransportType, kAudioObjectPropertyScopeGlobal, kAudioObjectPropertyElementMain };
        UInt32 tt = 0, tsz = sizeof(tt);
        AudioObjectGetPropertyData(ids[i], &t, 0, NULL, &tsz, &tt);
        char nm[256]; dev_name(ids[i], nm, sizeof nm);
        UInt32 ni = stream_count(ids[i], kAudioObjectPropertyScopeInput), no = stream_count(ids[i], kAudioObjectPropertyScopeOutput);
        LOG("  device %u  '%s'  transport=%.4s  in-streams=%u out-streams=%u  rate=%.0f\n",
            (unsigned)ids[i], nm, (char *)&tt, ni, no, nominal_rate(ids[i]));
        if (tt == kAudioDeviceTransportTypeBuiltIn) {
            if (ni > 0 && !gMic) gMic = ids[i];
            if (no > 0 && !gSpk) gSpk = ids[i];
        }
    }
    free(ids);
}
static void restore_defaults(void)
{
    if (gOldIn)  set_default(kAudioHardwarePropertyDefaultInputDevice, gOldIn);
    if (gOldOut) set_default(kAudioHardwarePropertyDefaultOutputDevice, gOldOut);
}

// ---------------------------------------------------------------- capture units
typedef struct { AudioUnit unit; Acc *acc; UInt32 bus; float buf[16384]; } Cap;

static OSStatus cap_cb(void *ref, AudioUnitRenderActionFlags *flags, const AudioTimeStamp *ts, UInt32 bus, UInt32 nframes, AudioBufferList *io)
{
    Cap *c = (Cap *)ref;
    if (nframes > 16384) nframes = 16384;
    AudioBufferList abl; abl.mNumberBuffers = 1;
    abl.mBuffers[0].mNumberChannels = 1;
    abl.mBuffers[0].mDataByteSize = nframes * sizeof(float);
    abl.mBuffers[0].mData = c->buf;
    if (AudioUnitRender(c->unit, flags, ts, 1, nframes, &abl) == noErr) acc_add(c->acc, c->buf, nframes);
    return noErr;
}
static OSStatus silence_cb(void *ref, AudioUnitRenderActionFlags *flags, const AudioTimeStamp *ts, UInt32 bus, UInt32 nframes, AudioBufferList *io)
{
    for (UInt32 i = 0; i < io->mNumberBuffers; i++) memset(io->mBuffers[i].mData, 0, io->mBuffers[i].mDataByteSize);
    *flags |= kAudioUnitRenderAction_OutputIsSilence;
    return noErr;
}

#define CHK(expr, what) do { OSStatus _s = (expr); if (_s != noErr) { LOG("    !! %s failed: %d\n", what, (int)_s); return _s; } } while (0)

static OSStatus make_raw(Cap *c)
{
    AudioComponentDescription d = { kAudioUnitType_Output, kAudioUnitSubType_HALOutput, kAudioUnitManufacturer_Apple, 0, 0 };
    UInt32 one = 1, zero = 0;
    CHK(AudioComponentInstanceNew(AudioComponentFindNext(NULL, &d), &c->unit), "raw new");
    CHK(AudioUnitSetProperty(c->unit, kAudioOutputUnitProperty_EnableIO, kAudioUnitScope_Input, 1, &one, 4), "raw enable in");
    CHK(AudioUnitSetProperty(c->unit, kAudioOutputUnitProperty_EnableIO, kAudioUnitScope_Output, 0, &zero, 4), "raw disable out");
    CHK(AudioUnitSetProperty(c->unit, kAudioOutputUnitProperty_CurrentDevice, kAudioUnitScope_Global, 0, &gMic, sizeof gMic), "raw device");
    AudioStreamBasicDescription f = mono(nominal_rate(gMic));
    CHK(AudioUnitSetProperty(c->unit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Output, 1, &f, sizeof f), "raw format");
    AURenderCallbackStruct cb = { cap_cb, c };
    CHK(AudioUnitSetProperty(c->unit, kAudioOutputUnitProperty_SetInputCallback, kAudioUnitScope_Global, 0, &cb, sizeof cb), "raw callback");
    CHK(AudioUnitInitialize(c->unit), "raw init");
    CHK(AudioOutputUnitStart(c->unit), "raw start");
    return noErr;
}

static OSStatus make_vpio(Cap *c, int bypass, int outEnabled)
{
    AudioComponentDescription d = { kAudioUnitType_Output, kAudioUnitSubType_VoiceProcessingIO, kAudioUnitManufacturer_Apple, 0, 0 };
    UInt32 one = 1, zero = 0, en = outEnabled ? 1 : 0, byp = bypass ? 1 : 0;
    CHK(AudioComponentInstanceNew(AudioComponentFindNext(NULL, &d), &c->unit), "vpio new");
    CHK(AudioUnitSetProperty(c->unit, kAudioOutputUnitProperty_EnableIO, kAudioUnitScope_Input, 1, &one, 4), "vpio enable in");
    CHK(AudioUnitSetProperty(c->unit, kAudioOutputUnitProperty_EnableIO, kAudioUnitScope_Output, 0, &en, 4), "vpio enable/disable out");
    AudioStreamBasicDescription f = mono(48000);
    CHK(AudioUnitSetProperty(c->unit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Output, 1, &f, sizeof f), "vpio in format");
    if (outEnabled) {
        CHK(AudioUnitSetProperty(c->unit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Input, 0, &f, sizeof f), "vpio out format");
        AURenderCallbackStruct rcb = { silence_cb, c };
        CHK(AudioUnitSetProperty(c->unit, kAudioUnitProperty_SetRenderCallback, kAudioUnitScope_Input, 0, &rcb, sizeof rcb), "vpio render cb");
    }
    AURenderCallbackStruct cb = { cap_cb, c };
    CHK(AudioUnitSetProperty(c->unit, kAudioOutputUnitProperty_SetInputCallback, kAudioUnitScope_Global, 1, &cb, sizeof cb), "vpio callback");
    CHK(AudioUnitInitialize(c->unit), "vpio init");
    CHK(AudioUnitSetProperty(c->unit, kAUVoiceIOProperty_VoiceProcessingEnableAGC, kAudioUnitScope_Global, 1, &zero, 4), "vpio agc off");
    CHK(AudioUnitSetProperty(c->unit, kAUVoiceIOProperty_BypassVoiceProcessing, kAudioUnitScope_Global, 1, &byp, 4), "vpio bypass");
#if defined(MAC_OS_VERSION_14_0) && MAC_OS_X_VERSION_MAX_ALLOWED >= MAC_OS_VERSION_14_0
    if (@available(macOS 14.0, *)) {
        AUVoiceIOOtherAudioDuckingConfiguration dk = { .mEnableAdvancedDucking = false, .mDuckingLevel = kAUVoiceIOOtherAudioDuckingLevelMin };
        OSStatus s = AudioUnitSetProperty(c->unit, kAUVoiceIOProperty_OtherAudioDuckingConfiguration, kAudioUnitScope_Global, 0, &dk, sizeof dk);
        if (s) LOG("    (ducking config not applied: %d)\n", (int)s);
    }
#endif
    CHK(AudioOutputUnitStart(c->unit), "vpio start");
    AudioDeviceID din = 0, dout = 0; UInt32 sz = sizeof din;
    AudioUnitGetProperty(c->unit, kAudioOutputUnitProperty_CurrentDevice, kAudioUnitScope_Global, 1, &din, &sz); sz = sizeof dout;
    AudioUnitGetProperty(c->unit, kAudioOutputUnitProperty_CurrentDevice, kAudioUnitScope_Global, 0, &dout, &sz);
    char a[256], b[256]; dev_name(din, a, sizeof a); dev_name(dout, b, sizeof b);
    LOG("    vpio devices: in=%u '%s'  out=%u '%s'\n", (unsigned)din, a, (unsigned)dout, b);
    return noErr;
}
static void kill_unit(Cap *c)
{
    if (!c->unit) return;
    AudioOutputUnitStop(c->unit); AudioUnitUninitialize(c->unit); AudioComponentInstanceDispose(c->unit); c->unit = NULL;
}

// ---------------------------------------------------------------- players
static float *gSpeech; static UInt32 gSpeechN, gPos;
static AudioUnit gPlay;
static const char *gSpeechPath;

static OSStatus play_cb(void *ref, AudioUnitRenderActionFlags *flags, const AudioTimeStamp *ts, UInt32 bus, UInt32 nframes, AudioBufferList *io)
{
    float *o = (float *)io->mBuffers[0].mData;
    for (UInt32 i = 0; i < nframes; i++) { o[i] = gSpeech[gPos++]; if (gPos >= gSpeechN) gPos = 0; }
    for (UInt32 b = 1; b < io->mNumberBuffers; b++) memcpy(io->mBuffers[b].mData, o, nframes * sizeof(float));
    return noErr;
}
static int load_speech(void)
{
    CFURLRef url = CFURLCreateFromFileSystemRepresentation(NULL, (const UInt8 *)gSpeechPath, strlen(gSpeechPath), false);
    ExtAudioFileRef f = NULL;
    if (ExtAudioFileOpenURL(url, &f) != noErr) { CFRelease(url); return 0; }
    CFRelease(url);
    AudioStreamBasicDescription cf = mono(48000);
    ExtAudioFileSetProperty(f, kExtAudioFileProperty_ClientDataFormat, sizeof cf, &cf);
    UInt32 cap = 48000 * 60; gSpeech = calloc(cap, sizeof(float)); gSpeechN = 0;
    for (;;) {
        UInt32 n = 4096; if (gSpeechN + n > cap) break;
        AudioBufferList abl; abl.mNumberBuffers = 1; abl.mBuffers[0].mNumberChannels = 1;
        abl.mBuffers[0].mDataByteSize = n * 4; abl.mBuffers[0].mData = gSpeech + gSpeechN;
        if (ExtAudioFileRead(f, &n, &abl) != noErr || n == 0) break;
        gSpeechN += n;
    }
    ExtAudioFileDispose(f);
    return gSpeechN > 0;
}
static OSStatus start_inproc(void)
{
    AudioComponentDescription d = { kAudioUnitType_Output, kAudioUnitSubType_DefaultOutput, kAudioUnitManufacturer_Apple, 0, 0 };
    CHK(AudioComponentInstanceNew(AudioComponentFindNext(NULL, &d), &gPlay), "play new");
    AudioStreamBasicDescription f = mono(48000);
    CHK(AudioUnitSetProperty(gPlay, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Input, 0, &f, sizeof f), "play format");
    AURenderCallbackStruct cb = { play_cb, NULL };
    CHK(AudioUnitSetProperty(gPlay, kAudioUnitProperty_SetRenderCallback, kAudioUnitScope_Input, 0, &cb, sizeof cb), "play cb");
    gPos = 0;
    CHK(AudioUnitInitialize(gPlay), "play init");
    CHK(AudioOutputUnitStart(gPlay), "play start");
    return noErr;
}
static void stop_inproc(void) { if (gPlay) { AudioOutputUnitStop(gPlay); AudioUnitUninitialize(gPlay); AudioComponentInstanceDispose(gPlay); gPlay = NULL; } }

static pid_t gAfplay;
static void start_afplay(void)
{
    char *argv[] = { "afplay", (char *)gSpeechPath, NULL };
    if (posix_spawn(&gAfplay, "/usr/bin/afplay", NULL, NULL, argv, environ) != 0) gAfplay = 0;
}
static void stop_afplay(void) { if (gAfplay > 0) { kill(gAfplay, SIGTERM); waitpid(gAfplay, NULL, 0); gAfplay = 0; } }

// ---------------------------------------------------------------- phases
enum { P_NONE, P_AFPLAY, P_INPROC };
static const char *pname[] = { "none", "afplay(other process)", "in-process DefaultOutput" };

static void phase(const char *tag, int useVpio, int bypass, int outEnabled, int player)
{
    LOG("\n[%s] vpio=%s bypass=%d vpio-output=%s player=%s\n", tag, useVpio ? "yes" : "no", bypass,
        outEnabled ? "ENABLED(silent)" : "disabled", pname[player]);
    Cap vp; memset(&vp, 0, sizeof vp); vp.acc = &gVp;
    if (useVpio && make_vpio(&vp, bypass, outEnabled) != noErr) { kill_unit(&vp); LOG("    PHASE SKIPPED\n"); return; }
    usleep(800000);
    if (player == P_AFPLAY) start_afplay();
    if (player == P_INPROC && start_inproc() != noErr) { stop_inproc(); kill_unit(&vp); LOG("    PHASE SKIPPED\n"); return; }
    usleep(2500000);                       // playback under way, AEC converging
    pthread_mutex_lock(&gMx); memset(&gRaw, 0, sizeof gRaw); memset(&gVp, 0, sizeof gVp); gMeasuring = 1; pthread_mutex_unlock(&gMx);
    usleep(5000000);                       // 5 s measurement window
    pthread_mutex_lock(&gMx); gMeasuring = 0; Acc r = gRaw, v = gVp; pthread_mutex_unlock(&gMx);
    stop_afplay(); stop_inproc(); kill_unit(&vp);
    double rd = acc_db(r), vd = acc_db(v);
    if (useVpio) LOG("    RESULT raw=%7.1f dBFS  vpio=%7.1f dBFS  delta(vpio-raw)=%7.1f dB   [raw n=%ld, vpio n=%ld]\n", rd, vd, vd - rd, r.n, v.n);
    else         LOG("    RESULT raw=%7.1f dBFS   [raw n=%ld]\n", rd, r.n);
    usleep(1000000);
}

static void on_signal(int s) { stop_afplay(); restore_defaults(); _exit(1); }

int main(int argc, char **argv)
{
    @autoreleasepool {
        gOut = fopen(argc > 1 ? argv[1] : "/tmp/aecprobe/result.txt", "w");
        if (!gOut) gOut = stderr;
        gSpeechPath = argc > 2 ? argv[2] : "/tmp/aecprobe/speech.aiff";
        signal(SIGINT, on_signal); signal(SIGTERM, on_signal);

        LOG("AEC probe — %s\n", [[[NSDate date] description] UTF8String]);
        AVAuthorizationStatus st = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio];
        if (st == AVAuthorizationStatusNotDetermined) {
            LOG("microphone permission: not determined — requesting (click Allow on the Mac)\n");
            dispatch_semaphore_t sem = dispatch_semaphore_create(0);
            __block BOOL granted = NO;
            [AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio completionHandler:^(BOOL g) { granted = g; dispatch_semaphore_signal(sem); }];
            dispatch_semaphore_wait(sem, dispatch_time(DISPATCH_TIME_NOW, 180 * NSEC_PER_SEC));
            st = granted ? AVAuthorizationStatusAuthorized : AVAuthorizationStatusDenied;
        }
        LOG("microphone permission: %s\n", st == AVAuthorizationStatusAuthorized ? "AUTHORIZED" : "NOT AUTHORIZED — results invalid");
        if (st != AVAuthorizationStatusAuthorized) return 2;

        if (!load_speech()) { LOG("!! could not load %s\n", gSpeechPath); return 3; }
        LOG("speech: %.1f s\n", gSpeechN / 48000.0);

        LOG("devices:\n");
        find_builtin();
        if (!gMic || !gSpk) { LOG("!! built-in mic/speakers not found\n"); return 4; }
        gOldIn = get_default(kAudioHardwarePropertyDefaultInputDevice);
        gOldOut = get_default(kAudioHardwarePropertyDefaultOutputDevice);
        char a[256], b[256], c2[256], d2[256];
        dev_name(gOldIn, a, sizeof a); dev_name(gOldOut, b, sizeof b); dev_name(gMic, c2, sizeof c2); dev_name(gSpk, d2, sizeof d2);
        LOG("defaults before: in='%s' out='%s'  → switching to in='%s' out='%s' (restored at exit)\n", a, b, c2, d2);
        set_default(kAudioHardwarePropertyDefaultInputDevice, gMic);
        set_default(kAudioHardwarePropertyDefaultOutputDevice, gSpk);
        usleep(1500000);

        Cap raw; memset(&raw, 0, sizeof raw); raw.acc = &gRaw;
        if (make_raw(&raw) != noErr) { restore_defaults(); return 5; }
        usleep(1000000);

        phase("P0 raw floor",                          0, 0, 0, P_NONE);
        phase("P1 bypass, out off, afplay",            1, 1, 0, P_AFPLAY);
        phase("P2 VP ON,  out off, afplay",            1, 0, 0, P_AFPLAY);
        phase("P3 VP ON,  out ON,  afplay",            1, 0, 1, P_AFPLAY);
        phase("P4 bypass, out off, in-process",        1, 1, 0, P_INPROC);
        phase("P5 VP ON,  out off, in-process",        1, 0, 0, P_INPROC);
        phase("P6 VP ON,  out ON,  in-process",        1, 0, 1, P_INPROC);
        phase("P7 VP ON,  out off, silence (vp floor)", 1, 0, 0, P_NONE);

        kill_unit(&raw);
        restore_defaults();
        LOG("\ndefaults restored. raw nonzero samples seen: %ld\nDONE\n", gRaw.nonzero);
    }
    return 0;
}
