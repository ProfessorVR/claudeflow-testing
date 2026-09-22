@echo off
rem Builds the awsTutorial EDITOR target (Win64 Development) with the project's source engine D:\UE_5.4.1.
rem Log: %TEMP%\evc_build_win_editor.log
call "D:\UE_5.4.1\Engine\Build\BatchFiles\Build.bat" awsTutorialEditor Win64 Development -Project="C:\Users\Dalton\Documents\Unreal_Projects\awsTutorial_VoiceRPCNew_ARBv3\awsTutorial.uproject" -WaitMutex -NoHotReloadFromIDE > "%TEMP%\evc_build_win_editor.log" 2>&1
echo BUILD_EXIT=%ERRORLEVEL%>> "%TEMP%\evc_build_win_editor.log"
