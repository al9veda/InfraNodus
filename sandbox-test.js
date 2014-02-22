var neo4j = require('node-neo4j');
dbneo = new neo4j('http://localhost:7474');
var uuid = require('node-uuid');


var contexts = ['tips','health', 'dsafdsa', 'dsfadfs'];

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

    var newcontexts = [];

    var check = [];

    for (var i=0;i<answer.data.length;i++) {
        newcontexts.push({
            uid: answer.data[i].uid,
            name: answer.data[i].name
        });
        check.push(answer.data[i].name);
    }


    contexts.forEach(function(element){
        if (check.indexOf(element) < 0) {
            newcontexts.push({
               uid: uuid.v1(),
               name: element
            });
        }
    });



    console.log(newcontexts);
    console.log(newcontexts.length);



}


getContexts(showContexts);








