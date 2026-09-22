// macOS display insets for the window repair (2026-09-21). See Mac/MacDisplayInsets.mm (a Mac/ folder: UBT leaves platform-named folders out of other platforms).

#pragma once

#include "CoreMinimal.h"

/** Measured on the display the game window is on, in backing pixels of that display's current mode. */
struct FMacDisplayInsetsPx
{
    int32 DisplayWidth = 0;     // the virtual framebuffer (NSScreen.frame x backingScaleFactor): what Slate, r.setres and FDisplayMetrics use
    int32 DisplayHeight = 0;
    int32 MenuBar = 0;          // top strip a window cannot use (menu bar, camera housing included; 0 when the menu bar auto-hides)
    int32 Dock = 0;             // bottom strip the Dock takes (0 when hidden or on a side)
    int32 Left = 0;             // left strip taken (a left-side Dock, the Stage Manager strip)
    int32 Right = 0;            // right strip taken (a right-side Dock)
    int32 TitleBar = 0;         // height of a standard titled window's title bar
    int32 Notch = 0;            // NSScreen.safeAreaInsets.top: the camera housing's height (0 on panels without one)
    int32 OriginX = 0;          // the display's top-left in Slate screen space (pixels)
    int32 OriginY = 0;
    int32 PanelWidth = 0;       // the physical panel, from the display's largest non-HiDPI mode (0 if not found)
    int32 PanelHeight = 0;      //   - equals DisplayWidth/Height in an exact-2x mode; smaller in a scaled ("More Space") mode
    float BackingScale = 1.f;

    /** How many virtual pixels are drawn per panel pixel in each axis (1.0 in an exact mode, ~1.15 on a 13.6" Air's default). */
    float VirtualOverPanel() const { return (PanelWidth > 0 && DisplayWidth > 0) ? static_cast<float>(DisplayWidth) / PanelWidth : 1.f; }
    bool IsScaledMode() const { return PanelWidth > 0 && DisplayWidth > PanelWidth + 2; }
    /** A signature that changes whenever anything a window placement depends on changes (mode, Dock, menu bar). */
    FString Signature() const
    {
        return FString::Printf(TEXT("%dx%d@%d,%d m%d t%d d%d l%d r%d n%d p%dx%d"), DisplayWidth, DisplayHeight, OriginX, OriginY, MenuBar, TitleBar, Dock, Left, Right, Notch, PanelWidth, PanelHeight);
    }
};

#if PLATFORM_MAC
/**
 * Reads the insets from AppKit: NSScreen.frame vs visibleFrame (menu bar, Dock on any edge, Stage Manager strip),
 * safeAreaInsets (camera housing), NSWindow's frame-for-content arithmetic (title bar) and Core Graphics' display-mode
 * list (the physical panel, cached per display and mode), for the screen containing the point given in Slate screen
 * space (backing pixels), or the main screen when none contains it. Returns false if AppKit has no screens.
 */
bool GetMacDisplayInsetsPx(const FVector2D& SlatePoint, FMacDisplayInsetsPx& Out);
#endif
