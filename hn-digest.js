var argv, fs, $, RSS, _, request, rss, moment, feed, tmpl;

argv = require("optimist").usage("Usage: $0")
                          .demand("p")
                          .alias("p", "path")
                          .describe("p", "Output file")
                          .argv;
fs = require("fs");
$ = require("cheerio");
RSS = require("rss");
_ = require("underscore");
request = require("request");
moment = require("moment");

fs.readFile(argv.p, { encoding: "utf8" }, function (err, data) {

    var previousArticles, $previousDigest;

    previousArticles = [];

    // Try to open existing feed to get a list of previous articles.
    if (err === null) {
        $previousDigest = $("item description", data).text();
        $("li a.article", $previousDigest).each(function (idx, el) {
            previousArticles.push($(el).attr("href"));
        });
    }

    feed = new RSS({
        title: "HN Digest",
        description: "Digest of the top HN articles.",
        site_url: "https://news.ycombinator.com"
    });

    tmpl = _.template('<li><a href="<%= link %>" class="article"><%= title %></a> <a href="https://news.ycombinator.com/item?id=<%= id %>">[comments]</a></li>');

    request("https://news.ycombinator.com/", function (err, resp, body) {

        var articles, description, date;

        articles = [];

        $("td.title a", body).each(function (idx, el) {
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

        // Ignore old articles.
        articles = articles.filter(function (article) {
            return previousArticles.indexOf(article.link) == -1;
        });

        if (articles.length > 0) {

            description = "<ol>";

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

            fs.writeFile(argv.p, feed.xml(), function (err) {
                if (err !== null) {
                    console.error("Feed could not be written to disk:", err);
                } else {
                    console.log("Feed was written to disk.");
                }
            });

        } else {
            console.log("Feed was not written to disk: there are no new articles.");
        }

    });

});
