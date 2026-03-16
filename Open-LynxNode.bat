@echo off
setlocal
cd /d "%~dp0"

echo [LynxNode] Checking dependencies...
if not exist node_modules (
  echo [LynxNode] Installing npm packages for first run...
  call npm install
  if errorlevel 1 (
    echo [LynxNode] npm install failed.
    pause
    exit /b 1
  )
)

set PORT=3000
:find_port
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
  set /a PORT+=1
  goto find_port
)
echo [LynxNode] Using port %PORT%.

if exist .next\BUILD_ID (
  echo [LynxNode] Existing build found. Skipping rebuild.
) else (
  echo [LynxNode] Building app...
  call npm run build
  if errorlevel 1 (
    echo [LynxNode] Build failed.
    pause
    exit /b 1
  )
)

echo [LynxNode] Open this address in your browser:
echo [LynxNode] http://localhost:%PORT%
start "" http://localhost:%PORT%
echo [LynxNode] Starting production server on port %PORT%
call npm run start -- --port %PORT%
