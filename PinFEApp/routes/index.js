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

var tableDir = '../../../Tables/';

var masterDir = "./public/Master";


//tableDir = masterDir;

function findInDir(dir, filter, fileList = []) {
    const files = fs.readdirSync(tableDir + dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(tableDir+filePath);

        if (fileStat.isDirectory()) {
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
        results.push({
            tableName: path.basename(file),
            tableFolder: path.basename(path.dirname(file)),
            table: file,
            fsPic: fs.existsSync(tableDir + file + ".fs.jpg"),
            bgPic: fs.existsSync(tableDir + file + ".bg.jpg"),
            dtPic: fs.existsSync(tableDir + file + ".dt.jpg"),
            fsSmallPic: fs.existsSync(tableDir + file + ".fs-small.jpg"),
            bgSmallPic: fs.existsSync(tableDir + file + ".bg-small.jpg"),
            dtSmallPic: fs.existsSync(tableDir + file + ".dt-small.jpg"),
            wheelPic: fs.existsSync(tableDir + file + ".wheel.png"),
            wheelSmallPic: fs.existsSync(tableDir + file + ".wheel-small.png")
        });
    });

    callback("", results);

}

var playerActive = false;
var playerStatus = "";
router.post('/play', function (req, res) {
    var query = url.parse(req.url, true).query;
    var view = query.view;

    var arg = "-ForceFS";
    if (view && view.toLowerCase() === "dt")
        arg = "-ForceDT";
    else if (view && view.toLowerCase() === "fss")
        arg = "-ForceFSS";


    console.log("POST play table:" + req.body.table);
    //var cmd = '"f:/Games/Visual Pinball/VPinballX_cab.exe" /play ' + '"c:\\' + tableDir + req.body.table + '"';

    runPlayer('../../VisualPinball/VisualPinballCab.exe', ["/play", tableDir + req.body.table, arg,"-minimized"]);

    //captureVideo('../../VisualPinball/VisualPinballCab.exe', ["/play", tableDir + req.body.table, arg, "-minimized"], tableDir + req.body.table+".bg.mp4");

    res.end();
});
router.post('/capture', function (req, res) {
    var query = url.parse(req.url, true).query;
    var view = query.view;

    console.log("POST capture table:"+view +" " + req.body.table);

    if (view) {
        var arg = "";
        var outName;
        if (view && view.toLowerCase() === "dt") {
            arg = "-ForceDT";
            outName = tableDir + req.body.table + ".dt.mp4"
        } else if (view && view.toLowerCase() === "fss") {
            arg = "-ForceFSS";
            outName = tableDir + req.body.table + ".fss.mp4"
        } else if (view && view.toLowerCase() === "bg") {
            arg = "-ForceFS";
            outName = tableDir + req.body.table + ".bg.mp4"
        } else if (view && view.toLowerCase() === "fs") {
            arg = "-ForceFS";
            outName = tableDir + req.body.table + ".fs.mp4"
        }
        if(arg!=="")
            captureVideo('../../VisualPinball/VisualPinballCab.exe', ["/play", tableDir + req.body.table, arg, "-minimized"], outName);
    }

    res.end();
});



var curSelectedTable = "";
router.post('/select', function (req, res) {
    console.log(req.body);
    console.log("POST select table:" + req.body.table);
    curSelectedTable = req.body.table;

    res.end();
});

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

            var ffmpeg = child_process.spawn("../../Ffmpeg/ffmpeg.exe", ffargs);
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


                let ffREargs = ["-i", outName + "_", "-loglevel", "error", "-stats", "-c:v", "libx264", "-an", "-crf", "20", "-preset", "slower", "-pix_fmt", "yuv420p", "-y", "-f", "mp4", outName];
                let ffREmpeg = child_process.spawn("../../Ffmpeg/ffmpeg.exe", ffREargs);

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
                    let ffPicmpeg = child_process.spawn("../../Ffmpeg/ffmpeg.exe", ffPicargs);

                    ffPicmpeg.stdout.on('data', function (data) {
                        console.log('ffmpeg stdout: ' + data);
                    });
                    ffPicmpeg.on('error', function (err) {
                        console.log('Error running ffmpeg: ' + err);
                    });
                    ffPicmpeg.on('close', function (code) {
                        console.log('FINISHED PIC: ');

                        ffPicargs = ["-i", picName, "-vf", "scale=480:-1,transpose=1", "-y", picName.replace(".jpg", "-small.jpg")];;
                        ffPicmpeg = child_process.spawn("../../Ffmpeg/ffmpeg.exe", ffPicargs);
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

    if (typeof pic === 'undefined') {
        getTableInfo("/", function (err, tables) {
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




module.exports = router;
