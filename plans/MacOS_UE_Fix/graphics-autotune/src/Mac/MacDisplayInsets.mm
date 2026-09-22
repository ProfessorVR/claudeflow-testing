// MacDisplayInsets.mm - the macOS screen insets the window repair needs, read from AppKit instead of measured
// constants (2026-09-21). The engine's FDisplayMetrics puts Cocoa's bottom-left visibleFrame origin (the Dock's
// height) into PrimaryDisplayWorkAreaRect.Top, so it cannot be used for this; the lab MacBook Pro (Dock 146 px)
// showed the Air's constant (120 px) leaving the game's bottom edge under the Dock.
//
// Compiled on Apple platforms only (UBT skips .mm elsewhere); the header is guarded by PLATFORM_MAC.

#include "../MacDisplayInsets.h" // the module root is not on the include path for a file in a subfolder

#if PLATFORM_MAC

#import <AppKit/AppKit.h>

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
        Out.DisplayWidth = (int32)llround(F.size.width * Scale);
        Out.DisplayHeight = (int32)llround(F.size.height * Scale);
        Out.MenuBar = (int32)llround((NSMaxY(F) - NSMaxY(V)) * Scale);
        Out.Dock = (int32)llround((V.origin.y - F.origin.y) * Scale);
        // A standard titled window: frame height minus content height.
        const NSRect Content = NSMakeRect(0, 0, 400, 300);
        const NSRect Frame = [NSWindow frameRectForContentRect:Content styleMask:(NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskMiniaturizable | NSWindowStyleMaskResizable)];
        Out.TitleBar = (int32)llround((Frame.size.height - Content.size.height) * Scale);
        Out.OriginX = (int32)llround(F.origin.x * PrimaryScale);
        Out.OriginY = (int32)llround((PrimaryTop - NSMaxY(F)) * PrimaryScale);
        return true;
    }
}

#endif // PLATFORM_MAC
