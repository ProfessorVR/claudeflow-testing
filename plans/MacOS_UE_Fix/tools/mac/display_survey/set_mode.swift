// set_mode.swift — switch the main display's mode for the Phase 1 panel matrix (2026-09-21).
//   set_mode current                    -> "W H hidpi|lowdpi HZ" of the current mode (save this to restore)
//   set_mode <ptW> <ptH> [hidpi|lowdpi] -> switches (session-scoped: a logout/reboot restores the login mode)
// Uses CGConfigureDisplayWithDisplayMode with .forSession so nothing is written permanently.
import CoreGraphics
import Foundation

let main = CGMainDisplayID()
func allModes() -> [CGDisplayMode] {
    let opts = [kCGDisplayShowDuplicateLowResolutionModes as String: true] as CFDictionary
    return (CGDisplayCopyAllDisplayModes(main, opts) as? [CGDisplayMode]) ?? []
}
let args = CommandLine.arguments
if args.count >= 2 && args[1] == "current" {
    if let c = CGDisplayCopyDisplayMode(main) {
        print("\(c.width) \(c.height) \(c.pixelWidth > c.width ? "hidpi" : "lowdpi") \(Int(c.refreshRate)) px=\(c.pixelWidth)x\(c.pixelHeight)")
    }
    exit(0)
}
guard args.count >= 3, let w = Int(args[1]), let h = Int(args[2]) else {
    print("usage: set_mode current | set_mode <ptW> <ptH> [hidpi|lowdpi]"); exit(2)
}
let wantHi = args.count < 4 || args[3] == "hidpi"
let cands = allModes().filter { $0.width == w && $0.height == h && (($0.pixelWidth > $0.width) == wantHi) && $0.isUsableForDesktopGUI() }
guard let m = cands.max(by: { $0.refreshRate < $1.refreshRate }) else {
    print("NO_SUCH_MODE \(w)x\(h) \(wantHi ? "hidpi" : "lowdpi")"); exit(3)
}
var cfg: CGDisplayConfigRef?
guard CGBeginDisplayConfiguration(&cfg) == .success, let c = cfg else { print("ERR begin"); exit(4) }
guard CGConfigureDisplayWithDisplayMode(c, main, m, nil) == .success else { CGCancelDisplayConfiguration(c); print("ERR configure"); exit(4) }
let err = CGCompleteDisplayConfiguration(c, .forSession)
if err == .success {
    Thread.sleep(forTimeInterval: 1.5)
    if let now = CGDisplayCopyDisplayMode(main) {
        print("OK \(now.width)x\(now.height) pt -> \(now.pixelWidth)x\(now.pixelHeight) px \(Int(now.refreshRate)) Hz")
    }
} else {
    print("ERR complete \(err.rawValue)"); exit(5)
}
