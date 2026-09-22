@echo off
rem package_win_24.bat - Windows build 24 (voice-echo fix + UI ScaleToFit), builds 22/23 untouched.
rem Mirrors the project's packaging settings (pak + IoStore + compressed + prerequisites, no debug files).
rem   step 1: cook only. Success is judged by the cook's own "Success - 0 error(s)" line, because the editor can
rem           crash while unloading plugin DLLs AFTER a successful cook (2026-09-18: access violation in
rem           UnrealEditor-BlueprintJson at process exit -> exit code 3 -> UAT "Cook failed").
rem   step 2: -skipcook build + stage + pak + archive, Development -> Packaged\24-dev (writes a log at runtime)
rem   step 3: -skipcook build + stage + pak + archive, Shipping    -> Packaged\24-shipping
rem Logs: %TEMP%\evc_package_win_cook.log, evc_package_win_dev.log, evc_package_win_ship.log
set ENGINE=D:\UE_5.4.1
set PROJ=C:\Users\Dalton\Documents\Unreal_Projects\awsTutorial_VoiceRPCNew_ARBv3
set BASE=-project="%PROJ%\awsTutorial.uproject" -target=awsTutorial -platform=Win64 -unrealexe="%ENGINE%\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" -nop4 -utf8output -nocompileeditor -skipbuildeditor -nocompileuat
set STAGE=-skipcook -build -stage -pak -iostore -compressed -package -archive -prereqs -nodebuginfo

call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% -cook -clientconfig=Development > "%TEMP%\evc_package_win_cook.log" 2>&1
echo COOK_EXIT=%ERRORLEVEL%>> "%TEMP%\evc_package_win_cook.log"
findstr /C:"Success - 0 error(s)" "%TEMP%\evc_package_win_cook.log" >nul || (echo COOK_REALLY_FAILED>> "%TEMP%\evc_package_win_cook.log" & exit /b 1)

call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% %STAGE% -clientconfig=Development -archivedirectory="%PROJ%\Packaged\24-dev" > "%TEMP%\evc_package_win_dev.log" 2>&1
echo PACKAGE_EXIT=%ERRORLEVEL%>> "%TEMP%\evc_package_win_dev.log"

call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %BASE% %STAGE% -clientconfig=Shipping -archivedirectory="%PROJ%\Packaged\24-shipping" > "%TEMP%\evc_package_win_ship.log" 2>&1
echo PACKAGE_EXIT=%ERRORLEVEL%>> "%TEMP%\evc_package_win_ship.log"
