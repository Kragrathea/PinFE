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



function getMasterTableList() {

    var masterDir = "./public/data";

    let results = [];
    let data = fs.readFileSync(masterDir + '/MasterTableList.tsv');
    if(data) {
        //if (err) throw err;
        var lines = data.toString().split("\n");


        //table headers are on line 1
        var headers = lines[1].split("\t");

        //override headers to shorter javascript friendly.
        headers = ["name", "comment", "type", "vpver", "author", "version", "date", "rom"]; //,"check","notes"];

        for (var i = 2; i < lines.length; i++) { //NOTE 2. Bypassheaders.
            var obj = {id:i-2}; //NOTE -2
            var currentline = lines[i].split("\t");
            for (var j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j];
            }
            if(obj.name!=="")//get rid of blank rows.
                results.push(obj);
        }
    }
        
    console.log("Loaded masterTableList. Length:" + results.length);
    return results;


        // app.locals.masterTableQuickSearch = function (tableName) {

        //     console.log("quickSearch for:" + tableName);
        //     var results = app.locals.masterTableList.filter(a => fuzzyCompare(a.name, tableName));
        //     console.log("quickSearch found:" + results.length + " for:" + simplifyName(tableName));

        //     if (results.length < 1)
        //         results = app.locals.masterTableList.filter(a => superFuzzyCompare(a.name, tableName));
        //     console.log("quickSearch found:" + results.length + " for:" + simplifyName(tableName));
        //     return (results);
        // }

    
}


function getSearchIndex(masterList) {

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
    let masterListIndex = new Fuse(masterList, options);
    return(masterListIndex);

    
}

router.get('/search', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.query;

    var matches = masterTableIndex.search(qry);
    res.json({
        matches: matches
    });

});
router.get('/quickSearch', function (req, res) {
    let query = url.parse(req.url, true).query;
    let qry = query.query;

    let results = getMasterTableList();
    //let searchIndex = getSearchIndex(masterList)

    console.log("quickSearch for:" + query.query);
    results = masterList.filter(a => fuzzy.fuzzyCompare(a.name, query.query));
    console.log("quickSearch found:" + results.length + " for:" + simplifyName(query.query));

    if (results.length < 1)
        results = masterList.filter(a => fuzzy.superFuzzyCompare(a.name, query.query));
    console.log("quickSearch found:" + results.length + " for:" + simplifyName(query.query));
 
    res.json(results);
});



router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var image = query.image;
    var json = query.json;

    let results = getMasterTableList();
    if (qry !== undefined) {
        results = res.app.locals.masterTableIndex.search(qry);
    }

    if (json !== undefined) {
        if (query.justNames)
            results = results.map(x => x.name);
        res.json( results );
    }
    else {
        var page = query.page;
        if (page === undefined)
            page = 0;
        page = parseInt(page);
        res.render('master', { title: 'PinFE', items: results.slice(page * 100, (page + 1) * 100) });
    }

});

module.exports = router;
