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


var neo4j = require('node-neo4j');

var options = require('../options');
dbneo = new neo4j(options.neo4jlink);

var CypherQuery = require('./db/neo4j');
var Instruments = require('./tools/instruments.js');

var async = require('async');


module.exports = Entry;

function Entry(obj) {
    for (var key in obj) {
        this[key] = obj[key];
    }
}


Entry.prototype.save = function(fn){


    // Pass on the user parameters
    var user = {
        name: this.by_name,
        uid: this.by_uid
    };

    // Pass on the user's settings for graph scan

    var fullscan = this.fullscan;

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

    // Pass on the mentions
    var mentions = this.mentions;

    // Check user's settings and see if they want to do a full scan

    var gapscan = null;

    if (fullscan == '1') { gapscan = 1 }

    // Finally, execute the query using the new contexts

    CypherQuery.addStatement(user, hashtags, statement, contexts, mentions, gapscan, function(cypherRequest) {

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

// TODO add a parameter in getRange which would tell the function what information to query

Entry.getRange = function(receiver, perceiver, contexts, fn){


     // Start building the context query

     var context_query1 = '';
     var context_query2 = '';

     // Are the contexts passed? If yes, add contextual query

     if (contexts.length > 0 && contexts[0]) {

         context_query1 = '(ctx:Context), ctx-[:BY]->u, s-[:IN]->ctx, ';
         context_query2 = 'ctx.name="' + contexts[0] + '" ';

         for (var u=1;u<(contexts.length);++u) {
            context_query2 += 'OR ctx.name="' + contexts[u] + '" ';
         }

     }

     // Now who sees what?

    // Perceiver - the one who made the graph
    // Receiver - the one who's watching it

     if (((receiver == perceiver) && (receiver !== '')) || ((receiver !== '') && (perceiver === ''))) {

         console.log("Retrieving statements for User UID: " + receiver);
         console.log("Retrieving statements made by UID: " + perceiver);

         if (context_query2.length > 0) {
             context_query2 = "WHERE " + context_query2;
         }

         var rangeQuery =  "MATCH (u:User{uid:'" + receiver + "'}), " +
                           "(s:Statement), " +
                           context_query1 +
                           "s-[:BY]->u " +
                           context_query2 +
                           "RETURN DISTINCT s " +
                           "ORDER BY s.timestamp DESC;"

         console.log(rangeQuery);

     }
     else if ((receiver != perceiver) && (perceiver !== '')) {

         console.log("1 Retrieving statements for Guest User UID: " + receiver);
         console.log("Retrieving statements made by UID: " + perceiver);

         // The person who's viewing the stuff is not the one who made them, so we include nodes that belong to the private context here

         if (context_query2.length > 0) {
             context_query2 = "AND (" + context_query2 + ") ";
         }

         var rangeQuery =  "MATCH (u:User{uid:'" + perceiver + "'}), " +
                           "(ctxa:Context{name:'private'}), ctxa-[:BY]->u " +
                           "WITH DISTINCT ctxa,u " +
                           "MATCH (s:Statement), " +
                           context_query1 +
                           "s-[:BY]->u " +
                           "WHERE NOT s-[:IN]->ctxa " +
                           context_query2 +
                           "RETURN DISTINCT s " +
                           "ORDER BY s.timestamp DESC;"

         console.log(rangeQuery);
     }
     else {
         console.log("2 Retrieving statements for guest user UID: " + receiver);
         console.log("Retrieving statements made by UID: " + perceiver);

         var rangeQuery =  "MATCH " +
             "(s:Statement), " +
             "(ctx:Context), " +
             "s-[:IN]->ctx " +
             "WHERE ctx.name <> 'private' " +
             "AND has(s.timestamp) " +
             "AND has(s.uid) " +
             "RETURN DISTINCT s " +
             "ORDER BY s.timestamp DESC " +
             "LIMIT 20;"

         console.log(rangeQuery);
     }




     dbneo.cypherQuery(rangeQuery, function(err, statements){

            if(err) {
                err.type = 'neo4j';
                return fn(err);
             }

            // debug to see what info about statements is shown
            // console.log(statements);

            fn(null,statements.data);

     });


};


Entry.getNodes = function(receiver, perceiver, contexts, fullview, fn){

    var context_query = "";
    var view_filter = "";

    // Are the contexts passed? If yes, change relation query to query specific contexts

    if (contexts.length > 0 && contexts[0]) {

        context_query = 'AND (ctx.name="' + contexts[0] + '" ';
        for (var u = 1; u < (contexts.length); ++u) {
            context_query += 'OR ctx.name="' + contexts[u] + '" ';
        }

        context_query += ') ';

    }


    // Show graph with all types of connections or only the words that are next to each other?

    if (fullview == null) {
        view_filter = "AND (rel.gapscan='2' OR rel.gapscan IS NULL)  ";
    }


    // Who sees what?


    if (((receiver == perceiver) && (receiver !== '')) || ((receiver !== '') && (perceiver === ''))) {

        console.log("Retrieving nodes for User UID: " + receiver);
        console.log("Retrieving nodes made by UID: " + perceiver);

   /* var querynodes =    "MATCH " +
                        "(c1:Concept), (c2:Concept), " +
                        context_query1 +
                        "c1-[rel:TO]->c2 " +
                        "WHERE " +
                        view_filter +
                        context_query2 +
                        "(rel.user='" + receiver + "' AND " +
                        "ctx.uid = rel.context) " +
                        "WITH DISTINCT " +
                        "c1, c2 " +
                        "MATCH " +
                        "(ctxname:Context), " +
                        "c1-[relall:TO]->c2 " +
                        "WHERE " +
                        "(relall.user='" + receiver + "' AND " +
                        "ctxname.uid = relall.context) " +
                        "RETURN DISTINCT " +
                        "c1.uid AS source_id, " +
                        "c1.name AS source_name, " +
                        "c2.uid AS target_id, " +
                        "c2.name AS target_name, " +
                        "relall.uid AS edge_id, " +
                        "ctxname.name AS context_name, " +
                        "relall.statement AS statement_id, " +
                        "relall.weight AS weight;";*/

        var querynodes =   "START rel=relationship:relationship_auto_index(user='" + receiver + "') " +
                           "WHERE TYPE(rel)='TO' " + view_filter +
                           "WITH rel MATCH (ctx:Context) " +
                           "WHERE rel.context = ctx.uid " + context_query +
                           "RETURN DISTINCT STARTNODE(rel).uid AS source_id, STARTNODE(rel).name AS source_name, " +
                           "ENDNODE(rel).uid AS target_id, ENDNODE(rel).name AS target_name, rel.uid AS edge_id, " +
                           "ctx.name AS context_name, rel.statement AS statement_id, rel.weight AS weight;";

        console.log(querynodes);
    }

    else if ((receiver != perceiver) && (perceiver !== '')) {

        console.log("1 Retrieving nodes for User UID: " + receiver);
        console.log("Retrieving nodes made by UID: " + perceiver);

        var querynodes =  "MATCH (u:User{uid:'" + perceiver + "'}), (ctxa:Context{name:'private'}), ctxa-[:BY]->u " +
            "WITH DISTINCT ctxa,u " +
            "START rel=relationship:relationship_auto_index(user='" + perceiver + "') " +
            "WHERE TYPE(rel)='TO' " + view_filter +
            "WITH DISTINCT rel,ctxa,u " +
            "MATCH (ctx:Context) " +
            "WHERE rel.context = ctx.uid " + context_query + " AND rel.context <> ctxa.uid " +
            "RETURN DISTINCT STARTNODE(rel).uid AS source_id, STARTNODE(rel).name AS source_name, " +
            "ENDNODE(rel).uid AS target_id, ENDNODE(rel).name AS target_name, rel.uid AS edge_id, " +
            "ctx.name AS context_name, rel.statement AS statement_id, rel.weight AS weight;";

        console.log(querynodes);
    }



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

            if (!nodes_object[i][7]) {
                nodes_object[i][7] = 3;
            }

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
                edge_context: nodes_object[i][5],
                statement_id: nodes_object[i][6],
                weight: nodes_object[i][7]
            });

        };

        // TODO fix that some statements appear twice, some are gone issue #11


        g.nodes = Instruments.uniqualizeArray(g.nodes, JSON.stringify);

        g.nodes.sort(function(a, b){
                if(a.label < b.label) return -1;
                if(a.label > b.label) return 1;
                return 0;
        });

        g.edges = Instruments.uniqualizeArray(g.edges, JSON.stringify);


        fn(null,g);

    });



};
