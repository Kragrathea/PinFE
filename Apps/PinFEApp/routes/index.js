'use strict';
var express = require('express');
var router = express.Router();
var child_process = require('child_process');
var exec = require('child_process').exec;

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');
//var imageDir = '/Games/VPTables/_index/FS/Gif/';


var masterDir = "./public/Master";


//tableDir = masterDir;

function findInDir(dir, filter, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(filePath);

        if (fileStat.isDirectory() || fileStat.isSymbolicLink()) {
            findInDir(filePath, filter, fileList);
        } else if (filter.test(filePath)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}



//get the list of jpg files in the image dir
function getImages(imageDir, callback) {
    var fileType = '.gif',
        files = [], i;
    fs.readdir(imageDir, function (err, list) {
        for (i = 0; i < list.length; i++) {
            if (path.extname(list[i]) === fileType) {
                files.push(list[i]); //store the file name into the array files
            }
        }
        callback(err, files);
    });
}
function getTableInfo(dir, callback) {

    // Usage
    var tableFiles = findInDir(dir, /\.vpx$/);
    var results = [];
    tableFiles.forEach((file) => {

        var bgFile=null
        if(fs.existsSync(file.replace(".vpx", "") + ".directb2s"))
            bgFile=(file.replace(".vpx", "") + ".directb2s");
        else if (fs.existsSync(file + ".directb2s"))
            bgFile=(file + ".directb2s");

        if(bgFile)
            bgFile=path.relative( dir, bgFile )
    
        let relFile = path.relative( dir, file )
        results.push({
            tableName: path.basename(relFile),
            tableFolder: path.basename(path.dirname(relFile)),
            table: relFile,
            backglass:bgFile,
            fsPic: fs.existsSync(file + ".fs.jpg"),
            bgPic: fs.existsSync(file + ".bg.jpg"),
            dtPic: fs.existsSync(file + ".dt.jpg"),
            fsSmallPic: fs.existsSync(file + ".fs-small.jpg"),
            bgSmallPic: fs.existsSync(file + ".bg-small.jpg"),
            dtSmallPic: fs.existsSync(file + ".dt-small.jpg"),
            wheelPic: fs.existsSync(file + ".wheel.png"),
            wheelSmallPic: fs.existsSync(file + ".wheel-small.png")
        });
    });

    callback("", results);

}

var playerActive = false;
var playerStatus = "";
router.post('/play', function (req, res) {
    var query = url.parse(req.url, true).query;
    var view = query.view;
    var editMode = query.editMode;

    var arg = "-ForceFS";
    if (view && view.toLowerCase() === "dt")
        arg = "-ForceDT";
    else if (view && view.toLowerCase() === "fss")
        arg = "-ForceFSS";


    console.log("POST play table:" + req.body.table);
    //var cmd = '"f:/Games/Visual Pinball/VPinballX_cab.exe" /play ' + '"c:\\' + tableDir + req.body.table + '"';

    let tableDir=req.app.locals.FETableDirs+"/";
    let tableFile= tableDir + req.body.table;
    tableFile= path.resolve(tableFile);

    //copy over roms.
    prepareTable(tableFile);
    if(query.editMode){
        runPlayer('../VisualPinball/VisualPinballCab.exe', ["/play", tableFile, arg,""]);
    }else{
        runPlayer('../VisualPinball/VisualPinballCab.exe', ["/play", tableFile, arg,"-minimized"]);
    }

    //captureVideo('../../VisualPinball/VisualPinballCab.exe', ["/play", tableDir + req.body.table, arg, "-minimized"], tableDir + req.body.table+".bg.mp4");

    res.end();
});
router.post('/capture', function (req, res) {
    var query = url.parse(req.url, true).query;
    var view = query.view;

    console.log("POST capture table:"+view +" " + req.body.table);
    let tableDir=req.app.locals.FETableDirs+"/";
    let tableFile= tableDir + req.body.table;
    tableFile= path.resolve(tableFile)

    if (view) {
        var arg = "";
        var outName;
        var xOffset = -1920;    //TODO:Make config!!!
        if (view && view.toLowerCase() === "dt") {
            arg = "-ForceDT";
            outName = tableDir + req.body.table + ".dt.mp4"
        } else if (view && view.toLowerCase() === "fss") {
            arg = "-ForceFSS";
            outName = tableDir + req.body.table + ".fss.mp4"
        } else if (view && view.toLowerCase() === "bg") {
            arg = "-ForceFS";
            outName = tableDir + req.body.table + ".bg.mp4"
            xOffset=0;
        } else if (view && view.toLowerCase() === "fs") {
            arg = "-ForceFS";
            outName = tableDir + req.body.table + ".fs.mp4"
        }
        if(arg!=="")
        {
            //copy over roms.
            prepareTable(tableFile);
            captureVideo('../VisualPinball/VisualPinballCab.exe', ["/play", tableFile, arg, "-minimized"], outName);
        }
    }

    res.end();
});



var curSelectedTable = "";
router.post('/select', function (req, res) {
    //console.log(req.body);
    //console.log("POST select table:" + req.body.table);
    curSelectedTable = req.body.table;

    res.end();
});

function prepareTable(tableFile) {
    console.log("prepareTable:"+tableFile);
    let tableRomsDir = path.dirname(tableFile) + "\\Roms\\";
    if (romPath && fs.existsSync(tableRomsDir)) {
        const files = fs.readdirSync(tableRomsDir);

        files.forEach((file) => {
            const filePath = path.join(tableRomsDir, file);
            if (!fs.existsSync(romPath + file)) {
                //need copy
                console.log("Copy:" + filePath + "->" + romPath);
                fs.copyFileSync(filePath,romPath);
            } else {
                //already there.
                //console.log("Exists:"+romPath+file);
            }
        });
    }
}

function sendStatus(res) {

    if (playerActive) {
        let msg = JSON.stringify({ state: "Playing", "table": curSelectedTable });
        res.write("data:" + msg + " \n\n");
        //res.write("table: " + curSelectedTable + "\n\n");
    }
    else {
        let msg = JSON.stringify({ state: "Idle", "table": curSelectedTable });
        res.write("data:" + msg + " \n\n");
        //res.write("data: " + "Idle\n\n");
        //res.write("table: " + curSelectedTable + "\n\n");
    }
    //res.flush();

    setTimeout(() => sendStatus(res), 1000);

    //res.end()
}
router.get('/status', function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();
    sendStatus(res);
});

