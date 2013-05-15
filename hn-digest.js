var RSS, _, request, cheerio, rss, moment, fs, feed, tmpl;

RSS = require("rss");
_ = require("underscore");
request = require("request");
cheerio = require("cheerio");
moment = require("moment");
fs = require("fs");

feed = new RSS({
    title: "HN Digest",
    description: "Digest of the top HN articles.",
    site_url: "https://news.ycombinator.com"
});

tmpl = _.template('<li><a href="<%= link %>"><%= title %></a> &mdash; <a href="https://news.ycombinator.com/item?id=<%= id %>">Comments</a></li>');

request("https://news.ycombinator.com/", function (err, resp, body) {

    var $, articles, description, date;

    $ = cheerio.load(body);

    articles = [];

    description = "<ol>";

    $("td.title a").each(function (idx, el) {
        var $headline, $comments, idPattern;
        $headline = $(el);
        $comments = $("a", $headline.parent().parent().next()).last();
     // Ignore `More` button.
        if ($headline.attr("href") === "news2") {
            return;
        }
     // Ignore ads (articles without comments).
        if ($comments.length === 0) {
            return;
        }
        idPattern = /item\?id=(\d+)/;
        articles.push({
            id: idPattern.exec($comments.attr("href"))[1],
            title: $headline.text(),
            link: $headline.attr("href")
        });
    });

    articles.forEach(function (article) {
        description += tmpl(article);
    });

    description += "</ol>";

    date = moment();

    feed.item({
        title: "HN Digest",
        description: description,
        guid: date.format("YYYY-MM-DD ha")
    });

    fs.writeFile("rss.xml", feed.xml(), function (err) {
        if (err !== null) {
            console.error("Feed could not be written to disk:", err);
        } else {
            console.log("Feed was written to disk.");
        }
    });

});
