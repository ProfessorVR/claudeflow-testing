# fg_launch.ps1 - runs INSIDE the interactive scheduled task: starts the game, keeps trying to bring its window to the
# foreground for the whole run, and logs which process owns the foreground window every 2 s (fg_log.txt).
param([string]$GameDir, [string]$GameArgs = '', [int]$Seconds = 150)
$log = Join-Path $env:USERPROFILE 'gfx_test\fg_log.txt'
Remove-Item $log -ErrorAction SilentlyContinue
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class FgWin {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
}
"@
$p = Start-Process -FilePath (Join-Path $GameDir 'awsTutorial.exe') -ArgumentList $GameArgs -WorkingDirectory $GameDir -PassThru
$shell = New-Object -ComObject WScript.Shell
$end = (Get-Date).AddSeconds($Seconds)
while ((Get-Date) -lt $end) {
    Start-Sleep -Seconds 2
    $game = Get-Process | Where-Object { $_.ProcessName -like 'awsTutorial*' -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
    $activated = $false
    if ($game) {
        $activated = $shell.AppActivate($game.Id)
        $null = [FgWin]::ShowWindow($game.MainWindowHandle, 5)
        $null = [FgWin]::SetForegroundWindow($game.MainWindowHandle)
    }
    $fgPid = 0
    $null = [FgWin]::GetWindowThreadProcessId([FgWin]::GetForegroundWindow(), [ref]$fgPid)
    $fgName = (Get-Process -Id $fgPid -ErrorAction SilentlyContinue).ProcessName
    Add-Content $log ("{0} game={1} activate={2} foreground={3}({4})" -f (Get-Date -Format 'HH:mm:ss'), ($game.Id), $activated, $fgName, $fgPid)
}
