var phantom = require('phantom');
var cheerio = require('cheerio');


phantom.create(function (ph) {
    ph.createPage(function (page) {
        page.set('settings.userAgent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.89 Safari/537.1');
        page.open("http://www.google.com/ncr", function (status) {
            console.log("opened google NCR ", status);
            page.evaluate(function () { return document.title; }, function (result) {
                console.log('Page title is ' + result);
                page.open("https://www.google.com/search?gws_rd=ssl&site=&source=hp&q=Vladimir Putin", function (status) {
                    console.log("opened google Search Results ", status);
                    page.evaluate(function () { return document.body.innerHTML; }, function (result) {

                       // Show extracted HTML
                       // console.log(result);

                        var $ = cheerio.load(result);

                        $(".kno-vrt-t").each(function() {
                            var link = $(this);
                            var text = link.text();

                            console.log(text);
                        });

                        // Get the link to more results
                        var expandedurl = $("._Yqb").attr('href');


                        page.open("https://www.google.com" + expandedurl, function (status) {
                            console.log("opened connections ", status);
                            page.evaluate(function () { return document.body.innerHTML; }, function (result) {

                               // console.log(result);

                                var $ = cheerio.load(result);

                                $(".kltat").each(function() {
                                    var link = $(this);
                                    var text = link.text();

                                    console.log(text);
                                });


                                ph.exit();

                            });
                        });

                       // ph.exit();

                    });
                });

            });
        });
    });
});