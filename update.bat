@echo off
setlocal
:PROMPT
SET /P AREYOUSURE=Update from Git. Are you sure (Y/[N])?
IF /I "%AREYOUSURE%" NEQ "Y" GOTO END

echo Updating from repo
rem git stash
rem git fetch
rem git pull
rem git stash pop

:END
endlocal

