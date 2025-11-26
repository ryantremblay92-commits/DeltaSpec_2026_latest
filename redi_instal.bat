@echo off
:: Reset WSL user password using root

:: === CONFIGURATION ===
set DISTRO=Ubuntu
set USERNAME=varun

echo.
echo =======================================
echo  Resetting WSL Password for %DISTRO%
echo =======================================

:: Set default user to root temporarily
echo [INFO] Setting default user to root...
wsl --set-user %DISTRO% root

:: Launch WSL as root to reset password
echo [INFO] Launching WSL as root...
echo.
echo [ACTION] Inside the shell, run:
echo passwd %USERNAME%
echo and enter your NEW password twice.
echo.
pause

wsl -d %DISTRO% -u root

:: Restore default user to your username
echo [INFO] Restoring default user to %USERNAME%...
wsl --set-user %DISTRO% %USERNAME%

echo.
echo [SUCCESS] Password reset completed.
pause
exit