var captureActive = false;
function captureVideo(command, args, outName) {
    console.log("Starting capture:"+args);
    if (playerActive)
        return;

    console.log("Capture outName:" + outName);
    var child = child_process.spawn(command, args);
    playerActive = true;
    child.on('error', function (err) {
        console.log('Error running player: ' + err);
        playerActive = false;
    });

    var scriptOutput = "";
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function (data) {
        console.log('stdout: ' + data);

        if (data.toString().indexOf("VPTableStart")>-1) {

            var ffargs = ["-loglevel", "error", "-stats", "-f", "gdigrab", "-framerate", "30", "-offset_x", "-1920", "-offset_y", "0",
                "-video_size", "1920x1080", "-ss", "6", "-t", "00:00:2", "-i", "desktop", "-c:v", "h264_nvenc", "-an", "-preset", "lossless", "-y", "-f", "mp4",
                outName+"_"];

            var ffmpeg = child_process.spawn("../Ffmpeg/ffmpeg.exe", ffargs);
            captureActive = true;
            ffmpeg.on('error', function (err) {
                console.log('Error running player: ' + err);
                captureActive = false;
            });

            ffmpeg.stdout.setEncoding('utf8');
            ffmpeg.stdout.on('data', function (data) {
                console.log('ffmpeg stdout: ' + data);
            });

            ffmpeg.stderr.setEncoding('utf8');
            ffmpeg.stderr.on('data', function (data) {
                console.log('ffmpeg stderr: ' + data);

                //data = data.toString();
                //scriptOutput += data;
            });

            ffmpeg.on('close', function (code) {
                //kill vp
                child.kill();

                // console.log("Screenshot Backglass")
                // var xxargs = ["foo.png"];

//                var xx = child_process.spawn("../ScreenCapture.bat", xxargs);

            //     child_process.exec('..\\screenCapture.bat foo.png Form1', function(error, stdout, stderr) {
            //         console.log("ScreenCapture:"+error);
            //         console.log("ScreenCapture:"+stdout);
            //         console.log("ScreenCapture:"+stderr);
            //         //kill vp
            //         child.kill();

            //   });
                // xx.on('error', function (err) {
                //     console.log('Error running ss: ' + err);

                // });

                // xx.stdout.setEncoding('utf8');
                // xx.stdout.on('data', function (data) {
                //     console.log('xx stdout: ' + data);
                //                         //kill vp
                //                         child.kill();
                // });



                let ffREargs = ["-i", outName + "_", "-loglevel", "error", "-stats", "-c:v", "libx264", "-an", "-crf", "20", "-preset", "slower", "-pix_fmt", "yuv420p", "-y", "-f", "mp4", outName];
                let ffREmpeg = child_process.spawn("../Ffmpeg/ffmpeg.exe", ffREargs);

                ffREmpeg.stdout.setEncoding('utf8');
                ffREmpeg.stdout.on('data', function (data) {
                    console.log('ffmpeg stdout: ' + data);
                });
                ffREmpeg.on('error', function (err) {
                    console.log('Error running ffmpeg: ' + err);
                });


                ffREmpeg.on('close', function (code) {
                    console.log('RE Encode finished: ' + data);
                    fs.unlinkSync(outName + "_");

                    let picName = outName.replace(".mp4", ".jpg");
                    let ffPicargs = ["-ss", "1", "-i", outName, "-vframes", "1", "-q:v", "2", "-loglevel", "error", "-y", "-stats", picName];
                    let ffPicmpeg = child_process.spawn("../Ffmpeg/ffmpeg.exe", ffPicargs);

                    ffPicmpeg.stdout.on('data', function (data) {
                        console.log('ffmpeg stdout: ' + data);
                    });
                    ffPicmpeg.on('error', function (err) {
                        console.log('Error running ffmpeg: ' + err);
                    });
                    ffPicmpeg.on('close', function (code) {
                        console.log('FINISHED PIC: ');

                        if(picName.indexOf(".vpx.fs")>-1)//if fullscreen table pic then rotate small version (transpose=1)
                            ffPicargs = ["-i", picName, "-vf", "scale=480:-1,transpose=1", "-y", picName.replace(".jpg", "-small.jpg")];
                        else
                            ffPicargs = ["-i", picName, "-vf", "scale=480:-1", "-y", picName.replace(".jpg", "-small.jpg")];;
                        ffPicmpeg = child_process.spawn("../Ffmpeg/ffmpeg.exe", ffPicargs);
                    });



                });

                //and any backglasses running. 
                //var bgkiller = child_process.spawn("taskkill", ["/IM", "B2SBackglassServerEXE.exe", "/F"]);

                //bgkiller.stderr.setEncoding('utf8');
                //bgkiller.stderr.on('data', function (data) {
                //    console.log('ffmpeg stderr: ' + data);
                //});


                captureActive = false;
            });




        }

    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function (data) {
        console.log('stderr: ' + data);

        data = data.toString();
        scriptOutput += data;
    });

    child.on('close', function (code) {
        playerActive = false;
        //callback(scriptOutput, code);
    });
}

