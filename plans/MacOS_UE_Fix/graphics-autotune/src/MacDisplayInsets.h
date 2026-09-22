// macOS display insets for the window repair (2026-09-21). See Mac/MacDisplayInsets.mm (a Mac/ folder: UBT leaves platform-named folders out of other platforms).

#pragma once

#include "CoreMinimal.h"

/** Measured on the display the game window is on, in backing pixels. */
struct FMacDisplayInsetsPx
{
    int32 DisplayWidth = 0;
    int32 DisplayHeight = 0;
    int32 MenuBar = 0;      // top strip a window cannot use (menu bar, camera housing included)
    int32 Dock = 0;         // bottom strip the Dock takes (0 when hidden or on a side)
    int32 TitleBar = 0;     // height of a standard titled window's title bar
    int32 OriginX = 0;      // the display's top-left in Slate screen space (pixels)
    int32 OriginY = 0;
};

#if PLATFORM_MAC
/**
 * Reads the insets from AppKit: NSScreen.frame vs visibleFrame (menu bar and Dock) and NSWindow's frame-for-content
 * arithmetic (title bar), for the screen containing the point given in Slate screen space (backing pixels), or the
 * main screen when none contains it. Returns false if AppKit has no screens.
 */
bool GetMacDisplayInsetsPx(const FVector2D& SlatePoint, FMacDisplayInsetsPx& Out);
#endif
