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


// Functions to sanitize input and to process hashtags TODO: make it field independent

exports.sanitize = function(field){

    field = parseField(field);

    return function(req, res, next){
        result = getField(req, field);
        result = S(result).trim().collapseWhitespace().s;
        result = jsesc(result, {
            'quotes': 'double'
        });

        req.body.entry.body = result;

        console.log(req.body.entry.body);

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
            console.log(req.body.entry.hashtags);
            next();
        }
        else {
            res.error(field.join(' ') + ' should contain at least one #hashtag');
            res.redirect('back');
        }
    }
}