var Registry = require('winreg')
var romPath=null;//todo make this sync
function loadRomPath()
{
    let   regKey = new Registry({                                       // new operator is optional
        hive: Registry.HKCU,                                        // open registry hive HKEY_CURRENT_USER
        key:  '\\Software\\Freeware\\Visual PinMame\\globals' // key containing autostart programs
        })

    regKey.values(function (err, items /* array of RegistryItem */) {
    if (err)
        console.log('ERROR: '+err);
    else
        for (var i=0; i<items.length; i++){
            //console.log('ITEM: '+items[i].name+'\t'+items[i].type+'\t'+items[i].value);
            if(items[i].name==="rompath"){
                romPath=items[i].value+"\\";
                console.log("Setting romPath:"+romPath);
            }
        }
    });
}
loadRomPath();//todo make this sync

function runPlayer(command, args, callback) {
    console.log("Starting Process.");
    if (playerActive)
        return;

    var child = child_process.spawn(command, args);
    playerActive = true;
    child.on('error', function (err) {
        console.log('Error running player: ' + err);
        playerActive = false;
    });

    var scriptOutput = "";
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function (data) {
        console.log('stdout: ' + data);

        data = data.toString();
        scriptOutput += data;
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function (data) {
        console.log('stderr: ' + data);

        data = data.toString();
        scriptOutput += data;
    });

    child.on('close', function (code) {
        playerActive = false;
        //callback(scriptOutput, code);
    });
}


var wheelsDir = '/Games/VPTables/Wheels';
var wheelFiles;
router.get('/search', function (req, res) {
    var query = url.parse(req.url, true).query;
    var term = query.term;
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();
    sendStatus(res);
});

/* GET home page. */
router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var pic = query.image;

    let tableDir=req.app.locals.FETableDirs+"/";

    if (typeof pic === 'undefined') {
        getTableInfo(tableDir, function (err, tables) {
            res.render('index', { title: 'PinFE', tables: tables/*.slice(0,30)*/});
        });
    } else {
        //read the image using fs and send the image content back in the response
        fs.readFile(imageDir + pic, function (err, content) {
            if (err) {
                res.writeHead(400, { 'Content-type': 'text/html' });
                console.log(err);
                res.end("No such image");
            } else {
                //specify the content type in the response will be an image
                res.writeHead(200, { 'Content-type': 'image/jpg' });
                res.end(content);
            }
        });
    }

});

router.get('/backglass', function (req, res) {
    var query = url.parse(req.url, true).query;
    var pic = query.image;
    //figure out backglass image name
    var bgImage = "tables/?image=" + curSelectedTable + ".bg.jpg";
    res.render('backglass', { title: 'PinFE Backglass', table: curSelectedTable, image: encodeURIComponent(bgImage) });
});
router.get('/wheel', function (req, res) {
    var query = url.parse(req.url, true).query;
    var pic = query.image;
    //figure out backglass image name
    var bgImage = "tables/?image=" + curSelectedTable + ".wheel.jpg";
    res.render('wheel', { title: 'PinFE', table: curSelectedTable, image: encodeURIComponent(bgImage) });
});

router.get('/playfield', function (req, res) {
    var query = url.parse(req.url, true).query;
    var pic = query.image;
    //figure out backglass image name
    var bgImage = "tables/?image=" + curSelectedTable + ".fs.jpg";
    res.render('playfield', { title: 'PinFE', table: curSelectedTable, image: encodeURIComponent(bgImage) });
});




module.exports = router;
