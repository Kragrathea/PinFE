'use strict';
var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');

var tablesDir = "../../../Tables/"; // ./public/data";

/* GET users listing. */
router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var name = query.name;
    var json = query.json;

    var exists = fs.existsSync(tablesDir + name);

    //res.json([name,exists]);

    res.render('table', { title: 'PinFE', table: {name:name} });
});
router.post('/update', function (req, res) {
    console.log(req.body);

    //res.json([name,exists]);

    res.render('table', { title: 'PinFE', table: {name:req.body.name} });
});

module.exports = router;
