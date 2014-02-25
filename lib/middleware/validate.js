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

            // TODO In case we're coming from a context page, add it to the list of contexts (unlike private)

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
            if (default_context == 'undefined' || typeof default_context === 'undefined') {
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





