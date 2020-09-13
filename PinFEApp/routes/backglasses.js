'use strict';
var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');

var bgDir = "../../..//Backglasses/"; // ./public/data";
var xml2js = require('xml2js');




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

var bgList = [];
var bgListIndex;
function loadBGList() {

    var files = findInDir(bgDir,".", /\.directb2s/);
    var results = [];
    files.forEach((file) => {
        results.push({
            name: path.basename(file),
            file: encodeURIComponent(file)
      });
    });

    bgList = results;

    console.log("Loaded bgList. Length:" + bgList.length);

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
            "name"
            //"author",
            //"comment",
        ]
    };
    bgListIndex = new Fuse(bgList, options);
}
loadBGList();

router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var image = query.image;
    var json = query.json;

    var results = bgList;
    if (qry !== undefined) {
        results = bgListIndex.search(qry);
    }

    if (json !== undefined) {
        if (query.justNames)
            results = results.map(x => x.name);
        res.json(results);
    }
    else if (image !== undefined) {
        fs.readFile(bgDir + image, "utf8", function (err, data) {
            var line = data.split("<BackglassImage Value=\"")[1];
            line = line.split("\n")[0];
            var imgData = line.replace(/&#xD;&#xA;/g, "");
            var img = Buffer.from(imgData, 'base64');

            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': img.length
            });
            res.end(img);
        });
    } else {
        var page = query.page;
        if (page === undefined)
            page = 0;
        page = parseInt(page);
        res.render('backglasses', { title: 'PinFE', items: results.slice(page * 250, (page + 1) * 250) });
    }

});


module.exports = router;