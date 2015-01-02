var request = require('request');
var cheerio = require("cheerio");

request = request.defaults({jar: true});

var options = {
    url: 'http://www.google.com/ncr',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; rv:1.9.2.16) Gecko/20110319 Firefox/3.6.16'
    }
};

request(options, function () {

    request('https://www.google.com/search?gws_rd=ssl&site=&source=hp&q=google&oq=google', function (error, response, body) {

        var $ = cheerio.load(body);

        $("li").each(function() {
            var link = $(this);
            var text = link.text();

            console.log(text);
        });
    });
});