Echo Install Node Packages
pushd .
npm install
pause
cd PinFEApp
npm install
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
B2SBackglassServerRegisterApp.exe
popd
Echo All Done!
pause

