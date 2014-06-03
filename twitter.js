var Twit = require('twit');
var FlowdockText = require("flowdock-text");


var T = new Twit({
    consumer_key:         'thuprgnrfxsKUV78Q6LdPqZWJ'
    , consumer_secret:      '2kaOHBI71anPOOthkNr5OHIfqt0gbARcKXgCsss2LJndVrmmQg'
    , access_token:         '77502415-1AHLCPML1tFYm2q27sEYt5YWYp9M5QhGhWvy12qPC'
    , access_token_secret:  'rn9Vve1c5oDtyGqbPhKM1AFN0KNDWoO9L296bIBpDiMGJ'
});


//
//  search twitter for all tweets containing the word 'banana' since Nov. 11, 2011
//
T.get('statuses/home_timeline', { count: 50 }, function(err, data, response) {
    var result = data;
    for (key in result) {
        var statement = result[key].text;
        console.log(statement);
    }



});
