@echo off
REM ------------------------------------------------------------
REM toggle-executionpolicy.bat
REM Toggles PowerShell ExecutionPolicy for the CurrentUser scope
REM ------------------------------------------------------------

REM 1. Read current CurrentUser policy
powershell -NoProfile -Command "Write-Host 'Checking current execution policy...'"
for /f "usebackq tokens=*" %%P in (`powershell -NoProfile -Command "Get-ExecutionPolicy -Scope CurrentUser"`) do set "curPolicy=%%P"

echo Current user execution policy is: %curPolicy%

REM 2. Toggle policy
if /i "%curPolicy%"=="Unrestricted" (
    echo.
    echo ^> Changing to Restricted...
    powershell -NoProfile -Command "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Restricted -Force; Write-Host 'Policy changed to Restricted' -ForegroundColor Green"
) else (
    echo.
    echo ^> Changing to Unrestricted...
    powershell -NoProfile -Command "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted -Force; Write-Host 'Policy changed to Unrestricted' -ForegroundColor Green"
)

REM 3. Display the new policy
echo.
echo New policy:
powershell -NoProfile -Command "Write-Host ('Current User Execution Policy: ' + (Get-ExecutionPolicy -Scope CurrentUser)) -ForegroundColor Cyan"

REM 4. Unblock Glitch Scripts
set "scriptDir=%~dp0"
set "ps1File=%scriptDir%organize-glitch-zips.ps1"
set "ps2File=%scriptDir%download-assets.ps1"

echo Unblocking script: %ps1File%
powershell -NoProfile -Command "Unblock-File -Path '%ps1File%'"

echo Unblocking script: %ps2File%
powershell -NoProfile -Command "Unblock-File -Path '%ps2File%'"

REM 5. Pause for confirmation
echo.
echo Press any key to exit...
pause > nul