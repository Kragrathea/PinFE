﻿'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var jQuery = require('jquery');
//var flipster = require('jquery.flipster');

var app = express();

var Fuse = require('fuse.js');

var fs = require('fs');

const config = require('./config.json');
const defaultConfig = config.development;

var process = require('process');
var myArgs = process.argv.slice(2);
//console.log('myArgs: ', myArgs);

//todo. make configurable
app.locals.FELibDirs = defaultConfig.libDirs;//'/Games/PinFE';
app.locals.FETableDirs = defaultConfig.tableDirs;//'/Games/PinFE';

//for debugging.
//app.locals.FEDataDir = 'C:\\Games\\PinFE\\Apps\\PinFE';
//app.locals.FEDataDir = '../../../';

//override data dir from command line.
// if(myArgs.length>0)//todo. add switch syntax
//     app.locals.FELibDir =myArgs[0];

console.log("Library data directory set to:"+app.locals.FELibDirs)

var master = require('./routes/master');
var routes = require('./routes/index');
var users = require('./routes/users');
var wheels = require('./routes/wheels');
var backglasses = require('./routes/backglasses');
var tables = require('./routes/tables');
var table = require('./routes/table');
var grid = require('./routes/grid');

var install = require('./routes/install');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/scripts', express.static(__dirname + '/node_modules/'));

app.use('/', routes);
app.use('/users', users);
app.use('/master', master);
app.use('/wheels', wheels);
app.use('/backglasses', backglasses);
app.use('/tables', tables);
app.use('/table', table);
app.use('/grid', grid);

app.use('/install', install);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});





// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});
