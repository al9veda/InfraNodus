var neo4j = require('node-neo4j');
dbneo = new neo4j('http://localhost:7474');

var contexts = ['tips','health'];

var uid = '3883c620-9a2e-11e3-9340-29d7278f08ec';

var context_query = 'MATCH (u:User{uid:"'+uid+'"}), (c:Context), c-[:BY]->u WHERE ';

contexts.forEach(function(element) {
    context_query += 'c.name = "'+element+'" OR ';
});

context_query += ' c.name = "~~~~dummy~~~~" RETURN DISTINCT c;';



function getContexts (callback) {
dbneo.cypherQuery(context_query, function(err, cypherAnswer){

    if(err) {
        err.type = 'neo4j';
        return callback(err);
    }

    callback(null,cypherAnswer);


});
}

function showContexts (err,answer) {
    if (err) console.log(err);
    console.log(context_query);



    var contexts = [];

    for (var i=0;i<answer.data.length;i++) {
        contexts.push({
            uid: answer.data[i].uid,
            name: answer.data[i].name
        });
    }

    console.log(contexts);


}


getContexts(showContexts);






