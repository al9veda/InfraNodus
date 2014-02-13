var redis = require('redis');
var db = redis.createClient();
var neo4j = require('node-neo4j');
dbneo = new neo4j('http://localhost:7474');
var CypherQuery = require('./db/neo4j');

module.exports = Entry;

function Entry(obj) {
    for (var key in obj) {
        this[key] = obj[key];
    }
}

/*Entry.prototype.save = function(fn){
    var entryJSON = JSON.stringify(this);

    db.lpush(
        'entries',
        entryJSON,
        function(err) {
            if (err) return fn(err);
            fn();
        }
    );
};     */

Entry.prototype.save = function(fn){


    // TODO Make it set up automatically later for each user
    var context = {
        name: "Sandbox",
        uid: "cc5c4320-927e-11e3-a139-9331f538c999"
    }

    // Pass on the user parameters
    var user = {
        name: this.by_name,
        uid: this.by_uid
    };

    // Set up UID for the statement
    var uuid = require('node-uuid');
    var statement_uid = uuid.v1();

    // Pass on statement parameters
    var statement = {
        text: this.text,
        uid: statement_uid
    };

    // Pass on the hashtags we got from Statement with validate.js
    var hashtags = this.hashtags;

    // Construct a query using the data we have so far
    CypherQuery.addStatement(user,hashtags,statement,context, function(cypherRequest) {

        console.log(cypherRequest);

        // Make the query itself

        dbneo.cypherQuery(cypherRequest, function(err, cypherAnswer){
            if(err) throw err;

            console.log("Return info: " + cypherAnswer);

            fn(null,cypherAnswer);

        });
    });

    // Continue




}

// TODO add a parameter in getRange which would tell the function what information to query

Entry.getRange = function(origin, fn){

    /*
    db.lrange('entries', from, to, function(err, items){
        if (err) return fn(err);
        var entries = [];

        items.forEach(function(item){
            entries.push(JSON.parse(item));
        });

        fn(null, entries);
    });  */



     console.log("Retrieving nodes for User UID: " + origin);

     dbneo.cypherQuery("MATCH (u:User{uid:'" + origin + "'}), (s:Statement), s-[rel:BY]->u RETURN s ORDER BY rel.timestamp DESC;", function(err, statements){
            if(err) throw err;

            console.log(statements);

            fn(null,statements.data);

     });

     // TODO 0. MAYBE GET A LIST OF ALL THE CONCEPTS - NETWORK MOTIFS STYLE?

     // TODO 1. GET ALL THE NODES FOR THE USER AS JSON (CHECK WHAT SIGMA NEEDS) AND VISUALIZE THEM

     // TODO 2. WHEN A NODE IS CLICKED, THE STATEMENTS ON THE LEFT ARE FILTERED ACCORDINGLY


};

