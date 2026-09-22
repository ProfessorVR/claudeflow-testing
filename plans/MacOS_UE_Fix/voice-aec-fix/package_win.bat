@echo off
rem package_win.bat - packages awsTutorial for Win64 with the voice-echo fix, mirroring the project's
rem packaging settings (pak + IoStore + compressed + prerequisites). Build 22 is left untouched.
rem   step 1: build + cook + stage  Development -> Packaged\23-aec-dev   (logs to awsTutorial\Saved\Logs)
rem   step 2: build + stage (-skipcook, same cook) Shipping -> Packaged\23-aec-shipping
rem Logs: %TEMP%\evc_package_win_dev.log, %TEMP%\evc_package_win_ship.log
set ENGINE=D:\UE_5.4.1
set PROJ=C:\Users\Dalton\Documents\Unreal_Projects\awsTutorial_VoiceRPCNew_ARBv3
set COMMON=-project="%PROJ%\awsTutorial.uproject" -target=awsTutorial -platform=Win64 -unrealexe="%ENGINE%\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" -nop4 -utf8output -nocompileeditor -skipbuildeditor -nocompileuat -build -stage -pak -iostore -compressed -package -archive -prereqs -nodebuginfo

call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %COMMON% -cook -clientconfig=Development -archivedirectory="%PROJ%\Packaged\23-aec-dev" > "%TEMP%\evc_package_win_dev.log" 2>&1
echo PACKAGE_EXIT=%ERRORLEVEL%>> "%TEMP%\evc_package_win_dev.log"
findstr /C:"BUILD SUCCESSFUL" "%TEMP%\evc_package_win_dev.log" >nul || exit /b 1

call "%ENGINE%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun %COMMON% -skipcook -clientconfig=Shipping -archivedirectory="%PROJ%\Packaged\23-aec-shipping" > "%TEMP%\evc_package_win_ship.log" 2>&1
echo PACKAGE_EXIT=%ERRORLEVEL%>> "%TEMP%\evc_package_win_ship.log"
