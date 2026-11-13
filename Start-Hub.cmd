@echo off
setlocal
cd /d "%~dp0"
set "DMH_NODE="
for /f "delims=" %%N in ('where node.exe 2^>nul') do if not defined DMH_NODE set "DMH_NODE=%%N"
if not defined DMH_NODE (
  for /d %%D in ("%ProgramFiles%\WindowsApps\OpenAI.CodexPrimaryRuntime.*") do (
    if exist "%%~fD\dependencies\node\bin\node.exe" set "DMH_NODE=%%~fD\dependencies\node\bin\node.exe"
  )
)
if not defined DMH_NODE (
  echo Node.js 22 or newer is needed. No software has been installed.
  pause
  exit /b 1
)
"%DMH_NODE%" --input-type=module -e "if(Number(process.versions.node.split('.')[0])<22)throw new Error('Node.js 22 or newer is required.');"
if errorlevel 1 goto failed
"%DMH_NODE%" scripts/build.mjs
if errorlevel 1 goto failed
echo.
echo Open http://127.0.0.1:4173/ in your browser.
echo Keep this window open while browsing. Ctrl+C stops the preview.
echo If the port is already in use, the earlier preview may still be running.
echo.
"%DMH_NODE%" scripts/serve.mjs
if errorlevel 1 goto failed
exit /b 0
:failed
echo.
echo The preview could not start. Read the message above.
pause
exit /b 1
