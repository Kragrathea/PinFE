'use strict';
var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');
var https = require('https');
var http = require('http');

var download = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var protocol=http;
    if(url.startsWith("https"))
        protocol=https;
    let request = protocol.get(url, function(response) {
        if(response.headers["content-type"]==="image/png" || response.headers["content-type"]==="image/jpg"){  
            response.pipe(file);
            file.on('finish', function() {
                file.close(cb);  // close() is async, call cb after close completes.
            });
        }else{
            //not png error
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            console.log("Download error:not png/jpg");
            if (cb) cb("Download error:not png/jpg");
        }
    }).on('error', function(err) { // Handle errors
      fs.unlink(dest); // Delete the file async. (But we don't check the result)
      console.log("Download error:"+err.message);
      if (cb) cb(err.message);
    });
  };

router.post('/downloadPng', function (req, res) {
    try{
        console.log([req.body.url,decodeURIComponent(req.body.tableFile)]);

        let tablesDir = req.app.locals.FEDataDir+"/Tables/";

        let fname = req.body.url.split('/').slice(-1)[0];
        let destName = decodeURIComponent(req.body.tableFile)+".wheel.png";

        const regex = /\\/gi;
        destName = destName.replace(regex,'/');
        destName = tablesDir+destName;
        //destName =decodeURIComponent(destName)
        console.log("downloadPng:" + [req.body.url,fname,destName]);
        download(req.body.url,destName)
        

        response.send(req.body);    // echo the result back
    }catch(e)
    {
        console.log("downloadPng exception:"+e.message)
    }

});


/* GET users listing. */
router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var name = query.name;

    var file = name;//todo fix this.

    var json = query.json;

    let tablesDir = req.app.locals.FEDataDir+"/Tables/";
    var exists = fs.existsSync(tablesDir + name);


    var dbase = {
        masterName: ""
    }

    let suggestedMaster = "";
    let master ="quick search";// res.app.locals.masterTableQuickSearch(path.basename(path.dirname(file)));
    if (master && master.length > 0) {
        suggestedMaster = master[0].name;

        //var dbName = tablesDir + file + ".dbase";
        //dbase.masterName = suggestedMaster;
        //fs.writeFileSync(dbName, JSON.stringify(dbase));
    }

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

    var bgFile=""
    if(fs.existsSync(tablesDir + file.replace(".vpx", "") + ".directb2s"))
        bgFile=encodeURIComponent(tablesDir + file.replace(".vpx", "") + ".directb2s");
    else if (fs.existsSync(tablesDir + file + ".directb2s"))
        bgFile=encodeURIComponent(file + ".directb2s");

    var backglass =  file.replace(".vpx", "") + ".directb2s"
    if(!fs.existsSync(tablesDir +backglass))
        backglass = file + ".directb2s"
    
    var tableInfo = {
        name: path.basename(file),
        //tableFolder: path.basename(path.dirname(file)),
        file: encodeURIComponent(file),
        //master: '/master/quickSearch?query=' + encodeURIComponent(path.basename(path.dirname(file))) + "&json=1",
        masterName: dbase.masterName,
        suggestedMaster: suggestedMaster,
        dbase: dbase,
        backglass: encodeURIComponent(backglass),
        fsPic: fs.existsSync(tablesDir + file + ".fs.jpg")?encodeURIComponent(file + ".fs.jpg"):"",
        bgPic: fs.existsSync(tablesDir + file + ".bg.jpg")?encodeURIComponent(file + ".bg.jpg"):"",
        dtPic: fs.existsSync(tablesDir + file + ".dt.jpg")?encodeURIComponent(file + ".dt.jpg"):"",
        fsSmallPic: fs.existsSync(tablesDir + file + ".fs-small.jpg")?encodeURIComponent(file + ".fs-small.jpg"):"",
        bgSmallPic: fs.existsSync(tablesDir + file + ".bg-small.jpg")?encodeURIComponent(file + ".bg-small.jpg"):"",
        dtSmallPic: fs.existsSync(tablesDir + file + ".dt-small.jpg")?encodeURIComponent(file + ".dt-small.jpg"):"",
        wheelPic: fs.existsSync(tablesDir + file + ".wheel.png")?(encodeURIComponent(file + ".wheel.png")):"",
        wheelSmallPic: fs.existsSync(tablesDir + file + ".wheel-small.png")?encodeURIComponent(file + ".wheel-small.png"):""
    };

    console.log(tableInfo);
    //res.json([name,exists]);

    res.render('table', { title: 'PinFE', tableInfo: tableInfo });
});
router.post('/update', function (req, res) {
    console.log(req.body);

    //res.json([name,exists]);

    res.render('table', { title: 'PinFE', table: {name:req.body.name} });
});

var upload_files = require('multer')();

router.post('/uploadbg', upload_files.single('file'), (req, res, next) => {

    var query = url.parse(req.url, true).query;
    var tableFile = decodeURIComponent(query.table);

    let tablesDir = req.app.locals.FEDataDir+"/Tables/";

    if (req.file.mimetype.startsWith('application/') && req.file.originalname.toLowerCase().endsWith(".directb2s")) {
        var destName = tablesDir+ tableFile+".directb2s";
        if(fs.existsSync(destName))
        {
            return res.status(422).json({
                error :'File exists.'
              });
        }
        fs.writeFile(destName, req.file.buffer, function (err) {
            //res.redirect("back");
        });
        return res.status(200).send(req.file);
      }

     if (!req.file.mimetype.startsWith('image/')) {
         return res.status(422).json({
           error :'The uploaded file must be an image'
         });
       }
    
      return res.status(200)//.send(req.file);
  });


module.exports = router;
