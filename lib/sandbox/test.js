var Twit = require('twit');
var config = require('../../config.json');


var T = new Twit({
    consumer_key:         config.twitter.consumer_key
    , consumer_secret:      config.twitter.consumer_secret
    , access_token:         config.twitter.access_token
    , access_token_secret:  config.twitter.access_token_secret
});


var twitterRequest = {
    type: 'lists/statuses',
    params: {
        slug: 'dataviz',
        owner_screen_name: 'noduslabs',
        count: 100
    }
}



T.get(twitterRequest.type, twitterRequest.params, function(err, data, response) {
    if (err) {
        console.log(err);

    }
    else {
        console.log(data.length);
    }
});