// aec_probe2.m — v2 of the macOS VoiceProcessingIO echo-cancellation probe (2026-09-18).
//
// v1 findings: (1) VPIO with its output bus DISABLED fails AudioUnitInitialize on macOS (-10875),
// so the iOS AudioCaptureAudioUnit code cannot work on Mac as written; (2) switching the system
// default devices raced AirPods auto-switching and invalidated phases.
//
// v2: never touches system defaults. Every unit is bound to an explicit device: built-in mic and
// built-in speakers. VPIO output is always ENABLED. Playback of the speech file goes either through
// a SEPARATE HAL output unit bound to the speakers (what UE's mixer is) or through VPIO's OWN output
// bus (positive control: the canonical AEC path). A raw HAL input unit on the built-in mic runs the
// whole time to show (a) whether VPIO alters the raw mic and (b) whether VPIO ducks the separate
// unit's playback. AGC off. 5 s measurement windows after 2.5 s of playback.
//
//   open -W -n AECProbe2.app --args <result.txt> <speech.aiff>

#import <AVFoundation/AVFoundation.h>
#include <AudioToolbox/AudioToolbox.h>
#include <CoreAudio/CoreAudio.h>
#include <math.h>
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static FILE *gOut;
#define LOG(...) do { fprintf(gOut, __VA_ARGS__); fflush(gOut); } while (0)

typedef struct { double sumsq; long n; } Acc;
static pthread_mutex_t gMx = PTHREAD_MUTEX_INITIALIZER;
static Acc gRaw, gVp;
static volatile int gMeasuring;

static void acc_add(Acc *a, const float *x, UInt32 n)
{
    double s = 0;
    for (UInt32 i = 0; i < n; i++) s += (double)x[i] * x[i];
    pthread_mutex_lock(&gMx);
    if (gMeasuring) { a->sumsq += s; a->n += n; }
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

static AudioDeviceID gMic, gSpk;
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
static float out_volume(AudioDeviceID d)
{
    AudioObjectPropertyAddress a = { kAudioDevicePropertyVolumeScalar, kAudioObjectPropertyScopeOutput, kAudioObjectPropertyElementMain };
    Float32 v = -1; UInt32 sz = sizeof v;
    if (AudioObjectGetPropertyData(d, &a, 0, NULL, &sz, &v) != noErr) { a.mElement = 1; sz = sizeof v; AudioObjectGetPropertyData(d, &a, 0, NULL, &sz, &v); }
    return v;
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
        if (tt != kAudioDeviceTransportTypeBuiltIn) continue;
        if (stream_count(ids[i], kAudioObjectPropertyScopeInput) > 0 && !gMic) gMic = ids[i];
        if (stream_count(ids[i], kAudioObjectPropertyScopeOutput) > 0 && !gSpk) gSpk = ids[i];
    }
    free(ids);
}

