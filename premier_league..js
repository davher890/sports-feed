'use strict'

var request = require('request');
var fs = require('fs');
var _ = require('underscore');
var utils = require('./utils');
var moment = require('moment');
var async = require("async");
var bunyan = require('bunyan');
var logger = bunyan.createLogger({
  name: 'foo',
  streams: [{
    path: './log/premier_league.log',
    // `type: 'file'` is implied
  }]
});

// 1 hour interval to keep active the process
setInterval(function() {
  var options = {
    method: 'GET',
    url: 'http://api.football-data.org/v1/soccerseasons/426/fixtures',
    headers: {
      'content-type': 'application/json',
      'X-Auth-Token': 'bbc5c6b7b30c4486948ffed5fd43acdc'
    }
  };
  request(options,
    function(error, response, body) {
      if (error) {
        console.log('Service unavailable')
      }
    });
}, 3600000 / 2);

function init() {

  var options = {
    method: 'GET',
    url: 'http://api.football-data.org/v1/soccerseasons/426/fixtures',
    headers: {
      'content-type': 'application/json',
      'X-Auth-Token': 'bbc5c6b7b30c4486948ffed5fd43acdc'
    }
  };
  request(options,
    function(error, response, body) {
      if (error) {
        logger.info('Error:', error);
      }
      else {
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
}

init();