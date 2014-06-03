var Twit = require('twit');
var FlowdockText = require("flowdock-text");

var async = require('async');



var T = new Twit({
    consumer_key:         'thuprgnrfxsKUV78Q6LdPqZWJ'
    , consumer_secret:      '2kaOHBI71anPOOthkNr5OHIfqt0gbARcKXgCsss2LJndVrmmQg'
    , access_token:         '77502415-1AHLCPML1tFYm2q27sEYt5YWYp9M5QhGhWvy12qPC'
    , access_token_secret:  'rn9Vve1c5oDtyGqbPhKM1AFN0KNDWoO9L296bIBpDiMGJ'
});


//
//  search twitter for all tweets containing the word 'banana' since Nov. 11, 2011
//

var tweets = [];
var twitterRequest = [];


async.waterfall([

    function(callback){

        T.get('friends/ids', { screen_name: 'noduslabs', count: 3 }, function(err, data, response) {

            var result = data['ids'];

            for (var i = 0; i < result.length; i++) {
                var statement = result[i];
                twitterRequest[i] = {
                    type: 'statuses/user_timeline',
                    params: {
                        user_id: statement,
                        count: 3
                    }
                }

            }

            callback(null, twitterRequest);

        });



    },
    function(twitterRequest, callback){

        var count = 0;
        for (var j = 0; j < twitterRequest.length; j++) {


            T.get(twitterRequest[j].type, twitterRequest[j].params, function(err, data, response) {

                var result = data;

                for (var k = 0; k < result.length; k++) {
                    var tweetobject = [];
                    tweetobject['created_at'] = result[k].created_at;
                    tweetobject['text'] = result[k].text;
                    tweets.push(tweetobject);
                }
                count = count + 1;
                if (count == twitterRequest.length) {
                    callback(null, tweets);
                }


            });



        }


    }
], function (err, tweets) {

    if (err) {

        console.log(err);



    }
    else {

        function sortFunction(a,b){
            var dateA = new Date(a.created_at).getTime();
            var dateB = new Date(b.created_at.getTime();
            return dateA > dateB ? 1 : -1;
        };

        tweets.sort(sortFunction​)
        console.log(tweets);

    }
});
