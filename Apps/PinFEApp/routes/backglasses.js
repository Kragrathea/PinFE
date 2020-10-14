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

var xml2js = require('xml2js');


function getBGList(bgDir) {

    var results = [];
    if(fs.existsSync(bgDir)){
        var files = utils.findInDir(bgDir,".", /\.directb2s/);
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
                utils.sendMissingBackglass(req,res);
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
                utils.sendMissingBackglass(req,res); 
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
                    utils.sendMissingBackglass(req,res);
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