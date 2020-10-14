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

router.get('/names', function (req, res) {
    var query = url.parse(req.url, true).query;

    let gameNames = req.app.locals.globalGameNameList;

    var qry = query.search;
    if (qry !== undefined) {
    }

    res.json( gameNames );

});

router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;

    if (query.json !== undefined) {
        let results = req.app.locals.globalGameList;
        var qry = query.search;
        if (qry !== undefined) {
            results = res.app.locals.masterTableIndex.search(qry);
        }
            
        let games = Object.values(results).flat();  

        // if(query.includeTables){
        //     // let gameNames = games.map(a=>a.name);  
        //     // gameNames = [...new Set(gameNames)];
        //     // for(let gn of gameNames)
        //     //     console.log(gn)
        //     let tablesDir = req.app.locals.FETableDirs+"/"; 
        //     var tables = utils.findInDir(tablesDir, ".", /\.vpx$/);

        //     for(let table of tables){
        //         let bestName = fuzzy.tableGetBestName(table);

        //         //Use an override name from .dbase file if it exists.
        //         if (fs.existsSync(tablesDir+table + ".dbase")) {
        //             //console.log(file)
        //             let data = fs.readFileSync(tablesDir+table + ".dbase");
        //             if (data){
        //                 let dbase = JSON.parse(data);
        //                 if(dbase.masterName){
        //                     console.log("Override bestName:"+dbase.masterName)
        //                     bestName=dbase.masterName;
        //                 }
        //             }
        //         }

        //         let found=false;
        //         for(let game of games){
        //             if(fuzzy.superFuzzyCompare(game.name,bestName)){
        //                 game.tables.push({table:table})
        //                 found=true;
        //                 break;
        //             }
        //         }
        //         if(!found)
        //         {
        //             // let options = {scorer: fuzz.token_sort_ratio};
        //             // //let fuzzResults = fuzz.extract(bestName.split(")")[0], gameNames, options);
        //             // let fuzzResults = fuzz.extract(bestName, gameNames, options);
        //             // let firstResult = fuzzResults[0]
        //             // results[firstResult[0]].tables.push(table)

        //             let options = {
        //                 scorer: fuzz.token_sort_ratio,
        //                 processor: choice => choice.name,
        //                 returnObjects: true
        //             };
        //             //let fuzzResults = fuzz.extract(bestName.split(")")[0], gameNames, options);
        //             let fuzzResults = fuzz.extract(bestName, games, options);
        //             let firstResult = fuzzResults[0].choice;
        //             console.log("Fuzz result:"+[firstResult.name,bestName])
        //             firstResult.tables.push({table:table});
        //         }
        //     }
        //     //let leftOver = [...new Set(tables)];
        //     //console.log("leftOver:"+leftOver.length);

        // }


        //console.log(JSON.stringify(games, null, 2));
        res.json( games );
    }
    else {
        res.render('games',{ title: 'PinFE' });
    }

});

module.exports = router;