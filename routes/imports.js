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

var User = require('../lib/user');

var Twit = require('twit');
var FlowdockText = require("flowdock-text");

var validate = require('../lib/middleware/validate');
var entries = require('../routes/entries');

var async = require('async');
var Evernote = require('evernote').Evernote;

var S = require('string');

var config = require('../config.json');

var Imap = require('imap'),
    inspect = require('util').inspect;

var Instruments = require('../lib/tools/instruments.js');

var mimelib = require("mimelib");


// Keeping them here as they are useful libs for future use

//var iconv = require('iconv-lite'); // converting encodings
//var cheerio = require('cheerio'); // for content extraction  from html pages
//var validator = require('validator'); // to validate encodings, emails, numbers




var T = new Twit({
    consumer_key:         config.twitter.consumer_key
    , consumer_secret:      config.twitter.consumer_secret
    , access_token:         config.twitter.access_token
    , access_token_secret:  config.twitter.access_token_secret
});





// GET request to the /settings page (view settings)

exports.render = function(req, res) {



    if (req.session.oauthAccessToken) {





   /*     notebooknotes = noteStore.getNotebook(req.session.oauthAccessToken, "e14d8c18-133f-4bc0-b32a-36ebe6ffd405", function(err, notebook) {

            console.log(notebook);

        });*/


        res.render('import', { title: 'Import Data to InfraNodus', evernote: req.session.oauthAccessToken});

    }
    else {

        res.render('import', { title: 'Import Data to InfraNodus', evernote: '' });

    }




};


// POST request to the settings page (change settings)

