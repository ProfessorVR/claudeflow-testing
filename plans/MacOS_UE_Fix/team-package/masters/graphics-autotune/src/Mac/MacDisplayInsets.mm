// MacDisplayInsets.mm - the macOS screen insets the window repair needs, read from AppKit instead of measured
// constants (2026-09-21). The engine's FDisplayMetrics puts Cocoa's bottom-left visibleFrame origin (the Dock's
// height) into PrimaryDisplayWorkAreaRect.Top, so it cannot be used for this; the lab MacBook Pro (Dock 146 px)
// showed the Air's constant (120 px) leaving the game's bottom edge under the Dock.
//
// Panel matrix (2026-09-21 evening): also the left/right strips (a side Dock, Stage Manager), the camera housing
// (safeAreaInsets.top) and the physical panel behind the current mode. Every Apple laptop from the 13.3" M1 Air to the
// 16" MacBook Pro offers "scaled" modes whose virtual framebuffer (frame x backingScaleFactor, which is what Slate and
// the Metal drawable use) is larger than the panel - the 13.6" Air's factory default 1470x956 draws 2940x1912 onto
// 2560x1664. The panel comes from the display's largest non-HiDPI mode (CGDisplayModeGetPixelWidth == width), which is
// the only place Core Graphics still reports it: CGDisplayPixelsWide returns points on these systems (measured).
//
// Compiled on Apple platforms only (UBT skips .mm elsewhere); the header is guarded by PLATFORM_MAC.

#include "../MacDisplayInsets.h" // the module root is not on the include path for a file in a subfolder

#if PLATFORM_MAC

#import <AppKit/AppKit.h>
#import <CoreGraphics/CoreGraphics.h>

namespace
{
    // The panel lookup walks the display-mode list, which is not free; cache it per display and current mode.
    struct FPanelCacheEntry
    {
        CGDirectDisplayID Display = 0;
        int32 ModeWidthPx = 0;      // the mode this answer was computed for (virtual pixels)
        int32 ModeHeightPx = 0;
        int32 PanelWidth = 0;
        int32 PanelHeight = 0;
    };
    FPanelCacheEntry GPanelCache;

    void LookupPanel(CGDirectDisplayID Display, int32 ModeWidthPx, int32 ModeHeightPx, int32& OutWidth, int32& OutHeight)
    {
        if (GPanelCache.Display == Display && GPanelCache.ModeWidthPx == ModeWidthPx && GPanelCache.ModeHeightPx == ModeHeightPx && GPanelCache.PanelWidth > 0)
        {
            OutWidth = GPanelCache.PanelWidth;
            OutHeight = GPanelCache.PanelHeight;
            return;
        }
        OutWidth = 0;
        OutHeight = 0;
        // The 1x ("low resolution") modes are only listed with this option; the largest of them is the panel.
        CFDictionaryRef Options = (__bridge CFDictionaryRef)@{ (__bridge NSString*)kCGDisplayShowDuplicateLowResolutionModes : @YES };
        CFArrayRef Modes = CGDisplayCopyAllDisplayModes(Display, Options);
        if (Modes)
        {
            const CFIndex Count = CFArrayGetCount(Modes);
            for (CFIndex Index = 0; Index < Count; ++Index)
            {
                CGDisplayModeRef Mode = (CGDisplayModeRef)CFArrayGetValueAtIndex(Modes, Index);
                const int32 Width = (int32)CGDisplayModeGetWidth(Mode);
                const int32 PixelWidth = (int32)CGDisplayModeGetPixelWidth(Mode);
                const int32 PixelHeight = (int32)CGDisplayModeGetPixelHeight(Mode);
                if (PixelWidth == Width && PixelWidth * PixelHeight > OutWidth * OutHeight)
                {
                    OutWidth = PixelWidth;
                    OutHeight = PixelHeight;
                }
            }
            CFRelease(Modes);
        }
        if (OutWidth == 0)
        {
            // No 1x mode listed (some external displays): the current mode's own pixel size is the best answer.
            if (CGDisplayModeRef Current = CGDisplayCopyDisplayMode(Display))
            {
                OutWidth = (int32)CGDisplayModeGetPixelWidth(Current);
                OutHeight = (int32)CGDisplayModeGetPixelHeight(Current);
                CGDisplayModeRelease(Current);
            }
        }
        GPanelCache = { Display, ModeWidthPx, ModeHeightPx, OutWidth, OutHeight };
    }
}

