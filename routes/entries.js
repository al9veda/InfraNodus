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

    // Here we process the data of the POST request, the entry.body and entry.hashtags fields

    var data = req.body.entry;


    // Then we ascribe the data that the Entry object needs in order to survive
    // We create various fields and values for that object and initialize it

    var entry = new Entry({
        "by_uid": res.locals.user.uid,
        "by_id": res.locals.user.uid,
        "by_name": res.locals.user.name,
        "contexts": data.contexts,
        "hashtags": data.hashtags,
        "text": data.body,
        "fullscan": res.locals.user.fullscan

    });

    // Now that the object is created, we can call upon the save function

    var default_context = req.body.context;

    entry.save(function(err) {
        if (err) return next(err);
        if (req.remoteUser) {
            res.json({message: 'Entry added.'});
        } else {
            if (default_context == 'undefined' || typeof default_context === 'undefined' || default_context == '') {
                res.redirect('/');
            }
            else {
                res.redirect('/contexts/' + default_context);
            }

        }
    });
};
