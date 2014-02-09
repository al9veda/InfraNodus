var neo4j = require('node-neo4j');
db = new neo4j('http://localhost:7474');

// Get the hashtags out

var FlowdockText = require('flowdock-text');

var context = "Default";

var statement = "So like #ClignancourtMarket is the #besthing I know and definitely they have lots of cool stuff like #rings and #hoodies much better than #KTZ";

var hashtags = FlowdockText.extractHashtags(statement);

var user_id = 270;

console.log(hashtags);


// Construct CREATE Cypher query


function makeCypherQuery (user_id,concepts,statement,context,callback) {

    var index;

    matchUser = 'MATCH (u:User {name: "nassim"}) CREATE ';
    createContext = '(c:Context ' + '{name:"' + context + '", by:"' + user_id + '"}), ';
    createStatement = '(s:Statement ' + '{name:"#' + concepts[0];
    createNodesQuery = '(' + concepts[0] + ':Hashtag ' + '{name:"' + concepts[0] + '", by:"' + user_id + '"})';
    createEdgesQuery = ', ' + concepts[0] +'-[:BY]->u, ' + concepts[0] + '-[:OF]->s, ' + concepts[0] + '-[:AT]->c';


    for (index = 1; index < concepts.length; ++ index) {
        createNodesQuery += ', (' + concepts[index] + ':Hashtag ' + '{name:"' + concepts[index] + '", by:"' + user_id + '"})';
        minusOne = index - 1;
        createEdgesQuery += ', ' + concepts[minusOne] + '-[:TO]->' + concepts[index] + ', ' + concepts[index] + '-[:BY]->u, ' + concepts[index] + '-[:OF]->s, ' + concepts[index] + '-[:AT]->c';
        createStatement += ' #' + concepts[index];
    }

    createStatement += '", text:"' + statement + '", by:"' + user_id + '"}), s-[:BY]->u, s-[:IN]->c, ';
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



