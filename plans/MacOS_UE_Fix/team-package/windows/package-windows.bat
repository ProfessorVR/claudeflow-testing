@echo off
setlocal EnableExtensions
rem =============================================================================
rem  package-windows.bat  —  ON THE WINDOWS PC. Makes the Windows Development and Shipping builds.
rem
rem  HOW TO USE (no typing needed):
rem    1. Copy this file into the project folder (the folder that contains awsTutorial.uproject).
rem    2. Double-click it. A black window shows progress (30-60 minutes; it is not stuck) and ends with
rem       PACKAGE OK or PACKAGE FAILED.
rem    3. The builds appear in the project's Packaged\ folder:  Packaged\<label>-dev\Windows  and
rem       Packaged\<label>-shipping\Windows  (the label is today's date unless you give one).
rem  From a command prompt:   package-windows.bat [all|stage|cook|check] [label]
rem       all   = cook + build + stage both configurations (use after ANY change; the default)
rem       stage = skip the cook (only when nothing but C++ changed - if unsure, use all)
rem       check = print the paths it would use and stop
rem
rem  Same recipe as package_win_44.bat (pak + IoStore + compressed + prerequisites, no debug files). The cook's
rem  success is judged by its own "Success - 0 error(s)" line because the editor can crash while unloading plugin
rem  DLLs AFTER a successful cook. Engine: D:\UE_5.4.1 (set UE_ENGINE_WIN to override).
rem  Logs: %TEMP%\package_win_<label>_cook.log, _dev.log, _ship.log
rem =============================================================================
set "PROJ=%~dp0"
if "%PROJ:~-1%"=="\" set "PROJ=%PROJ:~0,-1%"
set "ENGINE=%UE_ENGINE_WIN%"
if "%ENGINE%"=="" set "ENGINE=D:\UE_5.4.1"
set "MODE=%~1"
if "%MODE%"=="" set "MODE=all"
set "LABEL=%~2"
if "%LABEL%"=="" for /f %%d in ('%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set "LABEL=%%d"
if "%LABEL%"=="" set "LABEL=undated"
set "LOGC=%TEMP%\package_win_%LABEL%_cook.log"
set "LOGD=%TEMP%\package_win_%LABEL%_dev.log"
set "LOGS=%TEMP%\package_win_%LABEL%_ship.log"
set BASE=-project="%PROJ%\awsTutorial.uproject" -target=awsTutorial -platform=Win64 -unrealexe="%ENGINE%\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" -nop4 -utf8output -nocompileeditor -skipbuildeditor -nocompileuat
set STAGE=-skipcook -build -stage -pak -iostore -compressed -package -archive -prereqs -nodebuginfo

echo === Project: %PROJ%
echo === Engine:  %ENGINE%
echo === Mode:    %MODE%    Label: %LABEL%
echo === Output:  %PROJ%\Packaged\%LABEL%-dev\Windows  and  %PROJ%\Packaged\%LABEL%-shipping\Windows
if not exist "%PROJ%\awsTutorial.uproject" (echo PACKAGE FAILED: this file must sit in the project folder, next to awsTutorial.uproject. & goto :end_fail)
if not exist "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" (echo PACKAGE FAILED: engine not found at %ENGINE% ^(set UE_ENGINE_WIN^). & goto :end_fail)
if "%MODE%"=="check" (echo CHECK OK - paths exist, nothing built. & goto :end_ok)
for /f "tokens=3" %%f in ('dir /-c "%PROJ%\" ^| findstr /c:"bytes free"') do set "FREE=%%f"
echo === Free space on the project drive: %FREE% bytes ^(a full package needs about 12 GB^)
if "%MODE%"=="stage" goto :stage
if not "%MODE%"=="all" if not "%MODE%"=="cook" (echo PACKAGE FAILED: unknown mode %MODE% ^(use all, stage, cook or check^). & goto :end_fail)

echo === [1/3] Cooking content %TIME% ^(10-20 minutes^)...
call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% -cook -clientconfig=Development > "%LOGC%" 2>&1
echo COOK_EXIT=%ERRORLEVEL% >> "%LOGC%"
findstr /C:"Success - 0 error(s)" "%LOGC%" >nul || (echo COOK_REALLY_FAILED >> "%LOGC%" & echo PACKAGE FAILED: the cook did not finish with 0 errors. Log: %LOGC% & goto :end_fail)
echo COOK_OK >> "%LOGC%"
echo     cook OK
if "%MODE%"=="cook" goto :end_ok

:stage
echo === [2/3] Building + staging Development %TIME% ^(10-20 minutes^)...
call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% %STAGE% -clientconfig=Development -archivedirectory="%PROJ%\Packaged\%LABEL%-dev" > "%LOGD%" 2>&1
set RCD=%ERRORLEVEL%
echo PACKAGE_EXIT=%RCD% >> "%LOGD%"
if not "%RCD%"=="0" (echo PACKAGE FAILED: Development build/stage failed ^(exit %RCD%^). Log: %LOGD% & goto :end_fail)
if not exist "%PROJ%\Packaged\%LABEL%-dev\Windows\awsTutorial.exe" (echo PACKAGE FAILED: no awsTutorial.exe in Packaged\%LABEL%-dev\Windows. Log: %LOGD% & goto :end_fail)
echo     Development OK

echo === [3/3] Building + staging Shipping %TIME% ^(10-20 minutes^)...
call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% %STAGE% -clientconfig=Shipping -archivedirectory="%PROJ%\Packaged\%LABEL%-shipping" > "%LOGS%" 2>&1
set RCS=%ERRORLEVEL%
echo PACKAGE_EXIT=%RCS% >> "%LOGS%"
echo ALL_DONE >> "%LOGS%"
if not "%RCS%"=="0" (echo PACKAGE FAILED: Shipping build/stage failed ^(exit %RCS%^). Log: %LOGS% & goto :end_fail)
if not exist "%PROJ%\Packaged\%LABEL%-shipping\Windows\awsTutorial.exe" (echo PACKAGE FAILED: no awsTutorial.exe in Packaged\%LABEL%-shipping\Windows. Log: %LOGS% & goto :end_fail)
echo     Shipping OK
echo.
echo PACKAGE OK  %TIME%
echo    Development: %PROJ%\Packaged\%LABEL%-dev\Windows\awsTutorial.exe
echo    Shipping:    %PROJ%\Packaged\%LABEL%-shipping\Windows\awsTutorial.exe
echo    Next: run the Shipping awsTutorial.exe once and check it reaches the login screen and the level
echo    ^(PACKAGING-STEP-BY-STEP.md, "How to check a build"^). To hand it out, zip the whole Windows folder.
goto :end_ok

:end_fail
echo.
echo Send the log file named above ^(and a screenshot of this window^) to the engineer.
if "%~1"=="" pause
exit /b 1
:end_ok
if "%~1"=="" pause
exit /b 0
