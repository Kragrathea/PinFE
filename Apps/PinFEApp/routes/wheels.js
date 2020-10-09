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

        if (fileStat.isDirectory() || fileStat.isSymbolicLink()) {
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
function sendMissingIcon(req,res)
{
    let wheelsDir = req.app.locals.FELibDirs+"/Wheels/";
    fs.readFile(wheelsDir + "/Missing_Icon.png", function (err, content) {
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
    var imageIndex = query.imageIndex;
    var perPage = query.perPage;
 

    let wheelsDir = req.app.locals.FELibDirs+"/Wheels/";

    //early check for image.
    //Todo. refactor this.
    if (image !== undefined && fs.existsSync(wheelsDir)) {
        fs.readFile(wheelsDir + image, function (err, content) {
            if (err) {
                sendMissingIcon(req,res);
            } else {
                //specify the content type in the response will be an image
                res.writeHead(200, { 'Content-type': 'image/jpg' });
                res.end(content);
            }
        });
        return;

    } 


    if(true){
        var results=[];
            //cache wheel list for future use
        if( req.app.locals.globalWheelList)
            results=req.app.locals.globalWheelList
        else
            {
                results = getWheelList(wheelsDir);
                req.app.locals.globalWheelList=results;
            }
    
        if (qry !== undefined) {
            if(query.fuzzySearch){
                results=results.filter(a => fuzzy.superFuzzyCompare(a.name, qry) );
            }else{
                let wheelListIndex=getSearchIndex(results);
                results = wheelListIndex.search(qry);
            }

        }
    
        if (imageIndex !== undefined) {
            if(results.length<1 || imageIndex>results.length)
            {
                sendMissingIcon(req,res); 
                return;          
            }
            image = results[imageIndex].file;
        }
        if (image !== undefined || imageIndex !== undefined){
            fs.readFile(wheelsDir + image, function (err, content) {
                if (err) {
                    sendMissingIcon(req,res);
                } else {
                    //specify the content type in the response will be an image
                    res.writeHead(200, { 'Content-type': 'image/jpg' });
                    res.end(content);
                }
            });
        }else{

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
    }

});

module.exports = router;