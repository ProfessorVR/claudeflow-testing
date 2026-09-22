@echo off
rem Builds probe_win.exe from the SHIPPING Windows core. Run from a folder laid out as:
rem   .\probe_win.cpp  .\AEC\EVCCaptureCore.h  .\AEC\EVCCaptureCore.cpp  .\Windows\EVCCaptureCore_Windows.cpp
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul || exit /b 1
cl /nologo /std:c++17 /EHsc /W4 /WX /permissive- /MT /I. probe_win.cpp Windows\EVCCaptureCore_Windows.cpp AEC\EVCCaptureCore.cpp ole32.lib winmm.lib /Fe:probe_win.exe
