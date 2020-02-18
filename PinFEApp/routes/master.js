'use strict';
var express = require('express');
var router = express.Router();
var Fuse = require('fuse.js');

var fs = require('fs'),
    path = require('path'),
    querystring = require('querystring');
var url = require('url');




router.get('/search', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.query;

    var matches = masterTableIndex.search(qry);
    res.json({
        matches: matches
    });

});

router.get('/', function (req, res) {
    var query = url.parse(req.url, true).query;
    var qry = query.search;
    var image = query.image;
    var json = query.json;

    var results = res.app.locals.masterTableList;
    if (qry !== undefined) {
        results = res.app.locals.masterTableIndex.search(qry);
    }

    if (json !== undefined) {
        res.json( results );
    }
    else {
        var page = query.page;
        if (page === undefined)
            page = 0;
        page = parseInt(page);
        res.render('master', { title: 'PinFE', items: results.slice(page * 100, (page + 1) * 100) });
    }

});

module.exports = router;
