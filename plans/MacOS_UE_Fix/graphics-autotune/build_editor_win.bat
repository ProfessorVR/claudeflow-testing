@echo off
rem build_editor_win.bat - builds the awsTutorialEditor target (Win64 Development) for the Windows project with the
rem source-built engine at D:\UE_5.4.1. Log: %TEMP%\gfx_build_editor.log (last line BUILD_EXIT=<code>).
set ENGINE=D:\UE_5.4.1
set PROJ=C:\Users\Dalton\Documents\Unreal_Projects\awsTutorial_VoiceRPCNew_ARBv3
call "%ENGINE%\Engine\Build\BatchFiles\Build.bat" awsTutorialEditor Win64 Development -Project="%PROJ%\awsTutorial.uproject" -WaitMutex -NoHotReloadFromIDE > "%TEMP%\gfx_build_editor.log" 2>&1
echo BUILD_EXIT=%ERRORLEVEL% >> "%TEMP%\gfx_build_editor.log"
