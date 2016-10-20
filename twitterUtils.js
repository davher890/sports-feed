var Twitter = require('twitter');
var bunyan = require('bunyan');
var logger = bunyan.createLogger({
    name: 'foo',
    streams: [{
        path: './log/utils.log',
        // `type: 'file'` is implied
    }]
});

var client = new Twitter({
    consumer_key: 'REDACTED',
    consumer_secret: 'REDACTED',
    access_token_key: 'REDACTED',
    access_token_secret: 'REDACTED'
});

module.exports = {

    postTweet: function(text) {

        client.post('statuses/update', {
            status: text
        }, function(error, tweet, response) {
            if (error) {
                logger.info('Error', error);
            }
            else {
                logger.info('Tweet', tweet);
                // console.log(tweet); // Tweet body.
                // console.log(response); // Raw response object.
            }
        });
    }
}
