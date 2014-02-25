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

    // Now we need to get contexts ID from the database (if they exist)

    // Start constructing Neo4J query:

    var context_query = 'MATCH (u:User{uid:"'+user.uid+'"}), (c:Context), c-[:BY]->u WHERE ';

    // Foreach context get the right query

    contexts.forEach(function(element) {
        context_query += 'c.name = "'+element+'" OR ';
    });

    context_query += ' c.name = "~~~~dummy~~~~" RETURN DISTINCT c;';

    // First get the contexts from the DB, then make the query to add the nodes

    getContexts(makeQuery);


    // This will get the contexts from the database

    function getContexts (callback) {
        dbneo.cypherQuery(context_query, function(err, cypherAnswer){

            if(err) {
                err.type = 'neo4j';
                return callback(err);
            }
            // No error? Pass the contexts to makeQuery function
            callback(null,cypherAnswer);


        });
    }

    function makeQuery (err,answer) {
        // Error? Display it.
        if (err) console.log(err);

        // Show us the query, just in case
        console.log(context_query);

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



        // Finally, execute the query using the new contexts

        CypherQuery.addStatement(user,hashtags,statement,newcontexts, function(cypherRequest) {

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

    }








}

// TODO add a parameter in getRange which would tell the function what information to query

Entry.getRange = function(origin, context, fn){

    /*
    db.lrange('entries', from, to, function(err, items){
        if (err) return fn(err);
        var entries = [];

        items.forEach(function(item){
            entries.push(JSON.parse(item));
        });

        fn(null, entries);
    });  */

     var context_query = '';

     if (context) {
         context_query = '(ctx:Context{name:"' + context + '"}), ctx-[:BY]->u, s-[:IN]->ctx, ';
     }

     console.log("Retrieving statements for User UID: " + origin);

     var rangeQuery =  "MATCH (u:User{uid:'" + origin + "'}), " +
                       "(s:Statement), " +
                       context_query +
                       "s-[:BY]->u " +
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
