@echo off
title Android Emulator Launcher
echo Dang khoi dong may ao Android (Medium_Phone_API_37.0)...

cd /d "%LOCALAPPDATA%\Android\Sdk\emulator"
start "" emulator.exe -avd Medium_Phone_API_37.0

exit
