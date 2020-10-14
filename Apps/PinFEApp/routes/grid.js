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

function scan(baseDir,dir, filter ) {
    const files = fs.readdirSync(baseDir + dir);

    let fileList=[]

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(baseDir + filePath);

        if (fileStat.isDirectory() || fileStat.isSymbolicLink()) {
            let icon = null;
            const iconFiles = fs.readdirSync(baseDir + filePath);
            iconFiles.forEach((iFile) => {
                if(iFile.toLowerCase().endsWith(".png") && iFile.toLowerCase().indexOf("wheel")>-1){
                    icon=encodeURIComponent((filePath+"\\"+iFile)).replace(/[!'()*]/g, escape);
                    //break;
                }
            });
            fileList.push({
                name: path.basename(filePath),
                type:"folder",
                path:filePath.replace(/\\/g,"/"),
                items:scan(baseDir,filePath, filter),
                icon:icon
            });
        } else if (filter.test(filePath)) {
            fileList.push({
                name: path.basename(file),
                type:"file",
                path:filePath.replace(/\\/g,"/"),
                size:1234
            });
        }
    });

    return fileList;
}

var allWheels=null;
function getAllWheels(wheelsDir) {

    if(allWheels!=null)
        return allWheels;

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

    console.log("Loaded wheelList. Length:" + results.length);
    allWheels=results;
    return allWheels;
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
var Registry = require('winreg')
var romPath=null;//todo make this sync
function loadRomPath()
{
    let   regKey = new Registry({                                       // new operator is optional
        hive: Registry.HKCU,                                        // open registry hive HKEY_CURRENT_USER
        key:  '\\Software\\Freeware\\Visual PinMame\\globals' // key containing autostart programs
        })

    regKey.values(function (err, items /* array of RegistryItem */) {
    if (err)
        console.log('ERROR: '+err);
    else
        for (var i=0; i<items.length; i++){
            //console.log('ITEM: '+items[i].name+'\t'+items[i].type+'\t'+items[i].value);
            if(items[i].name==="rompath"){
                romPath=items[i].value+"\\";
                console.log("Setting romPath:"+romPath);
            }
        }
    });
}
loadRomPath();//todo make this sync

var allGames=null;
function getAllGames()
{
    let masterDir = "./public/data";

    if(allGames)
        return allGames;
    allGames={};
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

            var currentline = lines[i].replace("\r","").split("\t");//note /r gets rid of trailing line feed.
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
    
    //console.log("getMasterTableList Length:" + Object.keys(allGames).length);
    console.log("getAllGames Length:" + Object.keys(allGames).length);
    return allGames;
}
function romToGames(romName)
{
    var masterDir = "./public/data";

    let games = getAllGames();
    gameObjs=Object.values(games);
    results=gameObjs.filter(a => a.rom.toLowerCase()+".zip" === romName.toLowerCase());
    return results;
}
function nameToWheels(gameName,wheelDir)
{
    var masterDir = "./public/data";

    let results = getAllWheels(wheelDir);
    results=results.filter(a => fuzzy.superFuzzyCompare(a.name, gameName) );
    return results;
}

router.get('/scan', function (req, res) {
    var query = url.parse(req.url, true).query;
    // var qry = query.search;
    var type = query.type;
    // var json = query.json;
    // var imageIndex = query.imageIndex;
    // var perPage = query.perPage;

    if(!type)
        type="vpx"
    let results={};
    if(type==="vpx")
    {
        let dir = req.app.locals.FETableDirs+"/";

        results={
            name: "",
            type:"folder",
            path:"",
            //items:scan(wheelsDir,"/", /\.(png|directb2s)\b/)
            items:scan(dir,"/", /\.vpx$/)
        };
    }else if(type==="wheel"){
        let dir = req.app.locals.FELibDirs+"/Wheels/";

        results={
            name: "",
            type:"folder",
            path:"",
            //items:scan(dir,"/", /\.(png|directb2s)\b/)
            items:scan(dir,"/", /\.png$/)
        };
    }else if(type==="rom"){
        let dir =romPath;

        results={
            name: "",
            type:"folder",
            path:"",
            //items:scan(dir,"/", /\.(png|directb2s)\b/)
            items:scan(dir,"/", /\.zip$/)
        };
        let newItems=[]
        for(let li of results.items){
            let gg=romToGames(li.name);
            li.size=gg.length;
            if(gg.length>0)
            {
                let gname= gg[0].name;
                li.name=gname;
                let wheelsDir=req.app.locals.FELibDirs+"/Wheels/";
                let icons = nameToWheels(gname,wheelsDir);
                if(icons.length)
                    li.icon="/wheels/?image="+encodeURIComponent(icons[0].file.replace(/\\/g,"/")).replace(/[!'()*]/g, escape);
                    newItems.push(li);
            }
        }
        results.items=newItems;
    }else if(type==="games"){
        let games= getAllGames();

        function sortFunc(a,b)
        {
            let ad = Date.parse(b.date!=""?b.date:"1900-1-1");
            let bd = Date.parse(a.date!=""?a.date:"1900-1-1")
            //console.log([ad,bd]);
            return(ad-bd);
            
        }

        //let gameNames = Object.keys(games).sort((a,b)=>a.date-b.date);
        let gamesArray=Object.values(games).flat();
        gamesArray = gamesArray.sort(sortFunc);

        let newItems=[]
        for(let game of gamesArray){
            //let gname= gg.name;
            let li ={
                name: game.name,
                type:"file",
                path:"/game?name="+encodeURIComponent(game.name.replace(/\\/g,"/")).replace(/[!'()*]/g, escape),
                icon:null,
            };

            //let wheelsDir=req.app.locals.FELibDirs+"/Wheels/";
            //let icons = nameToWheels(game.name,wheelsDir);
            //if(icons.length)
                li.icon="/wheels/?search="+encodeURIComponent(game.name).replace(/[!'()*]/g, escape)+"&fuzzySearch=1&imageIndex=0"
            newItems.push(li);
        }


        results={
            name: "",
            type:"folder",
            path:"",
            items:newItems
        };

    }

    res.json(results);
});
router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var image = query.image;
    var json = query.json;

    res.render('grid', { title: 'PinFE' });
});

module.exports = router;