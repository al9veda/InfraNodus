// Import library to generate UID for statements
var uuid = require('node-uuid');

// Import string processing libraries
var S = require('string');
var jsesc = require('jsesc');

// Import Hashtag extraction library
var FlowdockText = require('flowdock-text');




function parseField(field) {
    return field
        .split(/\[|\]/)
        .filter(function(s){ return s });
}


function getField(req, field) {
    var val = req.body;
    field.forEach(function(prop){
        val = val[prop];
    });
    return val;
}

// TODO Move the two functions below to tools/instruments.js

// Function to extract hashtags from any input

function extractHashtags(statement) {

    var hashtags = FlowdockText.extractHashtags(statement);

    // Convert them to lowercase
     for (var i = 0; i < hashtags.length; i++) {
        if (!S(hashtags[i]).isUpper()) {
            hashtags[i] = S(hashtags[i]).dasherize().chompLeft('-').camelize().s;
        }
        else {
            hashtags[i] = hashtags[i].toLowerCase();
        }
    }
    return hashtags;
}


// Function to extract context from any input

function extractContexts(statement) {

    var contexts = FlowdockText.extractMentions(statement);

    // Convert them to lowercase
    for (var i = 0; i < contexts.length; i++) {
        if (!S(contexts[i]).isUpper()) {
            contexts[i] = S(contexts[i]).dasherize().chompLeft('-').camelize().s;
        }
        else {
            contexts[i] = contexts[i].toLowerCase();
        }
    }
    return contexts;
}


exports.isLoggedIn = function(){
    return function(req, res, next){
        if (! res.locals.user) {
            res.error('Please, log in or register first.');
            res.redirect('back');
        } else {
            next();
        }
    }
};


exports.isToDelete = function(){
    return function(req, res, next){

        if (req.body.delete == 'delete') {

            if (req.body.statementid) {

                var delete_query = 'MATCH (s:Statement{uid:"' + req.body.statementid + '"}), ' +
                                    's-[rel]-a WITH rel, s ' +
                                    'MATCH c1-[:OF]->s<-[:OF]-c2, c1-[to:TO]->c2, c1-[by:BY]->u, c2-[at:AT]->ctx ' +
                                    'WHERE to.statement="' + req.body.statementid + '" AND ' +
                                    'by.statement="' + req.body.statementid + '" AND ' +
                                    'at.statement="' + req.body.statementid + '" ' +
                                    'DELETE s,rel,to,by,at;';

                console.log(delete_query);

                deleteStatement(goBack);

            }
            else {

                res.error('Sorry, but we did not get the ID of what you wanted to delete.');
                res.redirect('back');

            }

        }
        else {
            res.error('Deleted the old statement and added the new one.');
            res.redirect('back');
        }


        function deleteStatement (callback) {
            dbneo.cypherQuery(delete_query, function(err, cypherAnswer){

                if(err) {
                    err.type = 'neo4j';
                    return callback(err);
                }
                // No error? Pass the contexts to makeQuery function
                callback(null,cypherAnswer);


            });
        }

        // Here we pass it on to res. variable

        function goBack (err,answer) {

            // Error? Display it.
            if (err) console.log(err);

            // If all is good, make a message for the user and send him back
            res.error('Deleted. As if it has never been there.');
            res.redirect('back');

        }

    }
};

exports.required = function(field){
    field = parseField(field);
    return function(req, res, next){
        if (getField(req, field)) {
            next();
        } else {
            res.error(field.join(' ') + ' is required');
            res.redirect('back');
        }
    }
};

exports.lengthAbove = function(field, len){
    field = parseField(field);
    return function(req, res, next){
        if (getField(req, field).length > len) {
            next();
        } else {
            res.error(field.join(' ') + ' must have more than ' + len + ' characters');
            res.redirect('back');
        }
    }
};


// Functions to sanitize input and to process hashtags TODO: make it field (entry.body) independent

exports.sanitize = function(field){

    field = parseField(field);

    return function(req, res, next){
        result = getField(req, field);
        result = S(result).trim().collapseWhitespace().s;
        result = jsesc(result, {
            'quotes': 'double'
        });

        req.body.entry.body = result;

        console.log("Text body normalized: " + req.body.entry.body);

        next();
    }
};


exports.getHashtags = function(field) {
    field = parseField(field);
    return function(req,res,next) {

        val = getField(req, field);

        var hashtags = extractHashtags(val);
        if (hashtags[0] != null) {
            req.body.entry.hashtags = hashtags;
            console.log("Hashtags extracted: " + req.body.entry.hashtags);
            next();
        }
        else {
            res.error(field.join(' ') + ' should contain at least one #hashtag');
            res.redirect('back');
        }
    }
}

exports.getContext = function(field) {
    field = parseField(field);
    return function(req,res,next) {

        val = getField(req, field);

        var contexts = extractContexts(val);


        var default_context = req.body.context;


        if (contexts[0] != null) {

            if (default_context != 'undefined' && typeof default_context != 'undefined' && default_context != '' && default_context != 'private') {
                contexts.push('@' + default_context);
                req.body.entry.body += ' @' + default_context;
            }

            for (var i=0;i<contexts.length; ++ i) {
                contexts[i] = contexts[i].substr(1);
            }
            req.body.entry.contexts = contexts;
            console.log("Contexts extracted: " + req.body.entry.contexts);
            next();
        }
        // No contexts in the body? Use the default one!
        else {
            var contexts = [];
            if (default_context == 'undefined' || typeof default_context === 'undefined' || default_context == '') {

                // This here is the default name for default context, TODO: take it out in settings
                contexts[0] = 'private';

            }
            else {
                contexts[0] = default_context;
            }
            req.body.entry.contexts = contexts;
            req.body.entry.body += ' @' + contexts[0];
            console.log("Context @" + contexts[0] + " added automatically: " + req.body.entry.contexts);
            next();
        }
    }
}


// How to know user's ID from their name
// TODO This function should probably go somewhere else, not so cool to have Cypher query in here also

exports.getUserID = function(){

    return function(req, res, next){

        // Do we have user ID we want to view in our URL?

        if (req.params.user) {

            // We do? Then get the ID and pass it on further along the line...

            var query = 'MATCH (u:User{name:"' + req.params.user + '"}) RETURN u.uid';

            obtainUserID(passOn);

        }

        // There's no ID of the user in the URL to look, ok...
        else {

            // Is the one who's trying to view logged in?
            if (! res.locals.user) {

                // Not logged in? Well, then let's pass the user further along the line
                res.locals.viewuser = '';
                next();


            } else {

                // Aha, he's logged in and he doesn't say which users he wants, so we show him himself

                res.locals.viewuser = res.locals.user.neo_uid;
                next();

            }
        }


        // Here we get the ID of the user

        function obtainUserID (callback) {
            dbneo.cypherQuery(query, function(err, cypherAnswer){

                if(err) {
                    err.type = 'neo4j';
                    return callback(err);
                }
                // No error? Pass the contexts to makeQuery function
                callback(null,cypherAnswer);


            });
        }

        // Here we pass it on to res. variable

        function passOn (err,answer) {

            // Error? Display it.
            if (err) console.log(err);

            // So we take the answer, which is the ID of the user we want to view, and give it to res variable
            res.locals.viewuser = answer.data[0];

            next();

        }



    }
};





