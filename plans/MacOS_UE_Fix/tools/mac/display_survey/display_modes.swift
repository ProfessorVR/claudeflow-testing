// display_modes.swift — read-only survey of the built-in display for the awsTutorial window-repair research.
// Prints: current mode (points, pixels, panel), every HiDPI mode the OS offers, and the AppKit insets the game reads.
import AppKit
import CoreGraphics

let main = CGMainDisplayID()
let panelW = CGDisplayPixelsWide(main)   // physical panel? (documented as pixels of the current mode; compare below)
let panelH = CGDisplayPixelsHigh(main)
print("macOS \(ProcessInfo.processInfo.operatingSystemVersionString)")
print("CGDisplayPixelsWide/High: \(panelW) x \(panelH)")

if let cur = CGDisplayCopyDisplayMode(main) {
    print("current mode: \(cur.width)x\(cur.height) pt, \(cur.pixelWidth)x\(cur.pixelHeight) px, \(cur.refreshRate) Hz, flags 0x\(String(cur.ioFlags, radix: 16))")
}
let opts: CFDictionary = [kCGDisplayShowDuplicateLowResolutionModes as String: true] as CFDictionary
if let modes = CGDisplayCopyAllDisplayModes(main, opts) as? [CGDisplayMode] {
    var seen = Set<String>()
    print("modes (pt -> px; usable=UI-selectable, hidpi=pixel>point):")
    for m in modes {
        let key = "\(m.width)x\(m.height)->\(m.pixelWidth)x\(m.pixelHeight)"
        if seen.contains(key) { continue }
        seen.insert(key)
        let usable = m.isUsableForDesktopGUI()
        let hidpi = m.pixelWidth > m.width
        print("  \(m.width)x\(m.height) pt -> \(m.pixelWidth)x\(m.pixelHeight) px  usable=\(usable) hidpi=\(hidpi) \(String(format: "%.0f", m.refreshRate))Hz")
    }
}
for (i, s) in NSScreen.screens.enumerated() {
    let f = s.frame, v = s.visibleFrame, sc = s.backingScaleFactor
    let menuPt = f.maxY - v.maxY
    let dockPt = v.minY - f.minY
    let leftPt = v.minX - f.minX
    let rightPt = f.maxX - v.maxX
    let content = NSRect(x: 0, y: 0, width: 400, height: 300)
    let frame = NSWindow.frameRect(forContentRect: content, styleMask: [.titled, .closable, .miniaturizable, .resizable])
    let titlePt = frame.height - content.height
    print("screen[\(i)] \(s.localizedName): frame \(Int(f.width))x\(Int(f.height)) pt @\(sc)x = \(Int(f.width*sc))x\(Int(f.height*sc)) px; menuBar \(menuPt) pt (\(Int(menuPt*sc)) px), dock bottom \(dockPt) pt (\(Int(dockPt*sc)) px), dock left \(leftPt) right \(rightPt) pt, titleBar \(titlePt) pt (\(Int(titlePt*sc)) px)")
    if #available(macOS 12.0, *) {
        let sa = s.safeAreaInsets
        print("  safeAreaInsets top \(sa.top) left \(sa.left) bottom \(sa.bottom) right \(sa.right) pt; auxTopLeft \(String(describing: s.auxiliaryTopLeftArea)) auxTopRight \(String(describing: s.auxiliaryTopRightArea))")
    }
    print("  NSStatusBar thickness \(NSStatusBar.system.thickness) pt; visibleFrame \(v)")
}
