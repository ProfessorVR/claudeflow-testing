@echo off
rem package_win_29.bat [cook|dev|ship] - Windows build 29 = build 28 + OrbitingScreen fix (BP_FirstPersonCharacter) +
rem video player volume (SC_Video/SM_Video, DefaultMediaSoundClassName, VideoPlayerVolumeSubsystem). Builds 22-28 untouched.
rem Same recipe as package_win_24.bat (pak + IoStore + compressed + prerequisites, no debug files):
rem   cook: cook only; success is judged by the cook's own "Success - 0 error(s)" line (the editor can crash while
rem         unloading plugin DLLs AFTER a successful cook).
rem   dev : -skipcook build + stage + pak + archive, Development -> Packaged\29-dev (for verification).
rem   ship: the same for Shipping -> Packaged\29-shipping (after verification).
rem Logs: %TEMP%\vv29_cook.log, vv29_dev.log, vv29_ship.log
set ENGINE=D:\UE_5.4.1
set PROJ=C:\Users\Dalton\Documents\Unreal_Projects\awsTutorial_VoiceRPCNew_ARBv3
set BASE=-project="%PROJ%\awsTutorial.uproject" -target=awsTutorial -platform=Win64 -unrealexe="%ENGINE%\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" -nop4 -utf8output -nocompileeditor -skipbuildeditor -nocompileuat
set STAGE=-skipcook -build -stage -pak -iostore -compressed -package -archive -prereqs -nodebuginfo
set MODE=%1

if "%MODE%"=="dev" goto dev
if "%MODE%"=="ship" goto ship
call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% -cook -clientconfig=Development > "%TEMP%\vv29_cook.log" 2>&1
echo COOK_EXIT=%ERRORLEVEL% >> "%TEMP%\vv29_cook.log"
findstr /C:"Success - 0 error(s)" "%TEMP%\vv29_cook.log" >nul || (echo COOK_REALLY_FAILED >> "%TEMP%\vv29_cook.log" & exit /b 1)
echo COOK_OK >> "%TEMP%\vv29_cook.log"
exit /b 0

:dev
call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% %STAGE% -clientconfig=Development -archivedirectory="%PROJ%\Packaged\29-dev" > "%TEMP%\vv29_dev.log" 2>&1
echo PACKAGE_EXIT=%ERRORLEVEL% >> "%TEMP%\vv29_dev.log"
exit /b 0

:ship
call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% %STAGE% -clientconfig=Shipping -archivedirectory="%PROJ%\Packaged\29-shipping" > "%TEMP%\vv29_ship.log" 2>&1
echo PACKAGE_EXIT=%ERRORLEVEL% >> "%TEMP%\vv29_ship.log"
exit /b 0
