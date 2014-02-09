var neo4j = require('node-neo4j');
db = new neo4j('http://localhost:7474');

// Get the hashtags out

var FlowdockText = require('flowdock-text');

var text = "Like #Paris was really something but #Berlin could never compare to it in its #Awesomeness";

var hashtags = FlowdockText.extractHashtags(text);

var user_id = 270;

console.log(hashtags);


// Construct CREATE Cypher query


function makeCypherQuery (nodes,user_id,callback) {
    var index;
    var createNodesQuery;
    var createEdgesQuery;

    matchUser = 'MATCH (u:User {name: "nassim"}) CREATE ';
    createNodesQuery = '(' + nodes[0] + ':Hashtag ' + '{name:"' + nodes[0] + '", id:"' + user_id + '"}), ';
    createNodesQuery += nodes[0] +'-[:BY]->u';
    createEdgesQuery = '';

    for (index = 1; index < nodes.length; ++ index) {
        createNodesQuery += ', (' + nodes[index] + ':Hashtag ' + '{name:"' + nodes[index] + '", id:"' + user_id + '"})';
        minusOne = index - 1;
        createEdgesQuery += ', ' + nodes[minusOne] + '-[:TO]->' + nodes[index] + ', ' + nodes[index] + '-[:BY]->u';
    }

    createNodesEdgesQuery = matchUser + createNodesQuery + createEdgesQuery + ';';
    callback(createNodesEdgesQuery);

};


makeCypherQuery(hashtags, user_id, function(query) {
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



