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

module.exports = CypherQuery;


// Create an prototype

function CypherQuery() {

}


// Create a method

CypherQuery.addStatement = function(user,concepts,statement,context,callback) {

    // Generate new timestamp and multiply it by 10000 to be able to track the sequence the nodes were created in
    var timestamp = new Date().getTime() * 10000;

    // Generate unique ID for the node
    var node_uid = uuid.v1();

    // Create an array variable to store the already added Nodes to avoid duplicates in Cypher MERGE query for Concepts
    var concepts_added = [];

    // Define starting points for each part of the query

    matchUser = 'MATCH (u:User {uid: "' + user.uid + '"}) ';
    createContext = 'MERGE (c:Context ' + '{uid:"' + context.uid + '",name:"' + context.name + '"}) ON CREATE SET c.timestamp="' + timestamp + '" MERGE c-[c_u:BY]->u ON CREATE SET c_u.timestamp="' + timestamp + '" ';
    createStatement = 'MERGE (s:Statement ' + '{name:"#' + concepts[0];
    createNodesQuery = 'MERGE (' + concepts[0] + ':Concept ' + '{name:"' + concepts[0] + '"}) ON CREATE SET ' + concepts[0] + '.timestamp="' + timestamp + '", ' + concepts[0] +  '.uid="' + node_uid + '" ';
    createEdgesQuery = 'MERGE ' + concepts[0] + '-[:BY {timestamp:"' + timestamp + '"}]->u MERGE ' + concepts[0] + '-[:OF {context:"' + context.uid + '",user:"' + user.uid + '",timestamp:"' + timestamp + '"}]->s  MERGE ' + concepts[0] + '-[:AT {user:"' + user.uid + '",timestamp:"' + timestamp + '"}]->c ';

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
            createEdgesQuery += 'MERGE ' + concepts[minusOne] +'-[:TO {context:"' + context.uid + '",statement:"' + statement.uid + '",user:"' + user.uid + '",timestamp:"'+(timestamp+index)+'",uid:"' + edge_uid + '"}]->' + concepts[index] + ' ';
        }

        // Let's link that concept to Statement, Context and User even if there was a similar one before
        // This will later be used to add weight to that connection

        createEdgesQuery += 'MERGE ' + concepts[index]  + '-[:BY {timestamp:"' +(timestamp+index)+ '"}]->u MERGE ' + concepts[index] + '-[:OF {context:"' + context.uid + '",user:"' + user.uid + '",timestamp:"'+(timestamp+index)+'"}]->s MERGE ' + concepts[index] + '-[:AT {user:"' + user.uid + '",timestamp:"' + (timestamp+index) + '"}]->c ';



        createStatement += ' #' + concepts[index];



    }

    createStatement += '", text:"' + statement.text + '", uid:"' + statement.uid + '"}) ON CREATE SET s.timestamp="' + timestamp + '" MERGE s-[s_u:BY {context:"' + context.uid + '"}]->u ON CREATE SET s_u.timestamp="' + timestamp + '" MERGE s-[s_c:IN {user:"' + user.uid + '"}]->c ON CREATE SET s_c.timestamp="' + timestamp + '" ';
    createNodesEdgesQuery = matchUser + createContext + createStatement + createNodesQuery + createEdgesQuery + ';';
    callback(createNodesEdgesQuery);

};

