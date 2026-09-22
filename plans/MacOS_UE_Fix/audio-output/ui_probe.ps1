# ui_probe.ps1 - runs INSIDE the interactive scheduled task (run_game_test.ps1 -Probe): starts the game, keeps its
# window in the foreground, and at given seconds after launch presses keys or saves a screenshot of the screen.
#   -Steps "58:shot:before;60:key:m;63:shot:menu;65:click:2170,110;70:key:m"   key = WScript.Shell SendKeys syntax,
#   click = left click at physical screen pixels x,y
# Screenshots: %USERPROFILE%\gfx_test\probe_<name>.png; log: %USERPROFILE%\gfx_test\probe_log.txt
param([string]$GameDir, [string]$GameArgs = '', [int]$Seconds = 150, [string]$Steps = '')
$dir = Join-Path $env:USERPROFILE 'gfx_test'
$log = Join-Path $dir 'probe_log.txt'
Remove-Item $log -ErrorAction SilentlyContinue
Get-ChildItem $dir -Filter 'probe_*.png' -ErrorAction SilentlyContinue | Remove-Item
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class ProbeWin {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
}
"@
$null = [ProbeWin]::SetProcessDPIAware()   # full-resolution screenshots on a scaled display

$plan = @()
foreach ($s in ($Steps -split ';')) {
    if ($s.Trim() -eq '') { continue }
    $f = $s.Split(':', 3)
    $plan += [pscustomobject]@{ At = [int]$f[0]; Kind = $f[1]; Arg = $f[2]; Done = $false }
}

$start = Get-Date
$p = Start-Process -FilePath (Join-Path $GameDir 'awsTutorial.exe') -ArgumentList $GameArgs -WorkingDirectory $GameDir -PassThru
$shell = New-Object -ComObject WScript.Shell
while (((Get-Date) - $start).TotalSeconds -lt $Seconds) {
    Start-Sleep -Milliseconds 500
    $game = Get-Process | Where-Object { $_.ProcessName -like 'awsTutorial*' -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
    if ($game) {
        $fgPid = 0
        $null = [ProbeWin]::GetWindowThreadProcessId([ProbeWin]::GetForegroundWindow(), [ref]$fgPid)
        if ($fgPid -ne $game.Id) {
            $null = $shell.AppActivate($game.Id)
            $null = [ProbeWin]::ShowWindow($game.MainWindowHandle, 5)
            $null = [ProbeWin]::SetForegroundWindow($game.MainWindowHandle)
        }
    }
    $t = ((Get-Date) - $start).TotalSeconds
    foreach ($step in $plan) {
        if ($step.Done -or $t -lt $step.At) { continue }
        $step.Done = $true
        $fgPid = 0
        $null = [ProbeWin]::GetWindowThreadProcessId([ProbeWin]::GetForegroundWindow(), [ref]$fgPid)
        $fgName = (Get-Process -Id $fgPid -ErrorAction SilentlyContinue).ProcessName
        if ($step.Kind -eq 'key') {
            $shell.SendKeys($step.Arg)
        } elseif ($step.Kind -eq 'click') {
            $xy = $step.Arg.Split(',')
            $null = [ProbeWin]::SetCursorPos([int]$xy[0], [int]$xy[1])
            Start-Sleep -Milliseconds 150
            [ProbeWin]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)   # left down
            Start-Sleep -Milliseconds 80
            [ProbeWin]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)   # left up
        } elseif ($step.Kind -eq 'shot') {
            $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
            $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
            $bmp.Save((Join-Path $dir ('probe_' + $step.Arg + '.png')), [System.Drawing.Imaging.ImageFormat]::Png)
            $g.Dispose(); $bmp.Dispose()
        }
        Add-Content $log ("{0:N1}s {1} {2} foreground={3}({4})" -f $t, $step.Kind, $step.Arg, $fgName, $fgPid)
    }
}
