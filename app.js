'use strict'

var request = require('request');
var fs = require('fs');
var _ = require('underscore');
var utils = require('./utils');
var moment = require('moment');
var async = require("async");
var bunyan = require('bunyan');

var processLog = bunyan.createLogger({
    name: "foo",
    streams: [{
        path: "./log/process-err.log"
    }]
});

var urlObject = {
    'liga_santander': 'http://api.football-data.org/v1/soccerseasons/436/fixtures',
    'champions': 'http://api.football-data.org/v1/soccerseasons/426/fixtures',
    'premier_league': 'http://api.football-data.org/v1/soccerseasons/440/fixtures'
};

function init() {

    _.each(urlObject, function(value, key) {

        var options = {
            method: 'GET',
            url: value,
            headers: {
                'content-type': 'application/json',
                'X-Auth-Token': 'bbc5c6b7b30c4486948ffed5fd43acdc'
            }
        };
        request(options,
            function(error, response, body) {
                var logger = bunyan.createLogger({
                    name: 'foo',
                    streams: [{
                        path: './log/' + key + '.log',
                        // `type: 'file'` is implied
                    }]
                });
                if (error) {
                    logger.err('Error:', error);
                } else {
                    var jsonFile = JSON.parse(body);
                    utils.scheduleMatches(jsonFile, logger, function(lastDate) {
                        lastDate = moment.unix(lastDate).add(2, 'hours').add(1, 'days').unix();
                        var now = moment().add(2, 'hours').unix();
                        setTimeout(function() {
                            init();

                        }, (lastDate - now) * 1000);
                    });
                }
            }
        );
    });
}

init();

process.on('uncaughtException', function(err) {
    // prevent infinite recursion
    // process.removeListener('uncaughtException', arguments.callee);

    // bonus: log the exception
    processLog.fatal(err);

    // if (typeof(processLog.streams[0]) !== 'object') return;

    // throw the original exception once stream is closed
    // processLog.streams[0].stream.on('close', function(streamErr, stream) {
    //     throw err;
    // });

    // close stream, flush buffer to disk
    // processLog.streams[0].stream.end();
});
