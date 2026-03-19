@echo off
set PATH=C:\coder\forSs\node\node-v20.11.0-win-x64;%PATH%
cd /d C:\coder\forSs\cet6-vocabulary
call npm install
call npm run dev
pause
