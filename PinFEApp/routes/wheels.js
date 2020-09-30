'use strict';
var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');




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


function getWheelList(wheelsDir) {

    var results = [];
    if(fs.existsSync(wheelsDir)){
        var wheelFiles = findInDir(wheelsDir,".", /\.png$/);
        wheelFiles.forEach((file) => {
            results.push({
                name: path.basename(file),
                file: file
            });
        });
    }
    //wheelList = results;

    console.log("Loaded wheelList. Length:" + results.length);
    return results;
}

function getSearchIndex(wheelList) {

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
    let wheelListIndex = new Fuse(wheelList, options);
    return(wheelListIndex);
}

router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var image = query.image;
    var json = query.json;
    var imageIndex = query.imageIndex;
    var perPage = query.perPage;

    let wheelsDir = req.app.locals.FEDataDir+"/Library/Wheels/";

    if (image !== undefined && fs.existsSync(wheelsDir)) {
        fs.readFile(wheelsDir + image, function (err, content) {
            if (err) {
                var size = (wheelsDir + image).length;
                res.writeHead(400, { 'Content-type': 'text/html' });
                console.log(err);
                res.end("No such image");
            } else {
                //specify the content type in the response will be an image
                res.writeHead(200, { 'Content-type': 'image/jpg' });
                res.end(content);
            }
        });

    } else {
        var results = getWheelList(wheelsDir);
    
        if (qry !== undefined) {
            let wheelListIndex=getSearchIndex(results);
            results = wheelListIndex.search(qry);
        }
    
        if (imageIndex !== undefined) {
            image = results[imageIndex].file;
        }
    
        if (perPage === undefined && isNaN(perPage)) {
            perPage=100;
        }
        if (json !== undefined) {
            res.json({
                results: results
            });
        }
 
        var page = query.page;
        if (page === undefined)
            page = 0;
        page = parseInt(page);
        res.render('wheels', { title: 'PinFE', items: results.slice(page * perPage, (page + 1) * perPage) });
    }

});

module.exports = router;