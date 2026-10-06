@echo off
rem Launcher script for OSTRO system
if "%~1"=="system" goto run_system
if "%~1"=="" goto run_system

:run_system
call "%~dp0system.bat"
