# run_probe_interactive.ps1 - runs probe_win.exe in the logged-on user's desktop session (audio playback
# from an SSH/services session does not reach the speakers). Registers a one-off scheduled task with an
# Interactive principal, waits for it, prints the output, and deletes the task.
#   powershell -ExecutionPolicy Bypass -File run_probe_interactive.ps1 [probe arguments...]
param([string]$ProbeArgs = 'acoustic speech.wav')
$ErrorActionPreference = 'Stop'
$dir = Join-Path $env:USERPROFILE 'evc_probe'
$out = Join-Path $dir 'probe_console.txt'
Remove-Item $out, (Join-Path $dir 'probe_result.txt') -ErrorAction SilentlyContinue
$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c probe_win.exe $ProbeArgs > probe_console.txt 2>&1" -WorkingDirectory $dir
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName 'EVCProbeOnce' -Action $action -Principal $principal -Settings $settings -Force | Out-Null
try {
    Start-ScheduledTask -TaskName 'EVCProbeOnce'
    Start-Sleep -Seconds 3
    $deadline = (Get-Date).AddMinutes(4)
    while ((Get-ScheduledTask -TaskName 'EVCProbeOnce').State -eq 'Running' -and (Get-Date) -lt $deadline) { Start-Sleep -Seconds 2 }
    $info = Get-ScheduledTaskInfo -TaskName 'EVCProbeOnce'
    Write-Output ("task last result: " + $info.LastTaskResult)
    if (Test-Path $out) { Get-Content $out } else { Write-Output "no output file" }
}
finally {
    Unregister-ScheduledTask -TaskName 'EVCProbeOnce' -Confirm:$false
    Write-Output "task removed"
}
