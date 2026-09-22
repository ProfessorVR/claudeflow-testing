#!/usr/bin/env python3
"""Speaker selection support in the staged EmbeddedVoiceChat AEC sources (voice-aec-fix/EmbeddedVoiceChat):
  - ICaptureCore::SetRenderEndpoint(): the speakers the echo canceller uses as its reference.
  - Windows core: binds the Voice Capture DSP (and its silent keep-alive) to that endpoint, falling back to the
    default render device; a change triggers the same rebind path as a Windows device change.
Idempotent; keeps each file's line endings."""
import pathlib
import sys

ROOT = pathlib.Path("/home/dalton/projects/claudeflow-testing/plans/MacOS_UE_Fix/voice-aec-fix/EmbeddedVoiceChat")


def patch(rel, edits):
    p = ROOT / rel
    raw = p.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    s = raw.replace("\r\n", "\n")
    for old, new, marker in edits:
        if marker in s:
            continue
        if s.count(old) != 1:
            sys.exit(f"{rel}: anchor not found exactly once: {old[:70]!r}")
        s = s.replace(old, new)
    p.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
    print("patched", rel)


patch("Private/AEC/EVCCaptureCore.h", [(
    """		virtual void SetAsyncFailureHandler(FFailureFn /*Handler*/) {}""",
    """		virtual void SetAsyncFailureHandler(FFailureFn /*Handler*/) {}
		// The speakers the game plays on, used as the echo reference: the platform endpoint ID (Windows: IMMDevice
		// ID, UTF-8). Empty = the system default. Thread-safe; a running core rebinds. The Mac core ignores it:
		// VoiceProcessingIO always uses the system default output, which the Mac speaker selection changes.
		virtual void SetRenderEndpoint(const std::string& /*EndpointId*/) {}""",
    "SetRenderEndpoint")])

patch("Private/Windows/EVCCaptureCore_Windows.cpp", [
    ("""	std::string Narrow(const wchar_t* Wide)""",
     """	std::wstring Widen(const std::string& Utf8)
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
		std::wstring Out(static_cast<size_t>(Needed), L'\\0');
		MultiByteToWideChar(CP_UTF8, 0, Utf8.c_str(), static_cast<int>(Utf8.size()), &Out[0], Needed);
		return Out;
	}

	std::string Narrow(const wchar_t* Wide)""",
     "std::wstring Widen(const std::string& Utf8)"),
    ("""		bool IsRunning() const override { return bRunning.load(); }""",
     """		bool IsRunning() const override { return bRunning.load(); }

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
		}""",
     "void SetRenderEndpoint(const std::string& EndpointId) override"),
    ("""		// Worker thread. Binds the DSP to the chosen microphone and the default render device.
		bool StartDsp(IMMDeviceEnumerator* Enumerator)""",
     """		// The speakers the game plays on (SetRenderEndpoint), else the default render device.
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
		bool StartDsp(IMMDeviceEnumerator* Enumerator)""",
     "const FEndpoint* ChooseRender(const std::vector<FEndpoint>& Renders) const"),
    ("""			if (Renders.empty() || !Renders[0].Info.bIsDefault)
			{
				Emit(ELogLevel::Error, "Voice Capture DSP: no default render device to use as the echo reference");
				return false;
			}
			const FEndpoint& Render = Renders[0];""",
     """			const FEndpoint* RenderChoice = ChooseRender(Renders);
			if (!RenderChoice)
			{
				Emit(ELogLevel::Error, "Voice Capture DSP: no render device to use as the echo reference");
				return false;
			}
			const FEndpoint& Render = *RenderChoice;""",
     "const FEndpoint* RenderChoice = ChooseRender(Renders);"),
    ("""			const bool bRenderMoved = !Renders.empty() && Renders[0].Info.bIsDefault && Renders[0].WideId != BoundRenderId;""",
     """			const FEndpoint* WantedRender = ChooseRender(Renders);
			const bool bRenderMoved = WantedRender && WantedRender->WideId != BoundRenderId;""",
     "const FEndpoint* WantedRender = ChooseRender(Renders);"),
    ("""				const bool bChanged = Notifications && Notifications->Consume();""",
     """				const bool bDeviceEvent = Notifications && Notifications->Consume();
				const bool bChanged = bRenderPreferenceChanged.exchange(false) || bDeviceEvent;""",
     "const bool bDeviceEvent = Notifications && Notifications->Consume();"),
    ("""		std::wstring BoundRenderId;       // worker thread only""",
     """		std::wstring BoundRenderId;       // worker thread only
		std::wstring PreferredRenderId;   // guarded by StateMutex; empty = the default render device
		std::atomic<bool> bRenderPreferenceChanged{ false };""",
     "std::wstring PreferredRenderId;"),
])
