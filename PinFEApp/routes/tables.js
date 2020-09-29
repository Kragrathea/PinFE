'use strict';
var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');



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

function getTablesList(tablesDir) {
    var files = findInDir(tablesDir, ".", /\.vpx$/);
    var results = [];
    var count = 0;
    files.forEach((file) => {
        //if db file exists load
        //else default info 

        var dbase = {
            masterName: ""
        }

        let suggestedMaster = "";
        //load database file if any.
        if (fs.existsSync(tablesDir + file + ".dbase")) {
            //console.log(file)
            let data = fs.readFileSync(tablesDir + file + ".dbase");
            if (data)
                dbase = JSON.parse(data);
        } else {
            // let master = res.app.locals.masterTableQuickSearch(path.basename(path.dirname(file)));
            // if (master && master.length > 0) {
            //     suggestedMaster = master[0].name;

            //     //var dbName = tablesDir + file + ".dbase";
            //     //dbase.masterName = suggestedMaster;
            //     //fs.writeFileSync(dbName, JSON.stringify(dbase));
            // } else {
            //     //let master = res.app.locals.masterTableIndex.search(path.basename(path.dirname(file)));
            //     //if (master && master.length > 0) {
            //     //    suggestedMaster = master[0].name;
            //     //}
            // }
        }

        results.push({
            id: count++,
            tableName: path.basename(file),
            tableFolder: path.basename(path.dirname(file)),
            table: file,
            //master: '/master/quickSearch?query=' + encodeURIComponent(path.basename(path.dirname(file))) + "&json=1",
            masterName: dbase.masterName,
            suggestedMaster: suggestedMaster,
            dbase: dbase,
            backglass: fs.existsSync(tablesDir + file + ".directb2s") || fs.existsSync(tablesDir + file.replace(".vpx", "") + ".directb2s"),
            fsPic: fs.existsSync(tablesDir + file + ".fs.jpg"),
            bgPic: fs.existsSync(tablesDir + file + ".bg.jpg"),
            dtPic: fs.existsSync(tablesDir + file + ".dt.jpg"),
            fsSmallPic: fs.existsSync(tablesDir + file + ".fs-small.jpg"),
            bgSmallPic: fs.existsSync(tablesDir + file + ".bg-small.jpg"),
            dtSmallPic: fs.existsSync(tablesDir + file + ".dt-small.jpg"),
            wheelPic: fs.existsSync(tablesDir + file + ".wheel.png"),
            wheelSmallPic: fs.existsSync(tablesDir + file + ".wheel-small.png")
        });
    });

    console.log("Loaded tablesList. Length:" + results.length);
    return(results);

}
function createTablesIndex(tablesList) {
    
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
    tablesListIndex = new Fuse(tablesList, options);
}


router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var image = query.image;
    var json = query.json;

    let tablesDir = req.app.locals.FEDataDir+"/Tables/";

    if (image !== undefined) {
        if(image.toLowerCase().endsWith(".directb2s"))
        {
            fs.readFile(tablesDir + image, "utf8", function (err, data) {
                if (err) {
                    var size = (tablesDir + image).length;
                    res.writeHead(400, { 'Content-type': 'text/html' });
                    console.log(err);
                    res.end("No such image");
                    return;
                }

                var line = data.split("<BackglassImage Value=\"")[1];
                if(line){
                    line = line.split("\n")[0];
                    var imgData = line.replace(/&#xD;&#xA;/g, "");
                    var img = Buffer.from(imgData, 'base64');
    
                    res.writeHead(200, {
                        'Content-Type': 'image/png',
                        'Content-Length': img.length
                    });
                    res.end(img);
                }else{
                    //error not backglass
                    res.writeHead(400, { 'Content-type': 'text/html' });
                    console.log(err);
                    res.end("No such image");
                }
            });
        }else{
            fs.readFile(tablesDir + image, function (err, content) {
                if (err) {
                    var size = (tablesDir + image).length;
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

    } else {
        if (json !== undefined) {
            let results=getTablesList(tablesDir); 

            if (qry !== undefined) {
                let tablesListIndex=getSearchIndex(tablesList); 
                results = tablesListIndex.search(qry);
            }
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
    }

});


router.get('/sort', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var image = query.image;
    var json = query.json;

    //if (!tablesList)
        loadTablesList(res);

    var results = tablesList;
    if (qry !== undefined) {
        if (!tablesListIndex)
            createTablesIndex();

        results = tablesListIndex.search(qry);
    }

    res.render('tablessort', { title: 'Sort Tables', tables: results});

});
router.post('/update', function (request, response) {
    console.log(request.body);
    var table = request.body.table;
    let data = JSON.stringify(request.body.data);
    console.log("Update Table:" + table);

    let tablesDir = req.app.locals.FEDataDir+"/Tables/";

    var dbName = tablesDir + table + ".dbase";
    console.log([dbName,data]);
    

    fs.writeFileSync(dbName, data);

    response.send(request.body);    // echo the result back


});


module.exports = router;