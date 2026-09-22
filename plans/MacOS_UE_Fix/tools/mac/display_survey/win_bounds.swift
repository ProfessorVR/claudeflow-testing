// win_bounds.swift — print the on-screen windows of awsTutorial as macOS sees them (Phase 1 evidence, 2026-09-21).
// Bounds come from CGWindowListCopyWindowInfo: points, origin at the top-left of the main display, y down.
// Also prints the same bounds in backing pixels of the main display, to compare with the game's own target.
import CoreGraphics
import Foundation
import AppKit

let scale = NSScreen.screens.first?.backingScaleFactor ?? 2.0
let opts: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
guard let list = CGWindowListCopyWindowInfo(opts, kCGNullWindowID) as? [[String: Any]] else { print("no window list"); exit(1) }
var found = 0
for w in list {
    let owner = w[kCGWindowOwnerName as String] as? String ?? ""
    let layer = w[kCGWindowLayer as String] as? Int ?? -1
    guard owner.contains("awsTutorial"), layer == 0 else { continue }
    guard let b = w[kCGWindowBounds as String] as? [String: CGFloat] else { continue }
    let x = b["X"] ?? 0, y = b["Y"] ?? 0, wd = b["Width"] ?? 0, ht = b["Height"] ?? 0
    let name = w[kCGWindowName as String] as? String ?? ""
    found += 1
    print("window \"\(name)\" owner=\(owner): frame pt x=\(Int(x)) y=\(Int(y)) w=\(Int(wd)) h=\(Int(ht)) | px x=\(Int(x*scale)) y=\(Int(y*scale)) w=\(Int(wd*scale)) h=\(Int(ht*scale)) (frame includes the title bar)")
}
if found == 0 { print("no awsTutorial window on screen") }
