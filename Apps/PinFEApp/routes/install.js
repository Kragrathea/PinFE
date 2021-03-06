﻿'use strict';
const express = require('express');
const router = express.Router();
const utils=require('./utils.js')
const fuzz = require('fuzzball');

const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const url = require('url');
const fuzzy=require('./fuzzycompare.js');
const AdmZip = require('adm-zip');

var allGames=null
function getAllGames()
{
    if(allGames)
        return allGames;
    let results = [];
    let data = fs.readFileSync(masterDir + '/MasterTableList.tsv');
    //let data = fs.readFileSync(masterDir + '/PinballX Database Sheet.tsv');
    if(data) {
        //if (err) throw err;
        var lines = data.toString().split("\n");

        //table headers are on line 0
        var headers = lines[0].split("\t");

        //Table Name (Manufacturer Year)	Feature(s) Description(s), comment(s) or extra information	Type 	VP Version	Table Author(s)	Table Version	Table Date	Needed ROM Name	Checkbox 	Comments or Notes 
        //Table Name (Manufacturer Year)	Manufacturer	Year	Theme	Player(s)	IPDB Number	Description(s)	Type	VP Version	Table URL	Table Author(s)	Table Version	Table Date
        //override headers to shorter javascript friendly.
        headers = ["name", "feature", "desc","comment","type","vpver", "author", "vpver","date", "rom"];//, "rom"]; //,"check","notes"];

        for (var i = 1; i < lines.length; i++) { //NOTE 1. Bypassheaders.
            var obj = {id:i-1}; //NOTE -1
            var currentline = lines[i].split("\t");
            for (var j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j];
            }
            if(obj.vpver!=="VPX")//only load vpx tables..
                continue;
            if(obj.name!=="")//get rid of blank rows.
                results.push(obj);
        }
    }
        
    console.log("romToGame Length:" + results.length);
    allGames=results;
    return allGames;
}
function romToGames(romName)
{
    var masterDir = "./public/data";

    let results = getAllGames();
    results.filter(a => a.rom.toLowerCase()+".zip" === romName.toLowerCase());

}
function getMasterTableList() {

    var masterDir = "./public/data";

    let results = [];
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
            if(obj.name!=="")//get rid of blank rows.
                results.push(obj);
            //if(obj.name.startsWith("Jokerz!"))
            {
                //obj.name=obj.name.replace(/\!/g, "").replace(/\'/g, "");//HACK.
                //console.log([obj]);    
            }
        }
    }
        
    console.log("Loaded masterTableList. Length:" + results.length);
    return results;


        // app.locals.masterTableQuickSearch = function (tableName) {

        //     console.log("quickSearch for:" + tableName);
        //     var results = app.locals.masterTableList.filter(a => fuzzy.fuzzyCompare(a.name, tableName));
        //     console.log("quickSearch found:" + results.length + " for:" + simplifyName(tableName));

        //     if (results.length < 1)
        //         results = app.locals.masterTableList.filter(a => fuzzy.superFuzzyCompare(a.name, tableName));
        //     console.log("quickSearch found:" + results.length + " for:" + simplifyName(tableName));
        //     return (results);
        // }

    
}


function getSearchIndex(masterList) {

    var options = {
        shouldSort: true,
        threshold: 0.3,
        includeScore:true,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 4,
        tokenize: true,
        ignoreLocation:true,
        keys: [
            "name"
            //"author",
            //"comment",
        ]
    };
    let masterListIndex = new Fuse(masterList, options);
    return(masterListIndex);

    
}


