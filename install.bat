Echo Install Node Packages
pushd .
cd .\Apps\PinFEApp
CMD /C npm install
pause
popd

Echo VPinMame Setup
Echo Make sure Roms folder is set correctly
Echo Set default Rom options
pushd .
cd Apps\VPinMAME
setup.exe
pause
Echo DMD Setup. Ignore the first red X. Register everything. 
Echo Possibly setup DMD positions. 
FlexDMDUI.exe
pause
cd ..\BackglassServer
B2SBackglassServerRegisterApp.exe
start .
Echo Register Backglass by running B2SBackglassServerRegisterApp.exe. NOTE:Might have to be done as Administrator.
popd
pause
Echo Configure Backglass positions
B2S_SetUp.exe
Echo Test and configure VP. Video options, keys, etc.
.\Apps\VisualPinball\VisualPinballCab.exe -forceFS /play ".\Tables\Test\Nudge Test and Calibration\Nudge Test and Calibration.vpx"
Echo All Done!
pause