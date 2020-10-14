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
const { json } = require('body-parser');


function getTablesList(req,tablesDir) {
    var files = utils.findInDir(tablesDir, ".", /\.vpx$/);
    var results = [];
    var count = 0;
    files.forEach((file) => {

        let dbase=utils.loadOrCreateTableDB(req,tablesDir+file);

        results.push({
            id: count++,
            tableName: path.basename(file),
            tableFolder: path.basename(path.dirname(file)),
            table: file,
            gameName: dbase.gameName,
            dbase: dbase,
            backglass: fs.existsSync(tablesDir + file + ".directb2s") || fs.existsSync(tablesDir + file.replace(".vpx", "") + ".directb2s"),
            fsPic: fs.existsSync(tablesDir + file + ".fs.jpg"),
            bgPic: fs.existsSync(tablesDir + file + ".bg.jpg"),
            dtPic: fs.existsSync(tablesDir + file + ".dt.jpg"),
            fsSmallPic: fs.existsSync(tablesDir + file + ".fs-small.jpg"),
            // bgSmallPic: fs.existsSync(tablesDir + file + ".bg-small.jpg"),
            // dtSmallPic: fs.existsSync(tablesDir + file + ".dt-small.jpg"),
            wheelPic: fs.existsSync(tablesDir + file + ".wheel.png"),
            // wheelSmallPic: fs.existsSync(tablesDir + file + ".wheel-small.png")
        });
    });

    console.log("Loaded tablesList. Length:" + results.length);
    return(results);
}

router.get('/', function (req, res) {
    let query = url.parse(req.url, true).query;
    let json = query.json;

    let tablesDir = req.app.locals.FETableDirs+"/";

    if (json !== undefined) {
        let results=getTablesList(req,tablesDir); 

        // var qry = query.search;
        // if (qry !== undefined) {
        //     let tablesListIndex=getSearchIndex(tablesList); 
        //     results = tablesListIndex.search(qry);
        // }
        var page = query.page;
        if (page === undefined)
            page = 0;
        var count = query.count;
        if (count === undefined)
            count = results.length;

        count = parseInt(count);
        page = parseInt(page);

        res.json(results.slice(page * count, (page + 1) * count) );
        return;
    }

    res.render('tables', { title: 'PinFE'});//, tables: results.slice(page * count, (page + 1) * count) });
});


// router.get('/sort', function (req, res) {
//     var query = url.parse(req.url, true).query;
//     var qry = query.search;
//     var image = query.image;
//     var json = query.json;

//     let tablesDir = req.app.locals.FETableDirs+"/";
//     //if (!tablesList)
//     let tablesList=getTablesList(req,tablesDir);

//     var results = tablesList;
//     if (qry !== undefined) {
//         if (!tablesListIndex)
//             createTablesIndex();

//         results = tablesListIndex.search(qry);
//     }

//     res.render('tablessort', { title: 'Sort Tables', tables: results});

// });

//todo: move to table.js
router.post('/update', function (req, res) {
    let table = req.body.table;
    let data = req.body.data;

    let tablesDir = req.app.locals.FETableDirs+"/";

    let tableFile =tablesDir + table;
    let dbase = utils.loadOrCreateTableDB(req,tableFile);

    let updated= Object.assign(dbase,data);
    //console.log("Update Table:" + [table,JSON.stringify(updated)]);

    //todo:error check. Table exists?

    utils.saveTableDB(req,tableFile,updated);

    res.send(request.body);    // echo the result back
});


module.exports = router;