function getZipList(dir) {

    var allFiles = utils.findInDir(dir,".", /\.zip$/);
    var results = [];
    allFiles.forEach((file) => {
        results.push(dir+file);
    });

    //wheelList = results;

    console.log("Loaded zipList. Length:" + results.length);
    return results;
}
function suggestMasterName(filename)
{
    if(true){
        let masterList = getMasterTableList();
        
        let qryStr=path.basename(filename).toLowerCase().replace(".vpx","").replace(".zip","");
        let simpleResults = masterList.filter(a => fuzzy.fuzzyCompare(a.name, qryStr));
        if (simpleResults.length < 1)
            simpleResults = masterList.filter(a => fuzzy.superFuzzyCompare(a.name, qryStr));

        if(simpleResults.length)
        {
            console.log("Simple suggested name:"+simpleResults[0].name);
            return(simpleResults[0].name);

        }else{
            let searchIndex = getSearchIndex(masterList);
            let fuseResults = searchIndex.search(simplifyName(qryStr," "));
            if(fuseResults.length)
            {
                console.log("Fuse suggested name:"+fuseResults[0].item.name);
                return(fuseResults[0].item.name);
            }
        }
        return null;
        //if(filename.toLowerCase.endsWith(".vpx"))
        //let tableQryStr=ename.replace(".vpx","");
        //let qryStr=path.basename(file).replace(".zip","");
        // if(true)
        // {
        //     let simpleTableResults = masterList.filter(a => fuzzy.fuzzyCompare(a.name, tableQryStr));
        //     if (simpleTableResults.length < 1)
        //         simpleTableResults = masterList.filter(a => fuzzy.superFuzzyCompare(a.name, tableQryStr));
            
        //     if(simpleTableResults.length){
        //         results.push("Simple suggested name:"+simpleTableResults[0].name);
        //         console.log("Simple suggested name:"+simpleTableResults[0].name);
        //     }
            
        //     let simpleFileResults = masterList.filter(a => fuzzy.fuzzyCompare(a.name, qryStr));
        //     if (simpleFileResults.length < 1)
        //         simpleFileResults = masterList.filter(a => fuzzy.superFuzzyCompare(a.name, qryStr));    

        //     if(simpleFileResults.length){
        //         results.push("Simple suggested name:"+simpleFileResults[0].name);
        //         console.log("Simple suggested name:"+simpleFileResults[0].name);
        //     }
            
        //     // results.push("Simple suggested names:"+[simpleTableResults.length?simpleTableResults[0].name:"",
        //     // simpleFileResults.length?simpleFileResults[0].name:""]);
        //     // console.log("Simple suggested names:"+[simpleTableResults.length?simpleTableResults[0].name:"",
        //     //     simpleFileResults.length?simpleFileResults[0].name:""]);
        // }

        // if(true)//fuse search.
        // {
        //     let fuseTableResults = searchIndex.search(simplifyName(tableQryStr," "));
        //     if(fuseTableResults.length)
        //     {
        //         results.push("Fuse suggested name:"+[fuseTableResults[0].score,fuseTableResults[0].item.name]);
        //         console.log("Fuse suggested name:"+[fuseTableResults[0].score,fuseTableResults[0].item.name]);
        //     }
        //     let fuseFileResults = searchIndex.search(simplifyName(qryStr," "));
        //     if(fuseFileResults.length)
        //     {
        //         results.push("Fuse suggested name:"+[fuseFileResults[0].score,fuseFileResults[0].item.name]);
        //         console.log("Fuse suggested name:"+[fuseFileResults[0].score,fuseFileResults[0].item.name]);
        //     }
        //     // let fuseFileResults = searchIndex.search(simplifyName(qryStr," "));
        //     // results.push("Fuse suggested names:"+[fuseTableResults.length?fuseTableResults[0].item.name:"",
        //     //     fuseFileResults.length?fuseFileResults[0].item.name:""]);
        //     // console.log("Fuse suggested names:"+[fuseTableResults.length?fuseTableResults[0].item.name:"",
        //     //     fuseFileResults.length?fuseFileResults[0].item.name:""]);

        //     // for(let fnr of tableNameResults.slice(0,3)) {
        //     //     if(fnr.score>0.85 || fnr.item.name.startsWith("2001") || fnr.item.name.startsWith("1-2-3"))
        //     //     break;//Hackish. Give Up at this point. 
        //     //     console.log("\t"+[fnr.score,fnr.item.name]);
        //     // }    
        // }


    }

}
function processZipFiles(zipFiles)
{
    


    let results=[];
    let goodName = null;
    for (let file of zipFiles) {
        //console.log("zip:"+file);
        //console.log("quickSearch for:" + query.query);
        // let qryStr=path.basename(file).replace(".zip","");
        // let fileNameResults = masterList.filter(a => fuzzy.fuzzyCompare(a.name, qryStr));
        //console.log("quickSearch found:" + fileNameResults.length + " for:" + simplifyName(qryStr));
    
        // if (fileNameResults.length < 1)
        //     fileNameResults = masterList.filter(a => fuzzy.superFuzzyCompare(a.name, qryStr));

        // if (fileNameResults.length >0)
        //     goodName=fileNameResults[0].name;

        results.push("ZIP:"+file);


        try{
            var zip = new AdmZip(file);
            var zipEntries = zip.getEntries(); 
            let foundTables=[];
            let foundBg=[];
            let foundWheels=0;
            let foundMusic=0;
            let foundIgnore=0;
            let extraFiles=0;
            for(let entry of zipEntries) {
                if(entry.isDirectory)
                {
                    continue;
                }
                let ename=entry.entryName.toLowerCase();
                if(ename.endsWith(".vpx"))
                {
                    results.push("-->"+"Found vpx:"+ename);

                    results.push("-->"+suggestMasterName(file));

                    //console.log(entry.name); 
                    foundTables.push(ename);
                }else if(ename.endsWith(".directb2s"))
                {
                    results.push("-->"+"Found backglass:"+ename);
                    //console.log(entry.name); 
                    foundBg.push(ename);
                }                    //foundMusic++;
                else if(ename.indexOf("ultradmd")>-1)//Needs to be checked early.
                {
                    //console.log(entry.name); 
                    //foundMusic++;
                }else if(ename.endsWith(".png"))
                {
                    results.push("-->"+"Possible wheel:"+ename);
                    //console.log(entry.name); 
                    foundWheels++;
                }else if(ename.endsWith(".mp3")||ename.endsWith(".ogg"))
                {
                    //todo. part of pup or something?
                    //console.log(entry.name); 
                    results.push("-->"+"Music:"+ename);
                    foundMusic++;
                }else if(ename.endsWith(".vbs"))
                {
                    //console.log(entry.name); 
                    
                }else if(ename.endsWith(".pup"))
                {
                    //console.log(entry.name); 
                }else if(ename.endsWith(".pup")|| ename.indexOf("pup")>-1 || ename.indexOf("pinup")>-1)
                {
                    //console.log(entry.name); 
                }else if(ename.endsWith(".ttf"))
                {
                    //console.log(entry.name); 

                }else if(ename.endsWith(".wav"))
                {
                    //maybe ignore?
                    //console.log(entry.name); 

                }else if(ename.endsWith(".zip") && ename.indexOf("roms")>-1 )
                {
                    results.push("-->"+"Possible ROM:"+ename);
                    //console.log(entry.name); 
                }else if(ename.endsWith(".zip") || ename.endsWith(".rar") )
                {
                    //console.log(entry.name); 
                }else if(ename.endsWith(".nv"))
                {
                    //console.log(entry.name); 
                }else if(ename.endsWith(".pov")|| ename.endsWith(".xml"))
                {
                    //console.log(entry.name); 
                }else if(ename.endsWith(".vpt"))
                {
                    //vp9 table!
                    //console.log(entry.name); 
                }else if(ename.endsWith(".txt")||ename.endsWith(".mp4")||ename.endsWith(".avi")||ename.endsWith(".f4v")
                    ||ename.endsWith(".jpg")||ename.endsWith(".bmp")
                    ||ename.endsWith(".pdf")||ename.endsWith(".doc")||ename.endsWith(".docx")
                    ||ename.endsWith(".docx")||ename.endsWith(".swf"))
                {
                    //console.log(entry.name); 
                    foundIgnore++;
                }else{
                    extraFiles++;
                    console.log("Extra:"+ename); 
                }

            }

            if(false)
            {
                if(foundTables.length==0 && foundBg.length==0)
                    console.log(file+"\n"+"***NO TABLES:"+[foundTables.length,foundBg,foundIgnore,extraFiles]);
                if(extraFiles>0)
                    console.log(file+"\n"+"Found:"+[foundTables.length,foundBg,foundIgnore,extraFiles]);
                if(foundTables.length==0 && foundBg.length>0)
                    console.log(file+"\n"+"Just BG:"+[foundTables.length,foundBg,foundIgnore,extraFiles]);
                if(foundTables.length>1){
                    console.log(file+"\n"+"Mutiple Tables:"+foundTables.length);
                    for(let ft of foundTables)
                    {
                        console.log("\t"+ft);
                    }
                }
                if(foundBg.length>1){
                    console.log(file+"\n"+"Mutiple BG:"+foundBg.length);
                    for(let fb of foundBg)
                    {
                        console.log("\t"+fb);
                    }
                }
            }


        }catch(e)
        {
            console.log("Zip Exception:"+e.message);
        }
        //break;
    }
    return results;
}

