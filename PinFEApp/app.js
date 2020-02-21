'use strict';
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

app.locals.masterTableList = [];
function loadMasterTableList() {

    var masterDir = "./public/data";

    function findInDir(dir, filter, fileList = []) {
        const files = fs.readdirSync(masterDir + dir);

        files.forEach((file) => {
            const filePath = path.join(dir, file);
            const fileStat = fs.lstatSync(masterDir + filePath);

            if (fileStat.isDirectory()) {
                findInDir(filePath, filter, fileList);
            } else if (filter.test(filePath)) {
                fileList.push(filePath);
            }
        });

        return fileList;
    }

    function fuzzyCompare(a, b) {
        //console.log([a, b]);
        var ca = a.toLowerCase().replace(" ", "").replace("-", "").replace("(", "").replace(")", "");
        var cb = b.toLowerCase().replace(" ", "").replace("-", "").replace("(", "").replace(")", "");

        //if (ca.Contains("pharaoh") && cb.Contains("pharaoh"))
        //    Console.WriteLine("here");

        if (ca == cb)
            return true;
        return false;
    }
    function simplifyName(tableName) {
        if (tableName.indexOf(')') > 0)
            tableName = tableName.substring(0, tableName.indexOf('('));
        var ca = tableName.toLowerCase().replace(" ", "").replace("-", "").replace("_", "").replace("'", "").replace("\"", "").replace("&", "").replace("'", "").
            replace(",", "").replace(".", "").replace("!", "").replace("the", "").replace("and", "").replace("do brasil", "").replace(" ", "");
        return ca;
    }
    function superFuzzyCompare(a, b) {
        var ca = simplifyName(a);
        var cb = simplifyName(b);

        //Console.WriteLine(ca);

        if (ca == cb)
            return true;
        return false;
    }

    fs.readFile(masterDir + '/MasterTableList.tsv', function (err, data) {
        if (err) throw err;
        var lines = data.toString().split("\n");

        app.locals.masterTableList = [];

        //table headers are on line 1
        var headers = lines[1].split("\t");

        //override headers to shorter javascript friendly.
        headers = ["name", "comment", "type", "vpver", "author", "version", "date", "rom"]; //,"check","notes"];

        for (var i = 2; i < lines.length; i++) { //NOTE 2. Bypassheaders.
            var obj = {id:i-2}; //NOTE -2
            var currentline = lines[i].split("\t");
            for (var j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j];
            }
            app.locals.masterTableList.push(obj);
        }
        console.log("Loaded masterTableList. Length:" + app.locals. masterTableList.length);

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
        app.locals.masterTableIndex = new Fuse(app.locals.masterTableList, options);
        app.locals.masterTableQuickSearch = function (tableName) {

            //console.log("quickSearch for:" + query.query);
            var results = app.locals.masterTableList.filter(a => fuzzyCompare(a.name, tableName));
            //console.log("quickSearch found:" + results.length + " for" + simplifyName(qry));

            if (results.length < 1)
                results = app.locals.masterTableList.filter(a => superFuzzyCompare(a.name, tableName));
            //console.log("quickSearch found:" + results.length + " for" + simplifyName(qry));
            return (results);
        }

    });
}
loadMasterTableList();



var master = require('./routes/master');
var routes = require('./routes/index');
var users = require('./routes/users');
var wheels = require('./routes/wheels');
var backglasses = require('./routes/backglasses');
var tables = require('./routes/tables');


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
