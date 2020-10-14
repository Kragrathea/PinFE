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

var allGames=null;


function getMasterTableList() {

    var masterDir = "./public/data";

    if(allGames)
        return allGames;
    allGames={};
    //let data = fs.readFileSync(masterDir + '/MasterTableList.tsv');
    let data = fs.readFileSync(masterDir + '/PinballX Database Sheet.tsv');
    if(data) {
        //if (err) throw err;
        var lines = data.toString().split("\n");

        //table headers are on line 0
        var headers = lines[0].split("\t");

        //Table Name (Manufacturer Year)	Manufacturer	Year	Theme	Player(s)	IPDB Number	Description(s)	Type	VP Version	Table URL	Table Author(s)	Table Version	Table Date
        //override headers to shorter javascript friendly.
        headers = ["name", "manufacturer", "year","theme","players","ipdb", "comment", "type", "vpver","url", "author", "version", "date"];//, "rom"]; //,"check","notes"];

        for (var i = 1; i < lines.length; i++) { //NOTE 1. Bypassheaders.
            var obj = {id:i-1}; //NOTE -1
            var currentline = lines[i].split("\t");
            for (var j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j];
            }
            if(obj.vpver!=="VPX")//only load vpx tables..
                continue;
            if(!allGames[obj.name])
                allGames[obj.name]=[]

            allGames[obj.name].push(obj);
            //if(obj.name.startsWith("Jokerz!"))
            {
                //obj.name=obj.name.replace(/\!/g, "").replace(/\'/g, "");//HACK.
                //console.log([obj]);    
            }
        }
    }
    
    console.log("getMasterTableList Length:" + Object.keys(allGames).length);
    return allGames;
}


/* GET users listing. */
router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var name = decodeURIComponent(query.name);

    var games = req.app.locals.globalGameList;

    let results=games.filter(a=>a.name==name);
    var game=null 
    if(results.length)
        game= results[0];

    if(!game)
        game=games[Math.floor(games.length*Math.random())];

    var json = query.json;

    res.render('game', { title: 'PinFE', game: game });
});


module.exports = router;
