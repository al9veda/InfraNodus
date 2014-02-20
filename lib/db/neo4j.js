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


CypherQuery.getContexts = function(userid,contexts,callback) {
    var queryContexts = 'MATCH (u:User {uid: "' + userid + '"}), (c:Context), c-[:BY]->u RETURN c';


}


CypherQuery.addStatement = function(user,concepts,statement,contexts,callback) {

    // Generate new timestamp and multiply it by 10000 to be able to track the sequence the nodes were created in
    var timestamp = new Date().getTime() * 10000;

    // Generate unique ID for the node
    var node_uid = uuid.v1();



    // Create an array variable to store the already added Nodes to avoid duplicates in Cypher MERGE query for Concepts
    var concepts_added = [];

    // TODO In case we ever need to have context_uid recorded in edges, we'll need to make a request here to DB and get their IDs

    // 1: Build a query to get the IDs of all the passed contexts (e.g. @private @health @tips (last one doesnt exist yet)




    // 2: Return the results in an array [indx][uid] [indx][name] = e.g. [0][32323] [0][private]

    // 3: If the previous context IS NOT IN the new one, add it in there.


    // Create an array variable to store the IDs for Contexts
    var contexts_uid = [];

    // Define starting points for each part of the query

    matchUser = 'MATCH (u:User {uid: "' + user.uid + '"}) ';

    // Add contexts to the query

    createContexts = '';

    for (var indx = 0; indx < contexts.length; ++ indx) {
        // Generate unique ID for the node
        var context_uid = uuid.v1();
        console.log("Context " + indx + " UID:" + context_uid);
        // Save it for future generations :)
        contexts_uid.push(context_uid);
        //Build context query
        createContexts += 'MERGE (' + 'c_' + contexts[indx] + ':Context ' + '{name:"' + contexts[indx] + '",by:"' + user.uid + '"}) ON CREATE SET ' + 'c_' + contexts[indx] + '.uid="' + context_uid + '", ' + 'c_' + contexts[indx] + '.timestamp="' + timestamp + '" MERGE ' + 'c_' + contexts[indx] + '-[:BY{timestamp:"' + timestamp + '"}]->u ';
    }

    // Add the statement

    createStatement = 'MERGE (s:Statement ' + '{name:"#' + concepts[0];

    createNodesQuery = 'MERGE (' + concepts[0] + ':Concept ' + '{name:"' + concepts[0] + '"}) ON CREATE SET ' + concepts[0] + '.timestamp="' + timestamp + '", ' + concepts[0] +  '.uid="' + node_uid + '" ';
    createEdgesQuery = 'MERGE ' + concepts[0] + '-[:BY {timestamp:"' + timestamp + '"}]->u ';

    for (var indx = 0; indx < contexts.length; ++ indx) {
        createEdgesQuery += 'MERGE ' + concepts[0] + '-[:OF {context:"' + contexts_uid[indx] + '",user:"' + user.uid + '",timestamp:"' + timestamp + '"}]->s  MERGE ' + concepts[0] + '-[:AT {user:"' + user.uid + '",timestamp:"' + timestamp + '"}]->'+'c_' + contexts[indx]+' ';
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
                createEdgesQuery += 'MERGE ' + concepts[minusOne] +'-[:TO {context:"' + contexts_uid[indx] + '",statement:"' + statement.uid + '",user:"' + user.uid + '",timestamp:"'+(timestamp+index)+'",uid:"' + edge_uid + '"}]->' + concepts[index] + ' ';
                edge_uid = uuid.v1();
                console.log("Contexts edges " + indx + " uid:" + contexts_uid[indx]);
            }
        }

        // Let's link that concept to Statement, Context and User even if there was a similar one before (can use it later for Weight)

        createEdgesQuery += 'MERGE ' + concepts[index]  + '-[:BY {timestamp:"' +(timestamp+index)+ '"}]->u ';

        for (var indx = 0; indx < contexts.length; ++ indx) {
            createEdgesQuery += 'MERGE ' + concepts[index] + '-[:OF {context:"' + contexts_uid[indx] + '",user:"' + user.uid + '",timestamp:"'+(timestamp+index)+'"}]->s MERGE ' + concepts[index] + '-[:AT {user:"' + user.uid + '",timestamp:"' + (timestamp+index) + '"}]->'+ 'c_' + contexts[indx] +' ';
        }

        createStatement += ' #' + concepts[index];



    }

    createStatement += '", text:"' + statement.text + '", uid:"' + statement.uid + '"}) ON CREATE SET s.timestamp="' + timestamp + '" ';

    for (var indx = 0; indx < contexts.length; ++ indx) {
        createStatement += 'MERGE s-[:BY {context:"' + contexts_uid[indx] + '",timestamp:"' + timestamp + '"}]->u ';
        createStatement += 'MERGE s-[:IN {user:"' + user.uid + '",timestamp:"'+timestamp+'"}]->'+'c_' + contexts[indx]+' ';
    }
    createNodesEdgesQuery = matchUser + createContexts + createStatement + createNodesQuery + createEdgesQuery + ';';
    callback(createNodesEdgesQuery);

};

