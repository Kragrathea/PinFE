'use strict';
var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');

var wheelsDir = "/Games/VPTables/Wheels/" // ./public/data";


function findInDir(dir, filter, fileList = []) {
    const files = fs.readdirSync(wheelsDir + dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(wheelsDir + filePath);

        if (fileStat.isDirectory()) {
            findInDir(filePath, filter, fileList);
        } else if (filter.test(filePath)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

var wheelList = [];
var wheelListIndex;
function loadWheelList() {

    var wheelFiles = findInDir(".", /\.png$/);
    var results = [];
    wheelFiles.forEach((file) => {
        results.push({
            name: path.basename(file),
            file: file,
        })
    });

    wheelList = results;

    console.log("Loaded wheelList. Length:" + wheelList.length);

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
    wheelListIndex = new Fuse(wheelList, options);
}
loadWheelList();

router.get('/search', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = (query.query);

    var matches = wheelListIndex.search(qry);
    res.json({
        matches: matches,
    });
    //res.end();
});

router.get('/grid', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = (query.search);
    var results = wheelList
    if (qry !== undefined) {
        results = wheelListIndex.search(qry);
    }
    res.render('wheels', { title: 'PinFE Wheels', wheels: results.slice(0,100) });
});

//router.get('/', function (req, res) {
//    var query = url.parse(req.url, true).query;
//    var qry = (query.search);
//    var image = (query.image);

//    var results = wheelList
//    if (qry !== undefined) {
//        var results = wheelListIndex.search(qry);
//    }

//    if (image === undefined) {
//        res.json({
//            results: wheelList,
//        });
//    } else {
//        fs.readFile(wheelsDir + image, function (err, content) {
//            if (err) {
//                res.writeHead(400, { 'Content-type': 'text/html' })
//                console.log(err);
//                res.end("No such image");
//            } else {
//                //specify the content type in the response will be an image
//                res.writeHead(200, { 'Content-type': 'image/jpg' });
//                res.end(content);
//            }
//        });
//    }

//});

router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = (query.search);
    var image = (query.image);
    var json = (query.json);
    var imageIndex = (query.imageIndex);


    var results = wheelList
    if (qry !== undefined) {
        results = wheelListIndex.search(qry);
    }

    if (imageIndex !== undefined) {
        image = results[imageIndex].file;
    }

    if (json !== undefined) {
        res.json({
            results: results,
        });
    }
    else if (image !== undefined) {

        fs.readFile(wheelsDir + image, function (err, content) {
            if (err) {
                var size = (wheelsDir + image).length;
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
        page = parseInt(page);
        res.render('wheels', { title: 'PinFE', items: results.slice(page * 60, (page + 1) * 60) });
    }

});

module.exports = router;