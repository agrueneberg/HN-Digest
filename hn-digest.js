(function () {
    "use strict";

    var argv, fs, $, RSS, _, request, moment, feed, tmpl;

    argv = require("optimist").usage("Usage: $0")
                              .option("p", {
                                  demand: true,
                                  alias: "path",
                                  describe: "Output path"
                               })
                              .option("l", {
                                  default: 20,
                                  alias: "limit",
                                  describe: "Number of digests per feed (default: 20)"
                               })
                              .argv;
    fs = require("fs");
    $ = require("cheerio");
    RSS = require("rss");
    _ = require("underscore");
    request = require("request");
    moment = require("moment");

    fs.readFile(argv.p, { encoding: "utf8" }, function (err, data) {

        var previousArticles, previousDigests;

        previousArticles = [];
        previousDigests = [];

        // Try to open existing feed to get a list of previous articles.
        if (err === null) {
            previousDigests = $("item", data).map(function (idx, previousDigest) {
                var $previousDigest;
                $previousDigest = $(previousDigest);
                return {
                    guid: $("guid", $previousDigest).text(),
                    description: $("description", $previousDigest).text()
                };
            });
            previousDigests.forEach(function (previousDigest) {
                $("li a.article", previousDigest.description).each(function (idx, el) {
                    previousArticles.push($(el).attr("href"));
                });
            });
        }

        feed = new RSS({
            title: "HN Digest",
            description: "Digest of the top HN articles.",
            site_url: "https://news.ycombinator.com"
        });

        tmpl = _.template('<li><a href="<%= link %>" class="article"><%= title %></a> <a href="https://news.ycombinator.com/item?id=<%= id %>">[comments]</a></li>');

        request("https://news.ycombinator.com/", function (err, resp, body) {

            var articles, description;

            articles = [];

            $("td.title a", body).each(function (idx, el) {
                var $headline, href, $comments, idPattern;
                $headline = $(el);
                href = $headline.attr("href");
             // Only push article if it is new.
                if (previousArticles.indexOf(href) > -1) {
                    return;
                }
             // Ignore `More` button.
                if (href === "news2") {
                    return;
                }
                $comments = $("a", $headline.parent().parent().next()).last();
             // Ignore ads (articles without comments).
                if ($comments.length === 0) {
                    return;
                }
                idPattern = /item\?id=(\d+)/;
                articles.push({
                    id: idPattern.exec($comments.attr("href"))[1],
                    title: $headline.text(),
                    link: href
                });
            });

            if (articles.length > 0) {

                description = "<ol>";

                articles.forEach(function (article) {
                    description += tmpl(article);
                });

                description += "</ol>";

                feed.item({
                    title: "HN Digest",
                    description: description,
                    guid: "agrueneberg/hn-digest/" + moment().format("X")
                });

                // Append previous digests, but limit the number of items.
                if (previousDigests.length >= argv.l) {
                    previousDigests.pop();
                }
                previousDigests.forEach(function (previousDigest) {
                    feed.item({
                        title: "HN Digest",
                        description: previousDigest.description,
                        guid: previousDigest.guid
                    });
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

}());
