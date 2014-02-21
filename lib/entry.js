/**
 * InfraNodus is a lightweight interface to graph databases.
 *
 * This open source, free software is available under MIT license.
 * It is provided as is, with no guarantees and no liabilities.
 * You are very welcome to reuse this code if you keep this notice.
 *
 * Written by Dmitry Paranyushkin | Nodus Labs, you, you and you!
 * www.noduslabs.com | info AT noduslabs DOT com
 *
 * In some parts the code from the book "Node.js in Action" is used,
 * (c) 2014 Manning Publications Co.
 *
 */

var redis = require('redis');
var db = redis.createClient();
var neo4j = require('node-neo4j');
dbneo = new neo4j('http://localhost:7474');
var CypherQuery = require('./db/neo4j');
var Instruments = require('./tools/instruments.js');

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

    // Pass on the contexts we got from Statement with validate.js
    var contexts = this.contexts;

    // Get their IDs

    var context_query = 'MATCH (u:User{uid:"'+user.uid+'"})';

    contexts.forEach(function(element,index) {
        context_query += ', (c'+index+':Concept{name:"'+element+'"}), c'+index+'-[:BY]->u';
    });

    context_query += ' RETURN ';



    // Construct a query using the data we have so far
    CypherQuery.addStatement(user,hashtags,statement,contexts, function(cypherRequest) {

        console.log(cypherRequest);

        // Make the query itself

        dbneo.cypherQuery(cypherRequest, function(err, cypherAnswer){

            // Important: this returns an error instead of crashing the server

            if(err) {
                err.type = 'neo4j';
                return fn(err);
            }


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



     console.log("Retrieving statements for User UID: " + origin);

     var rangeQuery =  "MATCH (u:User{uid:'" + origin + "'}), " +
                       "(s:Statement), s-[:BY]->u " +
                        "RETURN DISTINCT s " +
                        "ORDER BY s.timestamp DESC;"

    console.log(rangeQuery);


     dbneo.cypherQuery(rangeQuery, function(err, statements){

            if(err) {
                err.type = 'neo4j';
                return fn(err);
             }

            console.log(statements);

            fn(null,statements.data);

     });


};


Entry.getNodes = function(origin, fn){



    console.log("Retrieving nodes for User UID: " + origin);

    var querynodes =    "MATCH " +
                        "(c1:Concept), (c2:Concept), " +
                        "(ctx:Context), " +
                        "c1-[rel:TO]->c2 " +
                        "WHERE " +
                        "(rel.user='" + origin + "' AND " +
                        "ctx.uid = rel.context) " +
                        "RETURN DISTINCT " +
                        "c1.uid AS source_id, " +
                        "c1.name AS source_name, " +
                        "c2.uid AS target_id, " +
                        "c2.name AS target_name, " +
                        "rel.uid AS edge_id, " +
                        "ctx.name AS context_name;";

    console.log(querynodes);

    dbneo.cypherQuery(querynodes, function(err, nodes){

        if(err) {
            err.type = 'neo4j';
            return fn(err);
        }

        var nodes_object = nodes.data;

        var g = {
            nodes: [],
            edges: []
        };

        for (var i = 0; i < nodes_object.length; i++) {

            g.nodes.push({
                id: nodes_object[i][0],
                label: nodes_object[i][1]
            });

            g.nodes.push({
                id: nodes_object[i][2],
                label: nodes_object[i][3]
            });

            g.edges.push({
                source: nodes_object[i][0],
                target: nodes_object[i][2],
                id: nodes_object[i][4],
                edge_context: nodes_object[i][5]
            });

        };

        // TODO fix that some statements appear twice, some are gone issue #11


        g.nodes = Instruments.uniqualizeArray(g.nodes, JSON.stringify);
        g.edges = Instruments.uniqualizeArray(g.edges, JSON.stringify);


        fn(null,g);

    });



};
