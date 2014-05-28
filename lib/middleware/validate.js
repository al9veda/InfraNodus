// Import library to generate UID for statements
var uuid = require('node-uuid');

// Import string processing libraries
var S = require('string');

// Import Hashtag extraction library
var FlowdockText = require('flowdock-text');

// Options for Stack Overflow
var options = require('../../options');


// Stemming module initialization
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();

// Lemmatizer module initialization
var Lemmer = require('node-lemmer').Lemmer;
var lemmerEng = new Lemmer('english');
var lemmerRus = new Lemmer('russian');

// Language detection
var LanguageDetect = require('languagedetect');
var lngDetector = new LanguageDetect();

var neo4j = require('node-neo4j');
dbneo = new neo4j(options.neo4jlink);



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

function uniques(arr) {
    var a = [];
    for (var i=0, l=arr.length; i<l; i++)
        for (var j = 0; j < arr[i].length; j++) {
            if (a.indexOf(arr[i][j]) === -1 && arr[i][j] !== '')   {
                a.push(arr[i][j]);
            }
        }
    return a;
}

// AUXILIARY FUNCTIONS

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

// Function to extract concepts from any input

function extractConcepts(statement, morphemes, hashnodes) {




    // Get rid of the @contexts in the statement
    statement = statement.replace(/@\S+/g, '');

    // Get rid of the single and double quotes in the statement
    //statement = statement.replace(/['"]+/g, '');

    // Get rid of the links in the statement - we need only hashtags and concepts
    statement = statement.replace(/(?:https?|ftp):\/\/\S+/g, '');

    // Detect language
    var lngDetected = lngDetector.detect(statement, 4);

    console.log(lngDetected);

    // A rather complicated way of detecting language because language detect module works like shit
    var lng = 'undefined';

    var lngmarker = '';

    for (var i = 0; i<lngDetected.length; ++i) {
        if (lngDetected[i][0] == 'russian' || lngDetected[i][0] == 'macedonian' || lngDetected == 'slovak' || lngDetected == 'serbian') {

            lng = 'russian';
            lngmarker = 'detected';
        }
        else if (lngDetected[i][0] == 'english' || lngDetected[i][0] == 'danish') {

            lng = 'english';
            lngmarker = 'detected';
        }
        else {
            if (lngDetected[i][0] == 'german' || lngDetected[i][0] == 'italian' || lngDetected[i][0] == 'french' || lngDetected[i][0] == 'spanish') {

                // If we detect one of the languages above on top of the list, mark it as default language
                if (lngmarker != 'detected') {
                    lng = lngDetected[i][0];
                    lngmarker = 'detected';
                }

            }
        }
    }

    // Get a list of stopwords from settings
    // TODO load stopword corrections from user's settings

    var stopwords = options.stopwords_en;

    if (lng == 'russian') {
        var stopwords = options.stopwords_ru;
    }

    if (lng == 'german') {
        var stopwords = options.stopwords_de;
    }

    if (lng == 'french') {
        var stopwords = options.stopwords_fr;
    }

    if (lng == 'spanish') {
        var stopwords = options.stopwords_es;
    }


    // #Hashtags should not be lemmatized? Then extract them as they are and remove them from the statement.

    var hashtags = [];

    if (morphemes != 1) {

        hashtags = FlowdockText.extractHashtags(statement);

        // Convert them to lowercase
        for (var i = 0; i < hashtags.length; i++) {
            if (!S(hashtags[i]).isUpper()) {
                hashtags[i] = S(hashtags[i]).dasherize().chompLeft('-').camelize().s;
            }
            else {
                hashtags[i] = hashtags[i].toLowerCase();
            }
        }

    }

    var concepts = [];

    if (lng == 'russian' || lng == 'german' || lng == 'french') {

        // Split the statement into tokens (words)

        var conceptsRaw = statement.toLowerCase().replace(/[.,!?;:-]/g, '').replace(/#+/g, '').split(/\s+/);

        for (var i = 0; i < conceptsRaw.length; i++) {
            if (conceptsRaw[i] != undefined && conceptsRaw[i] != null && conceptsRaw[i] != "") {
                concepts.push(conceptsRaw[i].replace(/['"]+/g, '').replace(/\\/g, ''));
            }
        }

    }

    else {

        concepts = tokenizer.tokenize(statement.toLowerCase());

    }



    // Make an array of concepts that are not in the stoplist and longer than 1 character OR the ones that belong to hashtags

    var conceptsclean = [];

    for (var i = 0; i < concepts.length; i++) {
        if ((stopwords.indexOf(concepts[i]) == -1  && concepts[i].length > 1) || hashtags.indexOf(concepts[i]) > -1) {
            conceptsclean.push(concepts[i]);
        }
    }


    // Now find lemmas for every concept

    var lemmas = [];

    // There are hashtags and they should not be lemmatized

    if (hashtags[0] != null && morphemes != 1) {

        for (var i = 0; i < conceptsclean.length; ++i) {

            // This concept is a hashtag? Then add it to the list of lemmas unchanged

            if (hashtags.indexOf(conceptsclean[i]) > -1) {

                var hashtag_array = [{
                        text: conceptsclean[i],
                        partOfSpeech: 'unchanged'
                }];

                lemmas.push(hashtag_array);
            }

            // It's not a hashtag

            else {

                if (lng == 'russian') {
                    lemmas.push(lemmerRus.lemmatize(conceptsclean[i]));
                }
                else if (lng == 'english') {
                    lemmas.push(lemmerEng.lemmatize(conceptsclean[i]));
                }
                else {
                    var hashtag_array = [{
                        text: conceptsclean[i],
                        partOfSpeech: 'unchanged'
                    }];

                    lemmas.push(hashtag_array);
                }
            }

        }

    }

    // There are hashtags or no hashtags and both words and hashtags should be lemmatized

    else {

        for (var i = 0; i < conceptsclean.length; ++i) {
            if (lng == 'russian') {
                lemmas.push(lemmerRus.lemmatize(conceptsclean[i]));
            }
            else if (lng == 'english') {
                lemmas.push(lemmerEng.lemmatize(conceptsclean[i]));
            }
            else {
                var hashtag_array = [{
                    text: conceptsclean[i],
                    partOfSpeech: 'unchanged'
                }];

                lemmas.push(hashtag_array);
            }
        }
    }
    console.log(lemmas);

    // Get the first result and make a clean array
    // TODO find a way to better process multiple results, e.g. return the shortest word

    var lemmasclean = [];

    for (var i = 0; i < lemmas.length; ++i) {
        if (lemmas[i][0] != undefined) {
            lemmasclean.push(lemmas[i][0]['text'].toLowerCase());
        }
    }


    return lemmasclean;
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


// EXPORTS FOR VALIDATION PURPOSES


// Checks if the user is logged in

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



// Checks if the statement should be deleted or edited

exports.isToDelete = function(){
    return function(req, res, next){

        // Are we here to delete, to edit, or are we just passing by?

        if (req.body.delete == 'delete' || req.body.submit == 'edit') {

            var delete_query = [];


                // A query for when there's more than 1 hashtag/concept

                delete_query[0] = 'START rel=relationship:relationship_auto_index(statement="' + req.body.statementid + '")' +
                                  'DELETE rel;';

                delete_query[1] = 'MATCH (s:Statement{uid:"' + req.body.statementid + '"}), ' +
                                  's-[by:BY]->u, s-[in:IN]->ctx, c-[of:OF]->s ' +
                                  'DELETE by,in,of,s;'



            // Now let's check if the user wants to delete or edit a node

            if (req.body.delete == 'delete') {

                if (req.body.statementid) {

                    console.log(delete_query);

                    deleteStatement(goBack);

                }
                else {

                    res.error('Sorry, but we did not get the ID of what you wanted to delete.');
                    res.redirect('back');

                }

            }

            // If we want to edit the node, we simply delete it and then pass on the data to entries.submit to add a new one

            else if (req.body.submit == 'edit') {

                if (req.body.statementid) {

                    console.log(delete_query);
                    deleteStatement(moveOn);

                }
                else {

                    res.error('Sorry, but we did not get the ID of what you wanted to edit.');
                    res.redirect('back');

                }


            }
        }

        // Neither delete, nor edit, so we move on to entries.submit (adding a new statement, that is)

        else {

            next();

        }


        // Constructing transation for Neo4J operation

        function deleteStatement (callback) {

            dbneo.beginAndCommitTransaction({
                statements : [ {
                                    statement : delete_query[0],
                                    resultDataContents : [ 'row', 'graph' ]
                               },
                                {
                                    statement : delete_query[1],
                                    resultDataContents : [ 'row', 'graph' ]
                                }
                ]
            }, function(err, cypherAnswer){

                    if(err) {
                        err.type = 'neo4j';
                        return callback(err);
                    }
                    // No error? Pass the contexts to makeQuery function
                    callback(null,cypherAnswer);


            });



        }

        // That's in case we want to go back (when deleted, for example)

        function goBack (err,answer) {

            // Error? Display it.
            if (err) {
                console.log(err);
                res.error('Sorry, something went wrong on the Deleting part...');
                res.redirect('back');
            }
            else {

                // If all is good, make a message for the user and send him back
                res.error('The statement was removed.');
                res.redirect('back');
            }

        }

        // That's when we want to move on (when deleted and adding a new one

        function moveOn (err,answer) {

            // Error? Display it.
            if (err) {
                console.log(err);
                res.error('Sorry, something went wrong on the Editing part...');
                res.redirect('back');
            }
            else {
                // If all is good, movemove on
                res.error('Edited the statement and added at the top of the list.');
                next();
            }

        }

    }
};



// Function to sanitize input and clean it from all the apostrophes. TODO: Think of a better option, maybe like jesc

exports.sanitize = function(statement){

        var result = statement;
        result = S(result).trim().collapseWhitespace().s;
        result = result.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');

        console.log("Text body normalized: " + result);

        return result;

};


// Extract hashtags from a statement

exports.getHashtags = function(statement, res) {


        val = statement;

        var hashtags = [];

        // Hashtags are given priority over words? Get them from the statement

        var hashnodes = 0;

        if (!res.locals.user.hashnodes) {
            hashnodes = 0;
        }
        else {
            hashnodes = res.locals.user.hashnodes;
        }

        if (hashnodes != 1) {
            hashtags = extractHashtags(val);
        }


        var morphemes = 0;

        if (!res.locals.user.morphemes) {
            morphemes = 0;
        }
        else {
            morphemes = res.locals.user.morphemes;
        }

        // If there were no hashtags, extract every word from a statement

        if (hashtags[0] == null) {
            hashtags = extractConcepts(val, morphemes, hashnodes);
        }

        var maxhash = options.settings.max_hashtags;

        if (hashtags[0] != null && hashtags.length < maxhash) {
            console.log("Hashtags extracted: " + hashtags);
            return hashtags;
        }

}


// Extract context from the statement

exports.getContext = function(statement,default_context) {

       // Contexts extracted from the statement entry form (@mentions)

        var contexts = extractContexts(statement);

        // Some contexts extracted from the body?

        if (contexts[0] != null) {

            // Push the main context of the page into the contexts list

            if (default_context != 'undefined' && typeof default_context != 'undefined' && default_context != '' && default_context != null) {
                if (contexts.indexOf('@' + default_context) == -1) {
                    contexts.push('@' + default_context);
                }
            }

            // Remove the @mention sign

            for (var i=0;i<contexts.length; ++ i) {
                contexts[i] = contexts[i].substr(1);
            }


            // Make sure we got it right
            console.log("Contexts extracted: " + contexts);


        }

        // No contexts in the body? Use the default one!

        else {


            // No default context?

            if (default_context == 'undefined' || typeof default_context === 'undefined' || default_context == '') {

                contexts.push('private');

            }

            // There is a default context, so let's add that one and other ones that are selected

            else {
                contexts[0] = default_context;
            }

            console.log("Context @" + contexts[0] + " added automatically");



        }

        // Pass it on

        return contexts;

}


exports.getContextForEntry = function(field) {
    field = parseField(field);
    var that = this;
    return function(req,res,next) {
        var statements = [];
        statements.push(getField(req, field));

        that.getContextID(res.locals.user.uid, null, statements, function(result) {
            var contexts = result;
            req.contextids = contexts;
            console.log('retrieved contexts');
            console.log(req.contextids);
            next();
        });


    }
}

exports.getContextID = function(user_id, default_context, statements, finalCallback) {


    var contexts = [];

    if (default_context == null || !default_context) {
        default_context = '';
    }

    for (var key in statements) {
        contexts.push(this.getContext(statements[key], default_context));
    }

    contexts = uniques(contexts);

    console.log('all the contexts');
    console.log(contexts);

    var context_query = 'MATCH (u:User{uid:"'+user_id+'"}), (c:Context), c-[:BY]->u WHERE ';

    // Foreach context get the right query

    contexts.forEach(function(element) {
        context_query += 'c.name = "'+element+'" OR ';
    });

    context_query += ' c.name = "~~~~dummy~~~~" RETURN DISTINCT c;';


    getContexts(makeQuery);

    // This will get the contexts from the database

    function getContexts (callback) {

        dbneo.cypherQuery(context_query, function(err, cypherAnswer){

            if(err) {
                err.type = 'neo4j';
                return callback(err);
            }



            // we have our answer, call the callback
            callback(null, cypherAnswer);

       });



    }

    function makeQuery (err,answer) {
        // Error? Display it.
        if (err) console.log(err);

        // Define where we store the new contexts
        var newcontexts = [];

        // This is an array to check if there are any contexts that were not in DB
        var check = [];

        // Go through all the contexts we received from DB and create the newcontexts variable from them
        for (var i=0;i<answer.data.length;i++) {
            newcontexts.push({
                uid: answer.data[i].uid,
                name: answer.data[i].name
            });
            check.push(answer.data[i].name);
        }

        // Now let's check if there are any contexts that were not in the DB, we add them with a unique ID
        contexts.forEach(function(element){
            if (check.indexOf(element) < 0) {
                newcontexts.push({
                    uid: uuid.v1(),
                    name: element
                });
            }
        });

        finalCallback(newcontexts);

    }




};





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

                res.locals.viewuser = res.locals.user.uid;
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





