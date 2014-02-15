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

    var index;

    var timestamp = new Date().getTime() * 10000;

    // We create a new timestamp and multiply it by 10000 to be able to track the sequence the nodes were created in
    var timestamp = new Date().getTime() * 10000;

    // generate unique ID for the node
    var node_uid = uuid.v1();


    matchUser = 'MATCH (u:User {uid: "' + user.uid + '"}) ';
    createContext = 'MERGE (c:Context ' + '{uid:"' + context.uid + '",name:"' + context.name + '"}) ON CREATE SET c.timestamp="' + timestamp + '" MERGE c-[c_u:BY]->u ON CREATE SET c_u.timestamp="' + timestamp + '" ';
    createStatement = 'MERGE (s:Statement ' + '{name:"#' + concepts[0];
    createNodesQuery = 'MERGE (' + concepts[0] + ':Concept ' + '{name:"' + concepts[0] + '"}) ON CREATE SET ' + concepts[0] + '.timestamp="' + timestamp + '", ' + concepts[0] +  '.uid="' + node_uid + '" ';
    createEdgesQuery = 'MERGE ' + concepts[0] + '-['+concepts[0]+'_u:BY]->u ON CREATE SET '+concepts[0]+'_u.timestamp="' + timestamp + '" MERGE ' + concepts[0] + '-['+concepts[0]+'_s:OF {context:"' + context.uid + '",user:"' + user.uid + '"}]->s ON CREATE SET '+concepts[0]+'_s.timestamp="' + timestamp + '" MERGE ' + concepts[0] + '-['+concepts[0]+'_c:AT {user:"' + user.uid + '"}]->c ON CREATE SET '+concepts[0]+'_c.timestamp="' + timestamp + '" ';


    for (index = 1; index < concepts.length; ++ index) {
        var node_uid = uuid.v1();
        var edge_uid = uuid.v1();
        createNodesQuery += 'MERGE (' + concepts[index] + ':Concept ' + '{name:"' + concepts[index] + '"}) ON CREATE SET ' + concepts[index] + '.timestamp="' + (timestamp + index) + '", ' + concepts[index] +  '.uid="' + node_uid + '" ';
        minusOne = index - 1;
        createEdgesQuery += 'MERGE ' + concepts[minusOne] + '-['+concepts[minusOne]+'_'+concepts[index]+':TO {context:"' + context.uid + '",statement:"' + statement.uid + '",user:"' + user.uid + '"}]->' + concepts[index] + ' ON CREATE SET '+concepts[minusOne]+'_'+concepts[index]+'.timestamp = "'+(timestamp+index)+'", '+concepts[minusOne]+'_'+concepts[index]+'.uid="' + edge_uid + '" MERGE ' + concepts[index] + '-['+concepts[index]+'_u:BY]->u ON CREATE SET '+concepts[index]+'_u.timestamp = "' +(timestamp+index)+ '" MERGE ' + concepts[index] + '-['+concepts[index]+'_s:OF {context:"' + context.uid + '",user:"' + user.uid + '"}]->s ON CREATE SET '+concepts[index]+'_s.timestamp = "'+(timestamp+index)+'" MERGE ' + concepts[index] + '-['+concepts[index]+'_c:AT {user:"' + user.uid + '"}]->c ON CREATE SET '+concepts[index]+'_c.timestamp = "' + (timestamp+index) + '" ';
        createStatement += ' #' + concepts[index];
    }

    createStatement += '", text:"' + statement.text + '", uid:"' + statement.uid + '"}) ON CREATE SET s.timestamp="' + timestamp + '" MERGE s-[s_u:BY {context:"' + context.uid + '"}]->u ON CREATE SET s_u.timestamp="' + timestamp + '" MERGE s-[s_c:IN {user:"' + user.uid + '"}]->c ON CREATE SET s_c.timestamp="' + timestamp + '" ';
    createNodesEdgesQuery = matchUser + createContext + createStatement + createNodesQuery + createEdgesQuery + ';';
    callback(createNodesEdgesQuery);

};

