HN Digest
=========

HN Digest creates a static RSS feed of the first page of Hacker News. If run multiple times, it will only include new articles without duplicating previous ones.


Motivation
----------

You think RSS is not dead? You are annoyed by the table layout of Hacker News, especially on a mobile device? You don't care about its voting mechanism and just want to enjoy the top articles and their comments? This might be for you.


Requirements
------------

- Static file server
- NodeJS
- cron (optional, but strongly recommended)


Usage
-----

Clone this repository, run `npm install`, and invoke `node hn-digest.js -p rss.xml` to generate the RSS feed. Or even better, add it as a cronjob that runs, say, every 5 hours:

    00 */5 * * * node /path_to_repo/hn-digest.js -p rss.xml

- `-p` or `--path` specify the path where the feed is going to be stored.
- `-l` or `--limit` specify the number of previous digests to retain in the feed. The more often you update, the higher this value should be. Otherwise you'll see previous articles again. The default is 20.

Point your feed reader to the RSS feed, and enjoy!
