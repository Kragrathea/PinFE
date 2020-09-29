Echo Install Node Packages
pushd .
CMD /C npm install
pause
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
Echo DMD Setup
FlexDMDUI.exe
pause
cd ..\BackglassServer
Echo Register Backglass. NOTE:Might have to be done as Administrator.
B2SBackglassServerRegisterApp.exe
popd
Echo All Done!
pause