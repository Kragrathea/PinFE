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

const http = require('http');
const https = require('https');


var download = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var protocol=http;
    if(url.startsWith("https"))
        protocol=https;
    let request = protocol.get(url, function(response) {
        if(response.headers["content-type"]==="image/png" || response.headers["content-type"]==="image/jpg"){  
            response.pipe(file);
            file.on('finish', function() {
                console.log("Downloaded:"+url)
                console.log("To:"+dest)
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

        let tablesDir = req.app.locals.FETableDirs+"/";

        let fname = req.body.url.split('/').slice(-1)[0];
        let destName = decodeURIComponent(req.body.tableFile)+".wheel.png";

        const regex = /\\/gi;
        destName = destName.replace(regex,'/');
        destName = tablesDir+destName;
        //destName =decodeURIComponent(destName)
        console.log("downloadPng:" + [req.body.url,fname,destName]);
        download(req.body.url,destName)

        res.send(req.body);    // echo the result back
    }catch(e)
    {
        console.log("downloadPng exception:"+e.message)
    }

});


router.get('/:id/wheel', function (req, res) {
    let query = url.parse(req.url, true).query;
    let pic = query.image;
    //figure out backglass image name

    let file = decodeURIComponent(req.params.id);
    let tablesDir = req.app.locals.FETableDirs+"/";
    let wheelPath=tablesDir + file + ".wheel.png"
    if(fs.existsSync(wheelPath))
    {
        fs.readFile(wheelPath, function (err, content) {
            if (err) {
                utils.sendMissingIcon(req,res);
            } else {
                //specify the content type in the response will be an image
                res.writeHead(200, { 'Content-type': 'image/png' });
                res.end(content);
            }
        });
        return;
    }else{
        let results=req.app.locals.globalWheelList
        let bestName = fuzzy.tableGetBestName(file);
        results=results.filter(a => fuzzy.superFuzzyCompare(a.name, bestName) );
        if(results.length)
        {
            let wheelsDir = req.app.locals.FELibDirs+"/Wheels/";
            fs.readFile(wheelsDir+results[0].file, function (err, content) {
                if (err) {
                    utils.sendMissingIcon(req,res);
                } else {
                    //specify the content type in the response will be an image
                    res.writeHead(200, { 'Content-type': 'image/png' });
                    res.end(content);
                }
            });
            return;
        }

        utils.sendMissingIcon(req,res);
        return;
    }
});
router.get('/:id/fullscreen', function (req, res) {
    let query = url.parse(req.url, true).query;
    let size = query.size;

    let file = decodeURIComponent(req.params.id);
    let tablesDir = req.app.locals.FETableDirs+"/";
    let path=tablesDir + file;
    if(size=="large")
        path=path+".fs.jpg"
    else if(size=="mp4")
        path=path+".fs.mp4"
    else
        path=path+".fs-small.jpg";//default to small

    if(fs.existsSync(path))
    {
        fs.readFile(path, function (err, content) {
            if (err) {
                utils.sendMissingIcon(req,res);
            } else {
                //specify the content type in the response will be an image
                if(size=="mp4")
                    res.writeHead(200, { 'Content-type': 'video/mp4' });
                else
                    res.writeHead(200, { 'Content-type': 'image/jpg' });
                res.end(content);
            }
        });
        return;
    }else{
        utils.sendMissingIcon(req,res);
        return;
    }
});
router.get('/:id/desktop', function (req, res) {
    let query = url.parse(req.url, true).query;
    let size = query.size;

    let file = decodeURIComponent(req.params.id);
    let tablesDir = req.app.locals.FETableDirs+"/";
    let path=tablesDir + file;
    if(size=="large")
        path=path+".dt.jpg"
    else if(size=="mp4")
        path=path+".dt.mp4"
    else
        path=path+".dt-small.jpg";//default to small    

    if(fs.existsSync(path))
    {
        fs.readFile(path, function (err, content) {
            if (err) {
                utils.sendMissingIcon(req,res);
            } else {
                if(size=="mp4")
                    res.writeHead(200, { 'Content-type': 'video/mp4' });
                else//specify the content type in the response will be an image
                    res.writeHead(200, { 'Content-type': 'image/jpg' });
                res.end(content);
            }
        });
        return;
    }else{
        utils.sendMissingIcon(req,res);
        return;
    }
});
router.get('/:id/backglass', function (req, res) {
    let query = url.parse(req.url, true).query;

    let file = decodeURIComponent(req.params.id);
    let tablesDir = req.app.locals.FETableDirs+"/";
    let tableFile=tablesDir + file;
    let path=tableFile + ".bg.jpg"
    if(fs.existsSync(path))
    {
        fs.readFile(path, function (err, content) {
            if (err) {
                utils.sendMissingIcon(req,res);
            } else {
                //specify the content type in the response will be an image
                res.writeHead(200, { 'Content-type': 'image/jpg' });
                res.end(content);
            }
        });
        return;
    }else{
        var backglass =  tableFile.replace(".vpx", "") + ".directb2s"
        if(!fs.existsSync(backglass))
            backglass = tableFile + ".directb2s"
        if(!fs.existsSync(backglass)){
            
            let results=req.app.locals.globalBGList
            let bestName = fuzzy.tableGetBestName(file);
            //console.log(bestName);
            results=results.filter(a => fuzzy.superFuzzyCompare(a.name, bestName) );
            if(results.length)
            {
                let bgDir = req.app.locals.FELibDirs+"/Backglasses/";
                fs.readFile(bgDir+results[0].file,"utf8", function (err, content) {
                    if (err) {
                        utils.sendMissingBackglass(req,res);
                    } else {
                        var line = content.split("<BackglassImage Value=\"")[1];
                        if(line){
                            line = line.split("\n")[0];
                            var imgData = line.replace(/&#xD;&#xA;/g, "");
                            var img = Buffer.from(imgData, 'base64');
            
                            res.writeHead(200, {
                                'Content-Type': 'image/png',
                                'Content-Length': img.length
                            });
                            res.end(img);
                        //specify the content type in the response will be an image
                        }else{
                            utils.sendMissingBackglass(req,res);
                        }

                    }
                });
                return;
            }
            utils.sendMissingBackglass(req,res);
            return;
        }
        else {
            fs.readFile(backglass, "utf8", function (err, data) {
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
                    utils.sendMissingBackglass(req,res);
                    return;
                }
            });
            return;
        }
    }
});

router.get('/:id', function (req, res) {
    var query = url.parse(req.url, true).query;

    var file = req.params.id;

    //var json = query.json;

    let tablesDir = req.app.locals.FETableDirs+"/";
    let tableFile=tablesDir + file;

    if(!fs.existsSync(tableFile))
    {
        //if no table error
        //err
    }

    //load table db info.
    let dbase = utils.loadOrCreateTableDB(req,tableFile);

    var backglass =  tableFile.replace(".vpx", "") + ".directb2s"
    if(!fs.existsSync(backglass))
        backglass = tableFile + ".directb2s"
    if(!fs.existsSync(backglass))
        backglass = null
    
    var tableInfo = {
        name: path.basename(tableFile),
        file: file,
        gameName: dbase.gameName,
        dbase: dbase,
        backglass: backglass,
    };

    console.log(tableInfo);
    res.json( tableInfo );
    //res.render('table', { title: 'PinFE', tableInfo: tableInfo });
});


router.get('/:id/edit', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;

    var file = req.params.id;

    var json = query.json;

    let tablesDir = req.app.locals.FETableDirs+"/";
    let tableFile=tablesDir + file;


    if(!fs.existsSync(tableFile))
    {
        //if no table error
        //err
    }

    //load table db info.
    let dbase = utils.loadOrCreateTableDB(req,tableFile);

    var backglass =  tableFile.replace(".vpx", "") + ".directb2s"
    if(!fs.existsSync(backglass))
        backglass = tableFile + ".directb2s"
    if(!fs.existsSync(backglass))
        backglass = null
    
    var tableInfo = {
        name: path.basename(tableFile),
        file:encodeURIComponent(file).replace(/[!'()*]/g, escape),
        gameName: dbase.gameName,
        dbase: dbase,
        backglass: backglass,
    };

    //console.log(tableInfo);
    //res.json( tableInfo );

    res.render('table', { title: 'PinFE', tableInfo: tableInfo });
});
router.post('/update', function (req, res) {
    console.log(req.body);

    //res.json([name,exists]);

    res.render('table', { title: 'PinFE', table: {name:req.body.name} });
});

var upload_files = require('multer')();

router.post('/:id/upload', upload_files.single('file'), (req, res, next) => {

    var query = url.parse(req.url, true).query;
    var tableFile = decodeURIComponent( req.params.id);

    let tablesDir = req.app.locals.FETableDirs+"/";

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
      if (req.file.mimetype.startsWith('image/') && req.file.originalname.toLowerCase().endsWith(".png")) {
        var destName = tablesDir+ tableFile+".wheel.png";
        // if(fs.existsSync(destName))
        // {
        //     return res.status(422).json({
        //         error :'File exists.'
        //       });
        // }
        fs.writeFile(destName, req.file.buffer, function (err) {
            //res.redirect("back");
        });
        return res.status(200).send(req.file);
      }
    if (req.file.mimetype.startsWith('image/')) {

    }
    return res.status(422).json({
        error :'The uploaded file must be an BG or PNG image'
      });
 
      return res.status(200)//.send(req.file);
  });


module.exports = router;