// ------------------------------------------------------------------ speech source
static float *gSpeech; static UInt32 gSpeechN;
static volatile UInt32 gPos;
static int load_speech(const char *path)
{
    CFURLRef url = CFURLCreateFromFileSystemRepresentation(NULL, (const UInt8 *)path, strlen(path), false);
    ExtAudioFileRef f = NULL;
    OSStatus st = ExtAudioFileOpenURL(url, &f); CFRelease(url);
    if (st != noErr) return 0;
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
static void fill_speech(AudioBufferList *io, UInt32 nframes)
{
    float *o = (float *)io->mBuffers[0].mData;
    UInt32 p = gPos;
    for (UInt32 i = 0; i < nframes; i++) { o[i] = gSpeech[p++]; if (p >= gSpeechN) p = 0; }
    gPos = p;
    for (UInt32 b = 1; b < io->mNumberBuffers; b++) memcpy(io->mBuffers[b].mData, o, nframes * sizeof(float));
}

// ------------------------------------------------------------------ units
typedef struct { AudioUnit unit; Acc *acc; int ownPlayback; float buf[16384]; } Cap;

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
static OSStatus vpio_out_cb(void *ref, AudioUnitRenderActionFlags *flags, const AudioTimeStamp *ts, UInt32 bus, UInt32 nframes, AudioBufferList *io)
{
    Cap *c = (Cap *)ref;
    if (c->ownPlayback) { fill_speech(io, nframes); return noErr; }
    for (UInt32 i = 0; i < io->mNumberBuffers; i++) memset(io->mBuffers[i].mData, 0, io->mBuffers[i].mDataByteSize);
    *flags |= kAudioUnitRenderAction_OutputIsSilence;
    return noErr;
}
static OSStatus play_cb(void *ref, AudioUnitRenderActionFlags *flags, const AudioTimeStamp *ts, UInt32 bus, UInt32 nframes, AudioBufferList *io)
{
    fill_speech(io, nframes);
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

static AudioUnit gPlay;
static OSStatus start_player(void)
{
    AudioComponentDescription d = { kAudioUnitType_Output, kAudioUnitSubType_HALOutput, kAudioUnitManufacturer_Apple, 0, 0 };
    CHK(AudioComponentInstanceNew(AudioComponentFindNext(NULL, &d), &gPlay), "play new");
    CHK(AudioUnitSetProperty(gPlay, kAudioOutputUnitProperty_CurrentDevice, kAudioUnitScope_Global, 0, &gSpk, sizeof gSpk), "play device");
    AudioStreamBasicDescription f = mono(48000);
    CHK(AudioUnitSetProperty(gPlay, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Input, 0, &f, sizeof f), "play format");
    AURenderCallbackStruct cb = { play_cb, NULL };
    CHK(AudioUnitSetProperty(gPlay, kAudioUnitProperty_SetRenderCallback, kAudioUnitScope_Input, 0, &cb, sizeof cb), "play cb");
    CHK(AudioUnitInitialize(gPlay), "play init");
    CHK(AudioOutputUnitStart(gPlay), "play start");
    return noErr;
}
static void stop_player(void) { if (gPlay) { AudioOutputUnitStop(gPlay); AudioUnitUninitialize(gPlay); AudioComponentInstanceDispose(gPlay); gPlay = NULL; } }

static OSStatus make_vpio(Cap *c, int bypass)
{
    AudioComponentDescription d = { kAudioUnitType_Output, kAudioUnitSubType_VoiceProcessingIO, kAudioUnitManufacturer_Apple, 0, 0 };
    UInt32 one = 1, zero = 0, byp = bypass ? 1 : 0;
    CHK(AudioComponentInstanceNew(AudioComponentFindNext(NULL, &d), &c->unit), "vpio new");
    CHK(AudioUnitSetProperty(c->unit, kAudioOutputUnitProperty_EnableIO, kAudioUnitScope_Input, 1, &one, 4), "vpio enable in");
    CHK(AudioUnitSetProperty(c->unit, kAudioOutputUnitProperty_EnableIO, kAudioUnitScope_Output, 0, &one, 4), "vpio enable out");
    CHK(AudioUnitSetProperty(c->unit, kAudioOutputUnitProperty_CurrentDevice, kAudioUnitScope_Global, 1, &gMic, sizeof gMic), "vpio in device");
    CHK(AudioUnitSetProperty(c->unit, kAudioOutputUnitProperty_CurrentDevice, kAudioUnitScope_Global, 0, &gSpk, sizeof gSpk), "vpio out device");
    AudioStreamBasicDescription f = mono(48000);
    CHK(AudioUnitSetProperty(c->unit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Output, 1, &f, sizeof f), "vpio in format");
    CHK(AudioUnitSetProperty(c->unit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Input, 0, &f, sizeof f), "vpio out format");
    AURenderCallbackStruct rcb = { vpio_out_cb, c };
    CHK(AudioUnitSetProperty(c->unit, kAudioUnitProperty_SetRenderCallback, kAudioUnitScope_Input, 0, &rcb, sizeof rcb), "vpio render cb");
    AURenderCallbackStruct cb = { cap_cb, c };
    CHK(AudioUnitSetProperty(c->unit, kAudioOutputUnitProperty_SetInputCallback, kAudioUnitScope_Global, 1, &cb, sizeof cb), "vpio callback");
    CHK(AudioUnitInitialize(c->unit), "vpio init");
    CHK(AudioUnitSetProperty(c->unit, kAUVoiceIOProperty_VoiceProcessingEnableAGC, kAudioUnitScope_Global, 1, &zero, 4), "vpio agc off");
    CHK(AudioUnitSetProperty(c->unit, kAUVoiceIOProperty_BypassVoiceProcessing, kAudioUnitScope_Global, 1, &byp, 4), "vpio bypass");
    if (@available(macOS 14.0, *)) {
        AUVoiceIOOtherAudioDuckingConfiguration dk = { .mEnableAdvancedDucking = false, .mDuckingLevel = kAUVoiceIOOtherAudioDuckingLevelMin };
        OSStatus s = AudioUnitSetProperty(c->unit, kAUVoiceIOProperty_OtherAudioDuckingConfiguration, kAudioUnitScope_Global, 0, &dk, sizeof dk);
        LOG("    ducking=Min %s (%d)\n", s == noErr ? "applied" : "NOT applied", (int)s);
    }
    CHK(AudioOutputUnitStart(c->unit), "vpio start");
    AudioDeviceID din = 0, dout = 0; UInt32 sz = sizeof din;
    AudioUnitGetProperty(c->unit, kAudioOutputUnitProperty_CurrentDevice, kAudioUnitScope_Global, 1, &din, &sz); sz = sizeof dout;
    AudioUnitGetProperty(c->unit, kAudioOutputUnitProperty_CurrentDevice, kAudioUnitScope_Global, 0, &dout, &sz);
    char a[256], b[256]; dev_name(din, a, sizeof a); dev_name(dout, b, sizeof b);
    LOG("    vpio bound: in=%u '%s'  out=%u '%s'\n", (unsigned)din, a, (unsigned)dout, b);
    return noErr;
}
static void kill_unit(Cap *c)
{
    if (!c->unit) return;
    AudioOutputUnitStop(c->unit); AudioUnitUninitialize(c->unit); AudioComponentInstanceDispose(c->unit); c->unit = NULL;
}

enum { V_NONE, V_BYPASS, V_ON };
enum { PL_NONE, PL_SEPARATE, PL_VPIO_OWN };
static const char *vname[] = { "no VPIO", "VPIO bypass", "VPIO ON" };
static const char *plname[] = { "silence", "SEPARATE HAL unit (=UE mixer)", "VPIO's OWN output (control)" };

typedef struct { const char *tag; double raw, vp; int vpio; } Row;
static Row gRows[16]; static int gNRows;

static void phase(const char *tag, int vmode, int player)
{
    LOG("\n[%s] %s, playback: %s\n", tag, vname[vmode], plname[player]);
    Cap vp; memset(&vp, 0, sizeof vp); vp.acc = &gVp; vp.ownPlayback = (player == PL_VPIO_OWN);
    gPos = 0;
    if (vmode != V_NONE && make_vpio(&vp, vmode == V_BYPASS) != noErr) { kill_unit(&vp); LOG("    PHASE SKIPPED\n"); return; }
    usleep(800000);
    if (player == PL_SEPARATE && start_player() != noErr) { stop_player(); kill_unit(&vp); LOG("    PHASE SKIPPED\n"); return; }
    usleep(2500000);
    pthread_mutex_lock(&gMx); memset(&gRaw, 0, sizeof gRaw); memset(&gVp, 0, sizeof gVp); gMeasuring = 1; pthread_mutex_unlock(&gMx);
    usleep(5000000);
    pthread_mutex_lock(&gMx); gMeasuring = 0; Acc r = gRaw, v = gVp; pthread_mutex_unlock(&gMx);
    stop_player(); kill_unit(&vp);
    Row *row = &gRows[gNRows++]; row->tag = tag; row->raw = acc_db(r); row->vp = acc_db(v); row->vpio = vmode != V_NONE;
    if (row->vpio) LOG("    RESULT raw=%7.1f dBFS   vpio=%7.1f dBFS\n", row->raw, row->vp);
    else           LOG("    RESULT raw=%7.1f dBFS\n", row->raw);
    usleep(1000000);
}

int main(int argc, char **argv)
{
    @autoreleasepool {
        gOut = fopen(argc > 1 ? argv[1] : "/tmp/aecprobe/result2.txt", "w");
        if (!gOut) gOut = stderr;
        const char *speech = argc > 2 ? argv[2] : "/tmp/aecprobe/speech.aiff";
        LOG("AEC probe v2 — %s\n", [[[NSDate date] description] UTF8String]);
        AVAuthorizationStatus st = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio];
        if (st == AVAuthorizationStatusNotDetermined) {
            LOG("microphone permission: requesting (click Allow on the Mac)\n");
            dispatch_semaphore_t sem = dispatch_semaphore_create(0);
            __block BOOL granted = NO;
            [AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio completionHandler:^(BOOL g) { granted = g; dispatch_semaphore_signal(sem); }];
            dispatch_semaphore_wait(sem, dispatch_time(DISPATCH_TIME_NOW, 180 * NSEC_PER_SEC));
            st = granted ? AVAuthorizationStatusAuthorized : AVAuthorizationStatusDenied;
        }
        LOG("microphone permission: %s\n", st == AVAuthorizationStatusAuthorized ? "AUTHORIZED" : "NOT AUTHORIZED");
        if (st != AVAuthorizationStatusAuthorized) return 2;
        if (!load_speech(speech)) { LOG("!! could not load %s\n", speech); return 3; }
        find_builtin();
        if (!gMic || !gSpk) { LOG("!! built-in mic/speakers not found\n"); return 4; }
        char a[256], b[256]; dev_name(gMic, a, sizeof a); dev_name(gSpk, b, sizeof b);
        LOG("speech %.1f s | mic=%u '%s' @%.0f | speakers=%u '%s' volume=%.2f (system defaults untouched)\n",
            gSpeechN / 48000.0, (unsigned)gMic, a, nominal_rate(gMic), (unsigned)gSpk, b, out_volume(gSpk));

        Cap raw; memset(&raw, 0, sizeof raw); raw.acc = &gRaw;
        if (make_raw(&raw) != noErr) return 5;
        usleep(1000000);

        phase("Q0", V_NONE,   PL_NONE);
        phase("Q1", V_NONE,   PL_SEPARATE);
        phase("Q2", V_BYPASS, PL_NONE);
        phase("Q3", V_BYPASS, PL_SEPARATE);
        phase("Q4", V_ON,     PL_NONE);
        phase("Q5", V_ON,     PL_SEPARATE);
        phase("Q6", V_BYPASS, PL_VPIO_OWN);
        phase("Q7", V_ON,     PL_VPIO_OWN);
        phase("Q8", V_NONE,   PL_NONE);
        kill_unit(&raw);

        LOG("\n=== SUMMARY (dBFS)\n");
        LOG("  Q0 no VPIO,    silence        raw floor        %7.1f\n", gRows[0].raw);
        LOG("  Q1 no VPIO,    separate play  raw acoustic     %7.1f   (playback %+.1f dB over floor)\n", gRows[1].raw, gRows[1].raw - gRows[0].raw);
        LOG("  Q2 VPIO byp,   silence        raw %7.1f  vpio %7.1f\n", gRows[2].raw, gRows[2].vp);
        LOG("  Q3 VPIO byp,   separate play  raw %7.1f  vpio %7.1f\n", gRows[3].raw, gRows[3].vp);
        LOG("  Q4 VPIO ON,    silence        raw %7.1f  vpio %7.1f\n", gRows[4].raw, gRows[4].vp);
        LOG("  Q5 VPIO ON,    separate play  raw %7.1f  vpio %7.1f\n", gRows[5].raw, gRows[5].vp);
        LOG("  Q6 VPIO byp,   own-output     raw %7.1f  vpio %7.1f\n", gRows[6].raw, gRows[6].vp);
        LOG("  Q7 VPIO ON,    own-output     raw %7.1f  vpio %7.1f\n", gRows[7].raw, gRows[7].vp);
        LOG("  Q8 no VPIO,    silence        raw floor again  %7.1f\n", gRows[8].raw);
        LOG("\n  ducking of separate playback (raw Q1 - raw Q5)      : %6.1f dB\n", gRows[1].raw - gRows[5].raw);
        LOG("  separate-unit echo removed (vpio Q3 - vpio Q5)      : %6.1f dB   (vpio floor Q4 %.1f)\n", gRows[3].vp - gRows[5].vp, gRows[4].vp);
        LOG("  own-output echo removed    (vpio Q6 - vpio Q7)      : %6.1f dB   [positive control]\n", gRows[6].vp - gRows[7].vp);
        LOG("DONE\n");
    }
    return 0;
}