exports.submit = function(req, res,  next) {

    var user_id = res.locals.user.uid;

    // What will we analyze?
    var service = req.body.source;

    // What will we be extracting
    var extract = req.body.extract;

    var searchString = '';

    // What is the search string
    if (service == 'twitter' && (!req.body.search || req.body.search == ''))  {
        res.error('Please, enter the @username or a #hashtag');
        res.redirect('back');
    }
    else {
        searchString = req.body.search;
    }

    // How many recent posts
    var limit = 201;
    if (req.body.limit && req.body.limit < limit) {
            limit = req.body.limit;
    }

    // List to be used for import
    var importContext = 'imported';
    if (req.body.context && req.body.context.length > 3 && req.body.context.length < 13) {
        importContext = req.body.context;
    }
    else {
        req.body.context = importContext;
    }

    // We extract only hashtags or hashtags and morphemes
    // TODO reset res.locals after that parameter change

    if (req.body.settings == 'hashtags') {
        res.locals.user.hashnodes = '2';
    }
    else if (req.body.settings == 'morphemes') {
        res.locals.user.hashnodes = '1';
    }

    var twitterRequest = [];

    if (service == 'twitter' && extract == 'user') {
         twitterRequest = {
              type: 'statuses/user_timeline',
              params: {
                    screen_name: searchString.substr(1),
                    count: limit
              }
        }
    }
    else if (service == 'twitter' && extract == 'hashtag') {
         twitterRequest = {
            type: 'search/tweets',
            params: {
                q: searchString,
                count: limit
            }
        }
    }
    else if (service == 'twitter' && extract == 'timeline') {
        twitterRequest = {
            type: 'friends/ids',
            params: {
                screen_name: searchString.substr(1),
                count: limit
            }
        }


    }




    console.log('postparams');
    console.log(searchString);
    console.log(importContext);
    console.log(service);
    console.log(extract);


    if (searchString && service == 'twitter') {

        if (twitterRequest.type == 'friends/ids') {

            var tweets = [];
            var moreTwitterRequests = [];

            async.waterfall([

                function(callback){

                    T.get(twitterRequest.type, twitterRequest.params, function(err, data, response) {

                        console.log(data);
                        var result = data['ids'];
                        for (var i = 0; i < result.length; i++) {
                            var statement = result[i];
                            // Get 3 most recent statements from each friend of a user
                            moreTwitterRequests[i] = {
                                type: 'statuses/user_timeline',
                                params: {
                                    user_id: statement,
                                    count: 3
                                }
                            }

                        }

                        callback(null, moreTwitterRequests);

                    });



                },
                function(moreTwitterRequests, callback){

                    var count = 0;
                    for (var j = 0; j < moreTwitterRequests.length; j++) {


                        T.get(moreTwitterRequests[j].type, moreTwitterRequests[j].params, function(err, data, response) {

                            var result = data;


                            for (var k = 0; k < result.length; k++) {
                                var tweetobject = [];
                                tweetobject['created_at'] = result[k].created_at;
                                tweetobject['text'] = result[k].text;
                                tweets.push(tweetobject);
                            }
                            count = count + 1;
                            if (count == moreTwitterRequests.length) {
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
                        var dateB = new Date(b.created_at).getTime();
                        return dateA < dateB ? 1 : -1;
                    };

                    tweets.sort(sortFunction);
                    tweets = tweets.splice(0,100);

                    var statements = [];
                    var default_context = importContext;

                    var addToContexts = [];
                    addToContexts.push(default_context);

                    for (key in tweets) {
                        var statement = tweets[key].text;
                        var mentions = FlowdockText.extractMentions(statement);
                        for (index in mentions) {
                            statement = statement.replace(mentions[index], 'user_' + mentions[index].substr(1) + ' (http://twitter.com/' + mentions[index].substr(1) + ')');
                        }
                        statements.push(statement);
                    }

                    validate.getContextID(user_id, addToContexts, function(result, err) {
                        if (err) {
                            res.error('Something went wrong when adding new Tweets into Neo4J database. Try changing the import category name or open an issue on GitHub.');
                            res.redirect('back');
                        }
                        else {
                            console.log('so the statements we got are');
                            console.log(statements);
                            console.log('and default context');
                            console.log(default_context);
                            // What are the contexts that already exist for this user and their IDs?
                            // Note: actually there's been no contexts, so we just created IDs for all the contexts contained in the statement
                            var contexts = result;

                            console.log('extracted contexts');
                            console.log(contexts);

                            // Create default statement object that has an empty body, default context, and all the context IDs for the user
                            // context: default_context is where all the statements are added anyway
                            // contextids: contexts are the IDs of all the contexts that will be used in those statements

                            var req = {
                                body:  {
                                    entry: {
                                        body: ''
                                    },
                                    context: default_context
                                },

                                contextids: contexts,
                                internal: 1
                            };

                            console.log('requestobject');
                            console.log(req);


                            for (var key in statements) {
                                if (statements.hasOwnProperty(key)) {
                                    req.body.entry.body = statements[key];
                                    entries.submit(req, res);
                                }

                            }

                            // Move on to the next one

                            res.redirect('/contexts/' + default_context);
                        }


                    });


                }
            });


        }
        else {
            T.get(twitterRequest.type, twitterRequest.params, function(err, data, response) {

                var statements = [];

                var default_context = importContext;

                var addToContexts = [];
                addToContexts.push(default_context);


                var result = data;

                // For hashtag surrounding search remove the actual hashtag from all tweets
                if (twitterRequest.type == 'search/tweets') {
                    result = data['statuses'];

                }

                for (key in result) {
                    var statement = result[key].text;
                    var mentions = FlowdockText.extractMentions(statement);
                    for (index in mentions) {
                        statement = statement.replace(mentions[index], 'user_' + mentions[index].substr(1) + ' (http://twitter.com/' + mentions[index].substr(1) + ')');
                    }
                    if (twitterRequest.type == 'search/tweets') {
                        statement = statement.toLowerCase().replace(twitterRequest.params.q.toLowerCase(),'_#'+twitterRequest.params.q.substr(1).toLowerCase());
                    }
                    statements.push(statement);
                }


                validate.getContextID(user_id, addToContexts, function(result, err) {
                    if (err) {
                        res.error('Something went wrong when adding new Twitter lists into Neo4J database. Try changing the Twitter import folder name or open an issue on GitHub.');
                        res.redirect('back');
                    }
                    else {
                        console.log('so the statements we got are');
                        console.log(statements);
                        console.log('and default context');
                        console.log(default_context);
                        // What are the contexts that already exist for this user and their IDs?
                        // Note: actually there's been no contexts, so we just created IDs for all the contexts contained in the statement
                        var contexts = result;

                        console.log('extracted contexts');
                        console.log(contexts);

                        // Create default statement object that has an empty body, default context, and all the context IDs for the user
                        // context: default_context is where all the statements are added anyway
                        // contextids: contexts are the IDs of all the contexts that will be used in those statements

                        var req = {
                            body:  {
                                entry: {
                                    body: ''
                                },
                                context: default_context
                            },

                            contextids: contexts,
                            internal: 1
                        };

                        console.log('requestobject');
                        console.log(req);


                        for (var key in statements) {
                            if (statements.hasOwnProperty(key)) {
                                req.body.entry.body = statements[key];
                                entries.submit(req, res);
                            }

                        }

                        // Move on to the next one

                        res.redirect('/contexts/' + default_context);
                    }


                });



            });
        }
    }
    else if (service == 'evernote') {

        var userInfo 	= req.session.oauthAccessToken;
        var offset 		= 0;
        var count 		= limit;

        console.log('logged into Evernote');

        var client = new Evernote.Client({token: req.session.oauthAccessToken});

        console.log(req.session.oauthAccessToken);

        var noteStore = client.getNoteStore();
        var noteFilter = new Evernote.NoteFilter;
        var notesMetadataResultSpec = new Evernote.NotesMetadataResultSpec;

        var statements = [];

        var default_context = importContext;


        notebooks = noteStore.listNotebooks(function(err, notebooks) {
            //var notebookid = notebooks[1].guid
            if (err) {
                req.session.error = JSON.stringify(err);
                console.log(req.session.error);
                res.redirect('/');
            }
            else {


                // This below will be needed if we want to add filter notebooks functionality
                //noteFilter.notebookGuid = notebookid;

                // Let's create an array of notebook names to their IDs

                var notebooks_db = [];

                for (var t = 0; t < notebooks.length; t++) {
                     notebooks_db[notebooks[t].guid] = notebooks[t].name;
                }

                notesMetadataResultSpec.includeNotebookGuid = true;

                noteStore.findNotesMetadata(userInfo, noteFilter, offset, count, notesMetadataResultSpec, function(err, noteList) {
                    if (err) {
                        console.log(err);
                        console.log(noteList);
                    } else {
                        console.log(noteList);

                        var notebook_name = [];

                        for (var i = 0; i < noteList.notes.length; i++ ) {

                            notebook_name[i] = noteList.notes[i].notebookGuid;
                            console.log('notebookname');
                            console.log(notebook_name[i]);

                        }

                        async.waterfall([

                            function(callback){


                                var addToContexts = [];
                                // Here we create dummy statements in order to create the new contexts and get the IDs for them from our Neo4J DB

                                for (var m = 0; m < notebooks.length; m++) {
                                    addToContexts.push(S(notebooks[m].name).dasherize().chompLeft('-').camelize().s.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""));
                                }

                                validate.getContextID(user_id, addToContexts, function(result, err) {
                                    if (err) {
                                        res.error('Something went wrong when adding Evernote folders into Neo4J database. Try changing the name of your Evernote folder or open an issue on GitHub.');
                                        res.redirect('back');
                                    }
                                    else {

                                        // What are the contexts that already exist for this user and their IDs?
                                        // Note: actually there's been no contexts, so we just created IDs for all the contexts contained in the statement
                                        var contexts = result;

                                        console.log('Extracted contexts from DB with IDs');
                                        console.log(contexts);

                                        callback(null, contexts);
                                    }



                                });



                            },
                            function(contexts, callback){

                               callback(null,contexts);

                            }
                        ], function (err, contexts) {

                            if (err) {

                                console.log(err);



                            }
                            else {


                                for (var i = 0; i < noteList.notes.length; i++ ) {

                                    var notebook_name = noteList.notes[i].notebookGuid;
                                    var note_id = noteList.notes[i].guid;

                                    console.log('firstcontexts');
                                    console.log(contexts);
                                    getStatement(notebook_name, note_id, contexts);



                                }

                                function getStatement(notebook_name, note_id, contexts) {

                                    noteStore.getNoteContent(userInfo, note_id, function(err, result) {

                                        if (err) {
                                            console.log(err);
                                            res.error(err);
                                            res.redirect('back');

                                        }
                                        // Normalize note, get rid of tags, etc.

                                        var sendstring = S(result).stripTags().s;

                                        sendstring = sendstring.replace(/&quot;/g, '');


                                        // Create container for contexts to push

                                        var selcontexts = [];

                                        // Create contained for intemediary context

                                        var selcontexts2 = [];

                                        // What's the notebook name? This will be our context
                                        var currentcontext = S(notebooks_db[notebook_name]).dasherize().chompLeft('-').camelize().s.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
                                        currentcontext = currentcontext.replace(/[^\w]/gi, '');

                                        // Now let's find the right ID for that notebook in our database
                                        for (var i = 0; i < contexts.length; i++) {
                                            if (contexts[i].name == currentcontext) {
                                                selcontexts2['uid'] = contexts[i].uid;
                                                selcontexts2['name'] = contexts[i].name;
                                                selcontexts.push(selcontexts2);
                                            }
                                        }

                                        // and finally create an object to send this entry with the right context

                                        var req = {
                                            body:  {
                                                entry: {
                                                    body: sendstring
                                                },
                                                context: ''
                                            },

                                            contextids: selcontexts,
                                            internal: 1
                                        };


                                        entries.submit(req,res);



                                    });
                                }

                                    // Move on to the next one
                                res.error('Importing content... Please, reload this page in a few seconds...');
                                res.redirect('/');




                            }
                        });








                    }


                });
            }


        });





    }

    else if (service == 'email') {

        var email = '';
        var encoding = '';
        var sencoding = '';
        var statements = [];


        var imap = new Imap({
            user: req.body.email,
            password: req.body.password,
            host: req.body.host,
            port: req.body.port,
            tls: req.body.tls
        });

        function openInbox(cb) {
            imap.openBox('Notes', true, cb);
        }

        imap.once('ready', function() {
            openInbox(function(err, box) {
                if (err) {
                    throw err;
                    res.error(err);
                    res.redirect('back');
                }

                // How many last messages do we fetch?
                var nummes = box.messages.total - limit;


                var f = imap.seq.fetch(box.messages.total + ':' + nummes, { bodies: ['HEADER.FIELDS (DATE)','TEXT'], struct: true });
                f.on('message', function(msg, seqno) {
                    // console.log('Message #%d', seqno);
                    var prefix = '(#' + seqno + ') ';
                    msg.on('body', function(stream, info) {
                        if (info.which === 'TEXT') {
                            // console.log(prefix + 'Body [%s] found, %d total bytes', inspect(info.which), info.size);
                        }
                        var buffer = '', count = 0;
                        stream.on('data', function(chunk) {
                            count += chunk.length;
                            buffer += chunk.toString('utf8');
                            if (info.which === 'TEXT')  {
                                // console.log(prefix + 'Body [%s] (%d/%d)', inspect(info.which), count, info.size);
                            }
                        });

                        stream.once('end', function() {

                            // If the message contains text, save it to email variable

                            if (info.which !== 'TEXT') {
                                console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                            }
                            else  {
                                email = buffer;
                            }

                        });
                    });
                    msg.once('attributes', function(attrs) {

                        // Get the charset of the message obtained

                        var charset = attrs.struct[0].params.charset;
                        var enc = attrs.struct[0].encoding;

                        // Is the main encoding base64 - prioritize
                        if (enc == 'BASE64') {
                            encoding = 'base64';
                        }
                        // Another one – then it'll be that one
                        else {
                            encoding = charset;
                            sencoding = enc;
                        }



                    });
                    msg.once('end', function() {

                        // The statement is empty
                        var statement = '';

                        // If it's base64 convert it to utf8

                        if (encoding == 'base64') {
                            statement = new Buffer(email, 'base64').toString('utf8');
                        }

                        // otherwise it might have weird characters, so convert it accordingly
                        else if (sencoding == 'QUOTED-PRINTABLE') {
                            statement = mimelib.decodeQuotedPrintable(email);

                        }
                        // otherwise it must be utf-8 for real, so keep it that way
                        else {
                            statement = email;
                        }


                        // replace all html with spaces and <br> with \n

                        statement = Instruments.cleanHtml(statement);


                        // add the cleaned statement to array

                        statements.push(statement);


                        // console.log(prefix + 'Body [%s] Finished', inspect(info.which));

                    });
                });
                f.once('error', function(err) {
                    console.log('Fetch error: ' + err);
                });
                f.once('end', function() {

                    // console.log('Done fetching all messages!');

                    var default_context = importContext;

                    var addToContext = [];

                    addToContext.push(default_context);




                    validate.getContextID(user_id, addToContext, function(result, err) {
                        if (err) {
                            res.error('Something went wrong when adding new notes into Neo4J database. Try changing the import list name or open an issue on GitHub.');
                            res.redirect('back');
                        }
                        else {
                            // What are the contexts that already exist for this user and their IDs?
                            // Note: actually there's been no contexts, so we just created IDs for all the contexts contained in the statement

                            var contexts = result;


                            // Create default statement object that has an empty body, default context, and all the context IDs for the user
                            // context: default_context is where all the statements are added anyway
                            // contextids: contexts are the IDs of all the contexts that will be used in those statements

                            var req = {
                                body:  {
                                    entry: {
                                        body: ''
                                    },
                                    context: default_context
                                },

                                contextids: contexts,
                                internal: 1
                            };


                            for (var key in statements) {
                                if (statements.hasOwnProperty(key)) {
                                    req.body.entry.body = statements[key];
                                    entries.submit(req, res);
                                }

                            }

                            // Move on to the next one

                            res.redirect('/contexts/' + default_context);
                        }

                    });
                    imap.end();
                });
            });
        });

        imap.once('error', function(err) {
            console.log(err);
            res.error('Error connecting to email: ' + JSON.stringify(err));
            res.redirect('back');

        });

        imap.once('end', function() {
            console.log('Connection ended');
        });

        imap.connect();


    }




};
