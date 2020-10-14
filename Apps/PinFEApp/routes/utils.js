const fs = require('fs');
const path = require('path');
const fuzzy=require('./fuzzycompare.js');
const fuzz = require('fuzzball');
function sendMissingIcon(req,res)
{
    let wheelsDir = req.app.locals.FELibDirs+"/Wheels/";
    fs.readFile(wheelsDir + "/Missing_Icon.png", function (err, content) {
        if (err) {
            res.writeHead(400, { 'Content-type': 'text/html' });
            console.log(err);
            res.end("No such image");
        } else {
            //specify the content type in the response will be an image
            res.writeHead(200, { 'Content-type': 'image/jpg' });
            res.end(content);
        }
    });   
}
function sendMissingBackglass(req,res)
{
    let bgDir = req.app.locals.FELibDirs+"/Backglasses/"; // ./public/data";
    fs.readFile(bgDir + "/Missing_Backglass.png", function (err, content) {
        if (err) {
            res.writeHead(400, { 'Content-type': 'text/html' });
            console.log(err);
            res.end("No such image");
        } else {
            //specify the content type in the response will be an image
            res.writeHead(200, { 'Content-type': 'image/jpg' });
            res.end(content);
        }
    });   
}

function findInDir(baseDir,dir, filter, fileList = []) {
    const files = fs.readdirSync(baseDir + dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(baseDir + filePath);

        if (fileStat.isDirectory() || fileStat.isSymbolicLink()) {
            findInDir(baseDir,filePath, filter, fileList);
        } else if (filter.test(filePath)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}


function saveTableDB(req,tableFile,dbase) {
    //write pinfe dbase file
    //todo: handle error
    fs.writeFileSync(tableFile + ".pinfe", JSON.stringify(dbase));
}

function loadOrCreateTableDB(req,tableFile) {
    let dbase = {
        gameName: null,
        added: new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        played: null,
        tested: false,
        tags: []
    };
    //Load dbase if any.
    if (fs.existsSync(tableFile + ".pinfe")) {
        //console.log(file)
        let data = fs.readFileSync(tableFile + ".pinfe");
        if (data)
            dbase = JSON.parse(data);//todo:merge with defaults
    } else {
        //dbase not found. Init.
        //get best guess for name part of table 
        let bestName = fuzzy.tableGetBestName(tableFile);
        let results = [];
        for (let gameName of req.app.locals.globalGameNameList) {
            if (fuzzy.superFuzzyCompare(gameName, bestName)) {
                results.push(gameName);
            }
        }
        //hopefully
        if (results.length == 1) {
            dbase.gameName = results[0] + '*';//* means gme name has been guessed at and should be checked.
        } else if (results.length > 1) {
            //too many results. 
            //Probably a simplified compare error.
            //Todo. figure out better way to handle.
            console.log("Found too many matches for bestName:" + [results.length, bestName]);
            dbase.gameName = results[0] + '**';
        } else {
            //fall back to fuzzy name match.
            let options = {
                scorer: fuzz.token_sort_ratio,
            };
            //let fuzzResults = fuzz.extract(bestName.split(")")[0], gameNames, options);
            let fuzzResults = fuzz.extract(bestName, req.app.locals.globalGameNameList, options);
            fuzzResults= fuzzResults.slice(0, 3).map(a=>a[0]);
            console.log("Fuzz result:" + [fuzzResults, bestName]);
            dbase.gameName = fuzzResults[0] + '***';
        }

        //write created dbase
        //todo: handle error
        fs.writeFileSync(tableFile + ".pinfe", JSON.stringify(dbase));

    }
    return dbase;
}


module.exports ={
    findInDir,sendMissingIcon,sendMissingBackglass,loadOrCreateTableDB,saveTableDB
}