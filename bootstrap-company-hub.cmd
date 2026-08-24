@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24.x is required before bootstrap.
  exit /b 1
)
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm 11.x is required before bootstrap.
  exit /b 1
)
call npm.cmd install
if errorlevel 1 exit /b 1
call npm.cmd run bootstrap:workstation -- %*
exit /b %errorlevel%
