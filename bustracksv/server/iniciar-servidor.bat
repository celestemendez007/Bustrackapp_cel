@echo off
REM Script para iniciar el servidor BusTrackSV
REM Usa este archivo si PowerShell da problemas

cd /d "%~dp0"
echo Iniciando servidor BusTrackSV...
node src/index.js
pause





