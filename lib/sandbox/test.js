var Crawler = require("crawler");

var c = new Crawler();

// Queue URLs with custom callbacks & parameters
c.queue([{
    uri: 'https://www.google.com/ncr',

     // The global callback won't be called
    callback: function (error, result) {
        c.queue([{
            uri: 'https://www.google.com/search?gws_rd=ssl&site=&source=hp&q=google&oq=google',

            // The global callback won't be called
            callback: function (error, result) {
                console.log(result.body);
            }
        }]);
    }
}]);

