@echo off
set PORT=%1
if "%PORT%"=="" set PORT=4321
"C:\Program Files\Git\usr\bin\perl.exe" "%~dp0server.pl"
