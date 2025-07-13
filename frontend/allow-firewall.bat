@echo off
echo Adding Windows Firewall rule for Vite Dev Server...
echo This requires Administrator privileges.
echo.

REM Add firewall rule for port 3000
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=3000

echo.
if %errorlevel% equ 0 (
    echo SUCCESS: Firewall rule added successfully!
    echo Your phone should now be able to access: http://192.168.1.238:3000/
) else (
    echo ERROR: Failed to add firewall rule. Please run this script as Administrator.
    echo Right-click this file and select "Run as administrator"
)

echo.
pause
