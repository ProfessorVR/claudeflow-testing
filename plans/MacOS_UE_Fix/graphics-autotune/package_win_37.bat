@echo off
rem package_win_37.bat [cook|stage|all] - Windows build 37 (build 36 + [GraphicsAutoTune] Trace1..3 decision trace for Shipping diagnosis: graphics-tuner-power-profiles-plan-2026-09-21.md; the tuner stops
rem retrying after MaxFinishedFailures runs that finished but could not be applied/saved - [GraphicsAutoTune] FinishedFailures).
rem Builds 22-36 untouched. Same recipe as package_win_26.bat (pak + IoStore + compressed + prerequisites, no debug files):
rem   cook : cook only. Success is judged by the cook's own "Success - 0 error(s)" line, because the editor can crash
rem          while unloading plugin DLLs AFTER a successful cook (UnrealEditor-BlueprintJson, exit code 3).
rem   stage: -skipcook build + stage + pak + archive, Development -> Packaged\37-dev (writes a log at runtime), then
rem          Shipping -> Packaged\37-shipping. (C++-only changes need just this step; content/config changes need cook.)
rem Logs: %TEMP%\gfx37_package_win_cook.log, gfx37_package_win_dev.log, gfx37_package_win_ship.log
set ENGINE=D:\UE_5.4.1
set PROJ=C:\Users\Dalton\Documents\Unreal_Projects\awsTutorial_VoiceRPCNew_ARBv3
set BASE=-project="%PROJ%\awsTutorial.uproject" -target=awsTutorial -platform=Win64 -unrealexe="%ENGINE%\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" -nop4 -utf8output -nocompileeditor -skipbuildeditor -nocompileuat
set STAGE=-skipcook -build -stage -pak -iostore -compressed -package -archive -prereqs -nodebuginfo
set MODE=%1
if "%MODE%"=="" set MODE=all

if "%MODE%"=="stage" goto stage
call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% -cook -clientconfig=Development > "%TEMP%\gfx37_package_win_cook.log" 2>&1
echo COOK_EXIT=%ERRORLEVEL% >> "%TEMP%\gfx37_package_win_cook.log"
findstr /C:"Success - 0 error(s)" "%TEMP%\gfx37_package_win_cook.log" >nul || (echo COOK_REALLY_FAILED >> "%TEMP%\gfx37_package_win_cook.log" & exit /b 1)
echo COOK_OK >> "%TEMP%\gfx37_package_win_cook.log"
if "%MODE%"=="cook" exit /b 0

:stage
call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% %STAGE% -clientconfig=Development -archivedirectory="%PROJ%\Packaged\37-dev" > "%TEMP%\gfx37_package_win_dev.log" 2>&1
echo PACKAGE_EXIT=%ERRORLEVEL% >> "%TEMP%\gfx37_package_win_dev.log"

call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% %STAGE% -clientconfig=Shipping -archivedirectory="%PROJ%\Packaged\37-shipping" > "%TEMP%\gfx37_package_win_ship.log" 2>&1
echo PACKAGE_EXIT=%ERRORLEVEL% >> "%TEMP%\gfx37_package_win_ship.log"
echo ALL_DONE >> "%TEMP%\gfx37_package_win_ship.log"
