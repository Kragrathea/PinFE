Echo Install Node Packages
pushd .
REM CMD /C npm install
REM pause
cd PinFEApp
CMD /C npm install
pause
popd

Echo VPinMame Setup
Echo Make sure Roms folder is set correctly
pushd .
cd Apps\VPinMAME
setup.exe
pause
Echo DMD Setup.Ignore the first red X. Register everything. 
FlexDMDUI.exe
pause
cd ..\BackglassServer
B2SBackglassServerRegisterApp.exe
start .
Echo Register Backglass by running B2SBackglassServerRegisterApp.exe. NOTE:Might have to be done as Administrator.
popd
Echo All Done!
pause