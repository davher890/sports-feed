var request = require('request');
var moment = require('moment');
var schedule = require('node-schedule');
var twitterUtils = require('./twitterUtils');
var bunyan = require('bunyan');
var logger;

module.exports = {
    getNextFixture: function(jsonFile) {

        var nextMatchDay = 0;
        var nextFixture = [];

        if (jsonFile.fixtures && jsonFile.fixtures.length > 0) {

            // Get next match
            jsonFile.fixtures.every(function(match) {
                // Get first timed fixture and store the match day
                if (match.status === 'TIMED' || match.status === 'SCHEDULED') {
                    nextMatchDay = match.matchday;
                    return false;
                }
                return true;
            });
            logger.info('The next fixture is ', nextMatchDay);

            // Get the fixtures with the stored match day
            nextFixture = jsonFile.fixtures.filter(function(match) {
                if (match.matchday === nextMatchDay) {
                    return true;
                }
                return false;
            });
            return nextFixture;
        }
    },

    sendOneDayBeforeMessage: function(match, matchDate) {
        getMatchInfo(match._links.self.href, function(error, body) {
            if (error) {
                logger.info('Error getting match info');
            }
            else {
                match.info = JSON.parse(body);
                logger.info('1 day ' + match.homeTeamName + ' - ' + match.awayTeamName);
                var date = matchDate.format('HH:mm:ss');
                var text = 'Mañana a las ' + date + ', ' + match.homeTeamName + ' - ' + match.awayTeamName + '.';
                twitterUtils.postTweet(text);
            }
        });
    },

    sendOneHourBeforeMessage: function(match, matchDate) {
        getMatchInfo(match._links.self.href, function(error, body) {
            if (error) {
                logger.info('Error getting match info');
            }
            else {
                match.info = JSON.parse(body);
                logger.info('1 hour ' + match.homeTeamName + ' - ' + match.awayTeamName);
                var date = matchDate.format('HH:mm:ss');
                var text = 'Hoy a las ' + date + ', ' + match.homeTeamName + ' - ' + match.awayTeamName + '.';
                var countMatches = match.info.head2head.count;
                var countHome = match.info.head2head.homeTeamWins
                if (countMatches) {
                    text += 'El equipo local ha ganado ' + countHome + ' de los ultimos ' + countMatches + ' partidos.'
                }
                twitterUtils.postTweet(text);
            }
        });
    },

    sendFiveMinutesBeforeMessage: function(match, matchDate, getTextFunction) {
        getMatchInfo(match._links.self.href, function(error, body) {
            if (error) {
                logger.info('Error getting match info', error);
            }
            else {
                match.info = JSON.parse(body);
                logger.info('5 minutes ' + match.homeTeamName + ' - ' + match.awayTeamName);
                var text = match.homeTeamName + ' - ' + match.awayTeamName + '.';
                text += '. A falta de 5 minutos para el comienzo las apuestas estan asi: ' +
                    match.info.fixture.odds.homeWin + '-' +
                    match.info.fixture.odds.draw + '-' +
                    match.info.fixture.odds.awayWin;
                twitterUtils.postTweet(text);
            }
        });
    },

    sendResultChangeMessage: function(match) {
        getMatchInfo(match._links.self.href, function(error, body) {
            if (error) {
                logger.info('Error getting match info');
            }
            else {
                var info = JSON.parse(body);
                var goalsHomeTeam = JSON.parse(JSON.stringify(info.fixture.result.goalsHomeTeam));
                var goalsAwayTeam = JSON.parse(JSON.stringify(info.fixture.result.goalsAwayTeam));

                if (goalsHomeTeam && goalsAwayTeam && match.info && (goalsHomeTeam !== match.info.fixture.result.goalsHomeTeam ||
                        goalsAwayTeam !== match.info.fixture.result.goalsAwayTeam)) {
                    var text = match.homeTeamName + ' ' + match.info.fixture.result.goalsHomeTeam + ' : ' +
                        match.info.fixture.result.goalsAwayTeam + ' ' + match.awayTeamName;
                    // twitterUtils.postTweet(text);
                    logger.info(text);
                }
                match.info = body;
            }
        });
    },

    createCron: function(momentDate, sendTextFunction, match, matchDate, now, callback) {

        var timeout = momentDate.unix() - now.unix();
        timeout = (timeout * 1000);

        logger.info(momentDate.format('DD MM YYYY - HH:mm:ss'), 'Executing in ', timeout);

        setTimeout(function() {
            sendTextFunction(match, matchDate);
            if (callback) {
                callback();
            }
        }, timeout);
    },

    scheduleMatches: function(jsonFile, parentLogger, callback) {
        logger = parentLogger;
        var nextFixtureMatches = this.getNextFixture(jsonFile);

        if (nextFixtureMatches) {

            var lastDate = moment().add(2, 'hours').unix();

            for (var i = 0; i < nextFixtureMatches.length; i++) {

                var match = nextFixtureMatches[i];

                // Depending on the response of the api, add 2 hours or not
                var matchDate = moment(match.date). /*add(2, 'hours').*/ unix();

                // Add two hour because of the time zone
                var now = moment().add(2, 'hours').unix();

                if (matchDate > lastDate) {
                    lastDate = matchDate;
                }

                // The match is in the future
                if (match.status !== 'FINISHED' /*&& (matchDate - now) > 0*/ ) {

                    var logText = moment.unix(matchDate).format('DD MM YYYY - HH:mm:ss') + '--' + match.homeTeamName + ' - ' + match.awayTeamName;

                    // If the remaining time is bigger than a day
                    if ((matchDate - now) > 60 * 60 * 24) {
                        logText += ' *1 day* ';
                        this.createCron(moment.unix(matchDate).subtract(1, 'days'), this.sendOneDayBeforeMessage, match, moment.unix(matchDate), moment.unix(now));
                    }

                    // If the remaining time is bigger than an hour
                    if ((matchDate - now) > 60 * 60) {
                        logText += ' *1 hour* ';
                        this.createCron(moment.unix(matchDate).subtract(1, 'hours'), this.sendOneHourBeforeMessage, match, moment.unix(matchDate), moment.unix(now));
                    }

                    // If the remaining time is bigger than 5 minutes
                    if ((matchDate - now) > 60 * 5) {
                        logText += ' *5 minutes* ';
                        var self = this;
                        this.createCron(moment.unix(matchDate).subtract(5, 'minutes'), this.sendFiveMinutesBeforeMessage, match, moment.unix(matchDate), moment.unix(now),
                            function() {
                                // In five minutes the match will start
                                var interval = setInterval(function() {
                                        // Check if the result has change
                                        self.sendResultChangeMessage(match);
                                    },
                                    // Interval each 5 minutes
                                    5 * 60 * 1000);

                                setTimeout(function() {
                                    clearInterval(interval);
                                }, 120 * 60 * 1000);
                            }
                        );
                    }

                    // If the remaining time is bigger than 5 minutes
                    // if ((matchDate - now) < 0 && (now - matchDate) < 100 * 60) {
                    //     // Already match playing
                    //     logText += ' *playing* ';
                    //     var interval = setInterval(function() {
                    //             this.sendResultChangeMessage(match);
                    //         },
                    //         3000);

                    //     setTimeout(function() {
                    //         clearInterval(interval);
                    //     }, 120 * 60 * 1000);
                    // }

                    logger.info(logText);
                }
            }
            // Get last date; add 1 day; program the restart at this time
            callback(lastDate);
        }
    }
};

function getMatchInfo(matchUrl, callback) {
    var options = {
        method: 'GET',
        url: matchUrl,
        headers: {
            'content-type': 'application/json',
            'X-Auth-Token': 'bbc5c6b7b30c4486948ffed5fd43acdc'
        }
    };
    request(options, function(error, response, body) {
        callback(error, body);
    });
}