@echo off
setlocal
:PROMPT
SET /P AREYOUSURE=Update from Git. Are you sure (Y/[N])?
IF /I "%AREYOUSURE%" NEQ "Y" GOTO END

echo Updating from repo
git stash
git fetch
git pull
git stash pop

:END
endlocal

