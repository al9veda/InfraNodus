var neo4j = require('node-neo4j');
db = new neo4j('http://localhost:7474');


// Create unique ID for the statement
var uuid = require('node-uuid');
var statement_uid;
statement_uid = uuid.v1();

// Require string methods

var S = require('string');

var jsesc = require('jsesc');


var context = {
        name: "Rocket Science",
        uid: "cc5c4320-927e-11e3-a139-9331f538c925"
}

var statement = {
        text: "lets check if #lacie drives are better than #westernDigital when used with #Macs",
        uid: statement_uid
};


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

console.log(statement.text);



var timestamp = new Date().getTime() * 10000;

console.log(timestamp);


/*
   TODO Add timestamp to all the inputs

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

// Construct CREATE Cypher query


function makeCypherQuery (user,concepts,statement,context,callback) {

    var index;

    // We create a new timestamp and multiply it by 10000 to be able to track the sequence the nodes were created in
    var timestamp = new Date().getTime() * 10000;

    matchUser = 'MATCH (u:User {uid: "' + user.uid + '"}) ';
    createContext = 'MERGE (c:Context ' + '{uid:"' + context.uid + '",name:"' + context.name + '"}) ON CREATE SET c.timestamp="' + timestamp + '" MERGE c-[c_u:BY]->u ON CREATE SET c_u.timestamp="' + timestamp + '" ';
    createStatement = 'MERGE (s:Statement ' + '{name:"#' + concepts[0];
    createNodesQuery = 'MERGE (' + concepts[0] + ':Hashtag ' + '{name:"' + concepts[0] + '"}) ON CREATE SET ' + concepts[0] + '.timestamp="' + timestamp + '" ';
    createEdgesQuery = 'MERGE ' + concepts[0] + '-['+concepts[0]+'_u:BY]->u ON CREATE SET '+concepts[0]+'_u.timestamp="' + timestamp + '" MERGE ' + concepts[0] + '-['+concepts[0]+'_s:OF {context:"' + context.uid + '",user:"' + user.uid + '"}]->s ON CREATE SET '+concepts[0]+'_s.timestamp="' + timestamp + '" MERGE ' + concepts[0] + '-['+concepts[0]+'_c:AT {user:"' + user.uid + '"}]->c ON CREATE SET '+concepts[0]+'_c.timestamp="' + timestamp + '" ';


    for (index = 1; index < concepts.length; ++ index) {
        createNodesQuery += 'MERGE (' + concepts[index] + ':Hashtag ' + '{name:"' + concepts[index] + '"}) ON CREATE SET ' + concepts[index] + '.timestamp="' + (timestamp + index) + '" ';
        minusOne = index - 1;
        createEdgesQuery += 'MERGE ' + concepts[minusOne] + '-['+concepts[minusOne]+'_'+concepts[index]+':TO {context:"' + context.uid + '",statement:"' + statement.uid + '",user:"' + user.uid + '"}]->' + concepts[index] + ' ON CREATE SET '+concepts[minusOne]+'_'+concepts[index]+'.timestamp = "'+(timestamp+index)+'" MERGE ' + concepts[index] + '-['+concepts[index]+'_u:BY]->u ON CREATE SET '+concepts[index]+'_u.timestamp = "' +(timestamp+index)+ '" MERGE ' + concepts[index] + '-['+concepts[index]+'_s:OF {context:"' + context.uid + '",user:"' + user.uid + '"}]->s ON CREATE SET '+concepts[index]+'_s.timestamp = "'+(timestamp+index)+'" MERGE ' + concepts[index] + '-['+concepts[index]+'_c:AT {user:"' + user.uid + '"}]->c ON CREATE SET '+concepts[index]+'_c.timestamp = "' + (timestamp+index) + '" ';
        createStatement += ' #' + concepts[index];
    }

    createStatement += '", text:"' + statement.text + '", uid:"' + statement.uid + '"}) ON CREATE SET s.timestamp="' + timestamp + '" MERGE s-[s_u:BY {context:"' + context.uid + '"}]->u ON CREATE SET s_u.timestamp="' + timestamp + '" MERGE s-[s_c:IN {user:"' + user.uid + '"}]->c ON CREATE SET s_c.timestamp="' + timestamp + '" ';
    createNodesEdgesQuery = matchUser + createContext + createStatement + createNodesQuery + createEdgesQuery + ';';
    callback(createNodesEdgesQuery);

};



makeCypherQuery(user, hashtags, statement, context, function(query) {
    console.log(query);
} );





var addConcepts = {
    statements : [ {
        statement : 'CREATE (p:Hashtag {props}) RETURN p',
        parameters : {
            props : {
                name : 'Adam',
                timestamp : '',
                by: 22
            }
        }
    }]
};



/* db.insertNode({ name:'Darth Merengi', level: 99, hobbies: ['lightsaber fighting', 'cycling in space'], shipIds: [123, 321] }, 'User', function(err, result){
    console.log(result._id);
    console.log(result.hobbies);
}); */


/*

db.beginTransaction(function(err,returns) {
    if (err) throw err;
    console.log(returns);
});
*/

var d = new Date();

console.log(d.getTime());



