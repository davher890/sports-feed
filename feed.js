var feed = require("feed-read");
var _ = require('underscore');

// feed("http://craphound.com/?feed=rss2", function(err, articles) {
//     if (err) {
//         throw err;
//     }
//     else {
//         _.each(articles, function(article) {
//             console.log(article.title);
//         });
//     }
//     // Each article has the following properties:
//     // 
//     //   * "title"     - The article title (String).
//     //   * "author"    - The author's name (String).
//     //   * "link"      - The original article link (String).
//     //   * "content"   - The HTML content of the article (String).
//     //   * "published" - The date that the article was published (Date).
//     //   * "feed"      - {name, source, link}
//     // 
// });


var feedparser = require('feedparser'),
    parser = new feedparser();
    
parser.parseUrl("http://craphound.com/?feed=rss2")
    .on('article', console.log);
