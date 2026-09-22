// probe_mac_perm.mm - blocks until the user answers the microphone permission prompt.
#import <AVFoundation/AVFoundation.h>

extern "C" bool EVCProbeRequestMicrophone(void)
{
	AVAuthorizationStatus Status = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio];
	fprintf(stderr, "microphone authorization status at start: %ld (0=not determined, 1=restricted, 2=denied, 3=authorized)\n", (long)Status);
	if (Status == AVAuthorizationStatusNotDetermined)
	{
		dispatch_semaphore_t Done = dispatch_semaphore_create(0);
		__block BOOL bGranted = NO;
		[AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio completionHandler:^(BOOL bOk) { bGranted = bOk; dispatch_semaphore_signal(Done); }];
		dispatch_semaphore_wait(Done, dispatch_time(DISPATCH_TIME_NOW, 180 * NSEC_PER_SEC));
		return bGranted;
	}
	return Status == AVAuthorizationStatusAuthorized;
}
