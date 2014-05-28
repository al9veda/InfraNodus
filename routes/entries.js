/**
 * InfraNodus is a lightweight interface to graph databases.
 *
 * This open source, free software is available under MIT license.
 * It is provided as is, with no guarantees and no liabilities.
 * You are very welcome to reuse this code if you keep this notice.
 *
 * Written by Dmitry Paranyushkin | Nodus Labs and hopefully you also...
 * www.noduslabs.com | info AT noduslabs DOT com
 *
 * In some parts the code from the book "Node.js in Action" is used,
 * (c) 2014 Manning Publications Co.
 *
 */

var Entry = require('../lib/entry');
var FlowdockText = require("flowdock-text");
var validate = require('../lib/middleware/validate');
var options = require('../options');
var async = require('async');


exports.list = function(req, res, next){

    // The one who sees the statements (hello Tengo @1Q84 #Murakami)
    var receiver = '';
    // The one who made the statements (hello Fuka-Eri @1Q84 #Murakami)
    var perceiver = '';

    var perceivername = null;

    //res.locals.user = req.user;

    // Is the user logged in? Then he is the receiver
    if (res.locals.user) {
        receiver = res.locals.user.uid;
    }
    // Is there user in the URL and we know their ID already? Then the receiver will see their graph...
    if (req.params.user && res.locals.viewuser) {
        perceiver = res.locals.viewuser;
        perceivername = req.params.user;
    }
    // Otherwise they see their own
    else {
        if (res.locals.user) {
            perceiver = res.locals.user.uid;
        }
    }

    // Let's see what context the user wants to view if there is one

    var contexts = [];
        contexts.push(req.params.context);

    // Do we want to compare it with another ?addcontext=... ?

    if (req.query.addcontext) contexts.push(req.query.addcontext);

    // Now let's arrange what users we want to see and what information

    Entry.getRange(receiver, perceiver, contexts, function(err, entries) {
        if (err) return next(err);

        // Add links to @contexts and #hashtags
        for (var i = 0; i < entries.length; ++ i) {
              entries[i].text = FlowdockText.autoLinkMentions(entries[i].text,{hashtagUrlBase:"/contexts/",hashtagClass:"app-context-link"});
              entries[i].text = FlowdockText.autoLinkHashtags(entries[i].text,{hashtagUrlBase:"/concepts/",hashtagClass:"app-concept-link"});
              entries[i].text = FlowdockText.autoLinkUrlsCustom(entries[i].text,{class:"app-url-link",target:"_blank"});
        }

        console.log("Showing statements for user "+ receiver);
        console.log("Statements made by "+ perceiver);

        for (var s=0;s<contexts.length;++s) {
            if (contexts[s] == 'undefined' || typeof contexts[s] === 'undefined') {
                contexts[s] = '';
            }
        }

        res.render('entries', {
            title: 'InfraNodus',
            entries: entries,
            context: contexts[0],
            addcontext: req.query.addcontext,
            perceivername: perceivername,
            url: req.query.url,
            urltitle: req.query.urltitle
        });
    });
};

exports.form = function(req, res){
    res.render('post', { title: 'Post' });
};

exports.submit = function(req, res, next){

    // TODO  it's also a good opportunity to get rid of @contexts and change it to simple lists

    // Here we process the data of the POST request, the entry.body and entry.hashtags fields

    var statement = req.body.entry.body;

    // TODO this will be later replaced with an array of contexts derived before .submit is called
    var default_context = req.body.context;
    var contextids = req.contextids;

    var max_length = options.settings.max_text_length;
    var min_length = options.settings.min_text_length;
    var maxhash = options.settings.max_hashtags;



    async.waterfall([
        function(callback){
            if (!statement) {
                callback('please, enter a statement');
            }
            else if (statement.length <= min_length) {
                callback('a statement must have more than ' + min_length + ' characters');
            }
            else if (statement.length > max_length) {
                callback('try to make it less than ' + max_length + ' characters, please...');
            }
            else {
                callback(null, statement);
            }
        },
        function(statement, callback){
            statement = validate.sanitize(statement);
            callback(null, statement);
        },
        function(statement, callback){
            var hashtags = validate.getHashtags(statement, res);

            if  (!hashtags) {
                callback('there should be at least one #hashtag. you can double-click the words to hashtag them.');
            }
            else if (hashtags.length >= maxhash) {
                callback('please, try to use less than ' + maxhash + ' #hashtags');
            }
            else {
                callback(null, statement, hashtags);
            }
        },
        function(statement, hashtags, callback){

            var contexts = [];
            var contextsextracted = validate.getContext(statement, default_context);

            for (var i = 0; i < contextids.length; i++) {
                if (contextsextracted.indexOf(contextids[i].name) > -1) {
                    contexts.push(contextids[i]);
                }
            }


           for (var i = 0; i < contexts.length; ++i) {
                if (statement.indexOf('@' + contexts[i].name) == -1) {
                    statement +=  ' @' + contexts[i].name;
                }
            }
            callback(null, statement, hashtags, contexts);
        },
        function(statement, hashtags, contexts, callback){
            // Then we ascribe the data that the Entry object needs in order to survive
            // We create various fields and values for that object and initialize it

            var entry = new Entry({
                "by_uid": res.locals.user.uid,
                "by_id": res.locals.user.uid,
                "by_name": res.locals.user.name,
                "contexts": contexts,
                "hashtags": hashtags,
                "text": statement,
                "fullscan": res.locals.user.fullscan

            });
            callback(null, entry);
        }
    ], function (err, entry) {

        if (err) {

            console.log(err);
            res.error(err);
            res.redirect('back');

        }
        else {
            entry.save(function(err) {
                if (err) return next(err);
                if (req.remoteUser) {
                    res.json({message: 'Entry added.'});
                }
                else if (req.internal) {
                    //next();
                }
                else {
                    if (default_context == 'undefined' || typeof default_context === 'undefined' || default_context == '') {
                        res.redirect('/');
                    }
                    else {
                        res.redirect('/contexts/' + default_context);
                    }

                }
            });
        }
    });


};
