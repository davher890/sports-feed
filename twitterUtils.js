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
    consumer_key: 'fFpcXYFaguQnuxWHV9eAcSR0q',
    consumer_secret: 'UE3671ATGOMtztEyvWFmhTk1ldpDzwCU4STKsRDSMl1jdbRJ2I',
    access_token_key: '3297445672-zvbNu9G1DM3rQHcCZx29LzG1KM5ThuVzFt3wmh8',
    access_token_secret: 'KiiyDvgHruQaC2He0luCj4WgABJ8y5YJGdirAAp5Uw9u4'
});

module.exports = {

    postTweet: function(text) {

        client.post('statuses/update', {
            status: text
        }, function(error, tweet, response) {
            if (error) {
                logger.error('Error', error);
            } else {
                logger.info('Tweet', tweet);
                // console.log(tweet); // Tweet body.
                // console.log(response); // Raw response object.
            }
        });
    }
}
