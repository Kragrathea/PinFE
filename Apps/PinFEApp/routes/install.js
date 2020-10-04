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
        let simpleResults = masterList.filter(a => fuzzyCompare(a.name, qryStr));
        if (simpleResults.length < 1)
            simpleResults = masterList.filter(a => superFuzzyCompare(a.name, qryStr));

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
        //     let simpleTableResults = masterList.filter(a => fuzzyCompare(a.name, tableQryStr));
        //     if (simpleTableResults.length < 1)
        //         simpleTableResults = masterList.filter(a => superFuzzyCompare(a.name, tableQryStr));
            
        //     if(simpleTableResults.length){
        //         results.push("Simple suggested name:"+simpleTableResults[0].name);
        //         console.log("Simple suggested name:"+simpleTableResults[0].name);
        //     }
            
        //     let simpleFileResults = masterList.filter(a => fuzzyCompare(a.name, qryStr));
        //     if (simpleFileResults.length < 1)
        //         simpleFileResults = masterList.filter(a => superFuzzyCompare(a.name, qryStr));    

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
        // let fileNameResults = masterList.filter(a => fuzzyCompare(a.name, qryStr));
        //console.log("quickSearch found:" + fileNameResults.length + " for:" + simplifyName(qryStr));
    
        // if (fileNameResults.length < 1)
        //     fileNameResults = masterList.filter(a => superFuzzyCompare(a.name, qryStr));

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

module.exports = router;