START chrome --user-data-dir=C:\TEMP\acc1 --start-fullscreen --new-window http://localhost:4000 --window-position=0,0 
rem START chrome --user-data-dir=C:\TEMP\acc2 --start-fullscreen --new-window "http://localhost:4000/backglass" --window-position=0,0 
START chrome --user-data-dir=C:\TEMP\acc2 --new-window "http://localhost:4000/backglass" --window-position=1920,0 --window-size=1920,1080
REM xSTART chrome --user-data-dir=C:\TEMP\acc2 --start-fullscreen --new-window "http://localhost:4000/playfield" --window-position=2000,0 

rem START chrome --new-window http://localhost:4000  