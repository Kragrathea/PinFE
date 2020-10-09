'use strict';
var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');

var xml2js = require('xml2js');




function findInDir(baseDir,dir, filter, fileList = []) {
    const files = fs.readdirSync(baseDir + dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(baseDir + filePath);

        if (fileStat.isDirectory() || fileStat.isSymbolicLink()) {
            findInDir(baseDir,filePath, filter, fileList);
        } else if (filter.test(filePath)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function getBGList(bgDir) {

    var results = [];
    if(fs.existsSync(bgDir)){
        var files = findInDir(bgDir,".", /\.directb2s/);
        files.forEach((file) => {
            results.push({
                name: path.basename(file),
                file: (file)
        });
        });
    }
    return(results);
}
function getSearchIndex(bgList) {

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
    let bgListIndex = new Fuse(bgList, options);
    return(bgListIndex);
}
function sendMissing(req,res)
{
    let bgDir = req.app.locals.FELibDirs+"/Backglasses/"; // ./public/data";
    fs.readFile(bgDir + "/Missing_Backglass.png", function (err, content) {
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
var fuzzy=require('./fuzzycompare.js');
router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var image = query.image;
    var json = query.json;

    let bgDir = req.app.locals.FELibDirs+"/Backglasses/"; // ./public/data";
    if (image !== undefined && fs.existsSync(bgDir)) {
        fs.readFile(bgDir + image, "utf8", function (err, data) {
            var line = data.split("<BackglassImage Value=\"")[1];
            if(line){
                line = line.split("\n")[0];
                var imgData = line.replace(/&#xD;&#xA;/g, "");
                var img = Buffer.from(imgData, 'base64');

                res.writeHead(200, {
                    'Content-Type': 'image/png',
                    'Content-Length': img.length
                });
                res.end(img);
            }else{
                sendMissing(req,res);
            }
        });
    } else {
        var results = getBGList(bgDir);
        if (qry !== undefined) {
            if(query.fuzzySearch){
                results=results.filter(a => fuzzy.superFuzzyCompare(a.name, qry) );
            }else{
                let bgListIndex=getSearchIndex(results);
                results = bgListIndex.search(qry);
            }
        }
        if (query.imageIndex !== undefined) {
            if(results.length<1 || query.imageIndex>results.length)
            {
                sendMissing(req,res); 
                return;          
            }
            image = results[query.imageIndex].file;
        }
        if (image !== undefined){
            fs.readFile(bgDir + image, "utf8", function (err, data) {
                var line = data.split("<BackglassImage Value=\"")[1];
                if(line){
                    line = line.split("\n")[0];
                    var imgData = line.replace(/&#xD;&#xA;/g, "");
                    var img = Buffer.from(imgData, 'base64');
    
                    res.writeHead(200, {
                        'Content-Type': 'image/png',
                        'Content-Length': img.length
                    });
                    res.end(img);
                }else{
                    // error not backglass
                    sendMissing(req,res);
                }
            });
            return;//all done
        }    
        if (json !== undefined) {
            if (query.justNames)
                results = results.map(x => x.name);
            res.json(results);
            return;//all done
        }

        var page = query.page;
        if (page === undefined)
            page = 0;
        page = parseInt(page);
        res.render('backglasses', { title: 'PinFE', items: results.slice(page * 250, (page + 1) * 250) });
    }

});


module.exports = router;