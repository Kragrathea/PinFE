'use strict';
const express = require('express');
const router = express.Router();
const Fuse = require('fuse.js');



const fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
const url = require('url');
const AdmZip = require('adm-zip');


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
function simplifyNameOld(tableName) {
    if (tableName.indexOf(')') > 0)
        tableName = tableName.substring(0, tableName.indexOf('('));
    var ca = tableName.toLowerCase().replace(/ /g, "").replace(/\-/g, "").replace(/_/g, "").replace(/\'/g, "").replace(/\"/g, "").replace(/\&/g, "").replace(/\'/g, "").replace(/\(/g, "").replace(/\)/g, "").
        replace(/\,/g, "").replace(/\./g, "").replace(/\!/g, "").replace(/the/g, "").replace(/and/g, "").replace(/do brasil/g, "").replace(/ /g, "");
    return ca;
}
function simplifyName(tableName,replaceWith=" ") {
    if (tableName.indexOf(')') > 0)
        tableName = tableName.substring(0, tableName.indexOf('('));
    var ca = tableName.toLowerCase().replace(/ /g, replaceWith).replace(/\-/g, replaceWith).replace(/_/g, replaceWith).
        replace(/\'/g, replaceWith).replace(/\"/g, replaceWith).replace(/\&/g, replaceWith).replace(/\#/g, replaceWith).replace(/\;/g, replaceWith)
        .replace(/\'/g, replaceWith).
        replace(/\(/g, replaceWith).replace(/\)/g, replaceWith).replace(/\,/g, replaceWith).replace(/\./g, replaceWith).
        replace(/\!/g, replaceWith)./*replace(/the/g, replaceWith).replace(/and/g, replaceWith).*/replace(/do brasil/g, replaceWith).
        replace(/^[0-9]+/g, replaceWith).//NOTE replace leading numbers. 
        //replace(/[0-9]/g, replaceWith).//NOTE replace ALL numbers. 
        // replace(/jp s/g, replaceWith).
        // replace(/jps/g, replaceWith).
        // replace(/jp/g, replaceWith).
        replace(/  /g, replaceWith);//double spaces
    return ca;
}
function superFuzzyCompare(a, b) {
    var ca = simplifyName(a);
    var cb = simplifyName(b);

    if (ca.startsWith("shadow") && cb.startsWith("shadow"))
        console.log([ca, cb]);
    //Console.WriteLine(ca);

    if (ca == cb)
        return true;
    return false;
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


function findInDir(baseDir,dir, filter, fileList = []) {
    const files = fs.readdirSync(baseDir + dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(baseDir + filePath);

        if (fileStat.isDirectory()) {
            findInDir(baseDir,filePath, filter, fileList);
        } else if (filter.test(filePath)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}


function getZipList(dir) {

    var allFiles = findInDir(dir,".", /\.zip$/);
    var results = [];
    allFiles.forEach((file) => {
        results.push(file);
    });

    //wheelList = results;

    console.log("Loaded zipList. Length:" + results.length);
    return results;
}



router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var image = query.image;
    var json = query.json;
    var imageIndex = query.imageIndex;
    var perPage = query.perPage;

    let installDir = "z://VPTables//ZIPS//PD//";// req.app.locals.FEDataDir+"/_incoming";
    //let installDir = "z://VPTables//ZIPS//PD//";// req.app.locals.FEDataDir+"/_incoming";

    var results = getZipList(installDir);
    
    // if (qry !== undefined) {
    //     let wheelListIndex=getSearchIndex(results);
    //     results = wheelListIndex.search(qry);
    // }

    let masterList = getMasterTableList();
    let searchIndex = getSearchIndex(masterList);

    let xxx = searchIndex.search("jokerz");
    let yyy = searchIndex.search("jp s jokerz v1 0 1");
    let zzz = searchIndex.search("jp s jokerz 0");

    let qqq = searchIndex.search("jp s jokerz v");


    let goodName = null;
    for (let file of results) {
        //console.log("zip:"+file);
        //console.log("quickSearch for:" + query.query);
        let qryStr=path.basename(file).replace(".zip","");
        let fileNameResults = masterList.filter(a => fuzzyCompare(a.name, qryStr));
        //console.log("quickSearch found:" + fileNameResults.length + " for:" + simplifyName(qryStr));
    
        if (fileNameResults.length < 1)
            fileNameResults = masterList.filter(a => superFuzzyCompare(a.name, qryStr));

        if (fileNameResults.length >0)
            goodName=fileNameResults[0].name;

        if(false)
        {
            console.log("quickSearch found:" + fileNameResults.length + " for:" + simplifyName(qryStr));
            for(let fnr of fileNameResults) {
                console.log("\t"+fnr.name);
            }
        }


        try{
            var zip = new AdmZip(installDir+file);
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
                    if(!goodName){
                        let tableQryStr=ename.replace(".vpx","");
                        let tableNameResults = masterList.filter(a => fuzzyCompare(a.name, tableQryStr));

                        if (tableNameResults.length < 1)
                            tableNameResults = masterList.filter(a => superFuzzyCompare(a.name, tableQryStr));

                        if (tableNameResults.length >0){
                            goodName=tableNameResults[0].name;
                            break;
                        }

                        if (tableNameResults.length < 1)
                        {
                            //console.log("NAME NOT FOUND:" + " for:"+qryStr+"\n-->\t" + simplifyName(qryStr));
                            tableNameResults = searchIndex.search(simplifyName(tableQryStr," "));
                            fileNameResults = searchIndex.search(simplifyName(qryStr," "));
                            console.log("Best Guess:");
                            if(tableNameResults.length>0 && fileNameResults.length>0){
                                
                                if(fileNameResults[0].item && tableNameResults[0].item.name===fileNameResults[0].item.name)
                                {
                                    if(!tableNameResults[0].item.name.startsWith("2001") && !tableNameResults[0].item.name.startsWith("1-2-3"))
                                        console.log("AGREE:"+tableNameResults[0].item.name);

                                }
                            }
                            console.log("Table:"+simplifyName(tableQryStr," ")+"->"+tableQryStr);
                            //console.log("\t"+tableNameResults.length);
                            for(let fnr of tableNameResults.slice(0,3)) {
                                if(fnr.score>0.85 || fnr.item.name.startsWith("2001") || fnr.item.name.startsWith("1-2-3"))
                                break;//Hackish. Give Up at this point. 
                                console.log("\t"+[fnr.score,fnr.item.name]);
                            }                
                            console.log("File:"+simplifyName(qryStr," ")+"->"+qryStr);
                            //console.log("\t"+fileNameResults.length);
                            for(let fnr of fileNameResults.slice(0,3)) {
                                if(fnr.score>0.85 || fnr.item.name.startsWith("2001") || fnr.item.name.startsWith("1-2-3"))
                                break;//Hackish. Give Up at this point. 
                                console.log("\t"+[fnr.score,fnr.item.name]);
                            }                
                        }
                    }
                    if(goodName)
                        console.log(goodName);
                    //console.log(entry.name); 
                    foundTables.push(ename);
                }else if(ename.endsWith(".directb2s"))
                {
                    //console.log(entry.name); 
                    foundBg.push(ename);
                }else if(ename.endsWith(".png"))
                {
                    //console.log(entry.name); 
                    foundWheels++;
                }else if(ename.endsWith(".mp3")||ename.endsWith(".ogg"))
                {
                    //todo. part of pup or something?
                    //console.log(entry.name); 
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
                    //foundMusic++;
                }else if(ename.indexOf("ultradmd")>-1)
                {
                    //console.log(entry.name); 
                    //foundMusic++;
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

module.exports = router;