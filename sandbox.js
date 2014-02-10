var neo4j = require('node-neo4j');
db = new neo4j('http://localhost:7474');

// Get the hashtags out

var FlowdockText = require('flowdock-text');

var context = "Default";

var statement = "So like #ClignancourtMarket is the #besthing I know and definitely they have lots of cool stuff like #rings and #hoodies much better than #KTZ and from #WestCoast";

var hashtags = FlowdockText.extractHashtags(statement);

var user_id = 270;

console.log(hashtags);



// TODO create an internal system of IDs for each node


// Construct CREATE Cypher query


function makeCypherQuery (user_id,concepts,statement,context,callback) {

    var index;

    matchUser = 'MATCH (u:User {name: "nassim"}) MERGE ';
    createContext = '(c:Context ' + '{name:"' + context + '"}) MERGE c-[:BY]->u MERGE ';
    createStatement = '(s:Statement ' + '{name:"#' + concepts[0];
    createNodesQuery = '(' + concepts[0] + ':Hashtag ' + '{name:"' + concepts[0] + '"})';
    createEdgesQuery = ' MERGE ' + concepts[0] +'-[:BY]->u MERGE ' + concepts[0] + '-[:OF {context:"' + context + '",user:"' + user_id + '"}]->s MERGE ' + concepts[0] + '-[:AT {user:"' + user_id + '"}]->c';


    for (index = 1; index < concepts.length; ++ index) {
        createNodesQuery += ' MERGE (' + concepts[index] + ':Hashtag ' + '{name:"' + concepts[index] + '"})';
        minusOne = index - 1;
        createEdgesQuery += ' MERGE ' + concepts[minusOne] + '-[:TO {context:"' + context + '",statement:"' + statement + '",user:"' + user_id + '"}]->' + concepts[index] + ' MERGE ' + concepts[index] + '-[:BY]->u MERGE ' + concepts[index] + '-[:OF {context:"' + context + '",user:"' + user_id + '"}]->s MERGE ' + concepts[index] + '-[:AT {user:"' + user_id + '"}]->c';
        createStatement += ' #' + concepts[index];
    }

    createStatement += '", text:"' + statement + '"}) MERGE s-[:BY]->u MERGE s-[:IN {user:"' + user_id + '"}]->c MERGE ';
    createNodesEdgesQuery = matchUser + createContext + createStatement + createNodesQuery + createEdgesQuery + ';';
    callback(createNodesEdgesQuery);

};


makeCypherQuery(user_id, hashtags, statement, context, function(query) {
    console.log(query);
} );






var addConcepts = {
    statements : [ {
        statement : 'CREATE (p:Hashtag {props}) RETURN p',
        parameters : {
            props : {
                name : 'Adam',
                timestamp : '',
                by: 22
            }
        }
    }]
};



/* db.insertNode({ name:'Darth Merengi', level: 99, hobbies: ['lightsaber fighting', 'cycling in space'], shipIds: [123, 321] }, 'User', function(err, result){
    console.log(result._id);
    console.log(result.hobbies);
}); */


/*

db.beginTransaction(function(err,returns) {
    if (err) throw err;
    console.log(returns);
});
*/

var d = new Date();

console.log(d.getTime());



