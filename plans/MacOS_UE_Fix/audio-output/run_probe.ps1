# run_probe.ps1 - like graphics-autotune\run_game_test.ps1 -Foreground, but the game is started through ui_probe.ps1
# (key presses and screenshots at set times) in the logged-on user's desktop session, then closed.
#   powershell -ExecutionPolicy Bypass -File run_probe.ps1 -GameDir <folder> -Seconds 90 -Steps "60:key:m;63:shot:menu"
param(
    [Parameter(Mandatory = $true)][string]$GameDir,
    [string]$GameArgs = '',
    [int]$Seconds = 120,
    [string]$Steps = ''
)
$ErrorActionPreference = 'Stop'
$exe = Join-Path $GameDir 'awsTutorial.exe'
if (-not (Test-Path $exe)) { throw "not found: $exe" }
$helper = Join-Path $PSScriptRoot 'ui_probe.ps1'
$escaped = $GameArgs.Replace('"', '\"')
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ("-NoProfile -ExecutionPolicy Bypass -File `"$helper`" -GameDir `"$GameDir`" -GameArgs `"$escaped`" -Seconds $Seconds -Steps `"$Steps`"") -WorkingDirectory $GameDir
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName 'AudioOutputProbe' -Action $action -Principal $principal -Settings $settings -Force | Out-Null
try {
    Start-ScheduledTask -TaskName 'AudioOutputProbe'
    Write-Output ("started " + (Get-Date -Format 'HH:mm:ss') + ": awsTutorial.exe " + $GameArgs)
    Start-Sleep -Seconds ($Seconds + 3)
}
finally {
    Get-Process | Where-Object { $_.ProcessName -like 'awsTutorial*' } | ForEach-Object {
        Write-Output ("closing " + $_.ProcessName + " pid " + $_.Id)
        $null = $_.CloseMainWindow()
    }
    Start-Sleep -Seconds 8
    Get-Process | Where-Object { $_.ProcessName -like 'awsTutorial*' } | Stop-Process -Force -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName 'AudioOutputProbe' -Confirm:$false
    Write-Output ("stopped " + (Get-Date -Format 'HH:mm:ss') + ", task removed")
}
