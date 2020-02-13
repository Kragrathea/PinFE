'use strict';
var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');

var tablesDir = "/Games/VPTables/Sorted/VPXCollection/" // ./public/data";


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

var tablesList = [];
var tablesListIndex;
function loadTablesList() {

    var files = findInDir(tablesDir,".", /\.vpx$/);
    var results = [];
    files.forEach((file) => {
        results.push({
            name: path.basename(file),
            file: encodeURIComponent(file),
        })
    });

    tablesList = results;

    console.log("Loaded tablesList. Length:" + tablesList.length);

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
loadTablesList();

router.get('/search', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = (query.query);

    var matches = tablesList.search(qry);
    res.json({
        matches: matches,
    });
    //res.end();
});

router.get('/display', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = (query.search);
    var results = tablesList
    if (qry !== undefined) {
        results = tablesListIndex.search(qry);
    }
    res.render('tables', { title: 'PinFE', tables: results.slice(0,20) });
});

router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = (query.search);
    var image = (query.image);
    var json = (query.json);
    
    var results = tablesList
    if (qry !== undefined) {
        results = tablesListIndex.search(qry);
    }

    if (json !== undefined) {
        res.json({
            results: results,
        });
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