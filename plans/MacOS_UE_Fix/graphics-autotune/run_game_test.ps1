# run_game_test.ps1 - launches a packaged awsTutorial build in the logged-on user's desktop session (a game started
# from an SSH/services session gets no visible window or GPU presentation), lets it run, then closes it.
# Registers a one-off scheduled task with an Interactive principal and removes it afterwards.
#   powershell -ExecutionPolicy Bypass -File run_game_test.ps1 -GameDir <folder with awsTutorial.exe> -GameArgs "<args>" -Seconds 150
param(
    [Parameter(Mandatory = $true)][string]$GameDir,
    [string]$GameArgs = '',
    [int]$Seconds = 150,
    [switch]$Foreground   # launch through fg_launch.ps1, which keeps the game window in the foreground and logs it
)
$ErrorActionPreference = 'Stop'
$exe = Join-Path $GameDir 'awsTutorial.exe'
if (-not (Test-Path $exe)) { throw "not found: $exe" }
if ($Foreground) {
    $helper = Join-Path $PSScriptRoot 'fg_launch.ps1'
    $escaped = $GameArgs.Replace('"', '\"')
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ("-NoProfile -ExecutionPolicy Bypass -File `"$helper`" -GameDir `"$GameDir`" -GameArgs `"$escaped`" -Seconds $Seconds") -WorkingDirectory $GameDir
} else {
    $action = New-ScheduledTaskAction -Execute $exe -Argument $GameArgs -WorkingDirectory $GameDir
}
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName 'GfxAutoTuneTest' -Action $action -Principal $principal -Settings $settings -Force | Out-Null
try {
    Start-ScheduledTask -TaskName 'GfxAutoTuneTest'
    Write-Output ("started " + (Get-Date -Format 'HH:mm:ss') + ": awsTutorial.exe " + $GameArgs)
    Start-Sleep -Seconds $Seconds
}
finally {
    # The launcher exe starts the real game process (awsTutorial-Win64-*.exe); close both.
    Get-Process | Where-Object { $_.ProcessName -like 'awsTutorial*' } | ForEach-Object {
        Write-Output ("closing " + $_.ProcessName + " pid " + $_.Id)
        $null = $_.CloseMainWindow()
    }
    Start-Sleep -Seconds 8
    Get-Process | Where-Object { $_.ProcessName -like 'awsTutorial*' } | Stop-Process -Force -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName 'GfxAutoTuneTest' -Confirm:$false
    Write-Output ("stopped " + (Get-Date -Format 'HH:mm:ss') + ", task removed")
}
