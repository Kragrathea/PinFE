'use strict';
const express = require('express');
const router = express.Router();
const utils=require('./utils.js')
const fuzz = require('fuzzball');

const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const url = require('url');
const fuzzy=require('./fuzzycompare.js');


function getWheelList(wheelsDir) {

    var results = [];
    if(fs.existsSync(wheelsDir)){
        var wheelFiles = utils.findInDir(wheelsDir,".", /\.png$/);
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
 

    let wheelsDir = req.app.locals.FELibDirs+"/Wheels/";

    //early check for image.
    //Todo. refactor this.
    if (image !== undefined && fs.existsSync(wheelsDir)) {
        fs.readFile(wheelsDir + image, function (err, content) {
            if (err) {
                utils.sendMissingIcon(req,res);
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
                let options = {
                    //scorer: fuzz.token_sort_ratio,
                    scorer: fuzz.partial_ratio, //seems to work best when strings start the same.
                    processor: choice => choice.name,
                    limit: 20, // Max number of top results to return, default: no limit / 0.
                    //cutoff: 50, // Lowest score to return, default: 0
                    returnObjects: true
                };
                //let fuzzResults = fuzz.extract(bestName.split(")")[0], gameNames, options);
                let fuzzResults = fuzz.extract(qry, results, options);
                let firstResults = fuzzResults.map(a=>a.choice);
                //console.log("Fuzz result:"+[qry,firstResults])
                results=firstResults;

                // let wheelListIndex=getSearchIndex(results);
                // results = wheelListIndex.search(qry);
            }

        }
    
        if (imageIndex !== undefined) {
            if(results.length<1 || imageIndex>results.length)
            {
                utils.sendMissingIcon(req,res); 
                return;          
            }
            image = results[imageIndex].file;
        }
        if (image !== undefined || imageIndex !== undefined){
            fs.readFile(wheelsDir + image, function (err, content) {
                if (err) {
                    utils.sendMissingIcon(req,res);
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