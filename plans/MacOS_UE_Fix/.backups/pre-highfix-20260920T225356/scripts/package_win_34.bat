@echo off
rem package_win_34.bat [cook|stage|all] - Windows build 34 (build 33 + the window repair's ini trace; the Mac occlusion-query
rem workaround is in Config\Mac\MacEngine.ini and does not apply to Windows). Builds 22-33 untouched. Same recipe as
rem package_win_26.bat (pak + IoStore + compressed + prerequisites, no debug files):
rem   cook : cook only. Success is judged by the cook's own "Success - 0 error(s)" line, because the editor can crash
rem          while unloading plugin DLLs AFTER a successful cook (UnrealEditor-BlueprintJson, exit code 3).
rem   stage: -skipcook build + stage + pak + archive, Development -> Packaged\34-dev (writes a log at runtime), then
rem          Shipping -> Packaged\34-shipping. (C++-only changes need just this step; content/config changes need cook.)
rem Logs: %TEMP%\gfx34_package_win_cook.log, gfx34_package_win_dev.log, gfx34_package_win_ship.log
set ENGINE=D:\UE_5.4.1
set PROJ=C:\Users\Dalton\Documents\Unreal_Projects\awsTutorial_VoiceRPCNew_ARBv3
set BASE=-project="%PROJ%\awsTutorial.uproject" -target=awsTutorial -platform=Win64 -unrealexe="%ENGINE%\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" -nop4 -utf8output -nocompileeditor -skipbuildeditor -nocompileuat
set STAGE=-skipcook -build -stage -pak -iostore -compressed -package -archive -prereqs -nodebuginfo
set MODE=%1
if "%MODE%"=="" set MODE=all

if "%MODE%"=="stage" goto stage
call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% -cook -clientconfig=Development > "%TEMP%\gfx34_package_win_cook.log" 2>&1
echo COOK_EXIT=%ERRORLEVEL% >> "%TEMP%\gfx34_package_win_cook.log"
findstr /C:"Success - 0 error(s)" "%TEMP%\gfx34_package_win_cook.log" >nul || (echo COOK_REALLY_FAILED >> "%TEMP%\gfx34_package_win_cook.log" & exit /b 1)
echo COOK_OK >> "%TEMP%\gfx34_package_win_cook.log"
if "%MODE%"=="cook" exit /b 0

:stage
call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% %STAGE% -clientconfig=Development -archivedirectory="%PROJ%\Packaged\34-dev" > "%TEMP%\gfx34_package_win_dev.log" 2>&1
echo PACKAGE_EXIT=%ERRORLEVEL% >> "%TEMP%\gfx34_package_win_dev.log"

call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% %STAGE% -clientconfig=Shipping -archivedirectory="%PROJ%\Packaged\34-shipping" > "%TEMP%\gfx34_package_win_ship.log" 2>&1
echo PACKAGE_EXIT=%ERRORLEVEL% >> "%TEMP%\gfx34_package_win_ship.log"
echo ALL_DONE >> "%TEMP%\gfx34_package_win_ship.log"
