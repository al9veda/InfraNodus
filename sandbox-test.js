var neo4j = require('node-neo4j');
dbneo = new neo4j('http://localhost:7474');

var user_id = "3883c620-9a2e-11e3-9340-29d7278f08ec";


var concepts = function(user_id,queryContexts,callback) {
    dbneo.cypherQuery(queryContexts, function(err, contexts){
        if(err) {
            err.type = 'neo4j';
            return fn(err);
        }

    });

}