router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var image = query.image;
    var json = query.json;
    var imageIndex = query.imageIndex;
    var perPage = query.perPage;

    let inboxDir = req.app.locals.FETableDirs+"/Inbox/";

    var results = getZipList(inboxDir);
    
    // if (qry !== undefined) {
    //     let wheelListIndex=getSearchIndex(results);
    //     results = wheelListIndex.search(qry);
    // }


    // let xxx = searchIndex.search("jokerz");
    // let yyy = searchIndex.search("jp s jokerz v1 0 1");
    // let zzz = searchIndex.search("jp s jokerz 0");

    // let qqq = searchIndex.search("jp s jokerz v");


    results = processZipFiles(results);

    if (perPage === undefined && isNaN(perPage)) {
        perPage=results.length;
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
    res.render('install', { title: 'PinFE', items: results.slice(page * perPage, (page + 1) * perPage) });

});

var upload_files = require('multer')();

router.post('/upload', upload_files.single('file'), (req, res, next) => {

    var query = url.parse(req.url, true).query;
    var tableFile = decodeURIComponent(query.table);

    let tablesDir = req.app.locals.FETableDirs+"/";

    //console.log("Upload:"+req.file.originalname);
    console.log("Upload:"+req.body.fullPath);
    if (req.file.mimetype.startsWith('application/') && req.file.originalname.toLowerCase().endsWith(".vpx")) {
        var destName = tablesDir+ "/Inbox/"+req.file.originalname;
        if(fs.existsSync(destName))
        {
            return res.status(422).json({
                error :'File exists.'
              });
        }
        console.log("Writing:"+destName);
        fs.writeFile(destName, req.file.buffer, function (err) {
            //res.redirect("back");
        });
        return res.status(200).send(req.file);
      }
      if (req.file.mimetype.startsWith('application/x-zip-compressed') ) {
        var destName = tablesDir+ "/Inbox/"+req.file.originalname;
        // if(fs.existsSync(destName))
        // {
        //     return res.status(422).json({
        //         error :'File exists.'
        //       });
        // }
        console.log("Writing:"+destName);
        fs.writeFile(destName, req.file.buffer, function (err) {
            //todo:handle err
            //res.redirect("back");
            let results = processZipFiles([destName]);

        });
        return res.status(200).send(req.file);
      }      
    if (req.file.mimetype.startsWith('application/') && req.file.originalname.toLowerCase().endsWith(".directb2s")) {
        // var destName = tablesDir+ tableFile+".directb2s";
        // if(fs.existsSync(destName))
        // {
        //     return res.status(422).json({
        //         error :'File exists.'
        //       });
        // }
        // fs.writeFile(destName, req.file.buffer, function (err) {
        //     //res.redirect("back");
        // });
        return res.status(200).send(req.file);
      }
      if (req.file.mimetype.startsWith('image/') && req.file.originalname.toLowerCase().endsWith(".png")) {
        // var destName = tablesDir+ tableFile+".wheel.png";
        // fs.writeFile(destName, req.file.buffer, function (err) {
        //     //res.redirect("back");
        //});
        return res.status(200).send(req.file);
      }
    if (req.file.mimetype.startsWith('image/')) {

    }
    // return res.status(422).json({
    //     error :'The uploaded file must be an BG or PNG image'
    //   });
 
    return res.status(200)//.send(req.file);
  });


module.exports = router;