'use strict';
var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');

function fuzzyCompare(a, b) {
    //console.log([a, b]);

    //if (a.startsWith("Char") && b.startsWith("Char"))
    //    console.log([a, b]);
    var ca = a.toLowerCase().replace(/ /g, "").replace(/-/g, "").replace(/\(/g, "").replace(/\)/g, "");
    var cb = b.toLowerCase().replace(/ /g, "").replace(/-/g, "").replace(/\(/g, "").replace(/\)/g, "");

    //if (ca.startsWith("char") && cb.startsWith("char"))
    //    console.log([ca, cb]);
    //if (ca.Contains("pharaoh") && cb.Contains("pharaoh"))
    //    Console.WriteLine("here");

    if (ca == cb)
        return true;
    return false;
}
function simplifyName(tableName) {
    if (tableName.indexOf(')') > 0)
        tableName = tableName.substring(0, tableName.indexOf('('));
    var ca = tableName.toLowerCase().replace(/ /g, "").replace(/\-/g, "").replace(/_/g, "").replace(/\'/g, "").replace(/\"/g, "").replace(/\&/g, "").replace(/\'/g, "").replace(/\(/g, "").replace(/\)/g, "").
        replace(/\,/g, "").replace(/\./g, "").replace(/\!/g, "").replace(/the/g, "").replace(/and/g, "").replace(/do brasil/g, "").replace(/ /g, "");
    return ca;
}
function superFuzzyCompare(a, b) {
    var ca = simplifyName(a);
    var cb = simplifyName(b);

    if (ca.startsWith("char") && cb.startsWith("char"))
        console.log([ca, cb]);
    //Console.WriteLine(ca);

    if (ca == cb)
        return true;
    return false;
}

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
    results = masterList.filter(a => fuzzyCompare(a.name, query.query));
    console.log("quickSearch found:" + results.length + " for:" + simplifyName(query.query));

    if (results.length < 1)
        results = masterList.filter(a => superFuzzyCompare(a.name, query.query));
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
