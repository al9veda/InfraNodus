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
 */

/**
 *
 * This is a CypherQuery constructor to add rich edge annotation to Neo4J
 * TODO: Support for OrientDB and Titanium
 */



var uuid = require('node-uuid');

var neo4j = require('node-neo4j');
dbneo = new neo4j('http://localhost:7474');

module.exports = CypherQuery;


// Create an prototype

function CypherQuery() {

}




CypherQuery.addStatement = function(user,concepts,statement,contexts,callback) {

    // Generate new timestamp and multiply it by 10000 to be able to track the sequence the nodes were created in
    var timestamp = new Date().getTime() * 10000;

    // Generate unique ID for the node
    var node_uid = uuid.v1();

    // Create an array variable to store the already added Nodes to avoid duplicates in Cypher MERGE query for Concepts
    var concepts_added = [];


    // Define starting points for each part of the query

    matchUser = 'MATCH (u:User {uid: "' + user.uid + '"}) ';

    // Add contexts to the query

    createContexts = '';

    for (var indx = 0; indx < contexts.length; ++ indx) {

        //Build context query
        createContexts += 'MERGE (' + 'c_' + contexts[indx].name + ':Context ' + '{name:"' + contexts[indx].name + '",by:"' + user.uid + '",uid:"'+contexts[indx].uid+'"}) ON CREATE SET ' + 'c_' + contexts[indx].name + '.timestamp="' + timestamp + '" MERGE ' + 'c_' + contexts[indx].name + '-[:BY{timestamp:"' + timestamp + '"}]->u ';
    }

    // Add the statement

    createStatement = 'MERGE (s:Statement ' + '{name:"#' + concepts[0];

    createNodesQuery = 'MERGE (' + concepts[0] + ':Concept ' + '{name:"' + concepts[0] + '"}) ON CREATE SET ' + concepts[0] + '.timestamp="' + timestamp + '", ' + concepts[0] +  '.uid="' + node_uid + '" ';
    createEdgesQuery = 'MERGE ' + concepts[0] + '-[:BY {timestamp:"' + timestamp + '"}]->u ';

    for (var indx = 0; indx < contexts.length; ++ indx) {
        createEdgesQuery += 'MERGE ' + concepts[0] + '-[:OF {context:"' + contexts[indx].uid + '",user:"' + user.uid + '",timestamp:"' + timestamp + '"}]->s  MERGE ' + concepts[0] + '-[:AT {user:"' + user.uid + '",timestamp:"' + timestamp + '"}]->'+'c_' + contexts[indx].name+' ';
    }

    // To avoid duplicates in Cypher MERGE for nodes
    concepts_added.push(concepts[0]);

    // Start loop for adding nodes, edges, and their relations

    for (var index = 1; index < concepts.length; ++ index) {

        // Generate unique IDs for nodes and edges
        var node_uid = uuid.v1();
        var edge_uid = uuid.v1();

        // Make sure the node has not yet been added

        if (concepts_added.indexOf(concepts[index]) === -1) {

            createNodesQuery += 'MERGE (' + concepts[index] + ':Concept ' + '{name:"' + concepts[index] + '"}) ON CREATE SET ' + concepts[index] + '.timestamp="' + (timestamp + index) + '", ' + concepts[index]  + '.uid="' + node_uid + '" ';

            // Add the node we just added into another array, to check for duplicates in the next cycle
            concepts_added.push(concepts[index]);
        }


        minusOne = index - 1;

        // Let's make sure the previous node was not the same as the current

        if (concepts[minusOne] !== concepts[index]) {

            // Iterating the iteration to accommodate all the contexts
            for (var indx = 0; indx < contexts.length; ++ indx) {
                createEdgesQuery += 'MERGE ' + concepts[minusOne] +'-[:TO {context:"' + contexts[indx].uid + '",statement:"' + statement.uid + '",user:"' + user.uid + '",timestamp:"'+(timestamp+index)+'",uid:"' + edge_uid + '"}]->' + concepts[index] + ' ';
                edge_uid = uuid.v1();

            }
        }

        // Let's link that concept to Statement, Context and User even if there was a similar one before (can use it later for Weight)

        createEdgesQuery += 'MERGE ' + concepts[index]  + '-[:BY {timestamp:"' +(timestamp+index)+ '"}]->u ';

        for (var indx = 0; indx < contexts.length; ++ indx) {
            createEdgesQuery += 'MERGE ' + concepts[index] + '-[:OF {context:"' + contexts[indx].uid + '",user:"' + user.uid + '",timestamp:"'+(timestamp+index)+'"}]->s MERGE ' + concepts[index] + '-[:AT {user:"' + user.uid + '",timestamp:"' + (timestamp+index) + '"}]->'+ 'c_' + contexts[indx].name +' ';
        }

        createStatement += ' #' + concepts[index];



    }

    createStatement += '", text:"' + statement.text + '", uid:"' + statement.uid + '"}) ON CREATE SET s.timestamp="' + timestamp + '" ';

    for (var indx = 0; indx < contexts.length; ++ indx) {
        createStatement += 'MERGE s-[:BY {context:"' + contexts[indx].uid + '",timestamp:"' + timestamp + '"}]->u ';
        createStatement += 'MERGE s-[:IN {user:"' + user.uid + '",timestamp:"'+timestamp+'"}]->'+'c_' + contexts[indx].name+' ';
    }
    createNodesEdgesQuery = matchUser + createContexts + createStatement + createNodesQuery + createEdgesQuery + ';';
    callback(createNodesEdgesQuery);

};

