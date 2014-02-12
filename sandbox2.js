var CypherQuery = require('./lib/db/neo4j');


// Create unique ID for the statement
var uuid = require('node-uuid');
var statement_uid;
statement_uid = uuid.v1();

// Require string methods

var S = require('string');

var jsesc = require('jsesc');

// TODO Will transfer that from the form
var context = {
    name: "Rocket Science",
    uid: "cc5c4320-927e-11e3-a139-9331f538c925"
}


// TODO This will come from the form but needs to be processed

var statement = {
    text: "lets check if #lacie drives are better than #westernDigital when used with #Macs",
    uid: statement_uid
};



// TODO Will transfer that from the form

var user = {
    name: 'nassim',
    uid: "cc5c4320-927e-11e3-a139-9331f538c824"
};



// Get the hashtags out

var FlowdockText = require('flowdock-text');

var hashtags = FlowdockText.extractHashtags(statement.text);

// Convert them to lowercase

for(var i = 0; i < hashtags.length; i++) {
    if (!S(hashtags[i]).isUpper()) {
        hashtags[i] = S(hashtags[i]).dasherize().chompLeft('-').camelize().s;
    }
    else {
        hashtags[i] = hashtags[i].toLowerCase();
    }
}

console.log(hashtags);

// Remove extra whitespaces
statement.text = S(statement.text).trim().collapseWhitespace().s

// Make sure there's no injection
statement.text = jsesc(statement.text, {
    'quotes': 'double'
});

// Display them
console.log(statement.text);




CypherQuery.addStatement(user,hashtags,statement,context, function(entries) {
  console.log(entries);
});





/*

 TODO Implement the logic from here into the interface
 Implement this logic into the interface

 TODO Implement a simple server-side no database login system

 TODO Formalize this logic into a post on Nodus Labs and for KnowNodes

 TODO API
 Add all this functionality to APIs

 TODO Viz
 Visualize the graphs through Sigma

 TODO Interface
 Create better way to create contexts, etc. etc.


 */
