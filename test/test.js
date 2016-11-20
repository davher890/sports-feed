'use strict'

var request = require('request');
var fs = require('fs');
var _ = require('underscore');
var utils = require('../utils');
var moment = require('moment');
var async = require("async");
var bunyan = require('bunyan');
var jsonFile = require('./test.json');

var processLog = bunyan.createLogger({
    name: "foo",
    streams: [{
        path: "./log/process-err.log"
    }]
});

function init() {
    var logger = bunyan.createLogger({
        name: 'foo',
        streams: [{
            path: './log/test.log',
            // `type: 'file'` is implied
        }]
    });

    utils.scheduleMatches(jsonFile, logger, function(lastDate) {
        lastDate = moment.unix(lastDate).add(2, 'hours').add(1, 'days').unix();
        var now = moment().add(2, 'hours').unix();
        setTimeout(function() {
            init();

        }, (lastDate - now) * 1000);
    });

}

init();

process.on('uncaughtException', (err) => {
    processLog.error(err);
});

process.on('exit', (code) => {
    processLog.error(`About to exit with code: ${code}`);
});
