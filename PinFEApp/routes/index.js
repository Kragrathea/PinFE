'use strict';
var express = require('express');
var router = express.Router();
var child_process = require('child_process');
var exec = require('child_process').exec;

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');
var imageDir = '/Games/VPTables/_index/FS/Gif/';

var tableDir = '/Games/VPTables/Sorted/VPXCollection/';

var masterDir = '/Games/VPTables/TableLists/Master';


tableDir = masterDir;

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
                fsPic: fs.existsSync(tableDir +file + ".fs.jpg"),
                bgPic: fs.existsSync(tableDir +file + ".bg.jpg"),
                dtPic: fs.existsSync(tableDir +file + ".dt.jpg"),
                fsSmallPic: fs.existsSync(tableDir +file + ".fs-small.jpg"),
                bgSmallPic: fs.existsSync(tableDir +file + ".bg-small.jpg"),
                dtSmallPic: fs.existsSync(tableDir +file + ".dt-small.jpg"),
                wheelPic: fs.existsSync(tableDir+file + ".wheel.png"),
                wheelSmallPic: fs.existsSync(tableDir +file + ".wheel-small.png"),
            })
    });

    callback("", results);

}

var playerActive = false;
var playerStatus = "";
router.post('/play', function (req, res) {
    console.log(req.body);
    console.log("POST play table:" + req.body.table);
    var cmd = '"f:/Games/Visual Pinball/VPinballX_cab.exe" /play ' + '"c:\\' + tableDir + req.body.table + '"';
    runPlayer('f:/Games/Visual Pinball/VPinballX_cab.exe', ["/play", "c:\\" + tableDir + req.body.table]);

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
        var msg = JSON.stringify({ state: "Playing", "table": curSelectedTable });
        res.write("data:"+ msg + " \n\n")
        //res.write("table: " + curSelectedTable + "\n\n");
    }
    else {
        var msg = JSON.stringify({ state: "Idle", "table": curSelectedTable });
        res.write("data:" +msg + " \n\n")
        //res.write("data: " + "Idle\n\n");
        //res.write("table: " + curSelectedTable + "\n\n");
    }
    //res.flush();

    setTimeout(() => sendStatus(res), 1000)

    //res.end()
}
router.get('/status', function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    })
    res.flushHeaders();
    sendStatus(res)
})



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
    var term = (query.term);
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    })
    res.flushHeaders();
    sendStatus(res)
})

/* GET home page. */
router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var pic = (query.image);

    if (typeof pic === 'undefined') {
        getTableInfo("/", function (err, tables) {
            res.render('index', { title: 'PinFE', tables: tables/*.slice(0,30)*/});
        });
    } else {
        //read the image using fs and send the image content back in the response
        fs.readFile(imageDir + pic, function (err, content) {
            if (err) {
                res.writeHead(400, { 'Content-type': 'text/html' })
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
    //var query = url.parse(req.url, true).query;
    //var pic = (query.image);
    //figure out backglass image name
    var bgImage = "tables" + curSelectedTable + ".bg.jpg";
    res.render('backglass', { title: 'PinFE Backglass', table: curSelectedTable,image:bgImage});


});

module.exports = router;
