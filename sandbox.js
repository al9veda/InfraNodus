// Create unique ID for the statement


module.exports = cypherQuery;


// Construct CREATE Cypher query


function makeCypherQuery (user,concepts,statement,context,callback) {

    var index;

    var timestamp = new Date().getTime() * 10000;

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



function cypherQuery() {

}

cypherQuery.create = function(user, hashtags, statement, context, fn){

    makeCypherQuery(user, hashtags, statement, context, function(query) {
        var result = query;
        fn(result);
    } );

};