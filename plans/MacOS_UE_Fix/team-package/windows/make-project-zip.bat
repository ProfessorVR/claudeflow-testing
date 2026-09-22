@echo off
setlocal EnableExtensions
rem =============================================================================
rem  make-project-zip.bat  —  ON THE WINDOWS PC. Makes the zip that carries the project to a Mac.
rem
rem  HOW TO USE (no typing needed):
rem    1. Copy this file into the project folder (the folder that contains awsTutorial.uproject).
rem    2. Double-click it. A black window shows progress and ends with ZIP OK or ZIP FAILED.
rem    3. The zip and a small .md5 file appear one folder up (next to the project folder), named
rem       awsTutorial-src-YYYY-MM-DD.zip. Copy BOTH files to the Mac (or the lab drive).
rem  Optional: run it from a command prompt with an output folder as the first argument:
rem       make-project-zip.bat D:\
rem
rem  WHAT IT DOES: zips awsTutorial.uproject + Build + Config + Content + Plugins + Source, leaving out the
rem  folders a Mac rebuilds itself (Intermediate, Binaries, Saved, DerivedDataCache, Packaged, backups). The
rem  Unreal editor's own "Zip Up Project" must NOT be used: it leaves out Build\, and the Mac needs Build\Mac.
rem  Uses Windows' built-in tar.exe (Windows 10 1803+) and certutil for the checksum. Nothing in the project changes.
rem =============================================================================
set "PROJ=%~dp0"
if "%PROJ:~-1%"=="\" set "PROJ=%PROJ:~0,-1%"
if not exist "%PROJ%\awsTutorial.uproject" (
  echo ZIP FAILED: this file must sit in the project folder, next to awsTutorial.uproject. It is in: %PROJ%
  goto :end_fail
)
set "OUTDIR=%~1"
if "%OUTDIR%"=="" for %%I in ("%PROJ%\..") do set "OUTDIR=%%~fI"
if "%OUTDIR:~-1%"=="\" set "OUTDIR=%OUTDIR:~0,-1%"
rem %DATE% depends on the locale (this PC prints "Mon 09/22/2026"); PowerShell gives an unambiguous date.
set "STAMP="
for /f %%d in ('%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set "STAMP=%%d"
if "%STAMP%"=="" set "STAMP=undated"
set "OUT=%OUTDIR%\awsTutorial-src-%STAMP%.zip"

echo === Project: %PROJ%
echo === Output:  %OUT%
where tar.exe >nul 2>&1 || (echo ZIP FAILED: tar.exe not found ^(needs Windows 10 1803 or newer^). & goto :end_fail)

echo === Checking this is the live project ^(BP_SC_CatPara + BP_WG_CatPara present, CAT_PARAOG family absent^)...
set LIVE=0
for /f %%f in ('dir /s /b "%PROJ%\Content\BP_SC_CatPara.uasset" "%PROJ%\Content\BP_WG_CatPara.uasset" 2^>nul') do set /a LIVE+=1
set FORK=0
for /f %%f in ('dir /s /b "%PROJ%\Content\BP_SC_CAT_PARAOG.uasset" "%PROJ%\Content\BP_WG_CAT_PARAOG.uasset" 2^>nul') do set /a FORK+=1
echo     live markers %LIVE% ^(want 2^), fork markers %FORK% ^(want 0^)
if not "%LIVE%"=="2" (echo ZIP FAILED: this does not look like the live project ^(see README STEP 0^). & goto :end_fail)
if not "%FORK%"=="0" (echo ZIP FAILED: this looks like the OBSOLETE FORK of the project ^(see README STEP 0^). & goto :end_fail)
if not exist "%PROJ%\Config\Mac\MacEngine.ini" (echo ZIP FAILED: Config\Mac\MacEngine.ini is missing from the project. & goto :end_fail)
if not exist "%PROJ%\Build\Mac\Resources\Info.Template.plist" echo     note: Build\Mac\Resources\Info.Template.plist is missing - the Mac creates it from its masters.

if exist "%OUT%" (
  if not exist "%OUTDIR%\old-zips" mkdir "%OUTDIR%\old-zips"
  echo === A zip with today's name already exists - moving it to old-zips\
  move /y "%OUT%" "%OUTDIR%\old-zips\" >nul
  if exist "%OUT%.md5" move /y "%OUT%.md5" "%OUTDIR%\old-zips\" >nul
)
echo === Zipping ^(5-6 GB, typically 5-15 minutes; the window stays open^)... started %TIME%
pushd "%PROJ%"
tar.exe -a -c -f "%OUT%" ^
  --exclude=Intermediate --exclude=Binaries --exclude=Saved --exclude=DerivedDataCache --exclude=Packaged ^
  --exclude=.backups --exclude=__pycache__ --exclude=.DS_Store --exclude=*.tmp ^
  awsTutorial.uproject Build Config Content Plugins Source
set RC=%ERRORLEVEL%
popd
if not "%RC%"=="0" (echo ZIP FAILED: tar.exe returned %RC%. & goto :end_fail)
echo === Zip written %TIME%. Checking its contents...
set FAIL=0
call :count "Build/Mac/Resources/NoSandbox.entitlements" 1 "Mac entitlements file"
call :count "Config/Mac/MacEngine.ini" 1 "Config/Mac/MacEngine.ini"
call :count "Source/awsTutorial/GraphicsAutoTuneSubsystem" 2 "graphics tuner sources"
call :count "BP_SC_CatPara.uasset" 1 "live project marker"
call :countzero "/Intermediate/" "Intermediate folders leaked"
call :countzero "/Binaries/" "Binaries folders leaked"
call :countzero "/Saved/" "Saved folders leaked"
if not "%FAIL%"=="0" (echo ZIP FAILED: the zip content check failed ^(see lines above^). & goto :end_fail)
echo === Writing the checksum file...
set "HASH="
for /f "skip=1 tokens=* delims=" %%h in ('certutil -hashfile "%OUT%" MD5 ^| findstr /v /i "certutil"') do if not defined HASH set "HASH=%%h"
set "HASH=%HASH: =%"
if "%HASH%"=="" (echo ZIP FAILED: could not compute the MD5 checksum. & goto :end_fail)
> "%OUT%.md5" echo %HASH%
for %%A in ("%OUT%") do set "SIZE=%%~zA"
echo.
echo ZIP OK
echo    file:     %OUT%
echo    checksum: %OUT%.md5   ^(%HASH%^)
echo    size:     %SIZE% bytes
echo    Next: copy BOTH files to the Mac's ue541-team-package folder ^(or the lab drive^), then follow
echo    PACKAGING-STEP-BY-STEP.md, "Mac build after a change made on Windows".
goto :end_ok

:count
rem :count <text in zip listing> <minimum count> <what>
set N=0
for /f %%c in ('tar.exe -tf "%OUT%" ^| findstr /c:"%~1" ^| find /c /v ""') do set N=%%c
if %N% GEQ %~2 (echo     ok   %~3 ^(%N%^)) else (echo     BAD  %~3: found %N%, want at least %~2 & set FAIL=1)
exit /b 0
:countzero
set N=0
for /f %%c in ('tar.exe -tf "%OUT%" ^| findstr /c:"%~1" ^| find /c /v ""') do set N=%%c
if "%N%"=="0" (echo     ok   no %~2) else (echo     BAD  %~2: %N% entries & set FAIL=1)
exit /b 0

:end_fail
echo.
echo Nothing usable was produced. Send a photo/screenshot of this window to the engineer.
if "%~1"=="" pause
exit /b 1
:end_ok
if "%~1"=="" pause
exit /b 0
