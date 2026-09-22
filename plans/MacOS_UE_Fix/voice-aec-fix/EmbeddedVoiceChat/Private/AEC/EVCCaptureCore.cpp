// EVCCaptureCore.cpp - platforms without an echo-cancelling core (iOS, Android, Linux, servers)
// return nullptr, and the plugin keeps using the engine's capture back-end there.

#include "AEC/EVCCaptureCore.h"

#if !EVC_AEC_MAC && !EVC_AEC_WINDOWS

namespace EVCAec
{
	std::unique_ptr<ICaptureCore> CreatePlatformCaptureCore(FLogFn /*Log*/, const FOptions& /*Options*/)
	{
		return nullptr;
	}
}

#endif