bool GetMacDisplayInsetsPx(const FVector2D& SlatePoint, FMacDisplayInsetsPx& Out)
{
    @autoreleasepool
    {
        NSArray<NSScreen*>* Screens = [NSScreen screens];
        if (Screens.count == 0)
        {
            return false;
        }
        // Slate's screen space on macOS: origin at the top-left of the primary screen, y down, backing pixels.
        NSScreen* Primary = Screens[0];
        const CGFloat PrimaryScale = Primary.backingScaleFactor > 0 ? Primary.backingScaleFactor : 1.0;
        const CGFloat PrimaryTop = NSMaxY(Primary.frame);
        NSScreen* Chosen = nil;
        for (NSScreen* Screen in Screens)
        {
            const CGFloat Scale = Screen.backingScaleFactor > 0 ? Screen.backingScaleFactor : 1.0;
            const NSRect F = Screen.frame; // Cocoa points, bottom-left origin, primary-relative
            const CGFloat SlateLeft = F.origin.x * PrimaryScale;
            const CGFloat SlateTop = (PrimaryTop - NSMaxY(F)) * PrimaryScale;
            const CGFloat SlateRight = SlateLeft + F.size.width * Scale;
            const CGFloat SlateBottom = SlateTop + F.size.height * Scale;
            if (SlatePoint.X >= SlateLeft && SlatePoint.X < SlateRight && SlatePoint.Y >= SlateTop && SlatePoint.Y < SlateBottom)
            {
                Chosen = Screen;
                break;
            }
        }
        if (!Chosen)
        {
            Chosen = [NSScreen mainScreen] ? [NSScreen mainScreen] : Primary;
        }
        const CGFloat Scale = Chosen.backingScaleFactor > 0 ? Chosen.backingScaleFactor : 1.0;
        const NSRect F = Chosen.frame;
        const NSRect V = Chosen.visibleFrame;
        Out.BackingScale = (float)Scale;
        Out.DisplayWidth = (int32)llround(F.size.width * Scale);
        Out.DisplayHeight = (int32)llround(F.size.height * Scale);
        Out.MenuBar = (int32)llround((NSMaxY(F) - NSMaxY(V)) * Scale);
        Out.Dock = (int32)llround((V.origin.y - F.origin.y) * Scale);
        Out.Left = (int32)llround((V.origin.x - F.origin.x) * Scale);
        Out.Right = (int32)llround((NSMaxX(F) - NSMaxX(V)) * Scale);
        Out.Notch = 0;
        if (@available(macOS 12.0, *))
        {
            Out.Notch = (int32)llround(Chosen.safeAreaInsets.top * Scale);
        }
        // A standard titled window: frame height minus content height.
        const NSRect Content = NSMakeRect(0, 0, 400, 300);
        const NSRect Frame = [NSWindow frameRectForContentRect:Content styleMask:(NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskMiniaturizable | NSWindowStyleMaskResizable)];
        Out.TitleBar = (int32)llround((Frame.size.height - Content.size.height) * Scale);
        Out.OriginX = (int32)llround(F.origin.x * PrimaryScale);
        Out.OriginY = (int32)llround((PrimaryTop - NSMaxY(F)) * PrimaryScale);
        // The physical panel behind this mode.
        NSNumber* ScreenNumber = Chosen.deviceDescription[@"NSScreenNumber"];
        const CGDirectDisplayID Display = ScreenNumber ? (CGDirectDisplayID)ScreenNumber.unsignedIntValue : CGMainDisplayID();
        LookupPanel(Display, Out.DisplayWidth, Out.DisplayHeight, Out.PanelWidth, Out.PanelHeight);
        return true;
    }
}

#endif // PLATFORM_MAC
