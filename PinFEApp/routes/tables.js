'use strict';
var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');

var tablesDir = "../../../Tables/" // ./public/data";


function findInDir(baseDir,dir, filter, fileList = []) {
    const files = fs.readdirSync(baseDir + dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(baseDir + filePath);

        if (fileStat.isDirectory()) {
            findInDir(baseDir,filePath, filter, fileList);
        } else if (filter.test(filePath)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

var tablesList;
var tablesListIndex;
function loadTablesList() {

    function findBackglass() {

    }

    var files = findInDir(tablesDir, ".", /\.vpx$/);
    var results = [];
    var count = 0;
    files.forEach((file) => {
        //if db file exists load
        //else default info 
        results.push({
            id: count++,
            tableName: path.basename(file),
            tableFolder: path.basename(path.dirname(file)),
            table: file,
            master: '/master/?search=' + encodeURIComponent(path.basename(path.dirname(file))) + "&json=1",
            //master: app.locals.masterTableIndex.search(path.basename(path.dirname(file)))[0],
            backglass: fs.existsSync(tablesDir + file + ".directb2s") || fs.existsSync(tablesDir + file.replace(".vpx", "") + ".directb2s"),
            fsPic: fs.existsSync(tablesDir + file + ".fs.jpg"),
            bgPic: fs.existsSync(tablesDir + file + ".bg.jpg"),
            dtPic: fs.existsSync(tablesDir + file + ".dt.jpg"),
            fsSmallPic: fs.existsSync(tablesDir + file + ".fs-small.jpg"),
            bgSmallPic: fs.existsSync(tablesDir + file + ".bg-small.jpg"),
            dtSmallPic: fs.existsSync(tablesDir + file + ".dt-small.jpg"),
            wheelPic: fs.existsSync(tablesDir + file + ".wheel.png"),
            wheelSmallPic: fs.existsSync(tablesDir + file + ".wheel-small.png"),
        })
    });

    tablesList = results;

    console.log("Loaded tablesList. Length:" + tablesList.length);
}
function createTablesIndex() {
    
    var options = {
        shouldSort: true,
        threshold: 0.3,
        //includeScore:true,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 3,
        tokenize: true,
        keys: [
            "name",
            //"author",
            //"comment",
        ]
    };
    tablesListIndex = new Fuse(tablesList, options);
}


router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = (query.search);
    var image = (query.image);
    var json = (query.json);

    if (!tablesList)
        loadTablesList(); 

    var results = tablesList
    if (qry !== undefined) {
        if (!tablesListIndex)
            createTablesIndex(); 

        results = tablesListIndex.search(qry);
    }

    if (json !== undefined) {
        res.json(tablesList);
    }
    else if (image !== undefined) {
        fs.readFile(tablesDir + image, function (err, content) {
            if (err) {
                var size = (tablesDir + image).length;
                res.writeHead(400, { 'Content-type': 'text/html' })
                console.log(err);
                res.end("No such image");
            } else {
                //specify the content type in the response will be an image
                res.writeHead(200, { 'Content-type': 'image/jpg' });
                res.end(content);
            }
        });

    } else {
        var page = (query.page);
        if (page === undefined)
            page = 0;
        var count = (query.count);
        if (count === undefined)
            count = 20;

        count = parseInt(count);
        page = parseInt(page);
        res.render('tables', { title: 'PinFE', tables: results.slice(page * count, (page + 1) * count) });
    }

});

module.exports = router;