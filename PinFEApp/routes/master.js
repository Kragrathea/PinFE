'use strict';
var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');

var masterDir = "./public/data";

function findInDir(dir, filter, fileList = []) {
    const files = fs.readdirSync(masterDir + dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(masterDir + filePath);

        if (fileStat.isDirectory()) {
            findInDir(filePath, filter, fileList);
        } else if (filter.test(filePath)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

var masterTableList = [];
var masterTableIndex;
function loadMasterTableList() {

    fs.readFile(masterDir+'/MasterTableList.tsv', function (err, data) {
        if (err) throw err;
        var lines = data.toString().split("\n");

        masterTableList = []

        //table headers are on line 1
        var headers = lines[1].split("\t");

        //override headers to shorter javascript friendly.
        var headers = ["name", "comment", "type", "version", "author", "tver", "tdate", "rom"]; //,"check","notes"];
        for (var i = 2; i < lines.length; i++) {
            var obj = {};
            var currentline = lines[i].split("\t");

            for (var j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j];
            }
            masterTableList.push(obj);
        }
        console.log("Loaded masterTableList. Length:" + masterTableList.length);

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
        masterTableIndex = new Fuse(masterTableList, options);
    });
}

loadMasterTableList();

router.get('/search', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = (query.query);

    var matches = masterTableIndex.search(qry);
    res.json({
        matches: matches,
    });
    //res.end();
});

router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = (query.search);
    var image = (query.image);
    var json = (query.json);
    var imageIndex = (query.imageIndex);


    var results = masterTableList
    if (qry !== undefined) {
        results = masterTableIndex.search(qry);
    }

    //if (imageIndex !== undefined) {
    //    image = results[imageIndex].file;
    //}

    if (json !== undefined) {
        res.json({
            results: results,
        });
    }
    else if (image !== undefined) {

        //fs.readFile(wheelsDir + image, function (err, content) {
        //    if (err) {
        //        var size = (wheelsDir + image).length;
        //        res.writeHead(400, { 'Content-type': 'text/html' })
        //        console.log(err);
        //        res.end("No such image");
        //    } else {
        //        //specify the content type in the response will be an image
        //        res.writeHead(200, { 'Content-type': 'image/jpg' });
        //        res.end(content);
        //    }
        //});

    } else {
        var page = (query.page);
        if (page === undefined)
            page = 0;
        page = parseInt(page);
        res.render('master', { title: 'PinFE', items: results.slice(page * 60, (page + 1) * 60) });
    }

});

module.exports = router;
