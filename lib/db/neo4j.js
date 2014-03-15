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
 *
 * A part of "Textexture" algorithm below for converting a sequence of words
 * and / or hashtags derived from a text into a network graph is pending for
 * patent application.
 *
 * You are free to implement it for personal non-commercial use in your own
 * open-source software if you retain this notice.
 *
 * For commercial use and/or if your software is not open-source, please,
 * contact vortext@textexture.com for the explicit written permission.
 *
 */

/**
 *
 * This is a CypherQuery constructor to add rich edge annotation to Neo4J
 * TODO: Support for OrientDB, Titanium and some iOS/Android based DB
 *
 */



var uuid = require('node-uuid');

var neo4j = require('node-neo4j');

var options = require('../../options');
dbneo = new neo4j(options.neo4jlink);

module.exports = CypherQuery;


// Create an prototype

function CypherQuery() {

}




CypherQuery.addStatement = function(user,concepts,statement,contexts,gapscan,callback) {

    // Generate new timestamp and multiply it by 10000 to be able to track the sequence the nodes were created in
    var timestamp = new Date().getTime() * 10000;

    // Generate unique ID for the node
    var node_uid = uuid.v1();

    // Create an array variable to store the already added Nodes to avoid duplicates in Cypher MERGE query for Concepts
    var concepts_added = [];

    // Define some variables for edges and scans

    // Weight of connection when the words are next to each other
    var narrativeScanWeight = 1;

    // Weight of connection when the words are next to each other in a scan gap
    var landscapeScanWeight = 3;

    // Do we do a wider gap scan?
    var gapscan = gapscan || null;

    // Scan gap width from the gapscan parameter. By default it equals 4 if nothing is passed.
    var scanGap = 4;


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
    createEdgesQuery = 'MERGE ' + concepts[0] + '-[:BY {timestamp:"' + timestamp + '",statement:"' + statement.uid + '"}]->u ';

    for (var indx = 0; indx < contexts.length; ++ indx) {
        createEdgesQuery += 'MERGE ' + concepts[0] + '-[:OF {context:"' + contexts[indx].uid + '",user:"' + user.uid + '",timestamp:"' + timestamp + '"}]->s  MERGE ' + concepts[0] + '-[:AT {user:"' + user.uid + '",timestamp:"' + timestamp + '",statement:"' + statement.uid + '"}]->'+'c_' + contexts[indx].name+' ';
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


        // Connect the words / hashtags that follow one another within the narrative - 2 Word Scan

        var minusOne = index - 1;

        // Let's make sure the previous node was not the same as the current

        if (concepts[minusOne] !== concepts[index]) {

            // Iterating the iteration to accommodate all the contexts
            for (var indx = 0; indx < contexts.length; ++ indx) {

                createEdgesQuery += 'MERGE ' + concepts[minusOne] +'-[:TO {context:"' + contexts[indx].uid + '",statement:"' + statement.uid + '",user:"' + user.uid + '",timestamp:"'+(timestamp+index)+'",uid:"' + edge_uid + '",gapscan:"2",weight:"' + narrativeScanWeight + '"}]->' + concepts[index] + ' ';

                // Create unique ID for the next edge
                edge_uid = uuid.v1();

            }
        }

        // Implement the algorithm that connects words / hashtags within the same statement within the scanGap of words

        if (gapscan) {

            // Determine the word to the furthest left of the gap (the beginning of scan)
            var leftGap = (index + 1) - scanGap;

            // If we went beyond the start of the text, make it zero
            if (leftGap < 0) leftGap = 0;

            // Now scan every word from the one we are now to the scanGap words backwards and give them the relevant weight

            for (var indexGap = leftGap; indexGap < index; ++indexGap) {

                // If the words are next to each other in the gap, they get the max weight. Otherwise it decreases.
                var weightInGap = (landscapeScanWeight + 1) - (index - indexGap);

                // The two concepts we're going to link are not the same?

                if (concepts[indexGap] !== concepts[index]) {

                    // Iterating through all the contexts

                    for (var indx = 0; indx < contexts.length; ++ indx) {

                        // Create unique ID for this edge
                        edge_uid = uuid.v1();

                        // Make query
                        createEdgesQuery += 'MERGE ' + concepts[indexGap] +'-[:TO {context:"' + contexts[indx].uid + '",statement:"' + statement.uid + '",user:"' + user.uid + '",timestamp:"'+(timestamp+index)+'",uid:"' + edge_uid + '",gapscan:"' + scanGap + '",weight:"' + weightInGap + '"}]->' + concepts[index] + ' ';



                    }
                }

            }

        }






        // Let's link that concept to Statement, Context and User even if there was a similar one before (can use it later for Weight)

        createEdgesQuery += 'MERGE ' + concepts[index]  + '-[:BY {timestamp:"' +(timestamp+index)+ '",statement:"' + statement.uid + '"}]->u ';

        for (var indx = 0; indx < contexts.length; ++ indx) {
            createEdgesQuery += 'MERGE ' + concepts[index] + '-[:OF {context:"' + contexts[indx].uid + '",user:"' + user.uid + '",timestamp:"'+(timestamp+index)+'"}]->s MERGE ' + concepts[index] + '-[:AT {user:"' + user.uid + '",timestamp:"' + (timestamp+index) + '",statement:"' + statement.uid + '"}]->'+ 'c_' + contexts[indx].name +' ';
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

